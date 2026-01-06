import type { Rencontre } from "@prisma/client";
import { StatusRencontre } from "@prisma/client";

export async function currentRencontre(): Promise<Rencontre | null> {
  return prisma.rencontre.findFirst({
    where: {
      status: StatusRencontre.DEMARE,
    },
  });
}
