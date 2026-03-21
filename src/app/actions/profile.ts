'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateUserProfileImage(imageUrl: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' };
        }

        // Kullanıcının profil resmini güncelle (Sadece dosya yolunu kaydediyoruz)
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: imageUrl } // Burada 'imageUrl' artık aslında 'path' (avatars/...)
        });

        // Sayfayı yenile ki yeni resim her yerde güncellensin
        revalidatePath('/(dashboard)/profile');

        return { success: true };
    } catch (error) {
        console.error('Profile image update error:', error);
        return { success: false, error: 'Profil resmi güncellenirken bir hata oluştu.' };
    }
}
