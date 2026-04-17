'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { profileImageSchema } from '@/lib/validations';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function updateUserProfileImage(imageUrl: string) {
    try {
        // Siber Güvenlik Validasyonu
        const validated = profileImageSchema.safeParse(imageUrl);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' };
        }

        // Eski profil resmini Supabaseden sil
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true }
        });

        if (currentUser?.image && currentUser.image.startsWith('avatars/') && supabaseAdmin) {
            await supabaseAdmin.storage
                .from('profile-pictures')
                .remove([currentUser.image])
                .catch(() => { /* Eski dosya zaten silinmiş olabilir */ });
        }

        // Kullanıcının profil resmini güncelle (Sadece dosya yolunu kaydediyoruz)
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: imageUrl }
        });

        revalidatePath('/(dashboard)/profile');

        return { success: true };
    } catch (error) {
        console.error('Profile image update error:', error);
        return { success: false, error: 'Profil resmi güncellenirken bir hata oluştu.' };
    }
}
