import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getPublicUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Eski tam URL'leri desteklemek için
    const { data } = supabase.storage.from('profile-pictures').getPublicUrl(path);
    return data.publicUrl;
}
