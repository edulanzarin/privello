import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  __prismaQueryHookInstalled?: boolean;
};

// Instrumentação opt-in para a Fase 3 — captura de métricas antes/depois.
// Cf. .kiro/specs/fase-3-backend/metricas-baseline.md > §2.1.
//
// Uso (em desenvolvimento, manual):
//   PRISMA_DEBUG_QUERIES=1 npm run dev
//   curl -s http://localhost:3000/<rota> > $null
// Cada query Prisma vira uma linha "[prisma] <ms>ms <sql truncado>" em stdout.
//
// Em produção (default sem a env), o $on não é instalado e o overhead é zero.
const debugQueries = process.env.PRISMA_DEBUG_QUERIES === "1";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: debugQueries
      ? [{ level: "query", emit: "event" }, "error", "warn"]
      : process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

// Registra o handler de query apenas uma vez por instância singleton em dev.
// O cast para `never` é necessário porque o tipo de evento `"query"` só está
// disponível quando `log: [{ emit: "event" }]` é configurado em runtime.
if (debugQueries && !globalForPrisma.__prismaQueryHookInstalled) {
  // @ts-expect-error - $on("query") types vary by Prisma version configuration
  prisma.$on("query", (e: { query: string; duration: number; params?: string }) => {
    const truncated = e.query.replace(/\s+/g, " ").slice(0, 120);
    console.log(`[prisma] ${e.duration}ms ${truncated}`);
  });
  globalForPrisma.__prismaQueryHookInstalled = true;
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
