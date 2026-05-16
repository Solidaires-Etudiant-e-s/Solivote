import { StatusVote } from "@prisma/client";
import { prisma } from "./prisma";

export async function enVote() {
  return prisma.vote.findFirstOrThrow({
    where: {
      status: StatusVote.EN_VOTE,
    },
    include: {
      possibilites: true,
      texte: true,
    },
    orderBy: {
      date: "desc",
    },
  });
}
