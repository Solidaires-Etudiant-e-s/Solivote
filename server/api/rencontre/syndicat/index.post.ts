import { z } from "zod";

const syndicatsSchema = z.object({
  id: z.number(),
  syndicats: z.array(
    z.object({
      nom: z.string(),
    }),
  ),
});

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) =>
    syndicatsSchema.parse(body),
  );

  const syndicats = await prisma.syndicat.findMany({
    where: {
      nom: {
        in: data.syndicats.map((syndicat) => syndicat.nom),
      },
    },
    select: {
      id: true,
      nom: true,
      defaultMandats: true,
    },
  });

  const byName = new Map(syndicats.map((syndicat) => [syndicat.nom, syndicat]));
  const missing = data.syndicats.filter(
    (syndicat) => !byName.has(syndicat.nom),
  );
  if (missing.length) {
    throw createError({
      statusCode: 404,
      statusMessage: `Syndicat ${missing[0]?.nom ?? "unknown"} not found`,
    });
  }

  const result = await Promise.all(
    data.syndicats.map((syndicat) =>
      prisma.mandat.create({
        data: {
          syndicatId: byName.get(syndicat.nom)!.id,
          rencontreId: data.id,
          mandat: byName.get(syndicat.nom)!.defaultMandats
        },
      }),
    ),
  );
  await broadcastRencontre("rencontre");
  return result;
});
