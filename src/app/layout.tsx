import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavWrapper } from "@/components/layout/bottom-nav-wrapper";
import { AgeGate } from "@/components/age-gate";
import { auth } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "privello.",
    template: "%s · privello.",
  },
  description:
    "Encontros com curadoria, verificação manual e perfis verificados. Descubra acompanhantes por cidade com privacidade e estrutura de marca.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <div className="flex flex-1 flex-col pb-14">
          {children}
        </div>
        <BottomNavWrapper />
        {!isAdmin && <AgeGate />}
      </body>
    </html>
  );
}
