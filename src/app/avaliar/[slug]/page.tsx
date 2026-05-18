"use client";

/**
 * Página — Formulário de avaliação de perfil pelo cliente assinante.
 *
 * Rota: `/avaliar/[slug]`.
 * Tipo: Client Component (`"use client"`).
 * Auth: cliente logado (gate efetivo em `POST /api/review` — o handler
 *  exige sessão de cliente assinante; UI é acessível mas o submit falha
 *  sem credenciais).
 *
 * Visual:
 * - Tahoe Sensual v2 — `<SiteHeader>` + `<SiteFooter>`, container reading
 *   `max-w-md`, Card branco com border-line, picker de estrelas inline
 *   (rose fill quando selecionado), `<Textarea>` primitivo, `<Button>` lg
 *   primary fullwidth.
 * - Steering: §4 (Inter), §5.1 (form max-w-md), §3.3 (rose accent), §6.3
 *   (Button polimórfico).
 *
 * Cross-refs:
 * - src/app/api/review/route.ts (handler de submissão)
 * - src/components/ui/textarea.tsx, button.tsx
 */
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const RATING_LABELS = ["", "Muito ruim", "Ruim", "Regular", "Boa", "Excelente"] as const;

export default function ReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!rating) {
      setError("Selecione uma nota.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileSlug: slug, rating, comment }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao enviar avaliação.");
      setSubmitting(false);
      return;
    }
    router.push(`/p/${slug}`);
  }

  const display = hover || rating;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col px-4 py-12 sm:px-6">
        <Link
          href={`/p/${slug}`}
          className="inline-flex items-center gap-1.5 text-base text-ink-dim transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar ao perfil
        </Link>

        <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <h1 className="text-2xl font-bold tracking-[-0.022em] text-ink">
            Avaliar @{slug}
          </h1>
          <p className="mt-1.5 text-md text-ink-dim">
            Sua avaliação é visível para outros assinantes.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-md text-danger"
            >
              {error}
            </p>
          )}

          <div className="mt-6">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink-dim">
              Nota
            </p>
            <div className="mt-3 flex gap-1.5" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  aria-label={`Dar nota ${n} de 5`}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-transform duration-150 ease-[var(--ease-tahoe)] hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors duration-150",
                      n <= display
                        ? "fill-rose text-rose"
                        : "text-line",
                    )}
                    strokeWidth={n <= display ? 0 : 1.5}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-2 text-sm font-medium text-rose">
                {RATING_LABELS[rating]}
              </p>
            )}
          </div>

          <div className="mt-6">
            <Textarea
              label="Comentário"
              hint="Opcional — conte como foi sua experiência."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Conte sua experiência…"
            />
            <p className="mt-1 text-right text-xs tabular-nums text-ink-faint">
              {comment.length}/600
            </p>
          </div>

          <div className="mt-6">
            <Button
              onClick={submit}
              disabled={submitting || !rating}
              loading={submitting}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {submitting ? "Enviando…" : "Enviar avaliação"}
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
