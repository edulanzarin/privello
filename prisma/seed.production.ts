/**
 * prisma/seed.production.ts
 *
 * Seed mínimo para o banco de PRODUÇÃO. Diferente de `prisma/seed.ts`
 * (dev/staging com 50+ profiles fake, fotos do Picsum, reviews, etc.),
 * este seed cria APENAS o catálogo essencial:
 *
 *   - 27 capitais brasileiras (Cities)
 *   - 1 admin (`contato.privello@gmail.com`)
 *   - HotPeriodConfig inicial
 *
 * Não cria profiles, media, reviews, stories, durations ou qualquer dado
 * que pertença a usuários reais. Profiles em produção são criados pelo
 * fluxo `/cadastro/acompanhante` (signup → Mercado Pago → webhook).
 *
 * Uso:
 *   npm run db:seed:prod
 *
 * Pré-requisito: `DATABASE_URL` apontando para o banco de produção
 * (Postgres do Railway via DATABASE_PUBLIC_URL para conexão local, ou
 * Reference Variable `${{Postgres.DATABASE_URL}}` no service Railway).
 *
 * Execução repetida é segura: usa `upsert` para Cities, `findFirst`+`create`
 * para o admin, e `upsert` para HotPeriodConfig. Senhas existentes não são
 * sobrescritas (o admin só é criado se ainda não existir um com mesmo email).
 */

import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de cidades — 27 capitais brasileiras
// ─────────────────────────────────────────────────────────────────────────────

const CAPITAIS = [
    { name: "Aracaju, SE", slug: "aracaju-se" },
    { name: "Belém, PA", slug: "belem-pa" },
    { name: "Belo Horizonte, MG", slug: "belo-horizonte-mg" },
    { name: "Boa Vista, RR", slug: "boa-vista-rr" },
    { name: "Brasília, DF", slug: "brasilia-df" },
    { name: "Campo Grande, MS", slug: "campo-grande-ms" },
    { name: "Cuiabá, MT", slug: "cuiaba-mt" },
    { name: "Curitiba, PR", slug: "curitiba-pr" },
    { name: "Florianópolis, SC", slug: "florianopolis-sc" },
    { name: "Fortaleza, CE", slug: "fortaleza-ce" },
    { name: "Goiânia, GO", slug: "goiania-go" },
    { name: "João Pessoa, PB", slug: "joao-pessoa-pb" },
    { name: "Macapá, AP", slug: "macapa-ap" },
    { name: "Maceió, AL", slug: "maceio-al" },
    { name: "Manaus, AM", slug: "manaus-am" },
    { name: "Natal, RN", slug: "natal-rn" },
    { name: "Palmas, TO", slug: "palmas-to" },
    { name: "Porto Alegre, RS", slug: "porto-alegre-rs" },
    { name: "Porto Velho, RO", slug: "porto-velho-ro" },
    { name: "Recife, PE", slug: "recife-pe" },
    { name: "Rio Branco, AC", slug: "rio-branco-ac" },
    { name: "Rio de Janeiro, RJ", slug: "rio-de-janeiro-rj" },
    { name: "Salvador, BA", slug: "salvador-ba" },
    { name: "São Luís, MA", slug: "sao-luis-ma" },
    { name: "São Paulo, SP", slug: "sao-paulo-sp" },
    { name: "Teresina, PI", slug: "teresina-pi" },
    { name: "Vitória, ES", slug: "vitoria-es" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Admin de produção
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "contato.privello@gmail.com";
const ADMIN_NAME = "Administração Privello";
const ADMIN_SLUG = "privello";
const ADMIN_PASSWORD_PLAINTEXT = "H6RBqzZxVWkBQ8mK";

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    console.log("🌱 Seed de PRODUÇÃO — privello\n");

    // 1) Cidades — upsert por slug (idempotente)
    console.log("→ Inserindo capitais brasileiras...");
    let createdCities = 0;
    let updatedCities = 0;
    for (const c of CAPITAIS) {
        const existing = await prisma.city.findUnique({ where: { slug: c.slug } });
        if (!existing) {
            await prisma.city.create({ data: c });
            createdCities++;
        } else {
            updatedCities++;
        }
    }
    console.log(
        `  ✓ ${createdCities} cidade(s) criada(s), ${updatedCities} já existia(m)\n`,
    );

    // 2) Admin — só cria se não existir; nunca sobrescreve senha existente
    console.log("→ Verificando admin de produção...");
    const adminExisting = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
    });

    if (!adminExisting) {
        const hash = await bcrypt.hash(ADMIN_PASSWORD_PLAINTEXT, 12);
        await prisma.user.create({
            data: {
                email: ADMIN_EMAIL,
                name: ADMIN_NAME,
                slug: ADMIN_SLUG,
                password: hash,
                role: UserRole.ADMIN,
                verified: true,
            },
        });
        console.log(`  ✓ Admin criado — ${ADMIN_EMAIL}`);
        console.log(`    senha: <ver gerenciador de senhas>\n`);
    } else {
        console.log(
            `  ✓ Admin já existe (${ADMIN_EMAIL}) — senha NÃO foi sobrescrita\n`,
        );
    }

    // 3) HotPeriodConfig — singleton com id="hot"
    console.log("→ Configurando HotPeriodConfig...");
    await prisma.hotPeriodConfig.upsert({
        where: { id: "hot" },
        create: { id: "hot", startedAt: new Date() },
        update: {}, // não toca em registros existentes
    });
    console.log("  ✓ HotPeriodConfig pronto\n");

    // 4) Resumo final
    const totalCities = await prisma.city.count();
    const totalAdmins = await prisma.user.count({ where: { role: "ADMIN" } });
    const totalProfiles = await prisma.profile.count();

    console.log("📊 Estado atual do banco:");
    console.log(`   Cities: ${totalCities}`);
    console.log(`   Admins: ${totalAdmins}`);
    console.log(`   Profiles: ${totalProfiles} (esperado 0 em produção virgem)\n`);

    console.log("✅ Seed de produção concluído.\n");
    console.log("Próximos passos:");
    console.log("  1. Faça login em /entrar com o admin");
    console.log("  2. Troque a senha do admin pelo painel ou via prisma studio");
    console.log("  3. Configure o webhook do Mercado Pago em produção");
    console.log("  4. Configure os 2 cron services no Railway");
}

main()
    .catch((e) => {
        console.error("❌ Falha no seed de produção:");
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
