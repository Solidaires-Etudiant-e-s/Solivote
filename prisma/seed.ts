import {
  PrismaClient,
  StatusRencontre,
  StatusVote,
  TypeChoix,
  TypeRencontre,
  TypeVote,
} from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run prisma seed.");
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long" });

  await prisma.choix.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.mandat.deleteMany();
  await prisma.texte.deleteMany();
  await prisma.rencontre.deleteMany();
  await prisma.syndicat.deleteMany();

  const syndicats = await prisma.syndicat.createMany({
    data: [
      { nom: "Bordeaux", defaultMandats: 5 },
      { nom: "Rennes" },
      { nom: "Nantes", defaultMandats: 3 },
      { nom: "Lyon" },
      { nom: "Paris" },
      { nom: "Grenoble" },
      { nom: "Marseille", actif: false },
    ],
  });

  const allSyndicats = await prisma.syndicat.findMany({
    orderBy: { nom: "asc" },
  });

  const typeCycle = [
    TypeRencontre.CF,
    TypeRencontre.BF,
    TypeRencontre.CONGRES,
    TypeRencontre.PU,
  ];

  const rencontres = [];
  for (let monthOffset = 11; monthOffset >= 0; monthOffset -= 1) {
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth() - monthOffset,
      1,
    );
    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      3,
    );
    const status =
      monthEnd.getTime() < now.getTime()
        ? StatusRencontre.CLOTURE
        : monthStart.getTime() > now.getTime()
          ? StatusRencontre.INITIAL
          : StatusRencontre.DEMARE;

    const rencontre = await prisma.rencontre.create({
      data: {
        nom: `${typeCycle[monthOffset % typeCycle.length]} de ${monthFormatter.format(monthStart)} ${monthStart.getFullYear()}`,
        dateDebut: monthStart,
        dateFin: monthEnd,
        type: typeCycle[monthOffset % typeCycle.length],
        status,
      },
    });
    rencontres.push(rencontre);
  }

  const rencontreRunning = await prisma.rencontre.create({
    data: {
      nom: `${TypeRencontre.CF} de ${monthFormatter.format(
        new Date(now.getTime() - 3 * oneDayMs),
      )} ${new Date(now.getTime() - 3 * oneDayMs).getFullYear()}`,
      dateDebut: new Date(now.getTime() - 3 * oneDayMs),
      dateFin: new Date(now.getTime() + 3 * oneDayMs),
      type: TypeRencontre.CF,
      status: StatusRencontre.DEMARE,
    },
  });
  rencontres.push(rencontreRunning);

  const mandatsData = rencontres.flatMap((rencontre, rIndex) =>
    allSyndicats.map((syndicat, sIndex) => ({
      syndicatId: syndicat.id,
      rencontreId: rencontre.id,
      mandat: ((rIndex + sIndex) % 3) + 1,
    })),
  );
  await prisma.mandat.createMany({ data: mandatsData });

  const texteTitle = [
    "Budget",
    "Fédéralisation",
    "SF",
    "Mandatement",
  ];

  let textes = []
  rencontres.forEach(async (rencontre, rindex) => {
    for (let tindex = 0; tindex < 3; tindex++) {
      const texte = {
        titre: texteTitle[(tindex + rindex) % texteTitle.length],
        rencontreId: rencontre.id
      }
      textes.push(texte)
    }
  })

  await prisma.texte.createMany({
    data: textes
  })

  textes = await prisma.texte.findMany({
    include: {
      rencontre: true
    }
  })

  const voteTopics = [
    "Adoption du budget",
    "Evolution des primes",
    "Plan de formation",
    "Organisation des services",
    "Télétravail",
    "Revalorisation des grilles",
    "Calendrier social",
    "Recrutements",
    "Conditions de travail",
    "Dialogue social",
  ];
  const voteDescriptions = [
    "Vote de principe sur la proposition présentée.",
    "Décision sur l'adoption d'une mesure structurante.",
    "Arbitrage sur la proposition soumise au vote.",
    "Validation du cadre proposé pour la mise en œuvre.",
    "Accord sur les modalités opérationnelles.",
  ];

  const votes = [];
  for (let tIndex = 0; tIndex < textes.length; tIndex += 1) {
    const texte = textes[tIndex];
    const isClosed = texte.rencontre.status === StatusRencontre.CLOTURE;
    const isCurrent = texte.rencontre.status === StatusRencontre.DEMARE;
    const votesPerRencontre = isCurrent ? 5 : 3;

    for (let vIndex = 0; vIndex < votesPerRencontre; vIndex += 1) {
      const topic = voteTopics[(tIndex + vIndex) % voteTopics.length];
      const status = isClosed
        ? StatusVote.CLOTURE
        : isCurrent
          ? vIndex === 0
            ? StatusVote.EN_VOTE
            : vIndex <= 2
              ? StatusVote.INITIAL
              : StatusVote.CLOTURE
          : StatusVote.INITIAL;

      const vote = await prisma.vote.create({
        data: {
          nom: `${topic} ${texte.rencontre.dateDebut.getFullYear()}`,
          type: TypeVote.STANDARD,
          description:
            voteDescriptions[(tIndex + vIndex) % voteDescriptions.length],
          status,
          texteId: texte.id
        },
        include: {
          texte: true
        }
      });
      votes.push(vote);
    }
  }

  const choixData = [];
  const votesWithChoices = votes.filter(
    (vote) => vote.status !== StatusVote.INITIAL,
  );
  const tieVoteIndex = Math.floor(votesWithChoices.length / 2);
  for (let vIndex = 0; vIndex < votesWithChoices.length; vIndex += 1) {
    const vote = votesWithChoices[vIndex];
    const isInProgress = vote.status === StatusVote.EN_VOTE;
    const maxChoices = isInProgress
      ? Math.max(1, Math.floor(allSyndicats.length / 2))
      : allSyndicats.length;

    for (let sIndex = 0; sIndex < maxChoices; sIndex += 1) {
      const syndicat = allSyndicats[sIndex];
      let type;

      const mandat = await prisma.mandat.findUniqueOrThrow({
        where: {
          syndicatId_rencontreId: {
            syndicatId: syndicat.id,
            rencontreId: vote.texte.rencontreId,
          }
        }
      })

      if (vIndex === tieVoteIndex) {
        // Force a single tie between POUR and CONTRE.
        type = sIndex % 2 === 0 ? TypeChoix.POUR : TypeChoix.CONTRE;
      } else {
        // Ensure a clear winner (POUR) by biasing the distribution.
        type = sIndex < 4 ? TypeChoix.POUR : TypeChoix.CONTRE;
      }

      choixData.push({
        syndicatId: syndicat.id,
        voteId: vote.id,
        choix: [{type, mandat: mandat.mandat}],
      });
    }
  }

  await prisma.choix.createMany({ data: choixData });

  console.log(
    `Seeded ${syndicats.count} syndicats, ${rencontres.length} rencontres, ${textes.length} textes, ${votes.length} votes, and ${choixData.length} choix.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
