import { z } from 'zod'

const userSchema = z.object({
    id: z.number()
})

export default defineEventHandler(async (event) => {
    const data = await readValidatedBody(event, body => userSchema.parse(body))

    return prisma.vote.delete({
        where: {
            id: data.id
        },
    })
})
