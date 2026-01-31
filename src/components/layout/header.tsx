"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    BookOpen,
    Film,
    Heart,
    LayoutGrid,
    List,
    Lock,
    LogOut,
    Menu,
    Search,
    User,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useViewMode } from "@/contexts/view-mode-context";
import { useSearch } from "@/contexts/search-context";
import { getInitials } from "@/lib/utils";

const navItems = [
    { href: "/books", label: "Kitaplar", icon: BookOpen },
    { href: "/movies", label: "Filmler & Diziler", icon: Film },
    { href: "/wishlist", label: "İstek Listesi", icon: Heart },
];

export default function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { searchQuery, setSearchQuery } = useSearch();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { viewMode, toggleViewMode } = useViewMode();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
    };

    const getSearchPlaceholder = () => {
        if (pathname.startsWith("/books")) return "Kitaplarımda ara...";
        if (pathname.startsWith("/movies")) return "Film ve dizilerimde ara...";
        if (pathname.startsWith("/wishlist")) return "İstek listemde ara...";
        return "Kitap, film veya dizi ara...";
    };


    return (
        <header className="sticky top-0 z-50 w-full bg-slate-900 dark:bg-[#09090b] md:bg-transparent md:bg-gradient-to-r md:from-slate-900/90 md:to-purple-900/30 md:dark:bg-none md:dark:bg-[#09090b]/90 md:backdrop-blur-xl transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/books" className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-500 to-pink-500">
                                <BookOpen className="h-4 w-4 text-white" />
                            </div>
                            <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500">
                                <Film className="h-4 w-4 text-white" />
                            </div>
                        </div>
                        <span className="hidden sm:block font-bold text-white">
                            PersonalLib
                        </span>
                    </Link>

                    {/* Theme Toggle - Mobile: Left */}
                    <div className="md:hidden">
                        <ThemeToggle />
                    </div>

                    {/* Mobile Navigation - Icons */}
                    <nav className="flex md:hidden items-center gap-1 sm:gap-2 mx-auto">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`p-2 rounded-lg transition-colors ${isActive
                                        ? "bg-white/10 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive
                                        ? "bg-white/10 text-white"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Search Bar */}
                    <form
                        onSubmit={handleSearch}
                        className="hidden lg:flex flex-1 max-w-md mx-4"
                    >
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="search"
                                placeholder={getSearchPlaceholder()}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500"
                            />
                        </div>
                    </form>

                    {/* Theme Toggle - Desktop */}
                    <div className="hidden md:block">
                        <ThemeToggle />
                    </div>


                    {/* User Menu */}
                    <div className="flex items-center gap-2">

                        {/* User Dropdown */}
                        {session?.user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-9 w-9 rounded-full"
                                    >
                                        <Avatar className="h-9 w-9 border-2 border-purple-500/50">
                                            <AvatarImage src="/default-avatar.png" alt="Profile" />
                                            <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-sm">
                                                {getInitials(session.user.name || "U")}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-56 bg-slate-950 md:bg-slate-950/95 md:backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10"
                                >
                                    <div className="flex flex-col gap-1 p-2">
                                        <p className="text-sm font-medium text-white">
                                            {session.user.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            @{session.user.username}
                                        </p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer"
                                        >
                                            <User className="h-4 w-4" />
                                            <span>Profil</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/portfolio/${session.user.username}`}
                                            className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            <span>Portfolyo</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href="/settings/change-password"
                                            className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer"
                                        >
                                            <Lock className="h-4 w-4" />
                                            <span>Şifre Değiştir</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={toggleViewMode}
                                        className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer"
                                    >
                                        {viewMode === "compact" ? (
                                            <>
                                                <List className="h-4 w-4" />
                                                <span>Liste Görünümü</span>
                                            </>
                                        ) : (
                                            <>
                                                <LayoutGrid className="h-4 w-4" />
                                                <span>Kompakt Görünüm</span>
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem
                                        onClick={() => signOut({ callbackUrl: "/login" })}
                                        className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Çıkış Yap</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>

            {/* Soft gradient fade for dark mode only */}
            <div className="absolute -bottom-4 left-0 w-full h-4 bg-gradient-to-b from-[#09090b]/90 to-transparent hidden dark:block pointer-events-none" />
        </header >
    );
}
