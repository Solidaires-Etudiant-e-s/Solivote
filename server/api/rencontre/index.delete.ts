import { z } from 'zod'
import {StatusRencontre} from "@prisma/client";

const userSchema = z.object({
    id: z.number()
})

export default defineEventHandler(async (event) => {
    const data = await readValidatedBody(event, body => userSchema.parse(body))

    return prisma.rencontre.delete({
        where: {
            id: data.id,
            status: {
                notIn: [StatusRencontre.CLOTURE, StatusRencontre.DEMARE]
            }
        },
    })
})
