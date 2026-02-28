import { StatusRencontre } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { getUser, Groupe } from "../../../utils/role";
import { broadcastRencontre } from "../../../utils/sse";
export default defineEventHandler(async (event) => {
  const user = await getUser(event);
  if (user.role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const result = await prisma.rencontre.updateMany({
    where: {
      status: StatusRencontre.DEMARE,
    },
    data: {
      status: StatusRencontre.CLOTURE,
    },
  });
  await broadcastRencontre("rencontre");
  return result;
});
