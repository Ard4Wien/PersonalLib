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

export const BACKGROUND_GRADIENT = "min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-black dark:via-zinc-950 dark:to-black transition-colors duration-300";

export function getOptimizedImageUrl(url: string | null | undefined, width = 600) {
  if (!url) return "";
  if (url.startsWith("/") || url.startsWith("data:")) return url;


  if (url.includes("myanimelist.net")) return url;

  let decodedUrl = url;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    decodedUrl = url;
  }

  return `https://wsrv.nl/?url=${encodeURIComponent(decodedUrl)}&w=${width}&q=90&output=webp`;
}
