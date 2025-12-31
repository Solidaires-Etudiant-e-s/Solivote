import { z } from 'zod'

const userSchema = z.object({
    id: z.number(),
    syndicatID: z.number(),
})

export default defineEventHandler(async (event) => {
    const data = await readValidatedBody(event, body => userSchema.parse(body))

    return prisma.mandat.delete({
        where:{
            syndicatId_rencontreId: {
                syndicatId: data.syndicatID,
                rencontreId: data.id
            }
        }
    })
})
