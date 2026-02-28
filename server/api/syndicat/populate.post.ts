import { getSyndicats } from "~~/server/utils/syndicats";
import { prisma } from "../../utils/prisma";
import { getUser, Groupe } from "../../utils/role";

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const syndicats = await getSyndicats(event);

  for (const syndicat of syndicats) {
    await prisma.syndicat.upsert({
      where: {
        nom: syndicat,
      },
      create: {
        nom: syndicat,
      },
      update: {},
    });
  }

  return prisma.syndicat.findMany();
});
