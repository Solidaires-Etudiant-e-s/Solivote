import { StatusRencontre } from "@prisma/client";

export default defineEventHandler((_event) => {
  return prisma.rencontre.findMany({
    where: {
      status: {
        not: StatusRencontre.DEMARE,
      },
    },
    orderBy: [{ status: "asc" }, { dateDebut: "desc" }],
    take: 5,
  });
});
