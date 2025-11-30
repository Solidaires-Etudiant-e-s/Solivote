import {VoteStatus} from "@prisma/client";

export default defineEventHandler(async (event) => {
    return prisma.vote.findFirst({
        where: {
            status: VoteStatus.EN_VOTE
        }
    })
})