import { z } from "zod";
import { TypeRencontre } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { getUser, Groupe } from "../../utils/role";
import { broadcastRencontre } from "../../utils/sse";

const userSchema = z.object({
  nom: z.string().min(1).optional(),
  type: z.nativeEnum(TypeRencontre),
  dateDebut: z.string().datetime(),
  dateFin: z.string().datetime(),
});

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const result = await prisma.rencontre.create({
    data: {
      nom: data.nom,
      type: data.type,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
    },
  });
  await broadcastRencontre("rencontre");
  return result;
});
