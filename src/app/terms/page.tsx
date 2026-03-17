"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
    return (
        <div className={BACKGROUND_GRADIENT + " items-center justify-center p-4 transition-colors duration-500 overflow-y-auto"}>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="relative z-10 p-4 max-w-3xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/register">
                        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            Geri Dön
                        </Button>
                    </Link>
                    <ThemeToggle />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-black/5 dark:border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl space-y-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                            <Scale className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Kullanım Koşulları</h1>
                    </div>

                    <div className="space-y-6 text-muted-foreground text-sm md:text-base leading-relaxed">
                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">1. Giriş</h2>
                            <p>
                                PersonalLib platformuna hoş geldiniz. Bu web sitesini veya hizmetlerimizi kullanarak aşağıda belirtilen kullanım koşullarını kabul etmiş sayılırsınız. Lütfen bu koşulları dikkatlice okuyunuz.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">2. Hizmet Tanımı</h2>
                            <p>
                                PersonalLib, kullanıcıların kişisel medya kütüphanelerini (kitaplar, filmler, diziler) dijital ortamda yönetmelerini sağlayan bir platformdur. Hizmetimiz &quot;olduğu gibi&quot; sunulmakta olup, herhangi bir garanti verilmemektedir.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">3. Kullanıcı Yükümlülükleri ve İçerik (UGC)</h2>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz.</li>
                                <li><strong>İçerik Sorumluluğu:</strong> Eklediğiniz tüm verilerin (kitap incelemeleri, başlıklar, listeler vb.) yasal sorumluluğu tamamen size aittir.</li>
                                <li><strong>Telif Hakları:</strong> Telif hakkı ihlali içeren veya yasadışı materyaller (korsan linkler vb.) paylaşamazsınız.</li>
                                <li>Platformu yasadışı veya kötü niyetli amaçlarla kullanamazsınız.</li>
                                <li>Platformun teknik altyapısına zarar verecek davranışlarda bulunamazsınız.</li>
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">4. Açık Kaynak Lisansı ve Kullanım Şartları</h2>
                            <p>
                                PersonalLib&apos;in kaynak kodu açık kaynaklıdır ve aşağıdaki koşullar çerçevesinde kullanılabilir:
                            </p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li><strong>Kullanım ve Değiştirme:</strong> Kaynak kodunu kişisel veya eğitim amaçlı olarak kullanabilir, değiştirebilir ve dağıtabilirsiniz.</li>
                                <li><strong>Atıf Zorunluluğu:</strong> Kodu kullanan veya türetilmiş çalışmalar oluşturan herkes, orijinal projeye (PersonalLib) açık ve görünür bir şekilde atıfta bulunmak zorundadır.</li>
                                <li><strong>Ticari Kullanım Yasağı:</strong> Kaynak kodu veya türetilmiş çalışmalar hiçbir şekilde ticari amaçlarla kullanılamaz, satılamaz veya gelir elde etmek için dağıtılamaz.</li>
                            </ul>
                            <p className="text-xs italic text-muted-foreground/70 pt-1">
                                Bu lisans koşulları Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0) ilkeleriyle uyumludur.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">5. Fikri Mülkiyet</h2>
                            <p>
                                PersonalLib&apos;in logosu, tasarımı, yazılımı ve tüm özgün içerikleri PersonalLib&apos;e aittir. İzinsiz kopyalanamaz, çoğaltılamaz veya dağıtılamaz.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">6. Hesap Askıya Alma ve Fesih</h2>
                            <p>
                                Kullanım koşurlarını ihlal eden hesaplar önceden bildirimde bulunulmaksızın askıya alınabilir veya kalıcı olarak kapatılabilir.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">7. Sorumluluk Sınırlaması ve Hizmet Kesintileri</h2>
                            <p>
                                PersonalLib, &quot;olduğu gibi&quot; sunulmaktadır. Bakım çalışmaları, güncellemeler veya teknik arızalar nedeniyle platforma erişim geçici olarak kesilebilir. PersonalLib, bu kesintilerden veya platformun kullanımından doğabilecek zararlardan sorumlu tutulamaz.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">8. Sorumluluk Reddi (Disclaimer)</h2>
                            <p>
                                PersonalLib üzerinden erişilen verilerin (kitap, film bilgileri vb.) doğruluğu, güncelliği veya eksiksizliği konusunda herhangi bir garanti verilmemektedir. Platformdaki bilgiler yalnızca bilgilendirme amaçlıdır. Kullanıcıların bu bilgilere dayanarak aldığı kararların sorumluluğu kendilerine aittir.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">9. Uyuşmazlıkların Çözümü</h2>
                            <p>
                                Bu kullanım koşullarından doğabilecek her türlü uyuşmazlıkta Türkiye Cumhuriyeti yasaları geçerli olacak ve İstanbul (Merkez) Mahkemeleri ile İcra Daireleri yetkili kılınacaktır.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">10. Değişiklikler</h2>
                            <p>
                                Bu kullanım koşulları önceden haber verilmeksizin güncellenebilir. Platformu kullanmaya devam etmeniz, güncel koşulları kabul ettiğiniz anlamına gelir.
                            </p>
                        </section>

                        <div className="pt-4 border-t border-black/5 dark:border-white/5 text-xs italic text-muted-foreground/70">
                            Son güncelleme: 17 Mart 2026
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
