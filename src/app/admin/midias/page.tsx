import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { MediaDeleteBtn, MediaVisibilityBtn } from "@/components/admin/media-actions";
import { Heart, MessageCircle, Lock, Star, Play, LayoutGrid, List, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminMidiasPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const get = (k: string) => { const v = raw[k]; return Array.isArray(v) ? v[0] : v; };

  const q        = get("q")?.trim() ?? "";
  const typeF    = get("type") ?? "";
  const visibF   = get("visib") ?? "";
  const sortF    = get("sort") ?? "newest";
  const viewMode = get("view") ?? "grid";
  const pageNum  = Math.max(1, parseInt(get("p") ?? "1", 10));
  const PAGE_SIZE = viewMode === "list" ? 30 : 60;

  const where: Prisma.MediaWhereInput = {};
  if (typeF)  where.mediaType = typeF;
  if (visibF === "public")  where.isPublic = true;
  if (visibF === "private") where.isPublic = false;
  if (q) {
    where.profile = {
      OR: [
        { displayName: { contains: q, mode: "insensitive" } },
        { slug:        { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const orderBy: Prisma.MediaOrderByWithRelationInput =
    sortF === "oldest"   ? { createdAt: "asc" }  :
    sortF === "likes"    ? { likes: { _count: "desc" } } :
    sortF === "comments" ? { comments: { _count: "desc" } } :
    { createdAt: "desc" };

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
    prisma.media.count({ where: { mediaType: "REEL" } }),
  ]);

  function href(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merge = { q, type: typeF, visib: visibF, sort: sortF, view: viewMode, p: String(pageNum), ...overrides };
    for (const [k, v] of Object.entries(merge)) { if (v && v !== "newest" && v !== "grid") p.set(k, v); else if (k === "view" && v === "list") p.set(k, v); else if (k === "sort" && v !== "newest") p.set(k, v); }
    return `/admin/midias?${p.toString()}`;
  }

  return (
    <AdminShell>
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="font-bold text-lg">Mídias <span className="text-muted font-normal text-sm">({total.toLocaleString("pt-BR")})</span></h1>

          {/* View toggle */}
          <div className="flex items-center gap-1 border border-line">
            <Link href={href({ view: "grid", p: "1" })} className={`p-2 transition ${viewMode !== "list" ? "bg-foreground text-white" : "text-muted hover:text-foreground"}`}>
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
            <Link href={href({ view: "list", p: "1" })} className={`p-2 transition ${viewMode === "list" ? "bg-foreground text-white" : "text-muted hover:text-foreground"}`}>
              <List className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
          {[
            { label: "Total",    value: total,        active: !typeF && !visibF },
            { label: "Públicas", value: totalPublic,  active: visibF === "public" },
            { label: "Privadas", value: totalPrivate, active: visibF === "private" },
            { label: "Reels",    value: totalReels,   active: typeF === "REEL" },
          ].map(({ label, value, active }) => (
            <div key={label} className={`border px-3 py-2 ${active ? "border-foreground bg-foreground text-white" : "border-line bg-white"}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-white/60" : "text-muted"}`}>{label}</p>
              <p className="text-xl font-bold mt-0.5">{value.toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <form method="get" action="/admin/midias" className="flex flex-wrap gap-2">
          <input name="view" type="hidden" value={viewMode} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Perfil ou @handle…"
            className="border border-line px-2.5 py-1.5 text-xs outline-none focus:border-foreground/40 w-44"
          />
          <select name="type" defaultValue={typeF} className="border border-line bg-white px-2.5 py-1.5 text-xs outline-none">
            <option value="">Todos os tipos</option>
            <option value="IMAGE">Foto</option>
            <option value="VIDEO">Vídeo</option>
            <option value="REEL">Reel</option>
          </select>
          <select name="visib" defaultValue={visibF} className="border border-line bg-white px-2.5 py-1.5 text-xs outline-none">
            <option value="">Pública + Privada</option>
            <option value="public">Só públicas</option>
            <option value="private">Só privadas</option>
          </select>
          <select name="sort" defaultValue={sortF} className="border border-line bg-white px-2.5 py-1.5 text-xs outline-none">
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="likes">Mais curtidas</option>
            <option value="comments">Mais comentadas</option>
          </select>
          <button type="submit" className="bg-foreground px-3 py-1.5 text-xs font-bold text-white">
            Filtrar
          </button>
          {(q || typeF || visibF || sortF !== "newest") && (
            <Link href="/admin/midias" className="px-3 py-1.5 text-xs border border-line text-muted hover:text-foreground hover:border-foreground/30 transition">
              Limpar
            </Link>
          )}
        </form>
      </div>

      {media.length === 0 ? (
        <div className="py-24 text-center text-muted text-sm">Nenhuma mídia encontrada.</div>
      ) : viewMode === "list" ? (
        /* ── LIST VIEW ── */
        <div className="rounded border border-line bg-white shadow-sm overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-muted bg-zinc-50">
                <th className="px-3 py-2.5 w-16">Mídia</th>
                <th className="px-3 py-2.5">Perfil</th>
                <th className="px-3 py-2.5">Tipo</th>
                <th className="px-3 py-2.5">Visibilidade</th>
                <th className="px-3 py-2.5">Engajamento</th>
                <th className="px-3 py-2.5">Data</th>
                <th className="px-3 py-2.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {media.map((m) => {
                const cover = m.profile.media[0]?.url;
                return (
                  <tr key={m.id} className="border-b border-line last:border-0 hover:bg-zinc-50/60 transition">
                    {/* Thumbnail */}
                    <td className="px-3 py-2">
                      <div className="relative h-14 w-10 overflow-hidden bg-line flex-shrink-0 rounded">
                        {m.mediaType !== "IMAGE" ? (
                          <div className="flex h-full items-center justify-center bg-zinc-800 text-white/60">
                            <Play className="h-4 w-4" strokeWidth={1.5} />
                          </div>
                        ) : (
                          <Image src={m.url} alt="" fill sizes="40px" className="object-cover" />
                        )}
                        {!m.isPublic && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Lock className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Profile */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="relative h-7 w-6 overflow-hidden rounded bg-line flex-shrink-0">
                          {cover && <Image src={cover} alt="" fill sizes="24px" className="object-cover" />}
                        </div>
                        <div>
                          <Link href={`/admin/perfis?q=${m.profile.slug}`} className="font-semibold text-xs hover:underline flex items-center gap-1">
                            {m.profile.displayName}
                            {m.profile.isVerified && <span className="text-[9px] text-emerald-600 font-bold">✓</span>}
                          </Link>
                          <p className="text-[10px] text-muted">@{m.profile.slug} · {m.profile.city.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Tipo */}
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        {m.mediaType === "REEL" ? "🎬 Reel" : m.mediaType === "VIDEO" ? "📹 Vídeo" : "🖼 Foto"}
                      </span>
                      {m.isCover && <span className="ml-1 text-[9px] bg-coral/10 text-coral px-1 py-0.5 font-bold">CAPA</span>}
                    </td>

                    {/* Visibilidade */}
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${m.isPublic ? "text-emerald-600" : "text-muted"}`}>
                        {m.isPublic ? <><Eye className="h-3 w-3" /> Pública</> : <><Lock className="h-3 w-3" /> Privada</>}
                      </span>
                    </td>

                    {/* Engajamento */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" strokeWidth={1.5} />{m._count.likes}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" strokeWidth={1.5} />{m._count.comments}</span>
                      </div>
                    </td>

                    {/* Data */}
                    <td className="px-3 py-2 text-[11px] text-muted whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
                    </td>

                    {/* Ações */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <MediaVisibilityBtn mediaId={m.id} isPublic={m.isPublic} />
                        <MediaDeleteBtn mediaId={m.id} />
                        <Link
                          href={m.url}
                          target="_blank"
                          className="text-[10px] border border-line px-2 py-1 text-muted hover:text-foreground transition"
                        >
                          ↗ Ver
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {media.map((m) => {
            const cover = m.profile.media[0]?.url;
            return (
              <div key={m.id} className="group border border-line bg-white overflow-hidden">
                {/* Photo */}
                <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
                  {m.mediaType !== "IMAGE" ? (
                    <div className="flex h-full flex-col items-center justify-center bg-zinc-900 gap-2">
                      <Play className="h-8 w-8 text-white/50" strokeWidth={1.5} />
                      <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{m.mediaType}</span>
                    </div>
                  ) : (
                    <Image
                      src={m.url}
                      alt={m.caption ?? ""}
                      fill
                      sizes="(min-width:1024px) 20vw, (min-width:768px) 25vw, (min-width:640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}

                  {/* Top badges - always visible */}
                  <div className="absolute top-1.5 left-1.5 flex gap-1">
                    {!m.isPublic && (
                      <span className="flex items-center gap-0.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        <Lock className="h-2.5 w-2.5" strokeWidth={2.5} /> PRIVADA
                      </span>
                    )}
                    {m.isCover && (
                      <span className="flex items-center gap-0.5 bg-coral text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        <Star className="h-2.5 w-2.5" strokeWidth={2.5} /> CAPA
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
                      {cover && <Image src={cover} alt="" fill sizes="16px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/perfis?q=${m.profile.slug}`}
                        className="text-[11px] font-bold hover:underline leading-none truncate flex items-center gap-0.5"
                      >
                        {m.profile.displayName}
                        {m.profile.isVerified && <span className="text-emerald-600 text-[9px]">✓</span>}
                      </Link>
                      <p className="text-[9px] text-muted leading-none mt-0.5">{m.profile.city.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted">
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-2.5 w-2.5" strokeWidth={1.5} />{m._count.likes}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle className="h-2.5 w-2.5" strokeWidth={1.5} />{m._count.comments}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted">
                      {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
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
          <p className="text-muted">
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
                  className={`border px-3 py-1.5 transition ${n === pageNum ? "border-foreground bg-foreground text-white" : "border-line hover:bg-line"}`}
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

