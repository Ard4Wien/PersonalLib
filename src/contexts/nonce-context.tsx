"use client";

import { createContext, useContext, ReactNode } from "react";

const NonceContext = createContext<string>('');

export function NonceProvider({ value, children }: { value: string; children: ReactNode }) {
    return <NonceContext.Provider value={value}>{children}</NonceContext.Provider>;
}

export function useNonce() {
    return useContext(NonceContext);
}
