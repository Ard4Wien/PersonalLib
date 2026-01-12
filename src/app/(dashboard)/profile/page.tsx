"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
import { BookOpen, ExternalLink, Film, Share2, User, Edit2, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageCropModal } from "@/components/image-crop-modal";
import { useProfileImage } from "@/contexts/profile-image-context";
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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const { profileImage, setProfileImage, removeProfileImage } = useProfileImage();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSharePortfolio = () => {
        if (session?.user?.username) {
            const url = `${window.location.origin}/portfolio/${session.user.username}`;
            navigator.clipboard.writeText(url);
            toast.success("Portfolyo linki kopyalandı!");
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    // Security: Validate file magic numbers
    const validateFileMagicNumber = async (file: File): Promise<boolean> => {
        const signature = FILE_SIGNATURES[file.type];
        if (!signature) return false;

        const buffer = await file.slice(0, signature.length).arrayBuffer();
        const bytes = new Uint8Array(buffer);

        return signature.every((byte, index) => bytes[index] === byte);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input for same file selection
        e.target.value = "";

        // Security: Check file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Sadece JPEG, PNG ve WebP formatları destekleniyor.");
            return;
        }

        // Security: Check file size
        if (file.size > MAX_FILE_SIZE) {
            toast.error("Dosya boyutu 5MB'dan küçük olmalıdır.");
            return;
        }

        // Security: Validate magic number
        const isValid = await validateFileMagicNumber(file);
        if (!isValid) {
            toast.error("Geçersiz dosya formatı. Lütfen gerçek bir resim dosyası seçin.");
            return;
        }

        // Convert to base64 and open crop modal
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setSelectedImageSrc(result);
            setIsCropModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedImage: string) => {
        setProfileImage(croppedImage);
        toast.success("Profil fotoğrafı güncellendi!");
    };

    const handleRemovePhoto = () => {
        removeProfileImage();
        toast.success("Profil fotoğrafı kaldırıldı.");
    };

    if (!session?.user) {
        return null;
    }

    return (
        <AnimatedPage className="max-w-2xl mx-auto space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            {/* Profile Header */}
            <Card className="bg-white/5 border-white/10">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="relative group cursor-pointer">
                                    <Avatar className="h-24 w-24 border-4 border-purple-500/50 transition-all group-hover:border-purple-400">
                                        {profileImage && <AvatarImage src={profileImage} alt="Profile" />}
                                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl">
                                            {getInitials(session.user.name || "U")}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Edit Overlay */}
                                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="bg-slate-950/95 backdrop-blur-xl border-white/10 shadow-2xl shadow-purple-500/10">
                                <DropdownMenuItem className="cursor-pointer" onClick={handleFileClick}>
                                    <ImagePlus className="h-4 w-4 mr-2" />
                                    <span>Fotoğrafı Değiştir</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-400" onClick={handleRemovePhoto}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <span>Fotoğrafı Kaldır</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl font-bold text-white">
                                {session.user.name}
                            </h1>
                            <p className="text-gray-400">@{session.user.username}</p>
                            <p className="text-gray-500 text-sm mt-1">{session.user.email}</p>
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
                                <Button variant="outline" className="w-full border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white">
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
                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Kitaplar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/books"
                            className="text-2xl font-bold text-white hover:text-purple-400 transition-colors"
                        >
                            Görüntüle →
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Film className="h-4 w-4" />
                            Filmler & Diziler
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/movies"
                            className="text-2xl font-bold text-white hover:text-blue-400 transition-colors"
                        >
                            Görüntüle →
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Account Info */}
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Hesap Bilgileri
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">E-posta</span>
                        <span className="text-white">{session.user.email}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Kullanıcı Adı</span>
                        <span className="text-white">@{session.user.username}</span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Görünen Ad</span>
                        <span className="text-white">{session.user.name}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Image Crop Modal */}
            {selectedImageSrc && (
                <ImageCropModal
                    isOpen={isCropModalOpen}
                    onClose={() => setIsCropModalOpen(false)}
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                />
            )}
        </AnimatedPage>
    );
}
