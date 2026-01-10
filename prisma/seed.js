import {
  PrismaClient,
  StatusRencontre,
  StatusVote,
  TypeChoix,
  TypeRencontre,
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

  await prisma.choix.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.mandat.deleteMany();
  await prisma.rencontre.deleteMany();
  await prisma.syndicat.deleteMany();

  const syndicats = await prisma.syndicat.createMany({
    data: [
      { nom: "Bordeaux" },
      { nom: "Rennes" },
      { nom: "Nantes" },
      { nom: "Lyon" },
      { nom: "Paris" },
      { nom: "Grenoble" },
      { nom: "Marseille" },
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

  const votes = [];
  for (let rIndex = 0; rIndex < rencontres.length; rIndex += 1) {
    const rencontre = rencontres[rIndex];
    const isClosed = rencontre.status === StatusRencontre.CLOTURE;
    const isCurrent = rencontre.status === StatusRencontre.DEMARE;
    const votesPerRencontre = isCurrent ? 4 : 3;

    for (let vIndex = 0; vIndex < votesPerRencontre; vIndex += 1) {
      const topic = voteTopics[(rIndex + vIndex) % voteTopics.length];
      const status = isClosed
        ? StatusVote.CLOTURE
        : isCurrent && vIndex === 0
          ? StatusVote.EN_VOTE
          : StatusVote.INITAL;

      const vote = await prisma.vote.create({
        data: {
          nom: `${topic} ${rencontre.dateDebut.getFullYear()}`,
          rencontreId: rencontre.id,
          status,
        },
      });
      votes.push(vote);
    }
  }

  const choixData = [];
  for (let vIndex = 0; vIndex < votes.length; vIndex += 1) {
    const vote = votes[vIndex];
    for (let sIndex = 0; sIndex < allSyndicats.length; sIndex += 1) {
      const syndicat = allSyndicats[sIndex];
      const choiceIndex = (vIndex + sIndex) % 4;
      const type =
        choiceIndex === 0
          ? TypeChoix.POUR
          : choiceIndex === 1
            ? TypeChoix.CONTRE
            : choiceIndex === 2
              ? TypeChoix.ABSTENTION
              : TypeChoix.NPPV;

      choixData.push({
        syndicatId: syndicat.id,
        voteId: vote.id,
        type,
      });
    }
  }

  await prisma.choix.createMany({ data: choixData });

  console.log(
    `Seeded ${syndicats.count} syndicats, ${rencontres.length} rencontres, ${votes.length} votes, and ${choixData.length} choix.`,
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
