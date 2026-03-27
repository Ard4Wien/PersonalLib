"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { BACKGROUND_GRADIENT } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/language-context";

export default function TermsPage() {
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
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                            <Scale className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.terms.title}</h1>
                    </div>

                    <div className="space-y-6 text-muted-foreground text-sm md:text-base leading-relaxed">
                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section1Title}</h2>
                            <p>
                                {t.terms.section1Text}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section2Title}</h2>
                            <p>
                                {t.terms.section2Text}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section3Title}</h2>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                {t.terms.section3Items.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                                <li><strong>{t.terms.section3Content}</strong>{t.terms.section3ContentText}</li>
                                <li><strong>{t.terms.section3Copyright}</strong>{t.terms.section3CopyrightText}</li>
                                {t.terms.section3Extra.map((item, idx) => (
                                    <li key={idx}>{item}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section4Title}</h2>
                            <p>
                                {t.terms.section4Intro}
                            </p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li><strong>{t.terms.section4Usage}</strong>{t.terms.section4UsageText}</li>
                                <li><strong>{t.terms.section4Attribution}</strong>{t.terms.section4AttributionText}</li>
                                <li><strong>{t.terms.section4Commercial}</strong>{t.terms.section4CommercialText}</li>
                            </ul>
                            <p className="text-xs italic text-muted-foreground/70 pt-1">
                                {t.terms.section4License}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section5Title}</h2>
                            <p>
                                {t.terms.section5Text}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section6Title}</h2>
                            <p>
                                {t.terms.section6Text}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section7Title}</h2>
                            <p>
                                {t.terms.section7Text}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section8Title}</h2>
                            <p>
                                {t.terms.section8Text}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section9Title}</h2>
                            <p>
                                {t.terms.section9Text}
                            </p>
                        </section>

                        <section className="space-y-2 border-t border-black/5 dark:border-white/5 pt-6">
                            <h2 className="text-lg font-semibold text-foreground">{t.terms.section10Title}</h2>
                            <p>
                                {t.terms.section10Text}
                            </p>
                            <p className="font-semibold text-purple-600 dark:text-purple-400">
                                {t.privacy.section6Email}
                            </p>
                        </section>

                        <div className="pt-4 text-xs italic text-muted-foreground/70">
                            {t.terms.lastUpdated}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
