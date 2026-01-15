import { TypeVote } from "@prisma/client";
import { z } from "zod";

const userSchema = z
  .object({
    nom: z.string().min(1),
    description: z.string().nullable(),
    possibilites: z.array(z.string().min(1)),
    type: z.enum(TypeVote),
  })
  .refine((input) => {
    if (input.type != TypeVote.CONDORCET) return true;
    if (input.possibilites.length == 0) return false;
    return true;
  });

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const current = await currentRencontre();

  if (!current) {
    throw createError({
      statusCode: 400,
      statusMessage: "No rencontre is currently started",
    });
  }

  return prisma.vote.create({
    data: {
      nom: data.nom,
      description: data.description,
      type: data.type,
      possibilites: {
        createMany: {
          data: data.possibilites.map((x) => ({ nom: x })),
        },
      },
      rencontre: {
        connect: current,
      },
    },
  });
});
