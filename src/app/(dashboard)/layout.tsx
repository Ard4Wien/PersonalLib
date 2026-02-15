import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/header";
import Providers from "@/components/providers";
import { BACKGROUND_GRADIENT } from "@/lib/utils";

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
            <div className={BACKGROUND_GRADIENT}>
                <Header />
                <main className="container mx-auto px-4 py-8">{children}</main>
            </div>
        </Providers>
    );
}
