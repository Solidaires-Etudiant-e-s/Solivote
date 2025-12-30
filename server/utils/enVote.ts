import {StatusVote} from "@prisma/client";

export async function enVote() {
    return prisma.vote.findFirstOrThrow({
        where: {
            status: StatusVote.EN_VOTE,
        }
    });
}