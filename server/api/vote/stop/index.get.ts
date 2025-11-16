import {Statut} from "@prisma/client";

export default defineEventHandler(async (event) => {
    return prisma.vote.updateMany({
        where: {
            statut: Statut.EN_VOTE,
        },
        data: {
            statut: Statut.CLOTURE,
        }
    })
})