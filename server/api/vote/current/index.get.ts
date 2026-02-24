import { StatusVote } from "@prisma/client";

export default defineEventHandler(async () => {
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
});
