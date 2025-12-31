import { z } from 'zod'

const syndicatsSchema = z.object({
    rencontreId: z.number(),
    syndicatId: z.number(),
    mandat: z.number().min(0),
})

export default defineEventHandler(async (event) => {
    const {role} = await getUser(event)
    if (role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'forbidden' })

    const data = await readValidatedBody(event, body => syndicatsSchema.parse(body))

    return prisma.mandat.update({
        where: {
            syndicatId_rencontreId: {
                rencontreId: data.rencontreId,
                syndicatId: data.syndicatId
            }
        },
        data: {
            mandat: data.mandat
        }
    })
})
