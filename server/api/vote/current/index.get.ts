import {VoteStatus} from "@prisma/client";

export default defineEventHandler(async (event) => {
    return prisma.vote.findFirstOrThrow({
        where: {
            status: VoteStatus.EN_VOTE
        }
    })
})