import { prisma } from "../utils/prisma";
import { sanitizeChoix } from "../utils/sanitizeChoix";

export default defineEventHandler(async (_event) => {
  const current = await currentRencontre();

  if (!current) {
    const votes = await prisma.vote.findMany({
      include: {
        choix: {
          include: {
            syndicat: true,
          },
        },
      },
    });

    return votes.map((vote) => ({
      ...vote,
      choix: vote.choix.map((choice) => ({
        ...choice,
        choix: sanitizeChoix(choice.choix),
      })),
    }));
  }

  const votes = await prisma.vote.findMany({
    where: {
      rencontre: {
        is: current,
      },
    },
    include: {
      choix: {
        include: {
          syndicat: true,
        },
      },
      possibilites: true,
    },
  });

  return votes.map((vote) => ({
    ...vote,
    choix: vote.choix.map((choice) => ({
      ...choice,
      choix: sanitizeChoix(choice.choix),
    })),
  }));
});
