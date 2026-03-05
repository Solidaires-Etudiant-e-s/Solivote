import { StatusVote, type Vote } from "@prisma/client";

export async function currentVote(): Promise<Vote | null> {
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
    },
  });
}
