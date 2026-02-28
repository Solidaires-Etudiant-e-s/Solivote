import { z } from "zod";
import { prisma } from "../../../utils/prisma";
import { getUser, Groupe } from "../../../utils/role";
import { broadcastRencontre } from "../../../utils/sse";

const syndicatsSchema = z.object({
  rencontreId: z.number(),
  syndicatId: z.number(),
  mandat: z.number().min(0),
});

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) =>
    syndicatsSchema.parse(body),
  );

  const result = await prisma.mandat.update({
    where: {
      syndicatId_rencontreId: {
        rencontreId: data.rencontreId,
        syndicatId: data.syndicatId,
      },
    },
    data: {
      mandat: data.mandat,
    },
  });
  await broadcastRencontre("rencontre");
  return result;
});
