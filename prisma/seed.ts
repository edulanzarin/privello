import {
  FinancialOrigin,
  MeetingRequestStatus,
  ModerationStatus,
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

async function createProfile(opts: {
  email: string;
  name: string;
  slug: string;
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
  mediaSeeds: string[];
}) {
  const u = await prisma.user.create({
    data: {
      email: opts.email,
      name: opts.name,
      role: UserRole.PROVIDER,
      verified: opts.isVerified,
      profile: {
        create: {
          slug: opts.slug,
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
          planTier: opts.planTier,
          boostLabel: opts.planTier !== PlanTier.ESSENCIAL ? opts.planTier : null,
          ratingAvg: opts.ratingAvg,
          ratingCount: opts.ratingCount,
          memberSince: new Date(Date.now() - rnd(30, 730) * 86400000),
        },
      },
    },
    include: { profile: true },
  });

  const prof = u.profile!;

  await prisma.media.createMany({
    data: opts.mediaSeeds.map((s, i) => ({
      profileId: prof.id,
      url: img(s),
      isPublic: true,
      sortOrder: i,
      isCover: i === 0,
    })),
  });

  await prisma.profileDurationOption.createMany({
    data: [
      { profileId: prof.id, minutes: 60, label: "1 hora", priceBrl: opts.priceHour, sortOrder: 0, active: true },
      { profileId: prof.id, minutes: 120, label: "2 horas", priceBrl: Math.round(opts.priceHour * 1.75), sortOrder: 1, active: true },
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

  return prof;
}

async function main() {
  // ── Cleanup ──────────────────────────────────────────────────────────────
  await prisma.meetingRequest.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.whatsAppClick.deleteMany();
  await prisma.verificationCase.deleteMany();
  await prisma.review.deleteMany();
  await prisma.profileDurationOption.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.media.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.district.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  // ── Cities ───────────────────────────────────────────────────────────────
  const sp  = await prisma.city.create({ data: { name: "São Paulo",       slug: "sao-paulo-sp",       heroImage: img("sp-city",  800, 600) } });
  const rj  = await prisma.city.create({ data: { name: "Rio de Janeiro",  slug: "rio-de-janeiro-rj",  heroImage: img("rj-city",  800, 600) } });
  const bh  = await prisma.city.create({ data: { name: "Belo Horizonte",  slug: "belo-horizonte-mg",  heroImage: img("bh-city",  800, 600) } });
  const bsb = await prisma.city.create({ data: { name: "Brasília",        slug: "brasilia-df",        heroImage: img("bsb-city", 800, 600) } });
  const cwb = await prisma.city.create({ data: { name: "Curitiba",        slug: "curitiba-pr",        heroImage: img("cwb-city", 800, 600) } });
  const poa = await prisma.city.create({ data: { name: "Porto Alegre",    slug: "porto-alegre-rs",    heroImage: img("poa-city", 800, 600) } });
  const fln = await prisma.city.create({ data: { name: "Florianópolis",   slug: "florianopolis-sc",   heroImage: img("fln-city", 800, 600) } });
  const rec = await prisma.city.create({ data: { name: "Recife",          slug: "recife-pe",          heroImage: img("rec-city", 800, 600) } });
  const ssa = await prisma.city.create({ data: { name: "Salvador",        slug: "salvador-ba",        heroImage: img("ssa-city", 800, 600) } });
  const gyn = await prisma.city.create({ data: { name: "Goiânia",         slug: "goiania-go",         heroImage: img("gyn-city", 800, 600) } });

  // ── Districts ─────────────────────────────────────────────────────────────
  const jardins   = await prisma.district.create({ data: { name: "Jardins",       slug: "jardins",       cityId: sp.id  } });
  const itaim     = await prisma.district.create({ data: { name: "Itaim Bibi",    slug: "itaim-bibi",    cityId: sp.id  } });
  const pinheiros = await prisma.district.create({ data: { name: "Pinheiros",     slug: "pinheiros",     cityId: sp.id  } });
  const moema     = await prisma.district.create({ data: { name: "Moema",         slug: "moema",         cityId: sp.id  } });
  const leblon    = await prisma.district.create({ data: { name: "Leblon",        slug: "leblon",        cityId: rj.id  } });
  const botafogo  = await prisma.district.create({ data: { name: "Botafogo",      slug: "botafogo",      cityId: rj.id  } });
  const ipanema   = await prisma.district.create({ data: { name: "Ipanema",       slug: "ipanema",       cityId: rj.id  } });
  const savassi   = await prisma.district.create({ data: { name: "Savassi",       slug: "savassi",       cityId: bh.id  } });
  const asoasul   = await prisma.district.create({ data: { name: "Asa Sul",       slug: "asa-sul",       cityId: bsb.id } });
  const batel     = await prisma.district.create({ data: { name: "Batel",         slug: "batel",         cityId: cwb.id } });
  const moinhos   = await prisma.district.create({ data: { name: "Moinhos",       slug: "moinhos",       cityId: poa.id } });
  const centro_fln= await prisma.district.create({ data: { name: "Centro",        slug: "centro",        cityId: fln.id } });
  const boa_viagem= await prisma.district.create({ data: { name: "Boa Viagem",    slug: "boa-viagem",    cityId: rec.id } });
  const barra     = await prisma.district.create({ data: { name: "Barra",         slug: "barra",         cityId: ssa.id } });
  const setor_sul = await prisma.district.create({ data: { name: "Setor Sul",     slug: "setor-sul",     cityId: gyn.id } });

  // ── Helper: city+district pairs ──────────────────────────────────────────
  const locations = [
    { city: sp,  district: jardins   },
    { city: sp,  district: itaim     },
    { city: sp,  district: pinheiros },
    { city: sp,  district: moema     },
    { city: rj,  district: leblon    },
    { city: rj,  district: botafogo  },
    { city: rj,  district: ipanema   },
    { city: bh,  district: savassi   },
    { city: bsb, district: asoasul   },
    { city: cwb, district: batel     },
    { city: poa, district: moinhos   },
    { city: fln, district: centro_fln},
    { city: rec, district: boa_viagem},
    { city: ssa, district: barra     },
    { city: gyn, district: setor_sul },
  ];

  // ── 50 Garotas (servesMen: true) ─────────────────────────────────────────
  const garotasData = [
    // SP – Jardins (PREMIUM)
    { name: "Helena",    slug: "helena-jardins",    loc: 0,  price: 450, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 27, hair: "Castanho", eyes: "Castanhos", h: 168, rating: 4.9, rc: 42 },
    { name: "Luna",      slug: "luna-jardins",      loc: 0,  price: 650, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 25, hair: "Loiro",    eyes: "Azuis",     h: 172, rating: 4.8, rc: 38 },
    { name: "Sophia",    slug: "sophia-jardins",    loc: 0,  price: 580, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 26, hair: "Preto",    eyes: "Castanhos", h: 165, rating: 4.7, rc: 29 },
    // SP – Itaim
    { name: "Isabela",   slug: "isabela-itaim",     loc: 1,  price: 380, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 24, hair: "Castanho", eyes: "Verdes",    h: 163, rating: 4.5, rc: 18 },
    { name: "Valentina", slug: "valentina-itaim",   loc: 1,  price: 420, tier: PlanTier.ESSENCIAL, verified: false, online: false, age: 28, hair: "Ruivo",    eyes: "Castanhos", h: 166, rating: 4.3, rc: 11 },
    { name: "Mariana",   slug: "mariana-itaim",     loc: 1,  price: 500, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 23, hair: "Loiro",    eyes: "Castanhos", h: 170, rating: 4.6, rc: 22 },
    // SP – Pinheiros
    { name: "Camila",    slug: "camila-pinheiros",  loc: 2,  price: 520, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 26, hair: "Castanho", eyes: "Castanhos", h: 167, rating: 4.7, rc: 31 },
    { name: "Beatriz",   slug: "beatriz-pinheiros", loc: 2,  price: 350, tier: PlanTier.ESSENCIAL, verified: false, online: true,  age: 22, hair: "Preto",    eyes: "Pretos",    h: 160, rating: 4.2, rc: 8  },
    // SP – Moema
    { name: "Larissa",   slug: "larissa-moema",     loc: 3,  price: 480, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 29, hair: "Loiro",    eyes: "Verdes",    h: 169, rating: 4.8, rc: 35 },
    { name: "Fernanda",  slug: "fernanda-moema",    loc: 3,  price: 400, tier: PlanTier.ESSENCIAL, verified: true,  online: false, age: 25, hair: "Castanho", eyes: "Castanhos", h: 164, rating: 4.4, rc: 14 },
    // RJ – Leblon
    { name: "Aurora",    slug: "aurora-leblon",     loc: 4,  price: 600, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 24, hair: "Loiro",    eyes: "Verdes",    h: 170, rating: 4.8, rc: 31 },
    { name: "Gabriela",  slug: "gabriela-leblon",   loc: 4,  price: 700, tier: PlanTier.PREMIUM,   verified: true,  online: false, age: 27, hair: "Castanho", eyes: "Castanhos", h: 173, rating: 4.9, rc: 55 },
    { name: "Natalia",   slug: "natalia-leblon",    loc: 4,  price: 550, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 25, hair: "Preto",    eyes: "Castanhos", h: 166, rating: 4.6, rc: 27 },
    // RJ – Botafogo
    { name: "Leticia",   slug: "leticia-botafogo",  loc: 5,  price: 430, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 23, hair: "Castanho", eyes: "Verdes",    h: 162, rating: 4.5, rc: 19 },
    { name: "Rafaela",   slug: "rafaela-botafogo",  loc: 5,  price: 480, tier: PlanTier.DESTAQUE,  verified: false, online: false, age: 26, hair: "Loiro",    eyes: "Azuis",     h: 168, rating: 4.4, rc: 12 },
    // RJ – Ipanema
    { name: "Bianca",    slug: "bianca-ipanema",    loc: 6,  price: 620, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 28, hair: "Castanho", eyes: "Castanhos", h: 171, rating: 4.9, rc: 48 },
    { name: "Juliana",   slug: "juliana-ipanema",   loc: 6,  price: 500, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 24, hair: "Preto",    eyes: "Pretos",    h: 164, rating: 4.6, rc: 23 },
    // BH – Savassi
    { name: "Amanda",    slug: "amanda-savassi",    loc: 7,  price: 380, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 25, hair: "Castanho", eyes: "Castanhos", h: 163, rating: 4.5, rc: 16 },
    { name: "Patricia",  slug: "patricia-savassi",  loc: 7,  price: 450, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 30, hair: "Loiro",    eyes: "Verdes",    h: 167, rating: 4.7, rc: 28 },
    { name: "Renata",    slug: "renata-savassi",    loc: 7,  price: 320, tier: PlanTier.ESSENCIAL, verified: false, online: true,  age: 22, hair: "Preto",    eyes: "Castanhos", h: 160, rating: 4.1, rc: 7  },
    // BSB – Asa Sul
    { name: "Carolina",  slug: "carolina-asa-sul",  loc: 8,  price: 420, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 26, hair: "Castanho", eyes: "Castanhos", h: 165, rating: 4.6, rc: 21 },
    { name: "Daniela",   slug: "daniela-asa-sul",   loc: 8,  price: 380, tier: PlanTier.ESSENCIAL, verified: true,  online: false, age: 24, hair: "Loiro",    eyes: "Azuis",     h: 169, rating: 4.4, rc: 13 },
    { name: "Priscila",  slug: "priscila-asa-sul",  loc: 8,  price: 500, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 28, hair: "Ruivo",    eyes: "Verdes",    h: 166, rating: 4.8, rc: 36 },
    // CWB – Batel
    { name: "Aline",     slug: "aline-batel",       loc: 9,  price: 360, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 23, hair: "Castanho", eyes: "Castanhos", h: 162, rating: 4.4, rc: 15 },
    { name: "Tatiane",   slug: "tatiane-batel",     loc: 9,  price: 440, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 27, hair: "Preto",    eyes: "Pretos",    h: 164, rating: 4.6, rc: 24 },
    { name: "Vanessa",   slug: "vanessa-batel",     loc: 9,  price: 520, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 25, hair: "Loiro",    eyes: "Verdes",    h: 170, rating: 4.8, rc: 33 },
    // POA – Moinhos
    { name: "Bruna",     slug: "bruna-moinhos",     loc: 10, price: 400, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 24, hair: "Castanho", eyes: "Castanhos", h: 165, rating: 4.7, rc: 26 },
    { name: "Claudia",   slug: "claudia-moinhos",   loc: 10, price: 350, tier: PlanTier.ESSENCIAL, verified: false, online: false, age: 29, hair: "Loiro",    eyes: "Azuis",     h: 168, rating: 4.3, rc: 9  },
    { name: "Debora",    slug: "debora-moinhos",    loc: 10, price: 480, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 26, hair: "Preto",    eyes: "Castanhos", h: 163, rating: 4.6, rc: 20 },
    // FLN – Centro
    { name: "Elisa",     slug: "elisa-floripa",     loc: 11, price: 390, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 23, hair: "Loiro",    eyes: "Verdes",    h: 166, rating: 4.5, rc: 17 },
    { name: "Fabiana",   slug: "fabiana-floripa",   loc: 11, price: 460, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 27, hair: "Castanho", eyes: "Castanhos", h: 169, rating: 4.7, rc: 30 },
    // REC – Boa Viagem
    { name: "Giovana",   slug: "giovana-recife",    loc: 12, price: 340, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 24, hair: "Preto",    eyes: "Castanhos", h: 161, rating: 4.4, rc: 14 },
    { name: "Heloisa",   slug: "heloisa-recife",    loc: 12, price: 420, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 26, hair: "Castanho", eyes: "Castanhos", h: 164, rating: 4.6, rc: 22 },
    { name: "Ingrid",    slug: "ingrid-recife",     loc: 12, price: 300, tier: PlanTier.ESSENCIAL, verified: false, online: true,  age: 22, hair: "Loiro",    eyes: "Azuis",     h: 162, rating: 4.2, rc: 8  },
    // SSA – Barra
    { name: "Jessica",   slug: "jessica-salvador",  loc: 13, price: 360, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 25, hair: "Preto",    eyes: "Castanhos", h: 163, rating: 4.5, rc: 16 },
    { name: "Karen",     slug: "karen-salvador",    loc: 13, price: 450, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 28, hair: "Castanho", eyes: "Castanhos", h: 167, rating: 4.7, rc: 27 },
    { name: "Livia",     slug: "livia-salvador",    loc: 13, price: 520, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 26, hair: "Loiro",    eyes: "Verdes",    h: 170, rating: 4.8, rc: 34 },
    // GYN – Setor Sul
    { name: "Monica",    slug: "monica-goiania",    loc: 14, price: 330, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 23, hair: "Castanho", eyes: "Castanhos", h: 162, rating: 4.4, rc: 13 },
    { name: "Nathalia",  slug: "nathalia-goiania",  loc: 14, price: 400, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 27, hair: "Preto",    eyes: "Pretos",    h: 165, rating: 4.6, rc: 21 },
    // Extra SP
    { name: "Olivia",    slug: "olivia-sp",         loc: 0,  price: 600, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 26, hair: "Loiro",    eyes: "Azuis",     h: 172, rating: 4.9, rc: 51 },
    { name: "Paula",     slug: "paula-sp",          loc: 1,  price: 350, tier: PlanTier.ESSENCIAL, verified: false, online: false, age: 21, hair: "Castanho", eyes: "Castanhos", h: 160, rating: 4.1, rc: 6  },
    { name: "Quenia",    slug: "quenia-sp",         loc: 2,  price: 470, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 29, hair: "Ruivo",    eyes: "Verdes",    h: 167, rating: 4.7, rc: 32 },
    { name: "Roberta",   slug: "roberta-sp",        loc: 3,  price: 410, tier: PlanTier.ESSENCIAL, verified: true,  online: false, age: 24, hair: "Preto",    eyes: "Castanhos", h: 163, rating: 4.5, rc: 18 },
    // Extra RJ
    { name: "Sabrina",   slug: "sabrina-rj",        loc: 5,  price: 540, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 25, hair: "Castanho", eyes: "Castanhos", h: 168, rating: 4.7, rc: 29 },
    { name: "Tais",      slug: "tais-rj",           loc: 6,  price: 480, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 27, hair: "Loiro",    eyes: "Verdes",    h: 170, rating: 4.6, rc: 25 },
    // Extra BH
    { name: "Ursula",    slug: "ursula-bh",         loc: 7,  price: 370, tier: PlanTier.ESSENCIAL, verified: false, online: true,  age: 22, hair: "Preto",    eyes: "Pretos",    h: 161, rating: 4.2, rc: 9  },
    // Extra CWB
    { name: "Viviane",   slug: "viviane-cwb",       loc: 9,  price: 430, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 26, hair: "Castanho", eyes: "Castanhos", h: 165, rating: 4.6, rc: 23 },
    // Extra POA
    { name: "Wanessa",   slug: "wanessa-poa",       loc: 10, price: 390, tier: PlanTier.ESSENCIAL, verified: true,  online: false, age: 24, hair: "Loiro",    eyes: "Azuis",     h: 167, rating: 4.4, rc: 15 },
    // Extra FLN
    { name: "Ximena",    slug: "ximena-floripa",    loc: 11, price: 500, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 28, hair: "Castanho", eyes: "Verdes",    h: 169, rating: 4.8, rc: 37 },
  ];

  let code = 100;
  for (const g of garotasData) {
    code++;
    const loc = locations[g.loc];
    await createProfile({
      email: `${g.slug}@privello.local`,
      name: g.name,
      slug: g.slug,
      publicCode: `PRV-${code}`,
      displayName: g.name,
      age: g.age,
      tagline: pick([
        "Atendimento discreto e pontual.",
        "Perfil verificado, fotos reais.",
        "Encontros com leveza e presença.",
        "Local próprio, agenda sob consulta.",
        "Conversa boa e energia leve.",
        "Disponível com hora marcada.",
      ]),
      bio: "Perfil de demonstração Privello — conteúdo fictício para layout e testes.",
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
      mediaSeeds: [`${g.slug}-1`, `${g.slug}-2`, `${g.slug}-3`],
    });
  }

  // ── 4 Garotos (servesWomen: true) ────────────────────────────────────────
  const garotosData = [
    { name: "Rafael",   slug: "rafael-sp",      loc: 0,  price: 500, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 28, hair: "Castanho", eyes: "Castanhos", h: 182, rating: 4.8, rc: 24 },
    { name: "Bruno",    slug: "bruno-rj",       loc: 4,  price: 450, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 26, hair: "Preto",    eyes: "Castanhos", h: 178, rating: 4.6, rc: 17 },
    { name: "Thiago",   slug: "thiago-cwb",     loc: 9,  price: 380, tier: PlanTier.ESSENCIAL, verified: true,  online: true,  age: 25, hair: "Loiro",    eyes: "Azuis",     h: 180, rating: 4.5, rc: 12 },
    { name: "Leonardo", slug: "leonardo-bsb",   loc: 8,  price: 420, tier: PlanTier.DESTAQUE,  verified: false, online: false, age: 30, hair: "Castanho", eyes: "Verdes",    h: 176, rating: 4.4, rc: 9  },
  ];

  for (const g of garotosData) {
    code++;
    const loc = locations[g.loc];
    await createProfile({
      email: `${g.slug}@privello.local`,
      name: g.name,
      slug: g.slug,
      publicCode: `PRV-${code}`,
      displayName: g.name,
      age: g.age,
      tagline: pick([
        "Companhia discreta e agradável.",
        "Atendimento exclusivo para mulheres.",
        "Perfil verificado, agenda sob consulta.",
        "Presença, conversa e discrição.",
      ]),
      bio: "Perfil de demonstração Privello — conteúdo fictício para layout e testes.",
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
      mediaSeeds: [`${g.slug}-1`, `${g.slug}-2`],
    });
  }

  // ── 5 Casais (servesCouples: true) ───────────────────────────────────────
  const casaisData = [
    { name: "Casal SP Premium",   slug: "casal-sp-premium",   loc: 0,  price: 800, tier: PlanTier.PREMIUM,   verified: true,  online: true,  age: 27, hair: "Variado", eyes: "Castanhos", h: 170, rating: 4.9, rc: 31 },
    { name: "Casal RJ",           slug: "casal-rj",           loc: 4,  price: 700, tier: PlanTier.DESTAQUE,  verified: true,  online: false, age: 26, hair: "Variado", eyes: "Variados",  h: 168, rating: 4.7, rc: 22 },
    { name: "Casal BH",           slug: "casal-bh",           loc: 7,  price: 600, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 28, hair: "Variado", eyes: "Castanhos", h: 169, rating: 4.6, rc: 18 },
    { name: "Casal Curitiba",     slug: "casal-cwb",          loc: 9,  price: 550, tier: PlanTier.ESSENCIAL, verified: false, online: false, age: 25, hair: "Variado", eyes: "Variados",  h: 167, rating: 4.4, rc: 11 },
    { name: "Casal Porto Alegre", slug: "casal-poa",          loc: 10, price: 620, tier: PlanTier.DESTAQUE,  verified: true,  online: true,  age: 29, hair: "Variado", eyes: "Variados",  h: 171, rating: 4.7, rc: 19 },
  ];

  for (const g of casaisData) {
    code++;
    const loc = locations[g.loc];
    await createProfile({
      email: `${g.slug}@privello.local`,
      name: g.name,
      slug: g.slug,
      publicCode: `PRV-${code}`,
      displayName: g.name,
      age: g.age,
      tagline: pick([
        "Experiência a dois, com discrição total.",
        "Casal verificado, atendimento exclusivo.",
        "Encontros únicos para quem busca o diferente.",
        "Perfil verificado, agenda sob consulta.",
        "Companhia dupla, energia incrível.",
      ]),
      bio: "Perfil de demonstração Privello — conteúdo fictício para layout e testes.",
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
      homeVisit: Math.random() > 0.5,
      hair: g.hair,
      eyes: g.eyes,
      heightCm: g.h,
      ratingAvg: g.rating,
      ratingCount: g.rc,
      whatsappPhone: "+5511988880000",
      mediaSeeds: [`${g.slug}-1`, `${g.slug}-2`, `${g.slug}-3`],
    });
  }

  // ── Client + reviews para Helena ─────────────────────────────────────────
  const client = await prisma.user.create({
    data: { email: "rafael.cliente@privello.local", name: "Rafael M.", role: UserRole.CLIENT, verified: true },
  });

  const helenaProfile = await prisma.profile.findUnique({ where: { slug: "helena-jardins" } });
  const auroraProfile = await prisma.profile.findUnique({ where: { slug: "aurora-leblon" } });

  if (helenaProfile) {
    await prisma.review.createMany({
      data: [
        {
          profileId: helenaProfile.id,
          reviewerInitials: "R.M.",
          reviewerName: "Cliente R.M.",
          rating: 5,
          text: "Pontualíssima, exatamente como no perfil. Recomendo.",
          punctuality: 5,
          descriptionScore: 4.9,
          conversation: 5,
          experience: 4.8,
          createdAt: new Date(Date.now() - 4 * 86400000),
        },
        {
          profileId: helenaProfile.id,
          reviewerInitials: "A.P.",
          reviewerName: "Cliente A.P.",
          rating: 4.8,
          text: "Muito educada e ambiente impecável.",
          punctuality: 5,
          descriptionScore: 4.8,
          conversation: 4.9,
          experience: 4.7,
          createdAt: new Date(Date.now() - 20 * 86400000),
        },
      ],
    });

    await prisma.financialRecord.createMany({
      data: [
        {
          profileId: helenaProfile.id,
          occurredAt: new Date("2026-05-11T21:00:00"),
          clientLabel: "Felipe R.",
          durationLabel: "2h",
          locationLabel: "Local próprio",
          paymentLabel: "PIX",
          origin: FinancialOrigin.SITE,
          amountBrl: 1100,
          isNoShow: true,
          notes: "Não compareceu — cobrei 50% do agendamento",
        },
        {
          profileId: helenaProfile.id,
          occurredAt: new Date("2026-05-10T19:30:00"),
          clientLabel: "Cliente R.M.",
          durationLabel: "Pernoite",
          locationLabel: "Domicílio",
          paymentLabel: "Dinheiro",
          origin: FinancialOrigin.WHATSAPP,
          amountBrl: 2500,
        },
      ],
    });

    await prisma.whatsAppClick.createMany({
      data: [
        { profileId: helenaProfile.id, source: "Botão do perfil", visitor: "Anônimo", verified: false, clickedAt: new Date() },
        { profileId: helenaProfile.id, source: "Card na listagem", visitor: "Rafael M.", verified: true, clickedAt: new Date(Date.now() - 3600000) },
      ],
    });

    await prisma.verificationCase.create({
      data: {
        profileId: helenaProfile.id,
        status: ModerationStatus.APROVADO,
        documentType: "CNH — ok",
        selfieMatch: 99,
        waitingSince: new Date(Date.now() - 86400000),
      },
    });

    const farFuture = new Date("2030-12-31T23:59:59");
    await prisma.meetingRequest.createMany({
      data: [
        {
          profileId: helenaProfile.id,
          clientId: client.id,
          status: MeetingRequestStatus.CONFIRMED,
          date: new Date("2026-05-12T20:00:00"),
          startTime: "20:00",
          endTime: "22:00",
          duration: "2h",
          location: "Local próprio",
          notes: "",
          totalBrl: 900,
          expiresAt: farFuture,
        },
        {
          profileId: helenaProfile.id,
          clientId: client.id,
          status: MeetingRequestStatus.PENDING,
          date: new Date("2026-05-14T20:00:00"),
          startTime: "20:00",
          endTime: "22:00",
          duration: "2h",
          location: "Local próprio",
          notes: "Primeira vez no Jardins.",
          totalBrl: 900,
          expiresAt: new Date(Date.now() + 3 * 3600000),
        },
      ],
    });
  }

  if (auroraProfile) {
    await prisma.verificationCase.create({
      data: {
        profileId: auroraProfile.id,
        status: ModerationStatus.REVISAO,
        documentType: "CNH — ok",
        documentNote: "RG — ok",
        selfieMatch: 98,
        selfieNote: "match",
        waitingSince: new Date(Date.now() - 12 * 60000),
      },
    });

    if (client) {
      await prisma.meetingRequest.create({
        data: {
          profileId: auroraProfile.id,
          clientId: client.id,
          status: MeetingRequestStatus.PENDING,
          date: new Date("2026-05-14T20:00:00"),
          startTime: "20:00",
          endTime: "22:00",
          duration: "2h",
          location: "No local de Aurora",
          notes: "Primeira vez. Cheguei de fora do RJ.",
          totalBrl: 1100,
          expiresAt: new Date(Date.now() + 2 * 3600000),
        },
      });
    }
  }

  await prisma.user.create({
    data: { email: "moderador@privello.local", name: "Moderação", role: UserRole.MODERATOR },
  });

  console.log(`✓ Seed concluído: ${garotasData.length} garotas, ${garotosData.length} garotos, ${casaisData.length} casais`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
