import { z } from "zod";
import { StatusRencontre } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { getUser, Groupe } from "../../utils/role";
import { broadcastRencontre } from "../../utils/sse";

const userSchema = z.object({
  id: z.number().int(),
});

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const result = await prisma.rencontre.delete({
    where: {
      id: data.id,
      status: {
        notIn: [StatusRencontre.CLOTURE, StatusRencontre.DEMARE],
      },
    },
  });
  await broadcastRencontre("rencontre");
  return result;
});
