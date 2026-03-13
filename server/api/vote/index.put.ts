import { StatusVote, TypeVote } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { getUser, Groupe } from "../../utils/role";
import { sanitizeChoix } from "../../utils/sanitizeChoix";
import { broadcastVote } from "../../utils/sse";

const userSchema = z
  .object({
    id: z.number().int(),
    nom: z.string().trim().min(1),
    description: z.string().nullable(),
    possibilites: z.array(z.string().trim().min(1)),
    type: z.nativeEnum(TypeVote),
  })
  .superRefine((input, ctx) => {
    if (input.type === TypeVote.STANDARD) {
      return;
    }

    if (input.possibilites.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one possibility is required",
        path: ["possibilites"],
      });
    }

    if (input.type === TypeVote.EN_CONTRE && input.possibilites.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EN_CONTRE votes require exactly two possibilities",
        path: ["possibilites"],
      });
    }
  });

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const existingVote = await prisma.vote.findUnique({
    where: {
      id: data.id,
    },
    select: {
      status: true,
      _count: {
        select: {
          choix: true,
        },
      },
    },
  });

  if (!existingVote) {
    throw createError({ statusCode: 404, statusMessage: "Vote not found" });
  }

  if (
    existingVote.status !== StatusVote.INITIAL ||
    existingVote._count.choix > 0
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "Vote can no longer be edited",
    });
  }

  const result = await prisma.vote.update({
    where: {
      id: data.id,
    },
    data: {
      nom: data.nom.trim(),
      description: data.description?.trim() || null,
      type: data.type,
      possibilites: {
        deleteMany: {},
        ...(data.type !== TypeVote.STANDARD && data.possibilites.length > 0
          ? {
              createMany: {
                data: data.possibilites.map((nom) => ({ nom })),
              },
            }
          : {}),
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
