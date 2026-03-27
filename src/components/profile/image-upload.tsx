'use client';

import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X, Check, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitials } from '@/lib/utils';
import { useTranslation } from '@/contexts/language-context';

interface ImageUploadProps {
    currentImage?: string | null;
    userId: string;
    username: string;
    name?: string | null;
    onUploadSuccess: (url: string) => void;
}

// Güvenlik sabitleri: Dosya boyutu ve tip kısıtlamaları
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUpload({ currentImage, userId, username, name, onUploadSuccess }: ImageUploadProps) {
    const { t, locale } = useTranslation();
    const [image, setImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Güvenlik: MIME tipi kontrolü
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                toast.error(t.profile.uploadOnlyImages);
                e.target.value = ''; // Input'u sıfırla
                return;
            }

            // Güvenlik: Dosya boyutu kontrolü (5MB)
            if (file.size > MAX_FILE_SIZE) {
                toast.error(t.profile.maxFileSize);
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImage(reader.result as string);
                setIsCropping(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error('No 2d context');

        // Sabit bir boyut (400x400) belirleyelim ki performans artsın
        const targetSize = 400;
        canvas.width = targetSize;
        canvas.height = targetSize;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            targetSize,
            targetSize
        );

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/jpeg', 0.85); // %85 kalite ile sıkıştırılmış JPEG
        });
    };

    const handleUpload = async () => {
        if (!image || !croppedAreaPixels) return;

        try {
            setIsUploading(true);
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels);

            // 8-12 arası rastgele bir uzunluk belirle
            const randomLength = Math.floor(Math.random() * (12 - 8 + 1)) + 8;
            // Büyük/küçük harf, rakam ve karakter
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@!';
            let randomKey = '';
            for (let i = 0; i < randomLength; i++) {
                randomKey += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // Dosya adı: kullanıcıadıRandomKey.jpg (Aradaki tire kaldırıldı)
            const fileName = `${username}${randomKey}.jpg`;
            const filePath = `avatars/${fileName}`;

            // 1. Supabase Storage'a Yükle
            const { data, error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, croppedBlob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 2. Public URL Al
            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);

            // 3. Parent bileşene haber ver (URL yerine sadece PATH gönderiyoruz)
            onUploadSuccess(filePath);

            toast.success(t.profile.avatarUpdated);
            setIsCropping(false);
            setImage(null);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(t.profile.avatarUpdateError);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="relative group">
            <div className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-purple-500/30 ${!currentImage ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg' : 'bg-muted'} flex items-center justify-center`}>
                {currentImage ? (
                    <img
                        src={currentImage}
                        alt="Profil"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-white font-black text-2xl sm:text-4xl tracking-tighter shadow-sm">
                        {name ? getInitials(name, locale) : userId.substring(0, 1).toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US')}
                    </div>
                )}

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1"
                >
                    <Camera className="h-6 w-6" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">{t.profile.changeAvatar}</span>
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
            />

            {/* Crop Modalı */}
            <AnimatePresence>
                {isCropping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-background w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-border"
                        >
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-lg">{t.profile.editPhoto}</h3>
                                <button onClick={() => setIsCropping(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="relative h-80 w-full bg-black/20">
                                {image && (
                                    <Cropper
                                        image={image}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={1}
                                        onCropChange={setCrop}
                                        onCropComplete={onCropComplete}
                                        onZoomChange={setZoom}
                                        cropShape="round"
                                        showGrid={false}
                                    />
                                )}
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>{t.profile.zoom}</span>
                                        <span>{Math.round(zoom * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e: any) => setZoom(e.target.value)}
                                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-xl h-11"
                                        onClick={() => setIsCropping(false)}
                                        disabled={isUploading}
                                    >
                                        {t.common.cancel}
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-xl h-11 gap-2 shadow-lg shadow-primary/20"
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="h-4 w-4" />
                                        )}
                                        {isUploading ? t.common.updating : t.profile.savePhoto}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
