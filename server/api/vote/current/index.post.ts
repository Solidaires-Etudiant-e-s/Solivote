import { z } from "zod";

const userSchema = z.object({
  choix: z.array(
    z.object({
      type: z.union([z.string().min(1), z.number().int().min(0)]),
      mandat: z.number().int().min(0),
    }).or(z.object({
      vote: z.array(z.number().int().min(0)),
      mandat: z.number().int().min(0),
    })),
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
  const { choix, syndicat: syndicat_selected } = await readValidatedBody(event, (body) =>
    userSchema.parse(body),
  );

  const { name, role } = await getUser(event);
  if (syndicat_selected?.nom.toLowerCase() !== name && role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const syndicat = syndicat_selected ?? await currentSyndicat(event)
  if (!syndicat) {
    throw createError({
      statusCode: 404,
      statusMessage: "Current syndicat not found",
    });
  }

  const en_vote = await enVote();

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

  const possibilites = en_vote.possibilites ?? [];
  const possibiliteIds = new Set(
    possibilites.map((possibilite) => String(possibilite.id)),
  );
  const standardChoices = new Set(["POUR", "CONTRE", "ABSTENTION", "NPPV"]);
  const enContreChoicesRaw = new Set(["ABSTENTION", "NPPV"]);
  const enContreChoices = enContreChoicesRaw.union(possibiliteIds)


  let total_mandats = 0;

  if (en_vote.type != "CONDORCET") {
    for (const choi of choix) {
      total_mandats += choi.mandat;

      const allowed = en_vote.type === "EN_CONTRE" ? enContreChoices : standardChoices;
      console.log(allowed)
      if (!allowed.has(choi.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: "choix invalid",
        });
      }
    }
  } else {
    for (const choi of choix) {
      total_mandats += choi.mandat;
    }
  }

  const expectedMandats = mandatRecord.mandat;
  if (total_mandats !== expectedMandats) {
    throw createError({
      statusCode: 400,
      statusMessage: "mandats suplied is not the totality of mandats",
    });
  }

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
