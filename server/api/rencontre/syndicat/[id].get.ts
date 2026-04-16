import { prisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(<string>getRouterParam(event, "id"));
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "invalid id" });
  }

  const mandats = await prisma.mandat.findMany({
    where: {
      rencontreId: id,
    },
    select: {
      syndicatId: true,
    },
  });

  const presentIds = mandats.map((mandat) => mandat.syndicatId);

  const syndicats = await prisma.syndicat.findMany({
    where: {
      id: {
        notIn: presentIds.length ? presentIds : undefined,
      },
      actif: true
    },
    select: {
      nom: true,
    },
    orderBy: {
      nom: "asc",
    },
  });

  return syndicats.map((syndicat) => syndicat.nom);
});
