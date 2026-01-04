import {StatusRencontre} from "@prisma/client";

export default defineEventHandler(async (event) => {
    const user = await getUser(event)
    if (user.role !== Groupe.ADMIN) throw createError({ statusCode: 403, statusMessage: 'forbidden' })

    return prisma.rencontre.updateMany({
        where: {
            status: StatusRencontre.DEMARE,
        },
        data: {
            status: StatusRencontre.CLOTURE,
        }
    })
})