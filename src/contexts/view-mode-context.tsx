"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ViewMode = "compact" | "list";

interface ViewModeContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
    const [viewMode, setViewMode] = useState<ViewMode>("compact");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const savedMode = localStorage.getItem("viewMode") as ViewMode;
        if (savedMode && (savedMode === "compact" || savedMode === "list")) {
            setViewMode(savedMode);
        }
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem("viewMode", viewMode);
        }
    }, [viewMode, isMounted]);

    const toggleViewMode = () => {
        setViewMode((prev) => (prev === "compact" ? "list" : "compact"));
    };

    return (
        <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
            {children}
        </ViewModeContext.Provider>
    );
}

export function useViewMode() {
    const context = useContext(ViewModeContext);
    if (context === undefined) {
        throw new Error("useViewMode must be used within a ViewModeProvider");
    }
    return context;
}
