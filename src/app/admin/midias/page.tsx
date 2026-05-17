/**
 * Página RSC — Admin moderação de mídias.
 *
 * Rota: `/admin/midias`.
 * Tipo: Server Component.
 * Auth: admin/moderator (enforço em `src/app/admin/layout.tsx`).
 * Cache: `force-dynamic` (filtros, busca e paginação por searchParams).
 *
 * Listagem em grid/list de todas as mídias da plataforma com filtros por
 * tipo, visibilidade, ordenação e ações rápidas (toggle visibilidade, deletar).
 *
 * Migrada para os primitivos do design system (Tabs, Table, Badge) conforme
 * spec `redesign-macos-system` Requirement 10.3 / Task 14.1: zero classes
 * Tailwind cruas de paleta (zinc/emerald/etc.) na superfície da página.
 *
 * Cross-refs:
 * - src/app/admin/layout.tsx
 * - src/components/admin/admin-shell.tsx
 * - src/components/admin/media-actions.tsx
 * - src/components/ui/{table,badge,tabs}.tsx
 */
import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { MediaDeleteBtn, MediaVisibilityBtn } from "@/components/admin/media-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import {
  Heart,
  MessageCircle,
  Lock,
  Star,
  Play,
  Eye,
  BadgeCheck,
} from "lucide-react";

// dynamic justificado — ver .kiro/specs/fase-3-backend/metricas-baseline.md > §3.2 linha 38 (admin moderação de mídias).
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminMidiasPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const get = (k: string) => { const v = raw[k]; return Array.isArray(v) ? v[0] : v; };

  const q = get("q")?.trim() ?? "";
  const typeF = get("type") ?? "";
  const visibF = get("visib") ?? "";
  const sortF = get("sort") ?? "newest";
  const viewMode = get("view") ?? "grid";
  const pageNum = Math.max(1, parseInt(get("p") ?? "1", 10));
  const PAGE_SIZE = viewMode === "list"? 30 : 60;

  const where: Prisma.MediaWhereInput = {};
  if (typeF) where.mediaType = typeF;
  if (visibF === "public") where.isPublic = true;
  if (visibF === "private") where.isPublic = false;
  if (q) {
    where.profile = {
      OR: [
        { displayName: { contains: q, mode: "insensitive"} },
        { slug: { contains: q, mode: "insensitive"} },
      ],
    };
  }

  const orderBy: Prisma.MediaOrderByWithRelationInput =
    sortF === "oldest"? { createdAt: "asc"} :
      sortF === "likes"? { likes: { _count: "desc"} } :
        sortF === "comments"? { comments: { _count: "desc"} } :
          { createdAt: "desc"};

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy,
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        url: true,
        mediaType: true,
        isPublic: true,
        isCover: true,
        caption: true,
        createdAt: true,
        _count: { select: { likes: true, comments: true } },
        profile: {
          select: {
            id: true,
            slug: true,
            displayName: true,
            isVerified: true,
            city: { select: { name: true } },
            media: { where: { isCover: true }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    prisma.media.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Stats bar
  const [totalPublic, totalPrivate, totalReels] = await Promise.all([
    prisma.media.count({ where: { isPublic: true } }),
    prisma.media.count({ where: { isPublic: false } }),
    prisma.media.count({ where: { mediaType: "REEL"} }),
  ]);

  function href(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merge = { q, type: typeF, visib: visibF, sort: sortF, view: viewMode, p: String(pageNum), ...overrides };
    for (const [k, v] of Object.entries(merge)) { if (v && v !== "newest"&& v !== "grid") p.set(k, v); else if (k === "view"&& v === "list") p.set(k, v); else if (k === "sort"&& v !== "newest") p.set(k, v); }
    return `/admin/midias?${p.toString()}`;
  }

  // Tabs do view toggle (grid/list) — primitivo Tabs com modo Link via `href`.
  const viewTabs = [
    { key: "grid", label: "Grade", href: href({ view: "grid", p: "1"}) },
    { key: "list", label: "Lista", href: href({ view: "list", p: "1"}) },
  ];
  const activeViewKey = viewMode === "list"? "list": "grid";

  return (
    <AdminShell>
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="font-bold text-lg">Mídias <span className="text-ink-dim font-normal text-sm">({total.toLocaleString("pt-BR")})</span></h1>

          {/* View toggle (Tabs pills) */}
          <Tabs
            items={viewTabs}
            activeKey={activeViewKey}
            variant="pills"size="sm"/>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
          {[
            { label: "Total", value: total, active: !typeF && !visibF },
            { label: "Públicas", value: totalPublic, active: visibF === "public"},
            { label: "Privadas", value: totalPrivate, active: visibF === "private"},
            { label: "Reels", value: totalReels, active: typeF === "REEL"},
          ].map(({ label, value, active }) => (
            <div key={label} className={`border px-3 py-2 ${active ? "border-ink bg-ink text-white": "border-line bg-white"}`}>
              <p className={`text-2xs font-bold uppercase tracking-wider ${active ? "text-white/60": "text-ink-dim"}`}>{label}</p>
              <p className="text-xl font-bold mt-0.5">{value.toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <form method="get"action="/admin/midias"className="flex flex-wrap gap-2">
          <input name="view"type="hidden"value={viewMode} />
          <input
            name="q"defaultValue={q}
            placeholder="Perfil ou @handle…"className="rounded-md border border-line px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background w-44 hover:border-black/20 focus:border-rose transition-all"/>
          <select name="type"defaultValue={typeF} className="rounded-md border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-black/20 focus:border-rose transition-all">
            <option value="">Todos os tipos</option>
            <option value="IMAGE">Foto</option>
            <option value="VIDEO">Vídeo</option>
            <option value="REEL">Reel</option>
          </select>
          <select name="visib"defaultValue={visibF} className="border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <option value="">Pública + Privada</option>
            <option value="public">Só públicas</option>
            <option value="private">Só privadas</option>
          </select>
          <select name="sort"defaultValue={sortF} className="border border-line bg-white px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-rose/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="likes">Mais curtidas</option>
            <option value="comments">Mais comentadas</option>
          </select>
          <button type="submit"className="bg-ink px-3 py-1.5 text-xs font-bold text-white">
            Filtrar
          </button>
          {(q || typeF || visibF || sortF !== "newest") && (
            <Link href="/admin/midias"className="px-3 py-1.5 text-xs border border-line text-ink-dim hover:text-ink hover:border-ink/30 transition">
              Limpar
            </Link>
          )}
        </form>
      </div>

      {media.length === 0 ? (
        <div className="py-6">
          <EmptyState title="Nenhuma mídia encontrada"/>
        </div>
      ) : viewMode === "list"? (
        /* ── LIST VIEW ── */
        <Table minWidth={720}>
          <THead>
            <tr>
              <TH className="w-16">Mídia</TH>
              <TH>Perfil</TH>
              <TH>Tipo</TH>
              <TH>Visibilidade</TH>
              <TH>Engajamento</TH>
              <TH>Data</TH>
              <TH align="right">Ações</TH>
            </tr>
          </THead>
          <tbody>
            {media.map((m) => {
              const cover = m.profile.media[0]?.url;
              return (
                <TR key={m.id}>
                  {/* Thumbnail */}
                  <TD>
                    <div className="relative h-14 w-10 overflow-hidden bg-line flex-shrink-0 rounded">
                      {m.mediaType !== "IMAGE"? (
                        <div className="flex h-full items-center justify-center bg-ink text-white/60">
                          <Play className="h-4 w-4"strokeWidth={1.5} />
                        </div>
                      ) : (
                        <Image src={m.url} alt=""fill sizes="40px"className="object-cover"/>
                      )}
                      {!m.isPublic && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Lock className="h-3.5 w-3.5 text-white"strokeWidth={2} />
                        </div>
                      )}
                    </div>
                  </TD>

                  {/* Profile */}
                  <TD>
                    <div className="flex items-center gap-2">
                      <div className="relative h-7 w-6 overflow-hidden rounded bg-line flex-shrink-0">
                        {cover && <Image src={cover} alt=""fill sizes="24px"className="object-cover"/>}
                      </div>
                      <div>
                        <Link href={`/admin/perfis?q=${m.profile.slug}`} className="font-semibold text-xs hover:underline flex items-center gap-1">
                          {m.profile.displayName}
                          {m.profile.isVerified && (
                            <BadgeCheck className="h-3 w-3 text-success"strokeWidth={2} aria-label="Verificado"/>
                          )}
                        </Link>
                        <p className="text-2xs text-ink-dim">@{m.profile.slug} · {m.profile.city.name}</p>
                      </div>
                    </div>
                  </TD>

                  {/* Tipo */}
                  <TD>
                    <span className="text-2xs font-bold uppercase tracking-wider text-ink-dim">
                      {m.mediaType === "REEL"? "🎬 Reel": m.mediaType === "VIDEO"? "📹 Vídeo": "🖼 Foto"}
                    </span>
                    {m.isCover && (
                      <Badge variant="coral"className="ml-1 uppercase tracking-wider">
                        Capa
                      </Badge>
                    )}
                  </TD>

                  {/* Visibilidade */}
                  <TD>
                    {m.isPublic ? (
                      <Badge variant="success">
                        <Eye className="h-3 w-3"strokeWidth={2} />
                        Pública
                      </Badge>
                    ) : (
                      <Badge variant="muted">
                        <Lock className="h-3 w-3"strokeWidth={2} />
                        Privada
                      </Badge>
                    )}
                  </TD>

                  {/* Engajamento */}
                  <TD>
                    <div className="flex items-center gap-3 text-xs text-ink-dim">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3"strokeWidth={1.5} />{m._count.likes}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3"strokeWidth={1.5} />{m._count.comments}</span>
                    </div>
                  </TD>

                  {/* Data */}
                  <TD className="text-xs text-ink-dim whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit"})}
                  </TD>

                  {/* Ações */}
                  <TD align="right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <MediaVisibilityBtn mediaId={m.id} isPublic={m.isPublic} />
                      <MediaDeleteBtn mediaId={m.id} />
                      <Link
                        href={m.url}
                        target="_blank"className="text-2xs border border-line px-2 py-1 text-ink-dim hover:text-ink transition">
                        ↗ Ver
                      </Link>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      ) : (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((m) => {
            const cover = m.profile.media[0]?.url;
            return (
              <div key={m.id} className="group border border-line bg-white overflow-hidden">
                {/* Photo */}
                <div className="relative aspect-[3/4] bg-line overflow-hidden">
                  {m.mediaType !== "IMAGE"? (
                    <div className="flex h-full flex-col items-center justify-center bg-ink gap-2">
                      <Play className="h-8 w-8 text-white/50"strokeWidth={1.5} />
                      <span className="text-2xs text-white/40 font-semibold uppercase tracking-wider">{m.mediaType}</span>
                    </div>
                  ) : (
                    <Image
                      src={m.url}
                      alt={m.caption ?? ""}
                      fill
                      sizes="(min-width:1024px) 20vw, (min-width:768px) 25vw, (min-width:640px) 33vw, 50vw"className="object-cover transition-transform duration-300 group-hover:scale-105"/>
                  )}

                  {/* Top badges - always visible */}
                  <div className="absolute top-1.5 left-1.5 flex gap-1">
                    {!m.isPublic && (
                      <span className="flex items-center gap-0.5 bg-black/70 text-white text-2xs font-bold px-1.5 py-0.5 rounded">
                        <Lock className="h-2.5 w-2.5"strokeWidth={2.5} /> PRIVADA
                      </span>
                    )}
                    {m.isCover && (
                      <span className="flex items-center gap-0.5 bg-rose text-white text-2xs font-bold px-1.5 py-0.5 rounded">
                        <Star className="h-2.5 w-2.5"strokeWidth={2.5} /> CAPA
                      </span>
                    )}
                  </div>

                  {/* Quick actions - on hover */}
                  <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                    <MediaVisibilityBtn mediaId={m.id} isPublic={m.isPublic} />
                    <MediaDeleteBtn mediaId={m.id} />
                  </div>
                </div>

                {/* Profile info - always visible */}
                <div className="p-2 border-t border-line">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="relative h-5 w-4 overflow-hidden rounded flex-shrink-0 bg-line">
                      {cover && <Image src={cover} alt=""fill sizes="16px"className="object-cover"/>}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/perfis?q=${m.profile.slug}`}
                        className="text-xs font-bold hover:underline leading-none truncate flex items-center gap-0.5">
                        {m.profile.displayName}
                        {m.profile.isVerified && (
                          <BadgeCheck className="h-3 w-3 text-success"strokeWidth={2} aria-label="Verificado"/>
                        )}
                      </Link>
                      <p className="text-2xs text-ink-dim leading-none mt-0.5">{m.profile.city.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-2xs text-ink-dim">
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-2.5 w-2.5"strokeWidth={1.5} />{m._count.likes}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle className="h-2.5 w-2.5"strokeWidth={1.5} />{m._count.comments}
                      </span>
                    </div>
                    <span className="text-2xs text-ink-dim">
                      {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short"})}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-xs">
          <p className="text-ink-dim">
            Página {pageNum} de {totalPages} · {total.toLocaleString("pt-BR")} mídias
          </p>
          <div className="flex gap-1">
            {pageNum > 1 && (
              <Link href={href({ p: String(pageNum - 1) })} className="border border-line px-3 py-1.5 hover:bg-line transition">← Anterior</Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - pageNum) <= 2)
              .map((n) => (
                <Link
                  key={n}
                  href={href({ p: String(n) })}
                  className={`border px-3 py-1.5 transition ${n === pageNum ? "border-ink bg-ink text-white": "border-line hover:bg-line"}`}
                >
                  {n}
                </Link>
              ))}
            {pageNum < totalPages && (
              <Link href={href({ p: String(pageNum + 1) })} className="border border-line px-3 py-1.5 hover:bg-line transition">Próxima →</Link>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
