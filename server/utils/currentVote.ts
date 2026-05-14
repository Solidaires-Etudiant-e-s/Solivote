import { StatusVote } from "@prisma/client";

export async function currentVote() {
  return prisma.vote.findFirst({
    where: {
      status: StatusVote.EN_VOTE,
    },
    include: {
      choix: {
        include: {
          syndicat: true,
        },
      },
      possibilites: true,
      texte: true,
    },
  });
}
