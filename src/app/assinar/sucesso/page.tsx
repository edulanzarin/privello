import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function AssinaturaSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="font-serif text-xl">
          privello<span className="text-coral">.</span>
        </Link>

        <div className="mt-10 rounded-2xl border border-black/[0.06] bg-white p-8 shadow-sm">
          <CheckCircle className="mx-auto h-12 w-12 text-success" strokeWidth={1.5} />
          <h1 className="mt-4 font-serif text-2xl">Assinatura ativada!</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Bem-vindo ao Privello. Você agora tem acesso a todo o conteúdo exclusivo da plataforma.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block w-full rounded-lg bg-foreground py-3 text-center text-base font-semibold text-white hover:bg-foreground/80 active:scale-[0.97] transition"
          >
            Explorar conteúdo
          </Link>
          <Link
            href="/reels"
            className="mt-2 inline-block w-full rounded-lg border border-line py-3 text-center text-base font-semibold text-muted hover:text-foreground hover:bg-line/40 transition"
          >
            Ver Reels exclusivos
          </Link>
        </div>
      </div>
    </div>
  );
}
