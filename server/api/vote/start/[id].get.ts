import {Statut} from "@prisma/client";

export default defineEventHandler(async (event) => {
    const id = Number.parseInt(<string>getRouterParam(event, 'id'))

    try {
        await enVote()
    } catch {
        return prisma.vote.update({
            where: {
                id: id,
            },
            data: {
                statut: Statut.EN_VOTE,
            }
        })
    }

    throw createError({
        statusCode: 400,
        statusMessage: 'A vote is already started',
    })
})