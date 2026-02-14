<p align="center">
  <img src="public/images/logo.png" width="120" alt="PersonalLib Logo" />
</p>

<h1 align="center">PersonalLib</h1>

<p align="center">
  <sub>Dizi, Film, Kitap, Manga, Çizgi Roman ve Anime koleksiyonlarınızı yönetmek ve paylaşmak için kapsamlı bir dijital kütüphane ve portfolyo sistemi.</sub>
</p>

<p align="center">
  <a href="https://github.com/Ard4Wien/PersonalLib/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-CC%20BY--NC%204.0-blue?style=flat-square" alt="Lisans" /></a>
  <img src="https://img.shields.io/badge/platform-Web%20%7C%20Mobile-blue?style=flat-square" alt="Platform" />
</p>

---

PersonalLib; farklı medya türlerini tek bir arayüzde toplamak için tasarlanmış, minimalist ve güvenli bir platformdur. Hem kişisel bir takip aracı hem de kütüphanenizi dünyaya sergileyebileceğiniz bir portfolyo görevi görür.

## Özellikler

- **Çoklu Medya Takibi**: Film, dizi, kitap, manga ve anime için özel bölümler.
- **İlerleme Yönetimi**: "Okunuyor", "İzleniyor", "Tamamlandı" veya "İstek Listesi" gibi seçeneklerle durumunuzu takip edin.
- **Gelişmiş Doğrulama**: Abstract API ile gerçek SMTP e-posta doğrulaması ve anlık kullanıcı adı müsaitlik kontrolü.
- **Adaptif Arayüz**: Karanlık ve aydınlık mod desteği ile her cihazda tutarlı, premium tasarım dili.
- **Genel Portfolyolar**: Koleksiyonlarınızı paylaşabileceğiniz, gizlilik kontrollü profil sayfaları.
- **Güvenlik Sertleştirme**: İçerik Güvenliği Politikası (CSP), JWT algoritma doğrulaması ve XSS koruması.

## Teknik Yığın (Tech Stack)

PersonalLib, maksimum performans ve güvenilirlik için modern ve tip güvenli bir teknoloji yığını ile oluşturulmuştur:

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion.
- **Backend**: Next.js API Routes (Serverless), Prisma ORM.
- **Veritabanı**: Neon üzerinde PostgreSQL.
- **Kimlik Doğrulama**: Güvenli oturum yönetimi ile Auth.js (NextAuth).
- **Doğrulama**: Zod şema doğrulaması ve Abstract API entegrasyonu.

## Ön İzleme

<p align="center">
  <img src="public/screenshots/landing.png" width="800" alt="Giriş Sayfası" />
  <br />
  <img src="public/screenshots/dashboard.png" width="800" alt="Panel" />
  <br />
  <img src="public/screenshots/portfolio.png" width="800" alt="Kullanıcı Portfolyosu" />
</p>

## Proje Yapısı

```text
src/
├── app/               # Next.js App Router (Sayfalar ve API Rotaları)
│   ├── api/           # Serverless backend uç noktaları
│   ├── (dashboard)/   # Kimliği doğrulanmış kullanıcı paneli
│   └── portfolio/     # Genel/Özel kullanıcı profilleri
├── components/        # Yeniden kullanılabilir UI ve düzen bileşenleri
│   ├── layout/        # Navigasyon, header ve sarmalayıcılar
│   ├── media/         # Medyaya özel kartlar ve ızgaralar
│   └── ui/            # Temel Tailwind stilli bileşenler
├── lib/               # Yardımcı fonksiyonlar, doğrulayıcılar ve istemciler
├── context/           # React Context sağlayıcıları
└── types/             # Paylaşılan TypeScript arayüzleri ve DTO'lar
```

<details>
<summary><b>🛠️ Başlangıç (Kurulum Adımları)</b></summary>
<br />

Yerel bir geliştirme ortamı kurmak için:

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/Ard4Wien/PersonalLib.git
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. `.env` dosyasına gerekli ortam değişkenlerini ekleyin (DATABASE_URL, Auth secret'ları, API anahtarları).

4. Veritabanını hazırlayın:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

</details>

## Güvenlik

PersonalLib, veri bütünlüğüne ve kullanıcı güvenliğine öncelik verir:
- **Sanitizasyon**: Enjeksiyonu önlemek için tüm kullanıcı girişleri Zod şemaları ile doğrulanır.
- **CSP**: XSS risklerini azaltmak için özel İçerik Güvenliği Politikası başlıkları uygulanır.
- **JWT Koruması**: Oturum belirteçleri için sıkı HS256 algoritma doğrulaması uygulanır.
- **Hız Sınırlama**: Kimlik doğrulama uç noktalarında kaba kuvvet (brute-force) saldırılarına karşı koruma.

## Yardım

Kurulumla ilgili sorularınız veya sorun giderme için:
- [Dökümantasyonu](https://github.com/Ard4Wien/PersonalLib/wiki) inceleyin.
- Ayrıntılı günlüklerle bir [teknik sorun](https://github.com/Ard4Wien/PersonalLib/issues) bildirin.

## Katkıda Bulunma

PersonalLib'i geliştirmek için katkılarınızı bekliyoruz:
1. Depoyu forklayın.
2. Bir özellik dalı oluşturun (`git checkout -b feature/AmazingFeature`).
3. Değişikliklerinizi kaydedin (`git commit -m 'Add AmazingFeature'`).
4. Dalı pushlayın (`git push origin feature/AmazingFeature`).
5. Bir Pull Request açın.

## Lisans

Bu proje **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** kapsamında lisanslanmıştır.
- Ticari olmayan amaçlarla paylaşmakta ve uyarlamakta özgürsünüz.
- Orijinal yazara atıfta bulunulması zorunludur.

---

<p align="center">
  <a href="https://github.com/Ard4Wien">ArdaWien</a> tarafından ❤️ ile geliştirildi
</p>
