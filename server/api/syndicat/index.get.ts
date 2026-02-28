import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (_event) => {
  return (
    await prisma.syndicat.findMany({
      select: {
        nom: true,
      },
    })
  ).map((a) => a.nom);
});
