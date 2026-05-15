import bcrypt from "bcryptjs";
import {
  PlanTier,
  PrismaClient,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

function img(seed: string, w = 480, h = 720) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const TAGLINES = [
  "Encontros com calma e presença.",
  "Companhia discreta e sofisticada.",
  "Local próprio, agenda sob consulta.",
  "Perfil verificado, fotos reais.",
  "Conversa boa e energia leve.",
  "Disponível com hora marcada.",
  "Momentos únicos com quem sabe valorizar.",
  "Elegância e discrição acima de tudo.",
  "Para quem aprecia o que há de melhor.",
  "Atendimento exclusivo e personalizado.",
];

const BIOS = [
  "Sou uma pessoa tranquila, que gosta de conversas inteligentes e momentos com qualidade. Valorizo discrição e respeito mútuo.",
  "Adoro receber pessoas bem-educadas e com bom papo. Aqui você encontra presença de verdade, sem pressa.",
  "Meu espaço é confortável e aconchegante. Gosto de criar conexões genuínas, onde você se sinta à vontade.",
  "Sou discreta, pontual e reservada. Atendo com exclusividade para quem sabe o que busca.",
  "Formada, viajada e com ótimo humor. Adoro boa conversa, boa música e momentos sem pressa.",
  "Cuido muito de mim e da minha imagem. Você vai encontrar alguém leve, presente e sem estresse.",
];

const COMMENTS = [
  "Incrível, superou minhas expectativas!",
  "Perfil lindo demais 😍",
  "Quero agendar, como faço?",
  "Foto real, muito bonita!",
  "Simplesmente perfeita ✨",
  "Sempre elegante e discreta!",
  "Top! Recomendo muito.",
  "Linda e muito atenciosa.",
  "Perfil verificado, ótima escolha.",
  "A melhor experiência, nota 10!",
  "Que mulher linda!",
  "Incrível como sempre 🔥",
  "Foto nova? Ficou linda!",
  "Uma deusa!",
  "Agenda aberta essa semana?",
];

const REVIEW_TEXTS = [
  "Experiência incrível, muito além das expectativas. Recomendo demais!",
  "Pontual, discreta e muito agradável. Com certeza voltarei.",
  "Perfil real, fotos verdadeiras. Atendimento de primeira linha.",
  "Ótima companhia, conversa inteligente e ambiente aconchegante.",
  "Superou tudo que eu esperava. Nota máxima!",
  "Muito simpática e atenciosa. Valeu cada centavo.",
  "Ambiente lindo e pessoa incrível. Experiência única.",
  "Recomendo de olhos fechados. Tudo ocorreu como combinado.",
];

type ProfileRecord = {
  id: string;
  planTier: PlanTier;
  slug: string;
  [key: string]: unknown;
};

async function createProfile(opts: {
  email: string;
  name: string;
  handle: string;
  publicCode: string;
  displayName: string;
  age: number;
  tagline: string;
  bio: string;
  cityId: string;
  districtId: string;
  priceHour: number;
  planTier: PlanTier;
  isVerified: boolean;
  isOnline: boolean;
  servesMen: boolean;
  servesWomen: boolean;
  servesCouples: boolean;
  hasOwnPlace: boolean;
  homeVisit: boolean;
  hair: string;
  eyes: string;
  heightCm: number;
  ratingAvg: number;
  ratingCount: number;
  whatsappPhone: string;
  mediaCount?: number;
  password?: string;
  featuredUntil?: Date;
  boostLabel?: string;
}): Promise<ProfileRecord> {
  const u = await prisma.user.create({
    data: {
      email: opts.email,
      name: opts.name,
      role: UserRole.PROVIDER,
      verified: opts.isVerified,
      password: opts.password ?? null,
      profile: {
        create: {
          slug: opts.handle,
          publicCode: opts.publicCode,
          displayName: opts.displayName,
          age: opts.age,
          tagline: opts.tagline,
          bio: opts.bio,
          cityId: opts.cityId,
          districtId: opts.districtId,
          priceHour: opts.priceHour,
          priceTwoHours: Math.round(opts.priceHour * 1.75),
          priceOvernight: Math.round(opts.priceHour * 5),
          paymentMethods: pick(["Pix · Dinheiro", "Pix · Cartão", "Pix", "Dinheiro · Pix · Cartão"]),
          heightCm: opts.heightCm,
          hair: opts.hair,
          eyes: opts.eyes,
          languages: pick(["PT", "PT · EN", "PT · EN · ES", "PT · ES"]),
          servesMen: opts.servesMen,
          servesWomen: opts.servesWomen,
          servesCouples: opts.servesCouples,
          hasOwnPlace: opts.hasOwnPlace,
          homeVisit: opts.homeVisit,
          travelsNational: Math.random() > 0.6,
          whatsappPhone: opts.whatsappPhone,
          isOnline: opts.isOnline,
          isVerified: opts.isVerified,
          videoVerified: opts.isVerified && Math.random() > 0.5,
          viewsThisMonth: rnd(200, 9000),
          viewsCurrentPeriod: rnd(20, 800),
          planTier: opts.planTier,
          ratingAvg: opts.ratingAvg,
          ratingCount: opts.ratingCount,
          memberSince: new Date(Date.now() - rnd(30, 730) * 86400000),
          featuredUntil: opts.featuredUntil ?? null,
          boostLabel: opts.boostLabel ?? null,
        },
      },
    },
    include: { profile: true },
  });

  const prof = u.profile!;
  const n = opts.mediaCount ?? 3;

  await prisma.media.createMany({
    data: Array.from({ length: n }, (_, i) => ({
      profileId: prof.id,
      url: img(`${opts.handle}-${i + 1}`),
      isPublic: true,
      sortOrder: i,
      isCover: i === 0,
    })),
  });

  await prisma.profileDurationOption.createMany({
    data: [
      { profileId: prof.id, minutes: 60, label: "1 hora", priceBrl: opts.priceHour, sortOrder: 0, active: true },
      { profileId: prof.id, minutes: 120, label: "2 horas", priceBrl: Math.round(opts.priceHour * 1.75), sortOrder: 1, active: true },
      { profileId: prof.id, minutes: 480, label: "Pernoite", priceBrl: Math.round(opts.priceHour * 5), sortOrder: 2, active: true },
    ],
  });

  for (const wd of [0, 1, 2, 3, 4, 5, 6]) {
    await prisma.availabilityRule.create({
      data: {
        profileId: prof.id,
        weekday: wd,
        startTime: wd === 0 ? "00:00" : pick(["09:00", "10:00", "12:00", "14:00"]),
        endTime: wd === 0 ? "00:00" : pick(["20:00", "22:00", "23:00"]),
        status: wd === 0 ? "CLOSED" : "AVAILABLE",
      },
    });
  }

  return prof as ProfileRecord;
}

async function main() {
  // ── Cleanup ───────────────────────────────────────────────────────────────
  await prisma.financialRecord.deleteMany();
  await prisma.whatsAppClick.deleteMany();
  await prisma.verificationCase.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.review.deleteMany();
  await prisma.mediaComment.deleteMany();
  await prisma.mediaLike.deleteMany();
  await prisma.profileDurationOption.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.storyLike.deleteMany();
  await prisma.storyView.deleteMany();
  await prisma.story.deleteMany();
  await prisma.media.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.district.deleteMany();
  await prisma.city.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotPeriodConfig.deleteMany();

  console.log("✓ DB limpo");

  // ── Admin ─────────────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      name: "Privello",
      email: "contato.privello@gmail.com",
      slug: "privello",
      password: await bcrypt.hash("Edz#7284@", 12),
      role: "ADMIN" as UserRole,
      verified: true,
    },
  });
  console.log("✓ Admin criado");

  // ── Cities ────────────────────────────────────────────────────────────────
  const sp = await prisma.city.create({ data: { name: "São Paulo, SP", slug: "sao-paulo-sp", heroImage: img("sp-city", 800, 600) } });
  const rj = await prisma.city.create({ data: { name: "Rio de Janeiro, RJ", slug: "rio-de-janeiro-rj", heroImage: img("rj-city", 800, 600) } });
  const bh = await prisma.city.create({ data: { name: "Belo Horizonte, MG", slug: "belo-horizonte-mg", heroImage: img("bh-city", 800, 600) } });
  const bsb = await prisma.city.create({ data: { name: "Brasília, DF", slug: "brasilia-df", heroImage: img("bsb-city", 800, 600) } });
  const cwb = await prisma.city.create({ data: { name: "Curitiba, PR", slug: "curitiba-pr", heroImage: img("cwb-city", 800, 600) } });
  const poa = await prisma.city.create({ data: { name: "Porto Alegre, RS", slug: "porto-alegre-rs", heroImage: img("poa-city", 800, 600) } });
  const fln = await prisma.city.create({ data: { name: "Florianópolis, SC", slug: "florianopolis-sc", heroImage: img("fln-city", 800, 600) } });
  const rec = await prisma.city.create({ data: { name: "Recife, PE", slug: "recife-pe", heroImage: img("rec-city", 800, 600) } });
  const ssa = await prisma.city.create({ data: { name: "Salvador, BA", slug: "salvador-ba", heroImage: img("ssa-city", 800, 600) } });
  const gyn = await prisma.city.create({ data: { name: "Goiânia, GO", slug: "goiania-go", heroImage: img("gyn-city", 800, 600) } });

  // ── Districts ─────────────────────────────────────────────────────────────
  const jardins = await prisma.district.create({ data: { name: "Jardins", slug: "jardins", cityId: sp.id } });
  const itaim = await prisma.district.create({ data: { name: "Itaim Bibi", slug: "itaim-bibi", cityId: sp.id } });
  const pinheiros = await prisma.district.create({ data: { name: "Pinheiros", slug: "pinheiros", cityId: sp.id } });
  const moema = await prisma.district.create({ data: { name: "Moema", slug: "moema", cityId: sp.id } });
  const leblon = await prisma.district.create({ data: { name: "Leblon", slug: "leblon", cityId: rj.id } });
  const botafogo = await prisma.district.create({ data: { name: "Botafogo", slug: "botafogo", cityId: rj.id } });
  const ipanema = await prisma.district.create({ data: { name: "Ipanema", slug: "ipanema", cityId: rj.id } });
  const savassi = await prisma.district.create({ data: { name: "Savassi", slug: "savassi", cityId: bh.id } });
  const asasul = await prisma.district.create({ data: { name: "Asa Sul", slug: "asa-sul", cityId: bsb.id } });
  const batel = await prisma.district.create({ data: { name: "Batel", slug: "batel", cityId: cwb.id } });
  const moinhos = await prisma.district.create({ data: { name: "Moinhos", slug: "moinhos", cityId: poa.id } });
  const ctrofln = await prisma.district.create({ data: { name: "Centro", slug: "centro", cityId: fln.id } });
  const boaviagem = await prisma.district.create({ data: { name: "Boa Viagem", slug: "boa-viagem", cityId: rec.id } });
  const barra = await prisma.district.create({ data: { name: "Barra", slug: "barra", cityId: ssa.id } });
  const setorsul = await prisma.district.create({ data: { name: "Setor Sul", slug: "setor-sul", cityId: gyn.id } });

  const locs = [
    { city: sp, district: jardins }, // 0
    { city: sp, district: itaim }, // 1
    { city: sp, district: pinheiros }, // 2
    { city: sp, district: moema }, // 3
    { city: rj, district: leblon }, // 4
    { city: rj, district: botafogo }, // 5
    { city: rj, district: ipanema }, // 6
    { city: bh, district: savassi }, // 7
    { city: bsb, district: asasul }, // 8
    { city: cwb, district: batel }, // 9
    { city: poa, district: moinhos }, // 10
    { city: fln, district: ctrofln }, // 11
    { city: rec, district: boaviagem }, // 12
    { city: ssa, district: barra }, // 13
    { city: gyn, district: setorsul }, // 14
  ];

  console.log("✓ Cidades e bairros criados");

  // ── 43 Garotas ────────────────────────────────────────────────────────────
  type G = { name: string; handle: string; loc: number; price: number; tier: PlanTier; verified: boolean; online: boolean; age: number; hair: string; eyes: string; h: number; rating: number; rc: number };
  const garotas: G[] = [
    { name: "Helena", handle: "helena", loc: 0, price: 450, tier: PlanTier.PREMIUM, verified: true, online: true, age: 27, hair: "Castanho", eyes: "Castanhos", h: 168, rating: 4.9, rc: 42 },
    { name: "Luna", handle: "luna", loc: 0, price: 650, tier: PlanTier.PREMIUM, verified: true, online: true, age: 25, hair: "Loiro", eyes: "Azuis", h: 172, rating: 4.8, rc: 38 },
    { name: "Sophia", handle: "sophia", loc: 0, price: 580, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 26, hair: "Preto", eyes: "Castanhos", h: 165, rating: 4.7, rc: 29 },
    { name: "Isabela", handle: "isabela", loc: 1, price: 380, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 24, hair: "Castanho", eyes: "Verdes", h: 163, rating: 4.5, rc: 18 },
    { name: "Valentina", handle: "valentina", loc: 1, price: 420, tier: PlanTier.ESSENCIAL, verified: false, online: false, age: 28, hair: "Ruivo", eyes: "Castanhos", h: 166, rating: 4.3, rc: 11 },
    { name: "Mariana", handle: "mariana", loc: 1, price: 500, tier: PlanTier.DESTAQUE, verified: true, online: true, age: 23, hair: "Loiro", eyes: "Castanhos", h: 170, rating: 4.6, rc: 22 },
    { name: "Camila", handle: "camila", loc: 2, price: 520, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 26, hair: "Castanho", eyes: "Castanhos", h: 167, rating: 4.7, rc: 31 },
    { name: "Beatriz", handle: "beatriz", loc: 2, price: 350, tier: PlanTier.ESSENCIAL, verified: false, online: true, age: 22, hair: "Preto", eyes: "Pretos", h: 160, rating: 4.2, rc: 8 },
    { name: "Larissa", handle: "larissa", loc: 3, price: 480, tier: PlanTier.DESTAQUE, verified: true, online: true, age: 29, hair: "Loiro", eyes: "Verdes", h: 169, rating: 4.8, rc: 35 },
    { name: "Fernanda", handle: "fernanda", loc: 3, price: 400, tier: PlanTier.ESSENCIAL, verified: true, online: false, age: 25, hair: "Castanho", eyes: "Castanhos", h: 164, rating: 4.4, rc: 14 },
    { name: "Aurora", handle: "aurora", loc: 4, price: 600, tier: PlanTier.PREMIUM, verified: true, online: true, age: 24, hair: "Loiro", eyes: "Verdes", h: 170, rating: 4.8, rc: 31 },
    { name: "Gabriela", handle: "gabriela", loc: 4, price: 700, tier: PlanTier.PREMIUM, verified: true, online: false, age: 27, hair: "Castanho", eyes: "Castanhos", h: 173, rating: 4.9, rc: 55 },
    { name: "Natalia", handle: "natalia", loc: 4, price: 550, tier: PlanTier.DESTAQUE, verified: true, online: true, age: 25, hair: "Preto", eyes: "Castanhos", h: 166, rating: 4.6, rc: 27 },
    { name: "Leticia", handle: "leticia", loc: 5, price: 430, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 23, hair: "Castanho", eyes: "Verdes", h: 162, rating: 4.5, rc: 19 },
    { name: "Rafaela", handle: "rafaela", loc: 5, price: 480, tier: PlanTier.DESTAQUE, verified: false, online: false, age: 26, hair: "Loiro", eyes: "Azuis", h: 168, rating: 4.4, rc: 12 },
    { name: "Bianca", handle: "bianca", loc: 6, price: 620, tier: PlanTier.PREMIUM, verified: true, online: true, age: 28, hair: "Castanho", eyes: "Castanhos", h: 171, rating: 4.9, rc: 48 },
    { name: "Juliana", handle: "juliana", loc: 6, price: 500, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 24, hair: "Preto", eyes: "Pretos", h: 164, rating: 4.6, rc: 23 },
    { name: "Amanda", handle: "amanda", loc: 7, price: 380, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 25, hair: "Castanho", eyes: "Castanhos", h: 163, rating: 4.5, rc: 16 },
    { name: "Patricia", handle: "patricia", loc: 7, price: 450, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 30, hair: "Loiro", eyes: "Verdes", h: 167, rating: 4.7, rc: 28 },
    { name: "Renata", handle: "renata", loc: 7, price: 320, tier: PlanTier.ESSENCIAL, verified: false, online: true, age: 22, hair: "Preto", eyes: "Castanhos", h: 160, rating: 4.1, rc: 7 },
    { name: "Carolina", handle: "carolina", loc: 8, price: 420, tier: PlanTier.DESTAQUE, verified: true, online: true, age: 26, hair: "Castanho", eyes: "Castanhos", h: 165, rating: 4.6, rc: 21 },
    { name: "Daniela", handle: "daniela", loc: 8, price: 380, tier: PlanTier.ESSENCIAL, verified: true, online: false, age: 24, hair: "Loiro", eyes: "Azuis", h: 169, rating: 4.4, rc: 13 },
    { name: "Priscila", handle: "priscila", loc: 8, price: 500, tier: PlanTier.PREMIUM, verified: true, online: true, age: 28, hair: "Ruivo", eyes: "Verdes", h: 166, rating: 4.8, rc: 36 },
    { name: "Aline", handle: "aline", loc: 9, price: 360, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 23, hair: "Castanho", eyes: "Castanhos", h: 162, rating: 4.4, rc: 15 },
    { name: "Tatiane", handle: "tatiane", loc: 9, price: 440, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 27, hair: "Preto", eyes: "Pretos", h: 164, rating: 4.6, rc: 24 },
    { name: "Vanessa", handle: "vanessa", loc: 9, price: 520, tier: PlanTier.PREMIUM, verified: true, online: true, age: 25, hair: "Loiro", eyes: "Verdes", h: 170, rating: 4.8, rc: 33 },
    { name: "Bruna", handle: "bruna", loc: 10, price: 400, tier: PlanTier.DESTAQUE, verified: true, online: true, age: 24, hair: "Castanho", eyes: "Castanhos", h: 165, rating: 4.7, rc: 26 },
    { name: "Claudia", handle: "claudia", loc: 10, price: 350, tier: PlanTier.ESSENCIAL, verified: false, online: false, age: 29, hair: "Loiro", eyes: "Azuis", h: 168, rating: 4.3, rc: 9 },
    { name: "Debora", handle: "debora", loc: 10, price: 480, tier: PlanTier.DESTAQUE, verified: true, online: true, age: 26, hair: "Preto", eyes: "Castanhos", h: 163, rating: 4.6, rc: 20 },
    { name: "Elisa", handle: "elisa", loc: 11, price: 390, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 23, hair: "Loiro", eyes: "Verdes", h: 166, rating: 4.5, rc: 17 },
    { name: "Fabiana", handle: "fabiana", loc: 11, price: 460, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 27, hair: "Castanho", eyes: "Castanhos", h: 169, rating: 4.7, rc: 30 },
    { name: "Giovana", handle: "giovana", loc: 12, price: 340, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 24, hair: "Preto", eyes: "Castanhos", h: 161, rating: 4.4, rc: 14 },
    { name: "Heloisa", handle: "heloisa", loc: 12, price: 420, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 26, hair: "Castanho", eyes: "Castanhos", h: 164, rating: 4.6, rc: 22 },
    { name: "Ingrid", handle: "ingrid", loc: 12, price: 300, tier: PlanTier.ESSENCIAL, verified: false, online: true, age: 22, hair: "Loiro", eyes: "Azuis", h: 162, rating: 4.2, rc: 8 },
    { name: "Jessica", handle: "jessica", loc: 13, price: 360, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 25, hair: "Preto", eyes: "Castanhos", h: 163, rating: 4.5, rc: 16 },
    { name: "Karen", handle: "karen", loc: 13, price: 450, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 28, hair: "Castanho", eyes: "Castanhos", h: 167, rating: 4.7, rc: 27 },
    { name: "Livia", handle: "livia", loc: 13, price: 520, tier: PlanTier.PREMIUM, verified: true, online: true, age: 26, hair: "Loiro", eyes: "Verdes", h: 170, rating: 4.8, rc: 34 },
    { name: "Monica", handle: "monica", loc: 14, price: 330, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 23, hair: "Castanho", eyes: "Castanhos", h: 162, rating: 4.4, rc: 13 },
    { name: "Nathalia", handle: "nathalia", loc: 14, price: 400, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 27, hair: "Preto", eyes: "Pretos", h: 165, rating: 4.6, rc: 21 },
    { name: "Olivia", handle: "olivia", loc: 0, price: 600, tier: PlanTier.PREMIUM, verified: true, online: true, age: 26, hair: "Loiro", eyes: "Azuis", h: 172, rating: 4.9, rc: 51 },
    { name: "Sabrina", handle: "sabrina", loc: 5, price: 540, tier: PlanTier.DESTAQUE, verified: true, online: true, age: 25, hair: "Castanho", eyes: "Castanhos", h: 168, rating: 4.7, rc: 29 },
    { name: "Thamires", handle: "thamires", loc: 2, price: 470, tier: PlanTier.DESTAQUE, verified: true, online: true, age: 24, hair: "Loiro", eyes: "Castanhos", h: 166, rating: 4.6, rc: 19 },
    { name: "Vitoria", handle: "vitoria", loc: 6, price: 390, tier: PlanTier.ESSENCIAL, verified: true, online: false, age: 23, hair: "Castanho", eyes: "Verdes", h: 163, rating: 4.4, rc: 12 },
  ];

  const profiles: ProfileRecord[] = [];

  let code = 100;
  for (const g of garotas) {
    code++;
    const loc = locs[g.loc];
    const prof = await createProfile({
      email: `${g.handle}@privello.local`,
      name: g.name,
      handle: g.handle,
      publicCode: `PRV-${code}`,
      displayName: g.name,
      age: g.age,
      tagline: pick(TAGLINES),
      bio: pick(BIOS),
      cityId: loc.city.id,
      districtId: loc.district.id,
      priceHour: g.price,
      planTier: g.tier,
      isVerified: g.verified,
      isOnline: g.online,
      servesMen: true,
      servesWomen: false,
      servesCouples: false,
      hasOwnPlace: Math.random() > 0.4,
      homeVisit: Math.random() > 0.5,
      hair: g.hair,
      eyes: g.eyes,
      heightCm: g.h,
      ratingAvg: g.rating,
      ratingCount: g.rc,
      whatsappPhone: "+5511988880000",
      mediaCount: g.tier === PlanTier.PREMIUM ? 5 : g.tier === PlanTier.DESTAQUE ? 4 : 3,
    });
    profiles.push(prof);
    process.stdout.write(`  @${g.handle} ✓\n`);
  }

  // ── 4 Garotos ─────────────────────────────────────────────────────────────
  const garotos = [
    { name: "Rafael", handle: "rafael", loc: 0, price: 500, tier: PlanTier.PREMIUM, verified: true, online: true, age: 28, hair: "Castanho", eyes: "Castanhos", h: 182, rating: 4.8, rc: 24 },
    { name: "Bruno", handle: "bruno", loc: 4, price: 450, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 26, hair: "Preto", eyes: "Castanhos", h: 178, rating: 4.6, rc: 17 },
    { name: "Thiago", handle: "thiago", loc: 9, price: 380, tier: PlanTier.ESSENCIAL, verified: true, online: true, age: 25, hair: "Loiro", eyes: "Azuis", h: 180, rating: 4.5, rc: 12 },
    { name: "Leonardo", handle: "leonardo", loc: 8, price: 420, tier: PlanTier.DESTAQUE, verified: false, online: false, age: 30, hair: "Castanho", eyes: "Verdes", h: 176, rating: 4.4, rc: 9 },
  ];

  for (const g of garotos) {
    code++;
    const loc = locs[g.loc];
    const prof = await createProfile({
      email: `${g.handle}@privello.local`,
      name: g.name,
      handle: g.handle,
      publicCode: `PRV-${code}`,
      displayName: g.name,
      age: g.age,
      tagline: pick(["Companhia discreta e agradável.", "Atendimento exclusivo para mulheres.", "Perfil verificado, agenda sob consulta."]),
      bio: pick(BIOS),
      cityId: loc.city.id,
      districtId: loc.district.id,
      priceHour: g.price,
      planTier: g.tier,
      isVerified: g.verified,
      isOnline: g.online,
      servesMen: false,
      servesWomen: true,
      servesCouples: false,
      hasOwnPlace: Math.random() > 0.4,
      homeVisit: Math.random() > 0.5,
      hair: g.hair,
      eyes: g.eyes,
      heightCm: g.h,
      ratingAvg: g.rating,
      ratingCount: g.rc,
      whatsappPhone: "+5511988880000",
    });
    profiles.push(prof);
    process.stdout.write(`  @${g.handle} ✓\n`);
  }

  // ── 3 Casais ──────────────────────────────────────────────────────────────
  const casais = [
    { name: "Casal SP", handle: "casalsp", loc: 0, price: 800, tier: PlanTier.PREMIUM, verified: true, online: true, age: 27, hair: "Variado", eyes: "Castanhos", h: 170, rating: 4.9, rc: 31 },
    { name: "Casal RJ", handle: "casalrj", loc: 4, price: 700, tier: PlanTier.DESTAQUE, verified: true, online: false, age: 26, hair: "Variado", eyes: "Variados", h: 168, rating: 4.7, rc: 22 },
    { name: "Casal CWB", handle: "casalcwb", loc: 9, price: 550, tier: PlanTier.DESTAQUE, verified: false, online: false, age: 25, hair: "Variado", eyes: "Variados", h: 167, rating: 4.4, rc: 11 },
  ];

  for (const g of casais) {
    code++;
    const loc = locs[g.loc];
    const prof = await createProfile({
      email: `${g.handle}@privello.local`,
      name: g.name,
      handle: g.handle,
      publicCode: `PRV-${code}`,
      displayName: g.name,
      age: g.age,
      tagline: "Experiência a dois, com discrição total.",
      bio: "Somos um casal verificado. Atendemos com exclusividade e total discrição. Agenda sempre por hora marcada.",
      cityId: loc.city.id,
      districtId: loc.district.id,
      priceHour: g.price,
      planTier: g.tier,
      isVerified: g.verified,
      isOnline: g.online,
      servesMen: true,
      servesWomen: true,
      servesCouples: true,
      hasOwnPlace: true,
      homeVisit: false,
      hair: g.hair,
      eyes: g.eyes,
      heightCm: g.h,
      ratingAvg: g.rating,
      ratingCount: g.rc,
      whatsappPhone: "+5511988880000",
    });
    profiles.push(prof);
    process.stdout.write(`  @${g.handle} ✓\n`);
  }

  console.log(`\n✓ ${garotas.length + garotos.length + casais.length} perfis genéricos criados`);

  // ── Conta especial: @dudalanzarin (PREMIUM + boost 7 dias) ────────────────
  code++;
  const pwHash = await bcrypt.hash("Edz#7284@", 12);
  const boostUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const dudaProf = await createProfile({
    email: "eduardalanzarin@gmail.com",
    name: "Eduarda Lanzarin",
    handle: "dudalanzarin",
    publicCode: `PRV-${code}`,
    displayName: "Eduarda",
    age: 25,
    tagline: "Elegância, discrição e presença real.",
    bio: "Sou discreta, sofisticada e pontual. Atendo com exclusividade em local próprio nos Jardins. Perfil verificado.",
    cityId: sp.id,
    districtId: jardins.id,
    priceHour: 800,
    planTier: PlanTier.PREMIUM,
    isVerified: true,
    isOnline: true,
    servesMen: true,
    servesWomen: false,
    servesCouples: false,
    hasOwnPlace: true,
    homeVisit: false,
    hair: "Castanho",
    eyes: "Castanhos",
    heightCm: 168,
    ratingAvg: 5.0,
    ratingCount: 3,
    whatsappPhone: "+5511999999999",
    mediaCount: 6,
    password: pwHash,
    featuredUntil: boostUntil,
    boostLabel: "Em destaque",
  });
  profiles.push(dudaProf);
  console.log("✓ @dudalanzarin (Premium + boost) criada — eduardalanzarin@gmail.com");

  // ── 19 Clientes genéricos ─────────────────────────────────────────────────
  const clientNames = [
    { name: "Carlos Silva", email: "carlos.silva@email.local" },
    { name: "Pedro Alves", email: "pedro.alves@email.local" },
    { name: "Lucas Ferreira", email: "lucas.ferreira@email.local" },
    { name: "Mateus Costa", email: "mateus.costa@email.local" },
    { name: "Gabriel Santos", email: "gabriel.santos@email.local" },
    { name: "Felipe Oliveira", email: "felipe.oliveira@email.local" },
    { name: "Andre Sousa", email: "andre.sousa@email.local" },
    { name: "Rodrigo Lima", email: "rodrigo.lima@email.local" },
    { name: "Diego Pereira", email: "diego.pereira@email.local" },
    { name: "Marcos Ribeiro", email: "marcos.ribeiro@email.local" },
    { name: "Vinicius Carvalho", email: "vinicius.carvalho@email.local" },
    { name: "Thiago Nunes", email: "thiago.nunes@email.local" },
    { name: "Bruno Martins", email: "bruno.martins@email.local" },
    { name: "Rafael Gomes", email: "rafael.gomes@email.local" },
    { name: "Gustavo Torres", email: "gustavo.torres@email.local" },
    { name: "Leonardo Dias", email: "leonardo.dias@email.local" },
    { name: "Henrique Araujo", email: "henrique.araujo@email.local" },
    { name: "Samuel Barbosa", email: "samuel.barbosa@email.local" },
    { name: "Igor Nascimento", email: "igor.nascimento@email.local" },
  ];

  const clientUsers: { id: string }[] = [];
  const clientPw = await bcrypt.hash("Cliente#123", 12);

  for (const c of clientNames) {
    const u = await prisma.user.create({
      data: { name: c.name, email: c.email, password: clientPw, role: UserRole.CLIENT, verified: true },
    });
    clientUsers.push(u);
  }

  // ── Conta especial: @edulanzarin (cliente assinante) ──────────────────────
  const eduClient = await prisma.user.create({
    data: {
      name: "Eduardo Lanzarin",
      slug: "edulanzarin",
      email: "eduardolanzarin@gmail.com",
      password: pwHash,
      role: UserRole.CLIENT,
      verified: true,
    },
  });
  clientUsers.push(eduClient);
  console.log("✓ Cliente @edulanzarin criado — eduardolanzarin@gmail.com");

  // ── Assinaturas: 12 genéricos + Eduardo ───────────────────────────────────
  const subExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const subscribers = [...clientUsers.slice(0, 12), eduClient];
  for (const u of subscribers) {
    await prisma.subscription.create({
      data: { userId: u.id, status: "ACTIVE", expiresAt: subExpiry },
    });
  }
  console.log(`✓ ${subscribers.length} assinaturas criadas`);

  // ── Boosts extras em 6 perfis DESTAQUE/PREMIUM ────────────────────────────
  const boostCandidates = profiles.filter(p => p.planTier !== PlanTier.ESSENCIAL).slice(0, 6);
  for (const p of boostCandidates) {
    await prisma.profile.update({
      where: { id: p.id },
      data: {
        featuredUntil: new Date(Date.now() + rnd(3, 10) * 24 * 60 * 60 * 1000),
        boostLabel: pick(["Em destaque", "Top da semana", "Mais procurada"]),
      },
    });
  }
  console.log(`✓ ${boostCandidates.length} boosts adicionais aplicados`);

  // ── HotPeriodConfig ───────────────────────────────────────────────────────
  await prisma.hotPeriodConfig.create({ data: { id: "hot", startedAt: new Date() } });

  // ── Stories (DESTAQUE ganha 1, PREMIUM ganha 2) ───────────────────────────
  const storyProfiles = await prisma.profile.findMany({
    where: { planTier: { in: ["DESTAQUE", "PREMIUM"] } },
    include: { media: { where: { isCover: true }, take: 1 } },
  });
  const storyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const storyCaptions = [
    "Disponível hoje 🌙",
    "Nova foto adicionada ✨",
    "Agenda aberta para o fim de semana",
    "Local próprio, discreto e confortável",
    "Primeiros 30min com preço especial",
    null,
    "Fim de semana livre 💫",
    null,
    "Atendo com hora marcada",
    "Disponível agora",
    null,
    "Experiência única e inesquecível",
  ];

  const createdStories: { id: string }[] = [];
  for (let i = 0; i < storyProfiles.length; i++) {
    const p = storyProfiles[i];
    const coverUrl = p.media[0]?.url ?? img(`story-${p.slug}`, 720, 1280);
    const count = p.planTier === "PREMIUM" ? 2 : 1;
    for (let j = 0; j < count; j++) {
      const s = await prisma.story.create({
        data: {
          profileId: p.id,
          mediaUrl: j === 0 ? coverUrl : img(`story-${p.slug}-b`, 720, 1280),
          mediaType: "IMAGE",
          caption: storyCaptions[(i + j) % storyCaptions.length],
          expiresAt: storyExpiry,
        },
      });
      createdStories.push(s);
    }
  }
  console.log(`✓ ${createdStories.length} stories criados`);

  // ── StoryViews e StoryLikes ───────────────────────────────────────────────
  for (const story of createdStories) {
    const viewers = shuffle(clientUsers).slice(0, rnd(3, 12));
    for (const u of viewers) {
      await prisma.storyView.create({ data: { storyId: story.id, userId: u.id } });
      if (Math.random() > 0.5) {
        await prisma.storyLike.create({ data: { storyId: story.id, userId: u.id } });
      }
    }
  }
  console.log("✓ StoryViews e StoryLikes criados");

  // ── Reels ─────────────────────────────────────────────────────────────────
  const SAMPLE_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
  ];
  const REEL_CAPTIONS = [
    "Bom dia 🌙",
    "Disponível hoje ✨",
    "Nova semana, nova energia",
    "Fim de semana especial 💫",
    null,
    "Atendo com hora marcada",
    "Agenda aberta 🔥",
    null,
    "Para quem sabe apreciar",
    "Momentos únicos",
    null,
    "Local próprio e discreto",
    "Experiência inesquecível ✨",
    null,
    "Olha o que preparei pra vocês 😉",
  ];

  // Give ~15 profiles 1-2 reels each (PREMIUM and DESTAQUE profiles first)
  const reelProfiles = [
    ...profiles.filter(p => p.planTier === PlanTier.PREMIUM),
    ...profiles.filter(p => p.planTier === PlanTier.DESTAQUE),
    ...profiles.filter(p => p.planTier === PlanTier.ESSENCIAL),
  ].slice(0, 15);

  let reelCount = 0;
  for (let i = 0; i < reelProfiles.length; i++) {
    const p = reelProfiles[i];
    const count = i < 8 ? 2 : 1;
    for (let j = 0; j < count; j++) {
      await prisma.media.create({
        data: {
          profileId: p.id,
          url: SAMPLE_VIDEOS[(reelCount) % SAMPLE_VIDEOS.length],
          mediaType: "REEL",
          isPublic: true,
          isCover: false,
          caption: REEL_CAPTIONS[(reelCount) % REEL_CAPTIONS.length],
          sortOrder: j,
        },
      });
      reelCount++;
    }
  }
  console.log(`✓ ${reelCount} reels criados`);

  // ── MediaLikes e MediaComments ────────────────────────────────────────────
  const allMedia = await prisma.media.findMany({ where: { isPublic: true } });

  for (const media of allMedia) {
    const likers = shuffle(clientUsers).slice(0, rnd(2, 10));
    for (const u of likers) {
      await prisma.mediaLike.createMany({
        data: [{ mediaId: media.id, userId: u.id }],
        skipDuplicates: true,
      });
    }
    if (Math.random() > 0.55) {
      const commenter = pick(subscribers);
      await prisma.mediaComment.create({
        data: { mediaId: media.id, userId: commenter.id, text: pick(COMMENTS) },
      });
    }
  }
  console.log("✓ MediaLikes e MediaComments criados");

  // ── Reviews ───────────────────────────────────────────────────────────────
  for (const prof of profiles.slice(0, 25)) {
    const reviewers = shuffle(subscribers).slice(0, rnd(1, 4));
    for (const u of reviewers) {
      await prisma.review.create({
        data: {
          profileId: prof.id,
          userId: u.id,
          rating: rnd(4, 5),
          comment: Math.random() > 0.3 ? pick(REVIEW_TEXTS) : null,
        },
      }).catch(() => { });
    }
  }
  console.log("✓ Reviews criadas");

  const total = await prisma.profile.count();
  console.log(`\n✅ Seed completo — ${total} perfis no banco`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
