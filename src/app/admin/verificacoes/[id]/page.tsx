/**
 * Página RSC — Admin detalhe de caso de verificação (aprovar/rejeitar).
 *
 * Rota: `/admin/verificacoes/[id]`.
 * Tipo: Server Component.
 * Auth: admin/moderator (enforço em `src/app/admin/layout.tsx`; também
 *  re-checa `auth()` para garantir sessão).
 * Cache: `force-dynamic` (estado do caso e tempo de espera por request).
 *
 * Tela de revisão humana de um `VerificationCase`: mostra documentos,
 * selfie/vídeo e formulários para aprovar ou rejeitar com nota.
 *
 * Cross-refs:
 * - src/app/admin/layout.tsx
 * - src/components/admin/admin-shell.tsx
 * - src/app/_actions/verification.ts (approveVerification, rejectVerification)
 * - .kiro/specs/redesign-macos-system — Requirement 7 (Card variantes subtle)
 *   e Requirement 10.6 (painéis aprovar/rejeitar via Card subtle + Button).
 */
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { approveVerification, rejectVerification } from "@/app/_actions/verification";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { statusToBadgeVariant } from "@/lib/ui/status";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 40 (admin verificação aprovação humana).
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function DocImage({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded border border-dashed border-line bg-line text-sm text-ink-dim">
        Não enviado
      </div>
    );
  }
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
  return (
    <div className="space-y-1">
      <p className="text-2xs font-bold uppercase tracking-wider text-ink-dim">{label}</p>
      {isVideo ? (
        <video src={url} controls className="h-64 w-full rounded border border-line object-contain bg-black" />
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative h-64 w-full overflow-hidden rounded border border-line bg-line">
            <Image src={url} alt={label} fill className="object-contain" />
          </div>
        </a>
      )}
    </div>
  );
}

export default async function VerificationDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const { id } = await params;
  const vc = await prisma.verificationCase.findUnique({
    where: { id },
    include: {
      profile: {
        include: {
          city: { select: { name: true } },
          district: { select: { name: true } },
          media: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          user: { select: { email: true, phone: true } },
        },
      },
    },
  });
  if (!vc) notFound();

  const profile = vc.profile;
  const coverUrl = profile.media[0]?.url ?? null;
  // Page é dinâmica (`force-dynamic`); `Date.now()` aqui é avaliado uma vez por
  // request, comportamento intencional para calcular "esperando há X minutos".
  // O React Compiler considera `Date.now()` impura, mas em Server Component dinâmico
  // o resultado já é "consistente"dentro do request — não há re-render no client.
  // eslint-disable-next-line react-hooks/purity -- intencional em RSC dinâmica
  const nowMs = Date.now();
  const waitMin = Math.max(1, Math.floor((nowMs - vc.waitingSince.getTime()) / 60000));

  async function approve() {
    "use server";
    await approveVerification(id);
    redirect("/admin/moderacao");
  }

  async function reject(formData: FormData) {
    "use server";
    const note = (formData.get("note") as string | null)?.trim() || undefined;
    await rejectVerification(id, note);
    redirect("/admin/moderacao");
  }

  return (
    <AdminShell>
      <Link href="/admin/moderacao" className="mb-4 inline-flex items-center gap-1 text-xs text-ink-dim hover:text-ink transition">
        ← Moderação
      </Link>
      {/* Case header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {coverUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-line">
              <Image src={coverUrl} alt="" fill className="object-cover" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-line" />
          )}
          <div>
            <p className="text-xl font-bold tracking-[-0.022em] text-ink">{profile.displayName}</p>
            <p className="text-sm text-ink-dim">
              {profile.city.name}{profile.district ? ` · ${profile.district.name}` : ""}
            </p>
            <p className="mt-1 text-xs text-ink-dim">{profile.user?.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Badge variant={statusToBadgeVariant(vc.status)}>{vc.status}</Badge>
          <p className="text-xs text-ink-dim">Aguardando há {waitMin} min</p>
          <p className="text-xs text-ink-dim">Tipo: {vc.documentType ?? "—"}</p>
        </div>
      </div>

      {/* Documents */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DocImage url={vc.documentFrontUrl} label="Documento (frente)" />
        <DocImage url={vc.documentBackUrl} label="Documento (verso)" />
        <DocImage url={vc.selfieUrl} label="Selfie com documento" />
      </div>

      {/* Existing notes */}
      {(vc.documentNote || vc.selfieNote) && (
        <div className="mt-4 rounded border border-line bg-white p-4 text-sm">
          {vc.documentNote && <p><span className="font-semibold">Documento:</span> {vc.documentNote}</p>}
          {vc.selfieNote && <p className="mt-1"><span className="font-semibold">Selfie:</span> {vc.selfieNote}</p>}
        </div>
      )}

      {/* Profile link */}
      <div className="mt-4 flex gap-2">
        <Link
          href={`/p/${profile.slug}`}
          target="_blank" className="rounded border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:bg-line transition">
          Ver perfil público ↗
        </Link>
      </div>

      {vc.status !== "APROVADO" && vc.status !== "REJEITADO" ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Approve */}
          <Card variant="success-subtle" padding="md">
            <p className="mb-3 font-semibold text-success">Aprovar verificação</p>
            <p className="mb-4 text-sm text-ink-dim">
              O perfil será marcado como verificado e o selo aparecerá publicamente.
            </p>
            <form action={approve}>
              <Button type="submit" variant="primary" className="w-full">
                Aprovar
              </Button>
            </form>
          </Card>

          {/* Reject */}
          <Card variant="danger-subtle" padding="md">
            <p className="mb-3 font-semibold text-danger">Rejeitar verificação</p>
            <form action={reject} className="space-y-3">
              <Textarea
                name="note" rows={3}
                placeholder="Motivo da rejeição (opcional — aparece para o moderador)" />
              <Button type="submit" variant="danger" className="w-full">
                Rejeitar
              </Button>
            </form>
          </Card>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-line bg-white p-5 text-center shadow-[var(--shadow-sm)]">
          <p className="text-sm text-ink-dim">Este caso já foi {vc.status === "APROVADO" ? "aprovado" : "rejeitado"}.</p>
          <Link href="/admin/moderacao" className="mt-3 inline-block text-sm font-semibold text-rose hover:underline">
            Voltar à fila
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
