"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Share2, User, BookOpen, Film, ExternalLink, ArrowLeft, Shield, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AnimatedPage from "@/components/layout/animated-page";

// Security: Allowed file types and max size
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Magic number signatures for file validation
const FILE_SIGNATURES: Record<string, number[]> = {
    "image/jpeg": [0xFF, 0xD8, 0xFF],
    "image/png": [0x89, 0x50, 0x4E, 0x47],
    "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
};

export default function ProfilePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isPrivate, setIsPrivate] = useState<boolean | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useState(() => {
        fetch("/api/user/privacy")
            .then(res => res.json())
            .then(data => setIsPrivate(data.isPrivate))
            .catch(() => setIsPrivate(false));
    });

    const togglePrivacy = async () => {
        if (isUpdating) return;
        setIsUpdating(true);
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
            setIsUpdating(false);
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
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-4 border-purple-500/30">
                                {session.user.image && <AvatarImage src={session.user.image} alt="Profile" />}
                                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl">
                                    <User className="h-10 w-10" />
                                </AvatarFallback>
                            </Avatar>
                        </div>

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
                            <Link href={`/portfolio/${session.user.username}`}>
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
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Kitaplar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/books"
                            className="text-2xl font-bold text-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                            Görüntüle →
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Film className="h-4 w-4" />
                            Filmler & Diziler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/movies"
                            className="text-2xl font-bold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            Görüntüle →
                        </Link>
                    </CardContent>
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
                            disabled={isUpdating || isPrivate === null}
                            onClick={togglePrivacy}
                            className={!isPrivate ? "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10" : ""}
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : (isPrivate ? "Gizli" : "Açık")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

        </AnimatedPage>
    );
}
