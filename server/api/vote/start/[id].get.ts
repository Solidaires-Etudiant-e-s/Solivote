import {StatusVote} from "@prisma/client";

export default defineEventHandler(async (event) => {
    const {role} = await getUser(event)
    if (role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'forbidden' })

    const id = Number.parseInt(<string>getRouterParam(event, 'id'))

    try {
        await enVote()
    } catch {
        return prisma.vote.update({
            where: {
                id: id,
            },
            data: {
                status: StatusVote.EN_VOTE,
            }
        })
    }

    throw createError({
        statusCode: 400,
        statusMessage: 'A vote is already started',
    })
})