"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const DEFAULT_AVATAR = "/default-avatar.png";
const STORAGE_KEY = "profileImage";

interface ProfileImageContextType {
    profileImage: string;
    setProfileImage: (image: string) => void;
    removeProfileImage: () => void;
}

const ProfileImageContext = createContext<ProfileImageContextType | undefined>(undefined);

export function ProfileImageProvider({ children }: { children: ReactNode }) {
    const { data: session, update } = useSession();
    const [profileImage, setProfileImageState] = useState<string>(DEFAULT_AVATAR);
    const [isLoaded, setIsLoaded] = useState(false);

    // Sync from Session (Database Source of Truth)
    useEffect(() => {
        if (session?.user?.avatarUrl) {
            setProfileImageState(session.user.avatarUrl);
        }
    }, [session]);

    // Load from localStorage on mount and Sync to DB
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && stored !== DEFAULT_AVATAR) {
            setProfileImageState(stored);

            // Auto-sync to DB if logged in
            if (session?.user?.email) {
                // To avoid spamming toast on every refresh, we can be subtle or check a flag.
                // But since the user is debugging, let's be explicit.

                fetch("/api/user/update-avatar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ avatarUrl: stored }),
                })
                    .then(res => {
                        if (!res.ok) throw new Error("Sync failed");
                        // Success silently to not annoy everyday usage
                    })
                    .catch(err => {
                        console.error("Auto-sync failed", err);
                        toast.error("Profil fotoğrafı veritabanına yedeklenemedi.");
                    });
            }
        }
        setIsLoaded(true);
    }, [session]);

    const setProfileImage = async (image: string) => {
        setProfileImageState(image);
        localStorage.setItem(STORAGE_KEY, image);

        try {
            await fetch("/api/user/update-avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl: image }),
            });
            // Update session to reflect changes globally
            await update({ avatarUrl: image });
        } catch (error) {
            console.error("Failed to sync avatar to database", error);
        }
    };

    const removeProfileImage = () => {
        setProfileImageState(DEFAULT_AVATAR);
        localStorage.removeItem(STORAGE_KEY);
    };

    // Don't render children until loaded to prevent hydration mismatch
    if (!isLoaded) {
        return null;
    }

    return (
        <ProfileImageContext.Provider value={{ profileImage, setProfileImage, removeProfileImage }}>
            {children}
        </ProfileImageContext.Provider>
    );
}

export function useProfileImage() {
    const context = useContext(ProfileImageContext);
    if (!context) {
        throw new Error("useProfileImage must be used within ProfileImageProvider");
    }
    return context;
}
