"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BookOpen, Film, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/books");
    }
  }, [status, router]);

  // Yükleniyor durumu
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-zinc-950 dark:to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 50 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-zinc-950 dark:to-black flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-500">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 text-center max-w-3xl mx-auto"
      >
        <motion.div variants={item} className="flex justify-center mb-6">
          <ModeToggle />
        </motion.div>

        {/* Logo */}
        <motion.div variants={item} className="flex justify-center gap-3 mb-8">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
              scale: { duration: 0.2 }
            }}
            className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
          >
            <BookOpen className="h-10 w-10 text-white" />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 },
              scale: { duration: 0.2 }
            }}
            className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
          >
            <Film className="h-10 w-10 text-white" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={item} className="text-5xl md:text-7xl font-bold text-white mb-4">
          Personal<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Lib</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={item} className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
          Kitaplarınızı, filmlerinizi ve dizilerinizi tek bir yerde takip edin.
          Kişisel medya kütüphanenizi oluşturun ve paylaşın.
        </motion.p>

        {/* Features */}
        <motion.div variants={item} className="flex flex-wrap justify-center gap-4 mb-10">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 dark:bg-zinc-900/50 border border-white/10 dark:border-zinc-800 text-gray-300">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>Okuma & İzleme Takibi</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 dark:bg-zinc-900/50 border border-white/10 dark:border-zinc-800 text-gray-300">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>İstek Listesi</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 dark:bg-zinc-900/50 border border-white/10 dark:border-zinc-800 text-gray-300">
            <Sparkles className="h-4 w-4 text-pink-400" />
            <span>Paylaşılabilir Portfolyo</span>
          </motion.div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 transition-all hover:scale-105 shadow-lg shadow-purple-500/25">
                Ücretsiz Başla
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </Link>
          <Link href="/login">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-white/20 text-white hover:bg-white/10 dark:hover:bg-zinc-800 text-lg px-8 transition-all hover:scale-105">
                Giriş Yap
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.p variants={item} className="mt-12 text-gray-400 text-sm">
          PersonalLib ile oluşturuldu 📚🎬
        </motion.p>
      </motion.div>
    </div>
  );
}
