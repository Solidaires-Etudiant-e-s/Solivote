import type { Rencontre } from "@prisma/client";
import { StatusRencontre } from "@prisma/client";

export async function currentRencontre(id: number | undefined = undefined): Promise<Rencontre | null> {

  if (id === undefined) {
    return prisma.rencontre.findFirst({
      where: {
        status: StatusRencontre.DEMARE
      },
      orderBy: {
        dateDebut: "desc",
      },
    });
  }

  return prisma.rencontre.findFirst({
    where: {
      id: id,
    },
    orderBy: {
      dateDebut: "desc",
    },
  });
}
