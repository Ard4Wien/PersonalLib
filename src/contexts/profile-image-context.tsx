"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

const DEFAULT_AVATAR = "/default-avatar.png";
const STORAGE_KEY = "profileImage";

interface ProfileImageContextType {
    profileImage: string;
    setProfileImage: (image: string) => void;
    removeProfileImage: () => void;
}

const ProfileImageContext = createContext<ProfileImageContextType | undefined>(undefined);

export function ProfileImageProvider({ children }: { children: ReactNode }) {
    const [profileImage, setProfileImageState] = useState<string>(DEFAULT_AVATAR);
    const [isLoaded, setIsLoaded] = useState(false);

    const { data: session } = useSession();

    // Load from localStorage on mount and Sync to DB
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setProfileImageState(stored);

            // Auto-sync to DB if logged in
            if (session?.user) {
                fetch("/api/user/update-avatar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ avatarUrl: stored }),
                }).catch(err => console.error("Auto-sync failed", err));
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
