"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Share2, User, BookOpen, Film, ExternalLink, ArrowLeft, Shield, Lock, Eye, EyeOff, Loader2, Tv, Languages, ChevronDown, Globe } from "lucide-react";
import { toast } from "sonner";
import AnimatedPage from "@/components/layout/animated-page";
import ImageUpload from "@/components/profile/image-upload";
import { updateUserProfileImage } from "@/app/actions/profile";
import { getPublicUrl } from "@/lib/supabase";


const LANGUAGES = [
    { code: "tr", name: "Türkçe" },
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
];

const SOCIAL_PLATFORMS = [
    {
        key: "instagram", label: "Instagram", baseUrl: "instagram.com/", hoverColor: "group-hover:text-[#dc2743]", icon: (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
        )
    },
    {
        key: "x", label: "X (Twitter)", baseUrl: "x.com/", hoverColor: "group-hover:text-black dark:group-hover:text-white", icon: (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
        )
    },
    {
        key: "youtube", label: "YouTube", baseUrl: "youtube.com/@", hoverColor: "group-hover:text-[#FF0000]", icon: (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
        )
    },
    {
        key: "github", label: "GitHub", baseUrl: "github.com/", hoverColor: "group-hover:text-black dark:group-hover:text-white", icon: (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
        )
    },
    {
        key: "linkedin", label: "LinkedIn", baseUrl: "linkedin.com/in/", hoverColor: "group-hover:text-[#0077b5]", icon: (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
        )
    },
    {
        key: "tiktok", label: "TikTok", baseUrl: "tiktok.com/@", hoverColor: "group-hover:text-black dark:group-hover:text-white", icon: (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
        )
    },
] as const;

interface SocialLink {
    u?: string;      // optimized username
    v?: number;      // optimized visibility (1 or 0)
    username?: string; // legacy support
    isVisible?: boolean; // legacy support
}

type SocialLinks = Record<string, SocialLink>;

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [isPrivate, setIsPrivate] = useState<boolean | null>(null);
    const [language, setLanguage] = useState("tr");
    const [isPrivacyUpdating, setIsPrivacyUpdating] = useState(false);
    const [isLangUpdating, setIsLangUpdating] = useState(false);
    const [stats, setStats] = useState<{ books: number; movies: number; series: number } | null>(null);
    const [socialOpen, setSocialOpen] = useState(false);
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
    const [isSocialSaving, setIsSocialSaving] = useState(false);
    const [localImage, setLocalImage] = useState<string | null>(null);
    const socialDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetch("/api/user/privacy")
            .then(res => {
                if (!res.ok) throw new Error("Gizlilik bilgisi alınamadı");
                return res.json();
            })
            .then(data => setIsPrivate(data.isPrivate))
            .catch(() => setIsPrivate(false));

        fetch("/api/user/language")
            .then(res => {
                if (!res.ok) throw new Error("Dil bilgisi alınamadı");
                return res.json();
            })
            .then(data => setLanguage(data.language))
            .catch(() => setLanguage("tr"));

        fetch("/api/user/stats")
            .then(res => {
                if (!res.ok) throw new Error("İstatistikler alınamadı");
                return res.json();
            })
            .then(data => {
                if (typeof data.books === "number" && typeof data.movies === "number" && typeof data.series === "number") {
                    setStats(data);
                } else {
                    setStats({ books: 0, movies: 0, series: 0 });
                }
            })
            .catch(() => setStats({ books: 0, movies: 0, series: 0 }));

        fetch("/api/user/social-links")
            .then(res => res.json())
            .then(data => setSocialLinks(data.socialLinks || {}))
            .catch(() => { });
    }, []);

    const saveSocialLinks = useCallback(async (links: SocialLinks) => {
        setIsSocialSaving(true);
        try {
            const res = await fetch("/api/user/social-links", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ socialLinks: links }),
            });
            if (!res.ok) throw new Error();
            toast.success("Sosyal ağlar kaydedildi");
        } catch {
            toast.error("Sosyal ağlar kaydedilemedi");
        } finally {
            setIsSocialSaving(false);
        }
    }, []);

    const handleSocialChange = useCallback((platform: string, field: "username" | "isVisible", value: string | boolean) => {
        setSocialLinks(prev => {
            const current = prev[platform] || {};
            const updated = {
                ...prev,
                [platform]: {
                    u: field === "username" ? value : (current.u || (current as any).username || ""),
                    v: field === "isVisible" ? (value ? 1 : 0) : (current.v ?? ((current as any).isVisible !== false ? 1 : 0)),
                },
            };
            if (socialDebounceRef.current) clearTimeout(socialDebounceRef.current);
            socialDebounceRef.current = setTimeout(() => saveSocialLinks(updated), 800);
            return updated;
        });
    }, [saveSocialLinks]);

    const togglePrivacy = async () => {
        if (isPrivacyUpdating) return;
        setIsPrivacyUpdating(true);
        const newValue = !isPrivate;
        try {
            const res = await fetch("/api/user/privacy", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPrivate: newValue })
            });
            if (res.ok) {
                setIsPrivate(newValue);
                toast.success(newValue ? "Profiliniz gizlendi" : "Profiliniz artık herkese açık");
            } else {
                toast.error("Gizlilik ayarı güncellenemedi");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsPrivacyUpdating(false);
        }
    };

    const handleLanguageChange = async (val: string) => {
        if (isLangUpdating) return;
        setIsLangUpdating(true);
        try {
            const res = await fetch("/api/user/language", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: val })
            });
            if (res.ok) {
                setLanguage(val);
                toast.success("Dil ayarı güncellendi");
            } else {
                toast.error("Dil ayarı güncellenemedi");
            }
        } catch {
            toast.error("Bir hata oluştu");
        } finally {
            setIsLangUpdating(false);
        }
    };



    const handleSharePortfolio = () => {
        if (session?.user?.username) {
            const url = `${window.location.origin}/portfolio/${session.user.username}`;
            navigator.clipboard.writeText(url);
            toast.success("Portfolyo linki kopyalandı!");
        }
    };


    if (!session?.user) {
        return null;
    }

    return (
        <AnimatedPage className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Geri Dön
                </Button>
            </div>

            {/* Profile Header */}
            <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm transition-all duration-300">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <ImageUpload 
                            userId={session.user.id}
                            username={session.user.username}
                            name={session.user.name}
                            currentImage={getPublicUrl(localImage || session.user.image)}
                            onUploadSuccess={async (url) => {
                                setLocalImage(url);
                                await updateUserProfileImage(url);
                                await update({ image: url });
                                router.refresh();
                            }}
                        />

                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-foreground">
                                {session.user.name}
                            </h1>
                            <p className="text-muted-foreground">@{session.user.username}</p>
                            <p className="text-muted-foreground/60 text-sm mt-1">{session.user.email}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                onClick={handleSharePortfolio}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Portfolyoyu Paylaş
                            </Button>
                            <Link href={`/portfolio/${session.user.username}`} target="_blank">
                                <Button variant="outline" className="w-full border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Portfolyoyu Görüntüle
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="group relative overflow-hidden bg-purple-600/10 border-purple-500/20 shadow-sm hover:shadow-purple-500/10 transition-all duration-300">
                    <CardHeader className="pt-0 pb-0">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-[13px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                                Kitaplar
                            </CardTitle>
                            <Link
                                href="/books"
                                className="h-8 w-8 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center transition-all duration-300 hover:scale-110 shrink-0 shadow-sm border border-purple-500/10 relative z-20"
                            >
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-foreground tracking-tighter leading-none">
                                {stats?.books ?? "..."}
                            </div>
                        </div>
                    </CardContent>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <BookOpen className="h-24 w-24 text-purple-600" />
                    </div>
                </Card>

                <Card className="group relative overflow-hidden bg-blue-600/10 border-blue-500/20 shadow-sm hover:shadow-blue-500/10 transition-all duration-300">
                    <CardHeader className="pt-0 pb-0">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-[13px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                Filmler
                            </CardTitle>
                            <Link
                                href="/movies"
                                className="h-8 w-8 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all duration-300 hover:scale-110 shrink-0 shadow-sm border border-blue-500/10 relative z-20"
                            >
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-foreground tracking-tighter leading-none">
                                {stats?.movies ?? "..."}
                            </div>
                        </div>
                    </CardContent>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <Film className="h-24 w-24 text-blue-600" />
                    </div>
                </Card>

                <Card className="group relative overflow-hidden bg-cyan-600/10 border-cyan-500/20 shadow-sm hover:shadow-cyan-500/10 transition-all duration-300">
                    <CardHeader className="pt-0 pb-0">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-[13px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
                                Diziler
                            </CardTitle>
                            <Link
                                href="/movies"
                                className="h-8 w-8 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-all duration-300 hover:scale-110 shrink-0 shadow-sm border border-cyan-500/10 relative z-20"
                            >
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative z-10">
                            <div className="text-4xl font-black text-foreground tracking-tighter leading-none">
                                {stats?.series ?? "..."}
                            </div>
                        </div>
                    </CardContent>
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                        <Tv className="h-24 w-24 text-cyan-600" />
                    </div>
                </Card>
            </div>

            {/* Account Info */}
            <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-muted-foreground" />
                        Hesap Bilgileri
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">E-posta</span>
                        <span className="text-foreground font-medium">{session.user.email}</span>
                    </div>
                    <Separator className="bg-black/5 dark:bg-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Kullanıcı Adı</span>
                        <span className="text-foreground font-medium">@{session.user.username}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Account and Privacy */}
            <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-purple-500" />
                        Hesap ve Gizlilik
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                            <div className="text-foreground flex items-center gap-2">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                                <span>Şifre</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Güvenliğiniz için şifrenizi düzenli aralıklarla değiştirin.</p>
                        </div>
                        <Link href="/settings/change-password">
                            <Button variant="outline" size="sm" className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10">
                                Şifre Değiştir
                            </Button>
                        </Link>
                    </div>

                    <Separator className="bg-black/5 dark:bg-white/10" />

                    <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                            <div className="text-foreground flex items-center gap-2">
                                <Languages className="h-4 w-4 text-muted-foreground" />
                                <span>Dil / Language</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Uygulama dilini buradan seçebilirsiniz.</p>
                        </div>
                        <Select value={language} onValueChange={handleLanguageChange}>
                            <SelectTrigger size="sm" className="w-[120px] bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="bg-black/5 dark:bg-white/10" />

                    <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                            <div className="text-foreground flex items-center gap-2">
                                {isPrivate ? <EyeOff className="h-4 w-4 text-red-500" /> : <Eye className="h-4 w-4 text-green-500" />}
                                <span>Hesabı Gizle</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isPrivate
                                    ? "Hesabınız gizli. Portfolyonuzu sadece siz görebilirsiniz."
                                    : "Hesabınız herkese açık. Portfolyonuzu herkes görebilir."}
                            </p>
                        </div>
                        <Button
                            variant={isPrivate ? "destructive" : "outline"}
                            size="sm"
                            disabled={isPrivacyUpdating || isPrivate === null}
                            onClick={togglePrivacy}
                            className={!isPrivate ? "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10" : ""}
                        >
                            {isPrivacyUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : (isPrivate ? "Gizli" : "Açık")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm">
                <CardHeader
                    className="cursor-pointer select-none px-3 py-2 flex flex-row items-center"
                    onClick={() => setSocialOpen(prev => !prev)}
                >
                    <CardTitle className="text-foreground flex items-center gap-2.5 text-lg font-bold leading-none w-full">
                        <Globe className="h-5 w-5 text-blue-500/90 shrink-0" />
                        <span>Sosyal Ağlar</span>
                        <div className="ml-auto flex items-center gap-2">
                            {isSocialSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            <ChevronDown className={`h-5 w-5 text-muted-foreground/60 transition-transform duration-300 ${socialOpen ? "rotate-180" : ""}`} />
                        </div>
                    </CardTitle>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${socialOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
                    <CardContent className="space-y-3 px-3 pb-3 pt-0">
                        <p className="text-xs text-muted-foreground">
                            Kullanıcı adınızı girin. Switch ile portfolyonuzda gösterilip gösterilmeyeceğini seçin.
                        </p>
                        {SOCIAL_PLATFORMS.map((platform, idx) => (
                            <div key={platform.key}>
                                {idx > 0 && <Separator className="bg-black/5 dark:bg-white/10 mb-3" />}
                                <div className="flex items-center gap-3 group">
                                    <div className={`h-9 w-9 text-muted-foreground transition-all duration-300 flex items-center justify-center shrink-0 ${platform.hoverColor}`}>
                                        {platform.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-muted-foreground shrink-0">{platform.baseUrl}</span>
                                            <input
                                                type="text"
                                                placeholder="kullanıcı adı"
                                                value={socialLinks[platform.key]?.u || (socialLinks[platform.key] as any)?.username || ""}
                                                onChange={(e) => handleSocialChange(platform.key, "username", e.target.value)}
                                                className="flex-1 min-w-0 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                            {(socialLinks[platform.key]?.v ?? ((socialLinks[platform.key] as any)?.isVisible !== false ? 1 : 0)) === 1 ? "Görünür" : "Gizli"}
                                        </span>
                                        <Switch
                                            checked={(socialLinks[platform.key]?.v ?? ((socialLinks[platform.key] as any)?.isVisible !== false ? 1 : 0)) === 1}
                                            onCheckedChange={(checked) => handleSocialChange(platform.key, "isVisible", checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </div>
            </Card>

        </AnimatedPage>
    );
}
