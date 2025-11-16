import { z } from 'zod'

const userSchema = z.object({
    nom: z.string()
})

export default defineEventHandler(async (event) => {
    const data = await readValidatedBody(event, body => userSchema.parse(body))

    return prisma.vote.create({
        data: data
    })
})
