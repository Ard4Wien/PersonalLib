'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function updateUserProfileImage(imageUrl: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' };
        }

        // imageUrl doğrulama (Path Traversal koruması)
        if (!imageUrl ||
            !imageUrl.startsWith('avatars/') ||
            !imageUrl.endsWith('.jpg') ||
            imageUrl.includes('..') ||
            imageUrl.includes('//') ||
            imageUrl.includes('\0')) {
            return { success: false, error: 'Geçersiz resim yolu.' };
        }

        // 1. Mevcut resmi bul
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true }
        });

        // 2. Eski resmi sil
        if (user?.image) {
            let pathToDelete = user.image;
            if (user.image.includes('profile-pictures/')) {
                pathToDelete = user.image.split('profile-pictures/')[1];
            }

            // Query string temizle (?t=...)
            pathToDelete = pathToDelete.split('?')[0];

            if (pathToDelete && !pathToDelete.startsWith('http')) {
                try {
                    const finalPath = decodeURIComponent(pathToDelete).replace(/^\/+/, '');
                    await supabaseAdmin.storage
                        .from('profile-pictures')
                        .remove([finalPath]);
                } catch (err) {
                    console.error('Eski profil resmi silme hatası');
                }
            }
        }

        // 3. Yeni resmi kaydet
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { image: imageUrl }
        });

        // Sayfayı yenile
        revalidatePath('/profile');

        return {
            success: true
        };
    } catch (error) {
        console.error('Profil resmi güncelleme hatası');
        return { success: false, error: 'Profil resmi güncellenirken bir hata oluştu.' };
    }
}
