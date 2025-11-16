import { z } from 'zod'
import {Type} from "@prisma/client";

const userSchema = z.object({
    type: z.string()
})

export default defineEventHandler(async (event) => {
    const {type} = await readValidatedBody(event, body => userSchema.parse(body))

    if (!(Object.values(Type) as string[]).includes(type)){
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid vote type',
        })
    }

    const nom = <string>event.node.req.headers['ynh_user']

    const vote = await enVote()

    return prisma.choix.upsert({
        where: {
            syndicat_voteId: {
                syndicat: nom,
                voteId: vote.id
            },
        },
        update: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            type: type
        },
        create: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            type: type,
            syndicat: nom,
            vote: {
                connect: {id: vote?.id},
            },
        }
    })
})