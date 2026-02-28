import { z } from "zod";
import { prisma } from "../../../utils/prisma";
import { getUser, Groupe } from "../../../utils/role";
import { broadcastRencontre } from "../../../utils/sse";

const userSchema = z.object({
  id: z.number().int(),
  syndicatID: z.number().int(),
});

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const result = await prisma.mandat.delete({
    where: {
      syndicatId_rencontreId: {
        syndicatId: data.syndicatID,
        rencontreId: data.id,
      },
    },
  });
  await broadcastRencontre("rencontre");
  return result;
});
