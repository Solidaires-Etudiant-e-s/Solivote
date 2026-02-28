import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const nom = getRouterParam(event, "nom");
  return await prisma.syndicat.findUnique({
    where: {
      nom: nom,
    },
    include: {
      mandats: true,
    },
  });
});
