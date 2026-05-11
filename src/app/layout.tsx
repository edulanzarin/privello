import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavWrapper } from "@/components/layout/bottom-nav-wrapper";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <BottomNavWrapper />
      </body>
    </html>
  );
}
