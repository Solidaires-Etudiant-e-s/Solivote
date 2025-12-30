import { z } from 'zod'
import {TypeRencontre} from "@prisma/client";

const userSchema = z.object({
    nom: z.string(),
    type: z.nativeEnum(TypeRencontre)
})

export default defineEventHandler(async (event) => {
    const data = await readValidatedBody(event, body => userSchema.parse(body))

    return prisma.rencontre.create({
        data: {
            nom : data.nom,
            type: data.type,
        }
    })
})
