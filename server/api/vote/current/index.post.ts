import { z } from 'zod'
import {Type} from "@prisma/client";

const userSchema = z.object({
    type: z.nativeEnum(Type)
})

export default defineEventHandler(async (event) => {
    const {type} = await readValidatedBody(event, body => userSchema.parse(body))

    const nom = <string>event.node.req.headers['ynh_user']

    const syndicat = await prisma.sydicat.upsert({
        where: {
            nom
        },
        create: {
            nom
        },
        update: {},
    });

    const vote = await enVote()

    return prisma.choix.upsert({
        where: {
            syndicatID_voteId: {
                syndicatID: syndicat.id,
                voteId: vote.id
            },
        },
        update: {
            type: type,
            date: new Date()
        },
        create: {
            type: type,
            syndicat: {
                connect: syndicat
            },
            vote: {
                connect: {id: vote?.id},
            },
        }
    })
})