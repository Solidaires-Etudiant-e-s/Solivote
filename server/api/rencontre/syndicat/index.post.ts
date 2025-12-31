import { z } from 'zod'
import rencontre from '../../ws/rencontre'

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

    return await Promise.all(
        data.syndicats.map(async (nom) => {
            const syndicat = await prisma.syndicat.findUnique({ where: nom });
            if (!syndicat) {
                throw new Error(`Syndicat ${nom} not found`);
            }
            return prisma.mandat.create({
                data: {
                    syndicatId: syndicat.id,
                    rencontreId: data.id,
                },
            });
        })
    )
})
