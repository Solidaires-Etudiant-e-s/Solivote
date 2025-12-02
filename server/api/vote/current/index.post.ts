import { z } from 'zod'
import {Type} from "@prisma/client";

const userSchema = z.object({
    type: z.nativeEnum(Type)
})

export default defineEventHandler(async (event) => {
    const {type} = await readValidatedBody(event, body => userSchema.parse(body))

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
            type: type,
            date: new Date()
        },
        create: {
            type: type,
            syndicat: nom,
            vote: {
                connect: {id: vote?.id},
            },
        }
    })
})