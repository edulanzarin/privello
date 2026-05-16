/**
 * Route Handler — Registro de clique no botão de WhatsApp.
 *
 * Endpoint: `POST /api/wa-click`
 *
 * Persiste um `WhatsAppClick` por par `(profileId, source, visitor)` para
 * alimentar a métrica de conversão do provider. Quando o viewer está
 * autenticado, `visitor` é o `@slug` ou `name`; caso contrário fica
 * `"anônimo"`.
 *
 * Em **qualquer** erro inesperado o handler responde `{ ok: false }` em
 * 200 — esse caminho silencioso é deliberado para não expor falhas internas
 * a quem só está clicando para abrir o WhatsApp.
 *
 * Convenções:
 * - Autenticação: opcional — anônimo é permitido (apenas marca `verified: false`).
 * - Rate limit: `waClick` (10 req / 1h por par `(profileId, ip)`) via
 *   `rateLimitConfigFor("waClick", "<profileId>:<ip>")`. Em hit responde
 *   **200 silencioso** sem persistir o clique (per `rate-limits.md` — preserva
 *   a métrica de conversão e não revela o limite).
 * - Validação Zod: `WaClickBodySchema` em `src/lib/validation/wa-click.schema.ts`.
 *
 * Cross-refs:
 * - .kiro/specs/fase-1-seguranca/endpoints-zod.md §4.1 (`/api/wa-click`).
 * - .kiro/specs/fase-1-seguranca/rate-limits.md §"Tabela canônica" (linha
 *   `/api/wa-click`).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WaClickBodySchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitConfigFor } from "@/lib/rate-limit-config";

function resolveClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Persiste um clique de WhatsApp (atribuindo viewer quando autenticado).
 *
 * Body esperado:
 *   - `profileId` (cuid, required).
 *   - `source` (string, optional, trim, max 50, default `"perfil"`).
 *
 * @returns
 *   - 200: `{ ok: true }` em sucesso, hit de rate limit, ou em qualquer
 *     branch de erro inesperado (`{ ok: false }`).
 *   - 400: validation error (`flatten()`).
 *
 * Side effects:
 * - DB: `WhatsAppClick.create` quando o rate limit permite. Em hit ou erro
 *   genérico, **nenhum** efeito.
 * - Lookup de `User` para resolver o `visitor` (`@slug` ou `name`) quando há
 *   sessão.
 *
 * @see .kiro/specs/fase-1-seguranca/rate-limits.md (`waClick`)
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = WaClickBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(parsed.error.flatten(), { status: 400 });
    }
    const { profileId, source } = parsed.data;

    // Rate limit: 10 clicks per (profileId, IP) per hour. On excess we
    // return 200 silently and SKIP the prisma write (per `rate-limits.md`
    // — silent to avoid leaking the limit and to keep the conversion
    // metric clean).
    const ip = resolveClientIp(req);
    const rl = await rateLimit(rateLimitConfigFor("waClick", `${profileId}:${ip}`));
    if (!rl.allowed) {
      return NextResponse.json({ ok: true });
    }

    const session = await auth();

    let visitor = "anônimo";
    let verified = false;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true, name: true },
      });
      visitor = user?.slug ? `@${user.slug}` : (user?.name ?? "usuário");
      verified = true;
    }

    await prisma.whatsAppClick.create({
      data: {
        profileId,
        source,
        visitor,
        verified,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
