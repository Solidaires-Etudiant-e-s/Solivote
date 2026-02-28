import { StatusVote } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { sanitizeChoix } from "../../../utils/sanitizeChoix";

export default defineEventHandler(async () => {
    const vote = await prisma.vote.findFirst({
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

    if (!vote) return null;

    return {
        ...vote,
        choix: vote.choix.map((choice) => ({
            ...choice,
            choix: sanitizeChoix(choice.choix),
        })),
    };
});
