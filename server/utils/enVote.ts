import {Statut} from "@prisma/client";

export async function enVote() {
    return prisma.vote.findFirstOrThrow({
        where: {
            statut: Statut.EN_VOTE,
        }
    });
}