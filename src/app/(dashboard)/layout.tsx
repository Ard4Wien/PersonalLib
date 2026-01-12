import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/header";
import Providers from "@/components/providers";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <Providers>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-zinc-950 dark:to-black transition-colors duration-300">
                <Header />
                <main className="container mx-auto px-4 py-8">{children}</main>
            </div>
        </Providers>
    );
}
