import { z } from "zod";
import { StatusVote } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { enVote } from "../../../utils/enVote";
import { currentSyndicat } from "../../../utils/currentSyndicat";
import { broadcastVote } from "../../../utils/sse";
import { sanitizeChoix } from "../../../utils/sanitizeChoix";

const userSchema = z.object({
  choix: z.array(
    z.object({
      type: z.union([z.string().min(1), z.number().int().min(0)]),
      mandat: z.number().int().min(0),
    }),
  ),
  syndicat: z
    .object({
      id: z.number().int(),
      nom: z.string(),
      mandats: z.array(
        z.object({
          mandat: z.number().int().min(1),
          syndicatId: z.number().int().optional(),
          rencontreId: z.number().int().optional(),
        }),
      ),
    })
    .optional(),
});

export default defineEventHandler(async (event) => {
  let { choix, syndicat } = await readValidatedBody(event, (body) =>
    userSchema.parse(body),
  );
  choix = sanitizeChoix(choix);

  if (!syndicat) {
    syndicat = (await currentSyndicat(event)) ?? undefined;
  }

  if (!syndicat) {
    throw createError({
      statusCode: 404,
      statusMessage: "Current syndicat not found",
    });
  }

  const en_vote = await enVote();
  const possibilites = en_vote.possibilites ?? [];
  const standardChoices = new Set(["POUR", "CONTRE", "ABSTENTION", "NPPV"]);
  const enContreChoices = new Set(["ABSTENTION", "NPPV"]);

  const possibiliteIds = new Set(
    possibilites.map((possibilite) => possibilite.id),
  );
  let total_mandats = 0;
  for (const i of choix) {
    total_mandats += i.mandat;

    if (typeof i.type === "number") {
      if (!possibiliteIds.has(i.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: "choix invalid",
        });
      }
    } else {
      if (en_vote.type === "CONDORCET") {
        throw createError({
          statusCode: 400,
          statusMessage: "choix invalid",
        });
      }
      const allowed =
        en_vote.type === "EN_CONTRE" ? enContreChoices : standardChoices;
      if (!allowed.has(i.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: "choix invalid",
        });
      }
    }
  }

  const mandatRecord = await prisma.mandat.findUnique({
    where: {
      syndicatId_rencontreId: {
        syndicatId: syndicat.id,
        rencontreId: en_vote.texte.rencontreId,
      },
    },
  });

  if (!mandatRecord) {
    throw createError({
      statusCode: 400,
      statusMessage: "Syndicat has no mandats for current rencontre",
    });
  }

  const expectedMandats = mandatRecord.mandat;
  if (total_mandats !== expectedMandats) {
    throw createError({
      statusCode: 400,
      statusMessage: "mandats suplied is not the totality of mandats",
    });
  }

  // const vote = await prisma.vote.findFirstOrThrow({
  //   where: {
  //     status: StatusVote.EN_VOTE,
  //     texte: {
  //       rencontre: {
  //         mandats: {
  //           some: {
  //             syndicatId: syndicat.id,
  //           },
  //         },
  //       },
  //     },
  //   },
  // });

  const result = await prisma.choix.upsert({
    where: {
      syndicatId_voteId: {
        syndicatId: syndicat.id,
        voteId: en_vote.id,
      },
    },
    update: {
      choix,
      date: new Date(),
    },
    create: {
      choix,
      syndicatId: syndicat.id,
      voteId: en_vote.id,
    },
  });

  await broadcastVote("current");

  return result;
});
