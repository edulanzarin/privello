import type { Metadata, Viewport } from "next";
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
    "As melhores acompanhantes do Brasil. Perfis verificados, fotos reais, áudio e vídeo. Encontre acompanhantes por cidade com discrição e segurança.",
};

// fase-6: declara `interactive-widget=resizes-content` para que o viewport CSS
// reduza quando o teclado virtual abre em iOS Safari 16+ / Android Chrome moderno,
// permitindo que conteúdo `100dvh` se ajuste automaticamente em vez de ficar coberto.
// Cf. `.kiro/specs/fase-6-mobile-cross-browser/design.md > Components and Interfaces > 3`.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
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
