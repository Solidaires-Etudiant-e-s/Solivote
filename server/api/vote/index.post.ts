import { TypeVote } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { getUser, Groupe } from "../../utils/role";
import { broadcastVote } from "../../utils/sse";
import { sanitizeChoix } from "../../utils/sanitizeChoix";

const userSchema = z
  .object({
    nom: z.string().min(1),
    description: z.string().nullable(),
    possibilites: z.array(z.string().min(1)),
    type: z.nativeEnum(TypeVote),
  })
  .refine((input) => {
    if (input.type != TypeVote.CONDORCET) return true;
    if (input.possibilites.length == 0) return false;
    return true;
  });

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const current = await currentRencontre();

  if (!current) {
    throw createError({
      statusCode: 400,
      statusMessage: "No rencontre is currently started",
    });
  }

  const result = await prisma.vote.create({
    data: {
      nom: data.nom,
      description: data.description ?? undefined,
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
    include: {
      choix: {
        include: {
          syndicat: true,
        },
      },
      possibilites: true,
      rencontre: true,
    },
  });

  await broadcastVote("vote");

  return {
    ...result,
    choix: result.choix.map((choice) => ({
      ...choice,
      choix: sanitizeChoix(choice.choix),
    })),
  };
});
