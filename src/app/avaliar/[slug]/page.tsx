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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]">
        <div>
          <Link href={`/p/${slug}`} className="text-[13px] text-muted hover:text-foreground">← Voltar ao perfil</Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Avaliar @{slug}</h1>
          <p className="mt-1 text-[14px] text-muted">Sua avaliação é visível para outros assinantes.</p>
        </div>

        {error && (
          <p className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-[14px] text-coral">{error}</p>
        )}

        <div>
          <p className="text-[13px] font-semibold text-muted">Nota</p>
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
                    n <= (hover || rating) ? "fill-coral text-coral" : "text-black/10",
                  )}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-1 text-[13px] text-muted">
              {["", "Muito ruim", "Ruim", "Regular", "Boa", "Excelente"][rating]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-muted">
            Comentário <span className="font-normal">(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Conte sua experiência…"
            className="mt-2 w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[14px] shadow-[inset_0_0.5px_2px_rgba(0,0,0,0.04)] transition-shadow focus:border-[#0a84ff] focus:shadow-[0_0_0_3px_rgba(10,132,255,0.25)] focus:outline-none resize-none"
          />
          <p className="mt-1 text-right text-[11px] text-muted">{comment.length}/600</p>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !rating}
          className="w-full rounded-full bg-coral py-3 text-[14px] font-semibold text-white transition hover:brightness-110 active:scale-[0.97] disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Enviar avaliação"}
        </button>
      </div>
    </div>
  );
}
