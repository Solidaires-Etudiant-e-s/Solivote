import {Statut} from "@prisma/client";
import {Groupe} from "~~/server/utils/role";

export default defineEventHandler(async (event) => {
    //todo very is admin
    const role = await getRole(event)
    if (role !== Groupe.ADMIN) throw createError({ statusCode: 403, statusMessage: 'forbidden' })

    return prisma.vote.updateMany({
        where: {
            statut: Statut.EN_VOTE,
        },
        data: {
            statut: Statut.CLOTURE,
        }
    })
})