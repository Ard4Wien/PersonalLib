# 📚 Personal Media Library

**PersonalLib**, okuduğunuz kitapları, izlediğiniz filmleri ve dizileri takip etmenizi sağlayan; modern, güvenli ve kişiselleştirilebilir bir dijital kütüphane uygulamasıdır.

## 🚀 Özellikler

- **📂 Medya Takibi:** Kitap, Film ve Dizi koleksiyonlarınızı ayrı ayrı yönetin.
- **📊 Durum Yönetimi:** "Okunacak", "Okunuyor", "Tamamlandı" gibi durumlarla ilerlemenizi takip edin.
- **✨ Modern Arayüz:** Tailwind CSS ve shadcn/ui ile tasarlanmış, Responsive ve Karanlık Mod (Dark Mode) destekli şık tasarım.
- **🔒 Gelişmiş Güvenlik.**

## 🛠️ Teknolojiler

- **Frontend:** [Next.js 15+](https://nextjs.org/), React 19, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes (Serverless)
- **Database:** [Neon (PostgreSQL)](https://neon.tech/), Prisma ORM
- **Auth:** [Auth.js (NextAuth)](https://authjs.dev/)
- **Deploy:** [Vercel](https://vercel.com/)

## 📦 Kurulum

Projeyi yerel ortamınızda çalıştırmak için adımları takip edin:

1. **Repoyu Klonlayın:**
   ```bash
   git clone https://github.com/Ard4Wien/PersonalLib.git
   cd PersonalLib
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **Çevresel Değişkenleri Ayarlayın (.env):**
   ```env
   DATABASE_URL="postgresql://user:password@endpoint-pooler.neon.tech/neondb?sslmode=require"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="gizli-anahtariniz"
   ```

4. **Veritabanını Hazırlayın:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Uygulamayı Başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda `http://localhost:3000` adresine gidin.

## 🛡️ Lisans

Bu proje **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** ile lisanslanmıştır.
- ✅ Kişisel ve eğitim amaçlı kullanabilir, değiştirebilir ve paylaşabilirsiniz.
- ❌ **Ticari amaçla KULLANILAMAZ.**
- ✍️ Paylaşırken atıf yapılması zorunludur.

Detaylar için [LICENSE](LICENSE) dosyasına bakınız.

---
Made with ❤️ by [IsikArda](https://github.com/Ard4Wien)
