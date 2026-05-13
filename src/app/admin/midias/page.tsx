import Image from "next/image";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { deleteAdminMedia } from "@/app/_actions/admin-moderation";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminMidiasPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const get = (k: string) => { const v = raw[k]; return Array.isArray(v) ? v[0] : v; };

  const q = get("q")?.trim() ?? "";
  const typeFilter = get("type") ?? "";
  const pageNum = Math.max(1, parseInt(get("p") ?? "1", 10));
  const PAGE_SIZE = 48;

  const where: Prisma.MediaWhereInput = {};
  if (typeFilter) where.mediaType = typeFilter;
  if (q) {
    where.profile = {
      OR: [
        { displayName: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
        profile: {
          select: { id: true, slug: true, displayName: true },
        },
      },
    }),
    prisma.media.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function href(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merge = { q, type: typeFilter, p: String(pageNum), ...overrides };
    for (const [k, v] of Object.entries(merge)) { if (v) p.set(k, v); }
    return `/admin/midias?${p.toString()}`;
  }

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-bold text-lg">
          Mídias <span className="text-muted font-normal text-sm">({total})</span>
        </h1>
        <form method="get" action="/admin/midias" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Perfil ou @handle…"
            className="border border-line px-2.5 py-1.5 text-xs outline-none focus:border-foreground/40 w-44"
          />
          <select name="type" defaultValue={typeFilter} className="border border-line bg-white px-2.5 py-1.5 text-xs outline-none">
            <option value="">Todos os tipos</option>
            <option value="IMAGE">Foto</option>
            <option value="VIDEO">Vídeo</option>
          </select>
          <button type="submit" className="bg-foreground px-3 py-1.5 text-xs font-bold text-white">
            Filtrar
          </button>
        </form>
      </div>

      {media.length === 0 ? (
        <div className="py-16 text-center text-muted text-sm">Nenhuma mídia encontrada.</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {media.map((m) => (
            <div key={m.id} className="group relative aspect-[2/3] overflow-hidden bg-line rounded">
              {m.mediaType === "VIDEO" ? (
                <div className="flex h-full items-center justify-center bg-zinc-900 text-white/50 text-xs">
                  Vídeo
                </div>
              ) : (
                <Image
                  src={m.url}
                  alt={m.caption ?? ""}
                  fill
                  sizes="(min-width:1024px) 16vw, (min-width:768px) 25vw, (min-width:640px) 33vw, 50vw"
                  className="object-cover transition group-hover:opacity-80"
                />
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition bg-gradient-to-t from-black/70 via-transparent to-transparent">
                <div className="flex justify-end">
                  <form
                    action={async () => {
                      "use server";
                      await deleteAdminMedia(m.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-red-700 transition"
                      title="Apagar foto"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                      Apagar
                    </button>
                  </form>
                </div>
                <div>
                  <Link
                    href={`/p/${m.profile.slug}`}
                    target="_blank"
                    className="text-[10px] font-semibold text-white hover:underline line-clamp-1"
                  >
                    {m.profile.displayName}
                  </Link>
                  <p className="text-[9px] text-white/60 mt-0.5">
                    {m.isCover && <span className="mr-1 bg-coral px-1 py-0.5 rounded text-white">capa</span>}
                    {!m.isPublic && <span className="mr-1 bg-zinc-600 px-1 py-0.5 rounded">privada</span>}
                    {new Date(m.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end gap-1 text-xs">
          {pageNum > 1 && (
            <Link href={href({ p: String(pageNum - 1) })} className="border border-line px-2.5 py-1 hover:bg-line">←</Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => Math.abs(n - pageNum) <= 2)
            .map((n) => (
              <Link
                key={n}
                href={href({ p: String(n) })}
                className={`border px-2.5 py-1 ${n === pageNum ? "border-foreground bg-foreground text-white" : "border-line hover:bg-line"}`}
              >
                {n}
              </Link>
            ))}
          {pageNum < totalPages && (
            <Link href={href({ p: String(pageNum + 1) })} className="border border-line px-2.5 py-1 hover:bg-line">→</Link>
          )}
        </div>
      )}
    </AdminShell>
  );
}
