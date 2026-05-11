import Link from "next/link";
import { Camera, ChevronRight, Lock, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ContaVerificacaoPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full flex-col justify-between bg-sidebar px-8 py-12 text-white md:max-w-sm md:min-h-screen">
        <div>
          <p className="font-serif text-lg">
            privello<span className="text-coral">.</span>
          </p>
          <h1 className="mt-10 font-serif text-3xl">Verificação</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Comparamos sua selfie com o documento. Aprovação em até 24h. Documentos são criptografados e nunca publicados.
          </p>
        </div>
        <div className="mt-10 rounded border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/70 md:mt-0">
          Imagens enviadas com AES-256 ponta a ponta. Apagamos automaticamente após 30 dias da aprovação.
        </div>
      </aside>
      <main className="flex-1 bg-background px-6 py-12 md:px-16">
        <h2 className="font-serif text-3xl md:text-4xl">
          Confirme que é você<span className="text-coral">.</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Três envios. Você precisa estar com seu documento original em mãos.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="border-2 border-success bg-white p-6">
            <span className="float-right text-[10px] font-bold uppercase text-success">Recebido</span>
            <p className="text-sm font-semibold">Frente do documento</p>
            <p className="mt-2 text-xs text-muted">RG ou CNH — foto nítida, sem reflexos.</p>
            <p className="mt-4 flex items-center gap-2 text-xs text-success">
              <span>✓</span> documento.jpg · 1,4 MB
            </p>
          </div>
          <div className="border-2 border-coral bg-white p-6">
            <p className="text-sm font-semibold">Verso do documento</p>
            <p className="mt-2 text-xs text-muted">Verifique se os dados estão legíveis.</p>
            <div className="mt-4 h-1 w-full bg-line">
              <div className="h-full w-[78%] bg-coral" />
            </div>
            <p className="mt-2 text-xs text-muted">Enviando · 78%</p>
          </div>
          <div className="border border-line bg-white p-6">
            <Camera className="h-6 w-6 text-muted" strokeWidth={1.25} />
            <p className="mt-3 text-sm font-semibold">Selfie com documento</p>
            <p className="mt-2 text-xs text-muted">Segure o documento ao lado do rosto.</p>
            <button type="button" className="mt-6 w-full bg-foreground py-2 text-xs font-semibold uppercase tracking-wider text-white">
              Tirar selfie
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 bg-foreground px-6 py-6 text-white md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 items-center justify-center bg-coral">
              <Camera className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold">Adicionar vídeo-verificação</p>
              <p className="mt-1 text-sm text-white/70">
                Vídeo de 10s com cartão Privello — selo extra e mais visibilidade.
              </p>
            </div>
          </div>
          <button type="button" className="border border-white px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            Gravar vídeo
          </button>
        </div>

        <div className="mt-8 grid gap-4 border border-line bg-[#faf8f4] p-6 text-xs text-muted md:grid-cols-3">
          <div className="flex gap-2">
            <Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Criptografia AES-256 — imagens cifradas no envio e no servidor.</span>
          </div>
          <div className="flex gap-2">
            <Shield className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            <span>Acesso restrito — apenas moderação, auditável.</span>
          </div>
          <div className="flex gap-2">
            <span className="text-lg leading-none">🗑</span>
            <span>Exclusão automática — removidos 30 dias após aprovação.</span>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Link href="/conta/onboarding/fotos" className="border border-line bg-white px-6 py-3 text-center text-sm">
            Voltar
          </Link>
          <button
            type="button"
            className="flex items-center justify-center gap-2 bg-foreground px-8 py-3 text-sm font-semibold text-white"
          >
            Enviar para revisão
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </main>
    </div>
  );
}
