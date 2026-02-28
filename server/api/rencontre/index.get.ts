import { prisma } from "../../utils/prisma";

export default defineEventHandler((_event) => {
  return prisma.rencontre.findMany({
    include: {
      mandats: {
        include: {
          syndicat: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { dateDebut: "desc" }],
  });
});
