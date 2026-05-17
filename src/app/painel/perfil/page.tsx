/**
 * Página RSC — Painel do provider: editor de perfil.
 *
 * Rota: `/painel/perfil`.
 * Tipo: Server Component (editor é Client).
 * Auth: acompanhante (PROVIDER) — gate em `src/app/painel/layout.tsx`.
 * Cache: `force-dynamic` (lê estado atual do `Profile` + stories ativos).
 *
 * Carrega `Profile` completo + mídias + stories das últimas 24h e delega
 * a edição ao `PerfilEditor`.
 *
 * Cross-refs:
 * - src/app/painel/perfil/perfil-editor.tsx
 * - src/app/painel/_actions/provider-settings.ts
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PerfilEditor } from "./perfil-editor";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 25 (editor de perfil do provider).
export const dynamic = "force-dynamic";

export default async function PainelPerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  // Janela de stories ativos: últimos 24h. Page é dinâmica (`force-dynamic`),
  // então `Date.now()` por request é comportamento intencional.
  // eslint-disable-next-line react-hooks/purity -- intencional em RSC dinâmica
  const stories24hWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: {
      city: true,
      media: { orderBy: { sortOrder: "asc"} },
      stories: {
        where: { expiresAt: { gt: stories24hWindow } },
        include: { _count: { select: { views: true, likes: true } } },
        orderBy: { createdAt: "desc"},
        take: 20,
      },
    },
  });
  if (!profile) redirect("/conta/onboarding/perfil");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Editar perfil</h1>
        <p className="mt-1 text-md text-ink-dim">
          Alterações são salvas imediatamente e refletem no seu anúncio público.
        </p>
      </div>
      <div className="max-w-xl mx-auto">
        <PerfilEditor
          profile={profile}
          cityName={profile.city?.name ?? ""}
          citySlug={profile.city?.slug ?? ""}
        />
      </div>
    </div>
  );
}
