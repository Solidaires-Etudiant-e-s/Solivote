import { z } from 'zod'

const syndicatsSchema = z.object({
    id: z.number(),
    syndicats: z.array(z.object({
        nom: z.string()
    }))
})

export default defineEventHandler(async (event) => {
    const {role} = await getUser(event)
    if (role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'forbidden' })

    const data = await readValidatedBody(event, body => syndicatsSchema.parse(body))

    return prisma.rencontre.update({
        where: {
            id: data.id
        },
        data: {
            participants: {
                connect: data.syndicats
            }
        }
    })
})
