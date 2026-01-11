import { z } from "zod";
import { TypeRencontre } from "@prisma/client";

const userSchema = z.object({
  nom: z.string().min(1).optional(),
  type: z.nativeEnum(TypeRencontre),
  dateDebut: z.string().datetime(),
  dateFin: z.string().datetime(),
});

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  return prisma.rencontre.create({
    data: {
      nom: data.nom,
      type: data.type,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
    },
  });
});
