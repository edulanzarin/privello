import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavWrapper } from "@/components/layout/bottom-nav-wrapper";
import { AgeGate } from "@/components/age-gate";
import { auth } from "@/lib/auth";
import { SITE_URL } from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const SITE_NAME = "Privello";
const SITE_TAGLINE =
  "Diretório de acompanhantes verificadas no Brasil. Perfis com fotos reais, áudio e vídeo, organizados por cidade.";

/**
 * Metadata base do site — Design System v2 (Tahoe Sensual) + SEO Fase 1.
 *
 * Ponto único de origem para:
 * - `metadataBase`: ancora todas as URLs relativas usadas em `openGraph.images`,
 *   `twitter.images` e canonicals derivados em rotas filhas.
 * - `title.default` + `template`: o template resolve para "<rota> · privello." nas
 *   páginas que retornam só `title: "..."`.
 * - `openGraph` + `twitter`: cobertura completa para WhatsApp / X / LinkedIn /
 *   Facebook / Telegram. Locale `pt_BR`.
 * - `robots`: index + follow ativos, com `googleBot` granular para imagens e
 *   snippets sem limite (concorrência de busca por nicho exige snippets longos).
 * - `alternates.canonical: "/"` no root: cada rota filha pode sobrescrever.
 *
 * Notas:
 * - `openGraph.images` aponta para `opengraph-image.tsx` na raiz (file convention)
 *   — Next gera automaticamente; aqui fica documentado pra reuso.
 * - Páginas autenticadas (`/painel/**`, `/admin/**`, `/conta/**`) sobrescrevem com
 *   `robots: { index: false }` localmente quando convier — mas o `robots.ts` na raiz
 *   já bloqueia esses paths para todos os bots.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · acompanhantes verificadas`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  keywords: [
    "acompanhantes",
    "garotas de programa",
    "garotos de programa",
    "acompanhantes verificadas",
    "diretório acompanhantes",
    "acompanhantes Brasil",
    "Privello",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} · acompanhantes verificadas`,
    description: SITE_TAGLINE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} · acompanhantes verificadas`,
    description: SITE_TAGLINE,
    creator: "@privello",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  referrer: "strict-origin-when-cross-origin",
  category: "lifestyle",
};

// fase-6: declara `interactive-widget=resizes-content` para que o viewport CSS
// reduza quando o teclado virtual abre em iOS Safari 16+ / Android Chrome moderno,
// permitindo que conteúdo `100dvh` se ajuste automaticamente em vez de ficar coberto.
// Cf. `.kiro/specs/fase-6-mobile-cross-browser/design.md > Components and Interfaces > 3`.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcfb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1517" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "MODERATOR";

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col text-ink">
        {/* pb-24 reserva espaço para a BottomNav flutuante (visible em
            todos breakpoints — decisão do usuário em 2026-05-17). 24*4 = 96px
            cobre a altura da pill (~56px) + bottom-4 (16px) + safe-area. */}
        <div className="flex flex-1 flex-col pb-24">{children}</div>
        <BottomNavWrapper />
        {!isAdmin && <AgeGate />}
      </body>
    </html>
  );
}
