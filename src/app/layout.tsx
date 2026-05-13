import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavWrapper } from "@/components/layout/bottom-nav-wrapper";
import { AgeGate } from "@/components/age-gate";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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

  let showEmailBanner = false;
  let sessionUserId: string | undefined;
  const isProvider = session?.user?.role === "PROVIDER";
  if (session?.user?.id && !isAdmin && isProvider) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verified: true },
    });
    showEmailBanner = !user?.verified;
    sessionUserId = session.user.id;
  }

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        {showEmailBanner && sessionUserId && (
          <EmailVerificationBanner userId={sessionUserId} />
        )}
        <div className="flex flex-1 flex-col pb-16">
          {children}
        </div>
        <BottomNavWrapper />
        {!isAdmin && <AgeGate />}
      </body>
    </html>
  );
}
