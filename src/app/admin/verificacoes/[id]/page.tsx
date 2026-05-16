import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { approveVerification, rejectVerification } from "@/app/_actions/verification";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 40 (admin verificação aprovação humana).
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function DocImage({ url, label }: { url: string | null; label: string }) {
  if (!url) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded border border-dashed border-line bg-line text-sm text-muted">
        Não enviado
      </div>
    );
  }
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    NOVO: "bg-sky-100 text-sky-900",
    REVISAO: "bg-pink-100 text-red-900",
    APROVADO: "bg-emerald-100 text-emerald-900",
    REJEITADO: "bg-zinc-200 text-zinc-800",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${map[status] ?? "bg-line text-muted"}`}>
      {status}
    </span>
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
  const waitMin = Math.max(1, Math.floor((Date.now() - vc.waitingSince.getTime()) / 60000));

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
      <Link href="/admin/moderacao" className="mb-4 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition">
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
            <p className="text-xl font-bold">{profile.displayName}</p>
            <p className="text-sm text-muted">
              {profile.city.name}{profile.district ? ` · ${profile.district.name}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">{profile.user?.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {statusBadge(vc.status)}
          <p className="text-xs text-muted">Aguardando há {waitMin} min</p>
          <p className="text-xs text-muted">Tipo: {vc.documentType ?? "—"}</p>
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
          target="_blank"
          className="rounded border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:bg-line transition"
        >
          Ver perfil público ↗
        </Link>
      </div>

      {vc.status !== "APROVADO" && vc.status !== "REJEITADO" ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {/* Approve */}
          <div className="rounded border border-emerald-200 bg-emerald-50 p-5">
            <p className="mb-3 font-semibold text-emerald-900">Aprovar verificação</p>
            <p className="mb-4 text-sm text-emerald-800/70">
              O perfil será marcado como verificado e o selo aparecerá publicamente.
            </p>
            <form action={approve}>
              <button
                type="submit"
                className="w-full rounded bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
              >
                Aprovar
              </button>
            </form>
          </div>

          {/* Reject */}
          <div className="rounded border border-red-200 bg-red-50 p-5">
            <p className="mb-3 font-semibold text-red-900">Rejeitar verificação</p>
            <form action={reject} className="space-y-3">
              <textarea
                name="note"
                rows={3}
                placeholder="Motivo da rejeição (opcional — aparece para o moderador)"
                className="w-full rounded border border-red-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
              />
              <button
                type="submit"
                className="w-full rounded border border-red-500 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition"
              >
                Rejeitar
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded border border-line bg-white p-5 text-center">
          <p className="text-sm text-muted">Este caso já foi {vc.status === "APROVADO" ? "aprovado" : "rejeitado"}.</p>
          <Link href="/admin/moderacao" className="mt-3 inline-block text-sm font-semibold text-coral hover:underline">
            Voltar à fila
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
