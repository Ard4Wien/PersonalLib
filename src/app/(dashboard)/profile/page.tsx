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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Share2, User, BookOpen, Film, ExternalLink, ArrowLeft, Shield, Lock, Eye, EyeOff, Loader2, Tv, Languages, ChevronDown, Globe, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import AnimatedPage from "@/components/layout/animated-page";
import ImageUpload from "@/components/profile/image-upload";
import { updateUserProfileImage } from "@/app/actions/profile";
import { getPublicUrl } from "@/lib/supabase";
import { useTranslation } from "@/contexts/language-context";


const LANGUAGES = [
    { code: "tr", name: "Türkçe", flag: "🇹🇷" },
    { code: "en", name: "English", flag: "ᴇɴ" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
];

import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";

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
    const { t, locale, setLocale } = useTranslation();
    const [isPrivate, setIsPrivate] = useState<boolean | null>(null);
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
                if (!res.ok) throw new Error(t.profile.privacyFetchError);
                return res.json();
            })
            .then(data => setIsPrivate(data.isPrivate))
            .catch(() => setIsPrivate(false));

        fetch("/api/user/stats")
            .then(res => {
                if (!res.ok) throw new Error(t.profile.statsFetchError);
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
            toast.success(t.profile.socialSaved);
        } catch {
            toast.error(t.profile.socialSaveError);
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
                toast.success(t.profile.privacyUpdateSuccess);
            } else {
                toast.error(t.profile.privacyUpdateError);
            }
        } catch {
            toast.error(t.common.error);
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
                setLocale(val as any);
                toast.success(t.profile.languageUpdateSuccess);
            } else {
                toast.error(t.profile.languageUpdateError);
            }
        } catch {
            toast.error(t.common.error);
        } finally {
            setIsLangUpdating(false);
        }
    };

    const handleSharePortfolio = () => {
        if (session?.user?.username) {
            const url = `${window.location.origin}/portfolio/${session.user.username}`;
            navigator.clipboard.writeText(url);
            toast.success(t.profile.profileCopied);
        }
    };

    if (!session?.user) {
        return null;
    }

    const StatCard = ({ label, value, icon: Icon, colorClass, borderClass, shadowClass, bgIcon: BgIcon, href }: { label: string; value: number; icon: any; colorClass: string; borderClass: string; shadowClass: string; bgIcon: any; href: string }) => (
        <Link href={href}>
            <Card className={`group relative overflow-hidden bg-white/95 dark:bg-zinc-950/40 border-black/10 dark:border-white/5 ${borderClass} shadow-lg ${shadowClass} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] h-32 md:h-40`}>
                <div className="absolute top-4 right-4 z-10">
                    <div className={`p-2 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 text-muted-foreground group-hover:text-foreground transition-colors`}>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                    </div>
                </div>

                <div className="relative z-10 p-5 h-full flex flex-col justify-between">
                    <div>
                        <h3 className={`text-xs md:text-sm font-black uppercase tracking-[0.2em] ${colorClass}`}>
                            {label}
                        </h3>
                    </div>

                    <div className="text-4xl md:text-5xl font-black text-foreground tabular-nums">
                        {value}
                    </div>
                </div>

                {/* Background Icon Watermark */}
                <div className="absolute -bottom-6 -right-6 opacity-[0.15] dark:opacity-[0.12] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <BgIcon className={`w-28 h-28 md:w-36 md:h-36 ${colorClass}`} />
                </div>
            </Card>
        </Link>
    );

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
                    {t.common.back}
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
                                {t.profile.shareProfile}
                            </Button>
                            <Link href={`/portfolio/${session.user.username}`} target="_blank">
                                <Button variant="outline" className="w-full border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {t.profile.viewPortfolio}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard
                    label={t.nav.books}
                    value={stats?.books || 0}
                    icon={<BookOpen className="h-5 w-5" />}
                    bgIcon={BookOpen}
                    colorClass="text-purple-600 dark:text-purple-400"
                    borderClass="hover:border-purple-500/50"
                    shadowClass="hover:shadow-purple-500/10"
                    href="/books"
                />
                <StatCard
                    label={t.movies.moviesTab}
                    value={stats?.movies || 0}
                    icon={<Film className="h-5 w-5" />}
                    bgIcon={Film}
                    colorClass="text-blue-600 dark:text-blue-400"
                    borderClass="hover:border-blue-500/50"
                    shadowClass="hover:shadow-blue-500/10"
                    href="/movies"
                />
                <StatCard
                    label={t.movies.seriesTab}
                    value={stats?.series || 0}
                    icon={<Tv className="h-5 w-5" />}
                    bgIcon={Tv}
                    colorClass="text-cyan-600 dark:text-cyan-400"
                    borderClass="hover:border-cyan-500/50"
                    shadowClass="hover:shadow-cyan-500/10"
                    href="/movies"
                />
            </div>

            {/* Account Info */}
            <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-muted-foreground" />
                        {t.profile.accountInfo}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t.auth.email}</span>
                        <span className="text-foreground font-medium">{session.user.email}</span>
                    </div>
                    <Separator className="bg-black/5 dark:bg-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t.auth.username}</span>
                        <span className="text-foreground font-medium">@{session.user.username}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Account and Privacy */}
            <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5 text-purple-500" />
                        {t.profile.security}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                            <div className="text-foreground flex items-center gap-2">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                                <span>{t.profile.password}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{t.profile.passwordDescription}</p>
                        </div>
                        <Link href="/settings/change-password">
                            <Button variant="outline" size="sm" className="border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10">
                                {t.profile.changePassword}
                            </Button>
                        </Link>
                    </div>

                    <Separator className="bg-black/5 dark:bg-white/10" />

                    <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                            <div className="text-foreground flex items-center gap-2">
                                <Languages className="h-4 w-4 text-muted-foreground" />
                                <span>{t.profile.language}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{t.profile.languageDescription}</p>
                        </div>
                        <Select value={locale} onValueChange={handleLanguageChange}>
                            <SelectTrigger size="sm" className="w-[130px] bg-transparent border-transparent shadow-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:ring-0">
                                <SelectValue>
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-base leading-none">{LANGUAGES.find(l => l.code === locale)?.flag}</span>
                                        <span className="text-sm font-medium">{LANGUAGES.find(l => l.code === locale)?.name}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-lg rounded-xl p-1 z-50">
                                {LANGUAGES.map((lang) => (
                                    <SelectItem
                                        key={lang.code}
                                        value={lang.code}
                                        className="rounded-lg cursor-pointer focus:bg-black/5 dark:focus:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 w-[100px] py-0.5">
                                            <span className="text-base leading-none">{lang.flag}</span>
                                            <span className="text-sm font-medium">{lang.name}</span>
                                        </div>
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
                                <span>{t.profile.hideAccount}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isPrivate
                                    ? t.profile.accountPrivate
                                    : t.profile.accountPublic}
                            </p>
                        </div>
                        <Button
                            variant={isPrivate ? "destructive" : "outline"}
                            size="sm"
                            disabled={isPrivacyUpdating || isPrivate === null}
                            onClick={togglePrivacy}
                            className={!isPrivate ? "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10" : ""}
                        >
                            {isPrivacyUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : (isPrivate ? t.profile.private : t.profile.public)}
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
                        <span>{t.profile.socialLinks}</span>
                        <div className="ml-auto flex items-center gap-2">
                            {isSocialSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            <ChevronDown className={`h-5 w-5 text-muted-foreground/60 transition-transform duration-300 ${socialOpen ? "rotate-180" : ""}`} />
                        </div>
                    </CardTitle>
                </CardHeader>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${socialOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
                    <CardContent className="space-y-3 px-3 pb-3 pt-0">
                        <p className="text-xs text-muted-foreground">
                            {t.profile.socialDescription}
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
                                            <span className="text-xs text-muted-foreground shrink-0">{platform.baseUrl.replace('https://', '').replace(/[\/]$|@$/, '')}</span>
                                            <input
                                                type="text"
                                                placeholder={t.auth.usernamePlaceholder}
                                                value={socialLinks[platform.key]?.u || (socialLinks[platform.key] as any)?.username || ""}
                                                onChange={(e) => handleSocialChange(platform.key, "username", e.target.value)}
                                                className="flex-1 min-w-0 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-md px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                            {(socialLinks[platform.key]?.v ?? ((socialLinks[platform.key] as any)?.isVisible !== false ? 1 : 0)) === 1 ? t.profile.visible : t.profile.private}
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
