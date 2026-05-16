import bcrypt from "bcryptjs";
import { PlanTier, PrismaClient, UserRole } from "@prisma/client";

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
function future(days: number) {
  return new Date(Date.now() + days * 86400000);
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
  "Sensual, discreta e inesquecível.",
  "Sua experiência começa no primeiro contato.",
  "Sofisticação sem pressa.",
  "Presença real, sem filtros.",
];

const BIOS = [
  "Sou uma pessoa tranquila, que gosta de conversas inteligentes e momentos com qualidade. Valorizo discrição e respeito mútuo.",
  "Adoro receber pessoas bem-educadas e com bom papo. Aqui você encontra presença de verdade, sem pressa.",
  "Meu espaço é confortável e aconchegante. Gosto de criar conexões genuínas, onde você se sinta à vontade.",
  "Sou discreta, pontual e reservada. Atendo com exclusividade para quem sabe o que busca.",
  "Formada, viajada e com ótimo humor. Adoro boa conversa, boa música e momentos sem pressa.",
  "Cuido muito de mim e da minha imagem. Você vai encontrar alguém leve, presente e sem estresse.",
  "Sou direta e objetiva. Valorizo seu tempo e o meu. Atendimento impecável e discreto.",
  "Aprecio a companhia de cavalheiros. Local próprio, ambiente sofisticado e total privacidade.",
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

const COMMENTS = [
  "Incrível, superou minhas expectativas!",
  "Linda demais 😍",
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
  "Agenda aberta essa semana?",
];

// Sample public video URLs for verification
const VERIFICATION_VIDEOS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
];

const SAMPLE_REELS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
];

type ProfileRecord = { id: string; planTier: PlanTier; slug: string;[key: string]: unknown };

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
  districtId?: string | null;
  priceHour: number;
  planTier: PlanTier;
  planDays?: number;
  isVerified: boolean;
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
  reelCount?: number;
  password?: string;
  featuredUntil?: Date;
  boostLabel?: string;
  viewsCurrentPeriod?: number;
  travelsNational?: boolean;
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
          districtId: opts.districtId ?? null,
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
          travelsNational: opts.travelsNational ?? Math.random() > 0.6,
          whatsappPhone: opts.whatsappPhone,
          isOnline: false,
          isVerified: opts.isVerified,
          videoVerified: false,
          viewsThisMonth: rnd(200, 9000),
          viewsCurrentPeriod: opts.viewsCurrentPeriod ?? rnd(20, 800),
          planTier: opts.planTier,
          planExpiresAt: future(opts.planDays ?? 30),
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
      isPublic: i < Math.ceil(n * 0.6),
      sortOrder: i,
      isCover: i === 0,
    })),
  });

  // Add reels
  if (opts.reelCount && opts.reelCount > 0) {
    for (let r = 0; r < opts.reelCount; r++) {
      await prisma.media.create({
        data: {
          profileId: prof.id,
          url: SAMPLE_REELS[(r + opts.handle.length) % SAMPLE_REELS.length],
          mediaType: "REEL",
          isPublic: true,
          isCover: false,
          caption: pick(["Disponível hoje ✨", "Boa noite 🌙", "Agenda aberta 🔥", null, "Para quem sabe apreciar", null]),
          sortOrder: r,
        },
      });
    }
  }

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

async function addVerificationCase(opts: {
  profileId: string;
  status: "NOVO" | "REVISAO" | "APROVADO" | "REJEITADO";
  withDocs?: boolean;
  withVideo?: boolean;
  withSelfie?: boolean;
  waitDays?: number;
}) {
  const waitingDate = new Date(Date.now() - (opts.waitDays ?? rnd(1, 10)) * 86400000);
  return prisma.verificationCase.create({
    data: {
      profileId: opts.profileId,
      status: opts.status,
      documentType: opts.withDocs ? pick(["RG", "CNH", "Passaporte"]) : null,
      documentFrontUrl: opts.withDocs ? img(`doc-front-${opts.profileId}`, 600, 400) : null,
      documentBackUrl: opts.withDocs ? img(`doc-back-${opts.profileId}`, 600, 400) : null,
      selfieUrl: opts.withSelfie !== false ? img(`selfie-${opts.profileId}`, 480, 640) : null,
      videoUrl: opts.withVideo ? pick(VERIFICATION_VIDEOS) : null,
      waitingSince: waitingDate,
      createdAt: waitingDate,
    },
  });
}

async function main() {
  // ── Cleanup completo ──────────────────────────────────────────────────────
  await prisma.$transaction([
    prisma.financialRecord.deleteMany(),
    prisma.whatsAppClick.deleteMany(),
    prisma.verificationCase.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.review.deleteMany(),
    prisma.mediaComment.deleteMany(),
    prisma.mediaLike.deleteMany(),
    prisma.storyLike.deleteMany(),
    prisma.storyView.deleteMany(),
    prisma.story.deleteMany(),
    prisma.profileDurationOption.deleteMany(),
    prisma.availabilityRule.deleteMany(),
    prisma.media.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.district.deleteMany(),
    prisma.city.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.hotPeriodConfig.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("✓ DB limpo");

  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash("Admin@privello2025", 12);
  await prisma.user.create({
    data: {
      name: "Admin Privello",
      email: "admin@privello.com",
      slug: "admin-privello",
      password: adminPw,
      role: "ADMIN" as UserRole,
      verified: true,
    },
  });
  console.log("✓ Admin criado — admin@privello.com / Admin@privello2025");

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
  const blm = await prisma.city.create({ data: { name: "Blumenau, SC", slug: "blumenau-sc", heroImage: img("blm-city", 800, 600) } });
  const mao = await prisma.city.create({ data: { name: "Manaus, AM", slug: "manaus-am", heroImage: img("mao-city", 800, 600) } });

  // ── Districts ─────────────────────────────────────────────────────────────
  const jardins = await prisma.district.create({ data: { name: "Jardins", slug: "jardins", cityId: sp.id } });
  const itaim = await prisma.district.create({ data: { name: "Itaim Bibi", slug: "itaim-bibi", cityId: sp.id } });
  const pinheiros = await prisma.district.create({ data: { name: "Pinheiros", slug: "pinheiros", cityId: sp.id } });
  const moema = await prisma.district.create({ data: { name: "Moema", slug: "moema", cityId: sp.id } });
  const leblon = await prisma.district.create({ data: { name: "Leblon", slug: "leblon", cityId: rj.id } });
  const ipanema = await prisma.district.create({ data: { name: "Ipanema", slug: "ipanema", cityId: rj.id } });
  const botafogo = await prisma.district.create({ data: { name: "Botafogo", slug: "botafogo", cityId: rj.id } });
  const savassi = await prisma.district.create({ data: { name: "Savassi", slug: "savassi", cityId: bh.id } });
  const asasul = await prisma.district.create({ data: { name: "Asa Sul", slug: "asa-sul", cityId: bsb.id } });
  const batel = await prisma.district.create({ data: { name: "Batel", slug: "batel", cityId: cwb.id } });
  const moinhos = await prisma.district.create({ data: { name: "Moinhos", slug: "moinhos", cityId: poa.id } });
  const boaviagem = await prisma.district.create({ data: { name: "Boa Viagem", slug: "boa-viagem", cityId: rec.id } });
  const barra = await prisma.district.create({ data: { name: "Barra", slug: "barra", cityId: ssa.id } });

  console.log("✓ Cidades e bairros criados");

  // ── Definição dos perfis ──────────────────────────────────────────────────
  // verified: true = Verificada com selo | false = não verificada
  // verCase: "APROVADO" | "REJEITADO" | "REVISAO" | "NOVO" | "video" | null
  type G = {
    name: string; handle: string; cityId: string; districtId?: string;
    price: number; tier: PlanTier; planDays?: number;
    verified: boolean; age: number; hair: string; eyes: string; h: number;
    rating: number; rc: number;
    reels?: number; photos?: number; hasPlace?: boolean; homeVisit?: boolean;
    verCase?: "APROVADO" | "REJEITADO" | "REVISAO" | "NOVO" | "video-novo" | "video-revisao" | null;
    boost?: boolean; views?: number; travelsNational?: boolean;
  };

  const garotas: G[] = [
    // ── São Paulo – Jardins ──────────────────────────────────────────────
    { name: "Helena", handle: "helena", cityId: sp.id, districtId: jardins.id, price: 800, tier: PlanTier.PREMIUM, verified: true, age: 27, hair: "Castanho", eyes: "Castanhos", h: 168, rating: 4.9, rc: 42, reels: 2, photos: 6, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: true, views: 750 },
    { name: "Luna", handle: "luna", cityId: sp.id, districtId: jardins.id, price: 950, tier: PlanTier.PREMIUM, verified: true, age: 25, hair: "Loiro", eyes: "Azuis", h: 172, rating: 4.8, rc: 38, reels: 2, photos: 5, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: true, views: 680 },
    { name: "Sophia", handle: "sophia", cityId: sp.id, districtId: jardins.id, price: 700, tier: PlanTier.DESTAQUE, verified: true, age: 26, hair: "Preto", eyes: "Castanhos", h: 165, rating: 4.7, rc: 29, reels: 1, photos: 4, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 520 },
    { name: "Olivia", handle: "olivia", cityId: sp.id, districtId: jardins.id, price: 1100, tier: PlanTier.PREMIUM, verified: true, age: 29, hair: "Loiro", eyes: "Azuis", h: 172, rating: 4.9, rc: 51, reels: 3, photos: 7, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: true, views: 820, travelsNational: true },
    // ── São Paulo – Itaim ────────────────────────────────────────────────
    { name: "Isabela", handle: "isabela", cityId: sp.id, districtId: itaim.id, price: 550, tier: PlanTier.ESSENCIAL, verified: true, age: 24, hair: "Castanho", eyes: "Verdes", h: 163, rating: 4.5, rc: 18, reels: 0, photos: 3, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 310 },
    { name: "Valentina", handle: "valentina", cityId: sp.id, districtId: itaim.id, price: 480, tier: PlanTier.ESSENCIAL, verified: false, age: 28, hair: "Ruivo", eyes: "Castanhos", h: 166, rating: 4.3, rc: 11, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "NOVO", boost: false, views: 180 },
    { name: "Mariana", handle: "mariana", cityId: sp.id, districtId: itaim.id, price: 620, tier: PlanTier.DESTAQUE, verified: true, age: 23, hair: "Loiro", eyes: "Castanhos", h: 170, rating: 4.6, rc: 22, reels: 1, photos: 4, hasPlace: true, homeVisit: true, verCase: "APROVADO", boost: false, views: 420 },
    // ── São Paulo – Pinheiros ────────────────────────────────────────────
    { name: "Camila", handle: "camila", cityId: sp.id, districtId: pinheiros.id, price: 580, tier: PlanTier.DESTAQUE, verified: true, age: 26, hair: "Castanho", eyes: "Castanhos", h: 167, rating: 4.7, rc: 31, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 480 },
    { name: "Beatriz", handle: "beatriz", cityId: sp.id, districtId: pinheiros.id, price: 380, tier: PlanTier.ESSENCIAL, verified: false, age: 22, hair: "Preto", eyes: "Pretos", h: 160, rating: 4.2, rc: 8, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: null, boost: false, views: 140 },
    { name: "Thamires", handle: "thamires", cityId: sp.id, districtId: pinheiros.id, price: 490, tier: PlanTier.DESTAQUE, verified: false, age: 24, hair: "Loiro", eyes: "Castanhos", h: 166, rating: 0, rc: 0, reels: 1, photos: 4, hasPlace: true, homeVisit: true, verCase: "video-revisao", boost: false, views: 220 },
    // ── São Paulo – Moema ────────────────────────────────────────────────
    { name: "Larissa", handle: "larissa", cityId: sp.id, districtId: moema.id, price: 520, tier: PlanTier.DESTAQUE, verified: true, age: 29, hair: "Loiro", eyes: "Verdes", h: 169, rating: 4.8, rc: 35, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 560 },
    { name: "Fernanda", handle: "fernanda", cityId: sp.id, districtId: moema.id, price: 440, tier: PlanTier.ESSENCIAL, verified: true, age: 25, hair: "Castanho", eyes: "Castanhos", h: 164, rating: 4.4, rc: 14, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 290 },
    // ── SP sem bairro ────────────────────────────────────────────────────
    { name: "Priya", handle: "priya", cityId: sp.id, price: 650, tier: PlanTier.PREMIUM, verified: false, age: 27, hair: "Preto", eyes: "Castanhos", h: 162, rating: 0, rc: 0, reels: 1, photos: 5, hasPlace: true, homeVisit: false, verCase: "video-novo", boost: false, views: 190 },
    { name: "Andressa", handle: "andressa", cityId: sp.id, price: 350, tier: PlanTier.ESSENCIAL, verified: false, age: 21, hair: "Castanho", eyes: "Castanhos", h: 161, rating: 0, rc: 0, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "REVISAO", boost: false, views: 110 },
    // ── Rio de Janeiro ───────────────────────────────────────────────────
    { name: "Aurora", handle: "aurora", cityId: rj.id, districtId: leblon.id, price: 900, tier: PlanTier.PREMIUM, verified: true, age: 24, hair: "Loiro", eyes: "Verdes", h: 170, rating: 4.8, rc: 31, reels: 2, photos: 6, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: true, views: 640, travelsNational: true },
    { name: "Gabriela", handle: "gabriela", cityId: rj.id, districtId: leblon.id, price: 1000, tier: PlanTier.PREMIUM, verified: true, age: 27, hair: "Castanho", eyes: "Castanhos", h: 173, rating: 4.9, rc: 55, reels: 2, photos: 6, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: true, views: 780 },
    { name: "Natalia", handle: "natalia", cityId: rj.id, districtId: ipanema.id, price: 680, tier: PlanTier.DESTAQUE, verified: true, age: 25, hair: "Preto", eyes: "Castanhos", h: 166, rating: 4.6, rc: 27, reels: 1, photos: 4, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 450 },
    { name: "Leticia", handle: "leticia", cityId: rj.id, districtId: botafogo.id, price: 460, tier: PlanTier.ESSENCIAL, verified: true, age: 23, hair: "Castanho", eyes: "Verdes", h: 162, rating: 4.5, rc: 19, reels: 0, photos: 3, hasPlace: true, homeVisit: true, verCase: "APROVADO", boost: false, views: 330 },
    { name: "Bianca", handle: "bianca", cityId: rj.id, districtId: ipanema.id, price: 750, tier: PlanTier.PREMIUM, verified: true, age: 28, hair: "Castanho", eyes: "Castanhos", h: 171, rating: 4.9, rc: 48, reels: 2, photos: 5, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 690 },
    { name: "Rafaela", handle: "rafaela", cityId: rj.id, districtId: botafogo.id, price: 480, tier: PlanTier.ESSENCIAL, verified: false, age: 26, hair: "Loiro", eyes: "Azuis", h: 168, rating: 4.1, rc: 9, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "REJEITADO", boost: false, views: 160 },
    { name: "Juliana", handle: "juliana", cityId: rj.id, price: 520, tier: PlanTier.DESTAQUE, verified: false, age: 24, hair: "Preto", eyes: "Pretos", h: 164, rating: 0, rc: 0, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "video-novo", boost: false, views: 200 },
    // ── Belo Horizonte ───────────────────────────────────────────────────
    { name: "Amanda", handle: "amanda", cityId: bh.id, districtId: savassi.id, price: 420, tier: PlanTier.ESSENCIAL, verified: true, age: 25, hair: "Castanho", eyes: "Castanhos", h: 163, rating: 4.5, rc: 16, reels: 0, photos: 3, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 280 },
    { name: "Patricia", handle: "patricia", cityId: bh.id, districtId: savassi.id, price: 520, tier: PlanTier.DESTAQUE, verified: true, age: 30, hair: "Loiro", eyes: "Verdes", h: 167, rating: 4.7, rc: 28, reels: 1, photos: 4, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 390 },
    { name: "Renata", handle: "renata", cityId: bh.id, price: 320, tier: PlanTier.ESSENCIAL, verified: false, age: 22, hair: "Preto", eyes: "Castanhos", h: 160, rating: 4.1, rc: 7, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: null, boost: false, views: 120 },
    // ── Brasília ─────────────────────────────────────────────────────────
    { name: "Carolina", handle: "carolina", cityId: bsb.id, districtId: asasul.id, price: 500, tier: PlanTier.DESTAQUE, verified: true, age: 26, hair: "Castanho", eyes: "Castanhos", h: 165, rating: 4.6, rc: 21, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 370 },
    { name: "Daniela", handle: "daniela", cityId: bsb.id, districtId: asasul.id, price: 420, tier: PlanTier.ESSENCIAL, verified: false, age: 24, hair: "Loiro", eyes: "Azuis", h: 169, rating: 4.2, rc: 10, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "NOVO", boost: false, views: 150 },
    { name: "Priscila", handle: "priscila", cityId: bsb.id, price: 620, tier: PlanTier.PREMIUM, verified: true, age: 28, hair: "Ruivo", eyes: "Verdes", h: 166, rating: 4.8, rc: 36, reels: 2, photos: 5, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: true, views: 590 },
    // ── Curitiba ─────────────────────────────────────────────────────────
    { name: "Aline", handle: "aline", cityId: cwb.id, districtId: batel.id, price: 400, tier: PlanTier.ESSENCIAL, verified: true, age: 23, hair: "Castanho", eyes: "Castanhos", h: 162, rating: 4.4, rc: 15, reels: 0, photos: 3, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 260 },
    { name: "Tatiane", handle: "tatiane", cityId: cwb.id, districtId: batel.id, price: 500, tier: PlanTier.DESTAQUE, verified: true, age: 27, hair: "Preto", eyes: "Pretos", h: 164, rating: 4.6, rc: 24, reels: 1, photos: 4, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 350 },
    { name: "Vanessa", handle: "vanessa", cityId: cwb.id, price: 680, tier: PlanTier.PREMIUM, verified: true, age: 25, hair: "Loiro", eyes: "Verdes", h: 170, rating: 4.8, rc: 33, reels: 2, photos: 5, hasPlace: true, homeVisit: true, verCase: "APROVADO", boost: true, views: 610, travelsNational: true },
    // ── Porto Alegre ─────────────────────────────────────────────────────
    { name: "Bruna", handle: "bruna", cityId: poa.id, districtId: moinhos.id, price: 450, tier: PlanTier.DESTAQUE, verified: true, age: 24, hair: "Castanho", eyes: "Castanhos", h: 165, rating: 4.7, rc: 26, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 400 },
    { name: "Claudia", handle: "claudia", cityId: poa.id, districtId: moinhos.id, price: 350, tier: PlanTier.ESSENCIAL, verified: false, age: 29, hair: "Loiro", eyes: "Azuis", h: 168, rating: 0, rc: 0, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "video-novo", boost: false, views: 130 },
    { name: "Debora", handle: "debora", cityId: poa.id, price: 520, tier: PlanTier.DESTAQUE, verified: false, age: 26, hair: "Preto", eyes: "Castanhos", h: 163, rating: 4.3, rc: 11, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "REVISAO", boost: false, views: 240 },
    // ── Florianópolis ────────────────────────────────────────────────────
    { name: "Elisa", handle: "elisa", cityId: fln.id, price: 440, tier: PlanTier.ESSENCIAL, verified: true, age: 23, hair: "Loiro", eyes: "Verdes", h: 166, rating: 4.5, rc: 17, reels: 0, photos: 3, hasPlace: true, homeVisit: true, verCase: "APROVADO", boost: false, views: 270 },
    { name: "Fabiana", handle: "fabiana", cityId: fln.id, price: 540, tier: PlanTier.DESTAQUE, verified: true, age: 27, hair: "Castanho", eyes: "Castanhos", h: 169, rating: 4.7, rc: 30, reels: 1, photos: 4, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 430 },
    // ── Recife ───────────────────────────────────────────────────────────
    { name: "Giovana", handle: "giovana", cityId: rec.id, districtId: boaviagem.id, price: 380, tier: PlanTier.ESSENCIAL, verified: true, age: 24, hair: "Preto", eyes: "Castanhos", h: 161, rating: 4.4, rc: 14, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 240 },
    { name: "Heloisa", handle: "heloisa", cityId: rec.id, districtId: boaviagem.id, price: 460, tier: PlanTier.DESTAQUE, verified: false, age: 26, hair: "Castanho", eyes: "Castanhos", h: 164, rating: 4.4, rc: 15, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "video-revisao", boost: false, views: 310 },
    { name: "Ingrid", handle: "ingrid", cityId: rec.id, price: 300, tier: PlanTier.ESSENCIAL, verified: false, age: 22, hair: "Loiro", eyes: "Azuis", h: 162, rating: 0, rc: 0, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: null, boost: false, views: 90 },
    // ── Salvador ─────────────────────────────────────────────────────────
    { name: "Jessica", handle: "jessica", cityId: ssa.id, districtId: barra.id, price: 400, tier: PlanTier.ESSENCIAL, verified: true, age: 25, hair: "Preto", eyes: "Castanhos", h: 163, rating: 4.5, rc: 16, reels: 0, photos: 3, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 280 },
    { name: "Karen", handle: "karen", cityId: ssa.id, districtId: barra.id, price: 520, tier: PlanTier.DESTAQUE, verified: true, age: 28, hair: "Castanho", eyes: "Castanhos", h: 167, rating: 4.7, rc: 27, reels: 1, photos: 4, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 380 },
    { name: "Livia", handle: "livia", cityId: ssa.id, price: 650, tier: PlanTier.PREMIUM, verified: true, age: 26, hair: "Loiro", eyes: "Verdes", h: 170, rating: 4.8, rc: 34, reels: 2, photos: 5, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: true, views: 580 },
    // ── Goiânia ──────────────────────────────────────────────────────────
    { name: "Monica", handle: "monica", cityId: gyn.id, price: 330, tier: PlanTier.ESSENCIAL, verified: true, age: 23, hair: "Castanho", eyes: "Castanhos", h: 162, rating: 4.4, rc: 13, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 200 },
    { name: "Nathalia", handle: "nathalia", cityId: gyn.id, price: 450, tier: PlanTier.DESTAQUE, verified: false, age: 27, hair: "Preto", eyes: "Pretos", h: 165, rating: 0, rc: 0, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "REVISAO", boost: false, views: 150 },
    // ── Blumenau ─────────────────────────────────────────────────────────
    { name: "Sabrina", handle: "sabrina", cityId: blm.id, price: 480, tier: PlanTier.DESTAQUE, verified: true, age: 25, hair: "Castanho", eyes: "Castanhos", h: 168, rating: 4.7, rc: 29, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 360 },
    { name: "Vitoria", handle: "vitoria", cityId: blm.id, price: 360, tier: PlanTier.ESSENCIAL, verified: true, age: 23, hair: "Loiro", eyes: "Verdes", h: 163, rating: 4.5, rc: 18, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 230 },
    { name: "Rafaelly", handle: "rafaelly", cityId: blm.id, price: 290, tier: PlanTier.ESSENCIAL, verified: false, age: 21, hair: "Ruivo", eyes: "Castanhos", h: 160, rating: 0, rc: 0, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: null, boost: false, views: 80 },
    // ── Manaus ───────────────────────────────────────────────────────────
    { name: "Yasmin", handle: "yasmin", cityId: mao.id, price: 350, tier: PlanTier.ESSENCIAL, verified: false, age: 22, hair: "Preto", eyes: "Castanhos", h: 160, rating: 0, rc: 0, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "NOVO", boost: false, views: 70 },
    { name: "Luana", handle: "luana", cityId: mao.id, price: 420, tier: PlanTier.DESTAQUE, verified: false, age: 25, hair: "Castanho", eyes: "Castanhos", h: 164, rating: 4.3, rc: 8, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "video-novo", boost: false, views: 120 },
  ];

  const garotos: G[] = [
    { name: "Rafael", handle: "rafael", cityId: sp.id, districtId: jardins.id, price: 650, tier: PlanTier.PREMIUM, verified: true, age: 28, hair: "Castanho", eyes: "Castanhos", h: 182, rating: 4.8, rc: 24, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 440 },
    { name: "Bruno", handle: "bruno", cityId: rj.id, districtId: leblon.id, price: 500, tier: PlanTier.DESTAQUE, verified: true, age: 26, hair: "Preto", eyes: "Castanhos", h: 178, rating: 4.6, rc: 17, reels: 1, photos: 4, hasPlace: false, homeVisit: true, verCase: "APROVADO", boost: false, views: 320 },
    { name: "Thiago", handle: "thiago", cityId: cwb.id, price: 380, tier: PlanTier.ESSENCIAL, verified: false, age: 25, hair: "Loiro", eyes: "Azuis", h: 180, rating: 4.5, rc: 12, reels: 0, photos: 3, hasPlace: false, homeVisit: true, verCase: "REVISAO", boost: false, views: 180 },
    { name: "Leonardo", handle: "leonardo", cityId: bsb.id, price: 420, tier: PlanTier.DESTAQUE, verified: false, age: 30, hair: "Castanho", eyes: "Verdes", h: 176, rating: 0, rc: 0, reels: 0, photos: 3, hasPlace: true, homeVisit: false, verCase: "NOVO", boost: false, views: 90 },
  ];

  const casais: G[] = [
    { name: "Casal SP", handle: "casalsp", cityId: sp.id, districtId: itaim.id, price: 1200, tier: PlanTier.PREMIUM, verified: true, age: 27, hair: "Variado", eyes: "Castanhos", h: 170, rating: 4.9, rc: 31, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: true, views: 560 },
    { name: "Casal RJ", handle: "casalrj", cityId: rj.id, districtId: ipanema.id, price: 950, tier: PlanTier.DESTAQUE, verified: true, age: 26, hair: "Variado", eyes: "Variados", h: 168, rating: 4.7, rc: 22, reels: 1, photos: 4, hasPlace: true, homeVisit: false, verCase: "APROVADO", boost: false, views: 380 },
    { name: "Casal CWB", handle: "casalcwb", cityId: cwb.id, price: 750, tier: PlanTier.DESTAQUE, verified: false, age: 25, hair: "Variado", eyes: "Variados", h: 167, rating: 0, rc: 0, reels: 0, photos: 3, hasPlace: true, homeVisit: false, verCase: "video-novo", boost: false, views: 140 },
  ];

  const profiles: ProfileRecord[] = [];
  let code = 100;

  for (const g of [...garotas, ...garotos, ...casais]) {
    code++;
    const prof = await createProfile({
      email: `${g.handle}@privello.local`,
      name: g.name,
      handle: g.handle,
      publicCode: `PRV-${code}`,
      displayName: g.name,
      age: g.age,
      tagline: pick(TAGLINES),
      bio: pick(BIOS),
      cityId: g.cityId,
      districtId: g.districtId ?? null,
      priceHour: g.price,
      planTier: g.tier,
      planDays: 30,
      isVerified: g.verified,
      servesMen: !casais.some(c => c.handle === g.handle) ? garotas.some(x => x.handle === g.handle) : true,
      servesWomen: garotos.some(x => x.handle === g.handle) || casais.some(c => c.handle === g.handle),
      servesCouples: casais.some(c => c.handle === g.handle),
      hasOwnPlace: g.hasPlace ?? false,
      homeVisit: g.homeVisit ?? false,
      travelsNational: g.travelsNational ?? Math.random() > 0.7,
      hair: g.hair,
      eyes: g.eyes,
      heightCm: g.h,
      ratingAvg: g.rating,
      ratingCount: g.rc,
      whatsappPhone: "+5511988880000",
      mediaCount: g.photos ?? 3,
      reelCount: g.reels ?? 0,
      viewsCurrentPeriod: g.views ?? rnd(50, 400),
      featuredUntil: g.boost ? future(rnd(3, 10)) : undefined,
      boostLabel: g.boost ? pick(["Em destaque", "Top da semana", "Mais procurada"]) : undefined,
    });
    profiles.push(prof);
    process.stdout.write(`  @${g.handle} (${g.tier}) ✓\n`);
  }

  console.log(`\n✓ ${profiles.length} perfis criados`);

  // ── Conta especial: @dudalanzarin ─────────────────────────────────────────
  code++;
  const pwHash = await bcrypt.hash("Admin@privello2025", 12);
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
    priceHour: 1000,
    planTier: PlanTier.PREMIUM,
    planDays: 30,
    isVerified: true,
    servesMen: true, servesWomen: false, servesCouples: false,
    hasOwnPlace: true, homeVisit: false, travelsNational: true,
    hair: "Castanho", eyes: "Castanhos", heightCm: 168,
    ratingAvg: 5.0, ratingCount: 3,
    whatsappPhone: "+5511999999999",
    mediaCount: 7, reelCount: 3,
    password: pwHash,
    featuredUntil: future(10),
    boostLabel: "Em destaque",
    viewsCurrentPeriod: 920,
  });
  profiles.push(dudaProf);
  console.log("✓ @dudalanzarin (Premium + boost)");

  // ── Casos de verificação variados ────────────────────────────────────────
  const profileByHandle = (h: string) => profiles.find(p => (p as { slug: string }).slug === h);

  // Aprovados (já verificadas — apenas registro histórico)
  const aprovadas = garotas.filter(g => g.verCase === "APROVADO" && g.verified).slice(0, 8);
  for (const g of aprovadas) {
    const prof = profileByHandle(g.handle);
    if (prof) await addVerificationCase({ profileId: prof.id, status: "APROVADO", withDocs: true, withSelfie: true, withVideo: false, waitDays: rnd(20, 60) });
  }

  // Pendentes com video (NOVO - enviaram vídeo de verificação)
  const videoNovo = [...garotas, ...casais].filter(g => g.verCase === "video-novo");
  for (const g of videoNovo) {
    const prof = profileByHandle(g.handle);
    if (prof) await addVerificationCase({ profileId: prof.id, status: "NOVO", withDocs: true, withSelfie: true, withVideo: true, waitDays: rnd(1, 3) });
  }

  // Em revisão com video
  const videoRevisao = [...garotas, ...garotos].filter(g => g.verCase === "video-revisao");
  for (const g of videoRevisao) {
    const prof = profileByHandle(g.handle);
    if (prof) await addVerificationCase({ profileId: prof.id, status: "REVISAO", withDocs: true, withSelfie: true, withVideo: true, waitDays: rnd(3, 7) });
  }

  // Pendentes sem video (NOVO)
  const novoSemVideo = [...garotas, ...garotos, ...casais].filter(g => g.verCase === "NOVO");
  for (const g of novoSemVideo) {
    const prof = profileByHandle(g.handle);
    if (prof) await addVerificationCase({ profileId: prof.id, status: "NOVO", withDocs: true, withSelfie: true, withVideo: false, waitDays: rnd(1, 5) });
  }

  // Em revisão sem video
  const revisaoSemVideo = [...garotas, ...garotos].filter(g => g.verCase === "REVISAO");
  for (const g of revisaoSemVideo) {
    const prof = profileByHandle(g.handle);
    if (prof) await addVerificationCase({ profileId: prof.id, status: "REVISAO", withDocs: true, withSelfie: true, withVideo: false, waitDays: rnd(2, 8) });
  }

  // Rejeitados
  const rejeitados = garotas.filter(g => g.verCase === "REJEITADO");
  for (const g of rejeitados) {
    const prof = profileByHandle(g.handle);
    if (prof) await addVerificationCase({ profileId: prof.id, status: "REJEITADO", withDocs: true, withSelfie: true, withVideo: false, waitDays: 15 });
  }

  // Duda: aprovada
  await addVerificationCase({ profileId: dudaProf.id, status: "APROVADO", withDocs: true, withSelfie: true, withVideo: true, waitDays: 25 });

  const vcTotal = await prisma.verificationCase.count();
  console.log(`✓ ${vcTotal} casos de verificação criados`);

  // ── HotPeriodConfig ───────────────────────────────────────────────────────
  await prisma.hotPeriodConfig.create({ data: { id: "hot", startedAt: new Date() } });

  // ── 20 Clientes ───────────────────────────────────────────────────────────
  const clientNames = [
    "Carlos Silva", "Pedro Alves", "Lucas Ferreira", "Mateus Costa",
    "Gabriel Santos", "Felipe Oliveira", "Andre Sousa", "Rodrigo Lima",
    "Diego Pereira", "Marcos Ribeiro", "Vinicius Carvalho", "Thiago Nunes",
    "Bruno Martins", "Rafael Gomes", "Gustavo Torres", "Leonardo Dias",
    "Henrique Araujo", "Samuel Barbosa", "Igor Nascimento", "Caio Freitas",
  ];
  const clientPw = await bcrypt.hash("Cliente#123", 12);
  const clientUsers: { id: string }[] = [];
  for (const name of clientNames) {
    const handle = name.toLowerCase().replace(/\s/g, ".");
    const u = await prisma.user.create({
      data: { name, email: `${handle}@email.local`, password: clientPw, role: UserRole.CLIENT, verified: true },
    });
    clientUsers.push(u);
  }

  // Conta do dono (cliente assinante)
  const eduClient = await prisma.user.create({
    data: { name: "Eduardo Lanzarin", slug: "edulanzarin", email: "eduardolanzarin@gmail.com", password: pwHash, role: UserRole.CLIENT, verified: true },
  });
  clientUsers.push(eduClient);
  console.log(`✓ ${clientUsers.length} clientes criados`);

  // ── Assinaturas ───────────────────────────────────────────────────────────
  const subExpiry = future(30);
  const subscribers = [...clientUsers.slice(0, 14), eduClient];
  for (const u of subscribers) {
    await prisma.subscription.create({ data: { userId: u.id, status: "ACTIVE", expiresAt: subExpiry } });
  }
  console.log(`✓ ${subscribers.length} assinaturas criadas`);

  // ── Stories ───────────────────────────────────────────────────────────────
  const storyProfiles = await prisma.profile.findMany({
    where: { planTier: { in: ["DESTAQUE", "PREMIUM"] } },
    include: { media: { where: { isCover: true }, take: 1 } },
  });
  const storyExpiry = future(1);
  const storyCaptions = ["Disponível hoje 🌙", "Nova foto ✨", "Agenda aberta", "Local próprio 💫", null, "Atendo agora 🔥", null];
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

  for (const story of createdStories) {
    const viewers = shuffle(clientUsers).slice(0, rnd(2, 10));
    for (const u of viewers) {
      await prisma.storyView.create({ data: { storyId: story.id, userId: u.id } });
      if (Math.random() > 0.5) {
        await prisma.storyLike.create({ data: { storyId: story.id, userId: u.id } });
      }
    }
  }
  console.log(`✓ ${createdStories.length} stories criados`);

  // ── MediaLikes e Comments ─────────────────────────────────────────────────
  const allMedia = await prisma.media.findMany({ where: { isPublic: true } });
  for (const media of allMedia) {
    const likers = shuffle(clientUsers).slice(0, rnd(1, 8));
    for (const u of likers) {
      await prisma.mediaLike.createMany({ data: [{ mediaId: media.id, userId: u.id }], skipDuplicates: true });
    }
    if (Math.random() > 0.6) {
      await prisma.mediaComment.create({
        data: { mediaId: media.id, userId: pick(subscribers).id, text: pick(COMMENTS) },
      });
    }
  }
  console.log("✓ MediaLikes e Comments criados");

  // ── Reviews ───────────────────────────────────────────────────────────────
  for (const prof of profiles.filter(p => typeof p.ratingCount === "number" && p.ratingCount > 0).slice(0, 30)) {
    const reviewers = shuffle(subscribers).slice(0, rnd(1, 4));
    for (const u of reviewers) {
      await prisma.review.create({
        data: { profileId: prof.id, userId: u.id, rating: rnd(4, 5), comment: Math.random() > 0.3 ? pick(REVIEW_TEXTS) : null },
      }).catch(() => { });
    }
  }
  console.log("✓ Reviews criadas");

  // ── Favoritos ─────────────────────────────────────────────────────────────
  for (const u of subscribers.slice(0, 10)) {
    const favProfiles = shuffle(profiles).slice(0, rnd(2, 6));
    for (const prof of favProfiles) {
      await prisma.favorite.create({ data: { userId: u.id, profileId: prof.id } }).catch(() => { });
    }
  }
  console.log("✓ Favoritos criados");

  const total = await prisma.profile.count();
  console.log(`\n✅ Seed completo — ${total} perfis no banco`);
  console.log("\n🔑 Admin: admin@privello.com / Admin@privello2025");
  console.log("🔑 Eduardo (cliente): eduardolanzarin@gmail.com / Admin@privello2025");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
