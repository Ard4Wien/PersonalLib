"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gizlilik Politikası</h1>
                    </div>

                    <div className="space-y-6 text-muted-foreground text-sm md:text-base leading-relaxed">
                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">1. Toplanan Veriler</h2>
                            <p>PersonalLib, hizmetlerini sunabilmek için aşağıdaki kişisel verileri toplar:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li><strong>E-posta adresi:</strong> Hesap oluşturma, giriş yapma ve şifre sıfırlama işlemleri için.</li>
                                <li><strong>Kullanıcı adı ve görünen ad:</strong> Profil tanımlama ve sosyal özellikler için.</li>
                                <li><strong>Şifre:</strong> Güvenli bir şekilde hash&apos;lenerek saklanır, düz metin olarak asla kaydedilmez.</li>
                                <li><strong>Medya verileri:</strong> Eklediğiniz kitap, film ve dizi bilgileri.</li>
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">2. Verilerin Kullanım Amacı</h2>
                            <p>Topladığımız verileri yalnızca şu amaçlarla kullanırız:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Hesabınızı oluşturmak ve yönetmek.</li>
                                <li>Kişisel medya kütüphanenizi sunmak.</li>
                                <li>Platform güvenliğini sağlamak.</li>
                                <li>Hizmet kalitesini iyileştirmek.</li>
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">3. Veri Paylaşımı ve Altyapı</h2>
                            <p>
                                Kişisel verileriniz üçüncü taraflarla paylaşılmaz, satılmaz veya kiralanmaz. Ancak, uygulamamızın çalışması için gerekli olan teknik altyapı (sunucu ve veritabanı barındırma) güvenli bulut sağlayıcıları tarafından sunulmaktadır. Verileriniz bu sağlayıcıların altyapısında, üçüncü taraflarca işlenmeksizin güvenli bir şekilde muhafaza edilmektedir. Yalnızca yasal zorunluluk durumlarında yetkili makamlarla paylaşım yapılabilir.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">4. Veri Güvenliği ve Saklama Süreci</h2>
                            <p>Verilerinizin güvenliğini sağlamak için aşağıdaki önlemleri alıyor ve şu silme politikasını uyguluyoruz:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Şifreler bcrypt algoritmasıyla hash&apos;lenerek saklanır.</li>
                                <li>HTTPS ile şifrelenmiş bağlantı kullanılır.</li>
                                <li><strong>Hesap Silme:</strong> Hesabınızı sildiğinizde verileriniz aktif veritabanımızdan anında silinir. Yedekleme sistemlerimizdeki veriler ise en geç 30 gün içerisinde tamamen temizlenmektedir.</li>
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">5. Yaş Sınırı</h2>
                            <p>
                                PersonalLib, 13 yaş ve üzeri kullanıcıların kullanımı için tasarlanmıştır. Eğer 13 yaşın altındaki bir çocuğun bize kişisel veri sağladığını fark ederseniz, lütfen bizimle iletişime geçin. Bu verileri sistemlerimizden derhal sileceğiz.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">6. Kullanıcı Hakları</h2>
                            <p>Kullanıcılarımız aşağıdaki haklara sahiptir:</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>Kişisel verilerine erişim talep etme.</li>
                                <li>Verilerinin düzeltilmesini veya silinmesini isteme.</li>
                                <li>Hesabını kalıcı olarak kapatma.</li>
                                <li>Veri işleme faaliyetleri hakkında bilgi alma.</li>
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">7. Değişiklikler</h2>
                            <p>
                                Bu gizlilik politikası önceden haber verilmeksizin güncellenebilir. Önemli değişiklikler yapıldığında kullanıcılarımız bilgilendirilecektir.
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
