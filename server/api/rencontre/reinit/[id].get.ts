import {StatusRencontre} from "@prisma/client";

export default defineEventHandler(async (event) => {
    const {role} = await getUser(event)
    if (role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'forbidden' })

    const id = Number.parseInt(<string>getRouterParam(event, 'id'))

    if (!await currentRencontre()) {
        return prisma.rencontre.update({
            where: {
                id: id,
                status: StatusRencontre.CLOTURE,
            },
            data: {
                status: StatusRencontre.INITIAL,
            }
        })
    }

    throw createError({
        statusCode: 400,
        statusMessage: 'A Rencontre is already started',
    })
})