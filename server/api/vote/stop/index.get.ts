import {VoteStatus} from "@prisma/client";
import {Groupe} from "~~/server/utils/role";

export default defineEventHandler(async (event) => {
    //todo verify is admin
    const user = await getUser(event)
    if (user.role !== Groupe.ADMIN) throw createError({ statusCode: 403, statusMessage: 'forbidden' })

    return prisma.vote.updateMany({
        where: {
            status: VoteStatus.EN_VOTE,
        },
        data: {
            status: VoteStatus.CLOTURE,
        }
    })
})