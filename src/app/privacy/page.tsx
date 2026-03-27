"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/language-context";

export default function PrivacyPage() {
    const { t } = useTranslation();

    return (
        <div className={BACKGROUND_GRADIENT + " items-center justify-center p-4 transition-colors duration-500 overflow-y-auto"}>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="relative z-10 p-4 max-w-3xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                            {t.common.back}
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
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.privacy.title}</h1>
                    </div>

                    <div className="space-y-6 text-muted-foreground text-sm md:text-base leading-relaxed">
                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.privacy.section1Title}</h2>
                            <p>{t.privacy.section1Intro}</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {t.privacy.section1Items.map((item, idx) => (
                                    <li key={idx}><strong>{item.bold}</strong>{item.text}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.privacy.section2Title}</h2>
                            <p>
                                <Link href="https://personal-lib.vercel.app" className="text-blue-500 hover:underline">PersonalLib</Link>, 
                                {t.privacy.section2Text}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.privacy.section3Title}</h2>
                            <p>{t.privacy.section3Intro}</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {t.privacy.section3Items.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.privacy.section4Title}</h2>
                            <p>{t.privacy.section4Text}</p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.privacy.section5Title}</h2>
                            <p>{t.privacy.section5Intro}</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {t.privacy.section5Items.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                                <li><strong>{t.privacy.section5Delete}</strong>{t.privacy.section5DeleteText}</li>
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.privacy.section6Title}</h2>
                            <p>
                                {t.privacy.section6Text}
                                <strong>{t.privacy.section6Email}</strong>
                                {t.privacy.section6TextEnd}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.privacy.section7Title}</h2>
                            <p>{t.privacy.section7Intro}</p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {t.privacy.section7Items.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.privacy.section8Title}</h2>
                            <p>{t.privacy.section8Text}</p>
                        </section>

                        <div className="pt-4 border-t border-black/5 dark:border-white/5 text-xs italic text-muted-foreground/70">
                            {t.privacy.lastUpdated}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
