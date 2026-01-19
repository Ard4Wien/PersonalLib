import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const BACKGROUND_GRADIENT = "min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-zinc-950 dark:to-black transition-colors duration-300";
