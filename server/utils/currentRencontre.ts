import type { Rencontre } from "@prisma/client";
import { StatusRencontre } from "@prisma/client";
import { prisma } from "./prisma";

export async function currentRencontre(): Promise<Rencontre | null> {
  return prisma.rencontre.findFirst({
    where: {
      status: StatusRencontre.DEMARE,
    },
    orderBy: {
      dateDebut: "desc",
    },
  });
}
