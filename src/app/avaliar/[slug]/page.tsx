"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!rating) { setError("Selecione uma nota."); return; }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileSlug: slug, rating, comment }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erro ao enviar avaliação."); setSubmitting(false); return; }
    router.push(`/p/${slug}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f9f7] px-4">
      <div className="w-full max-w-md space-y-6 border border-line bg-white p-8">
        <div>
          <Link href={`/p/${slug}`} className="text-xs text-muted hover:text-foreground">← Voltar ao perfil</Link>
          <h1 className="mt-4 font-serif text-2xl">Avaliar @{slug}</h1>
          <p className="mt-1 text-sm text-muted">Sua avaliação é visível para outros assinantes.</p>
        </div>

        {error && (
          <p className="border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</p>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Nota</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    n <= (hover || rating) ? "fill-coral text-coral" : "text-line",
                  )}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-1 text-xs text-muted">
              {["", "Muito ruim", "Ruim", "Regular", "Boa", "Excelente"][rating]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
            Comentário <span className="font-normal normal-case">(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Conte sua experiência…"
            className="mt-2 w-full border border-line bg-white px-4 py-3 text-sm outline-none focus:border-foreground resize-none"
          />
          <p className="mt-1 text-right text-[11px] text-muted">{comment.length}/600</p>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !rating}
          className="w-full bg-coral py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-coral/90 disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Enviar avaliação"}
        </button>
      </div>
    </div>
  );
}
