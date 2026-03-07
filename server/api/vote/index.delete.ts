import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { getUser, Groupe } from "../../utils/role";
import { broadcastVote } from "../../utils/sse";

const userSchema = z.object({
  id: z.number().int(),
});

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const vote = await prisma.vote.findUnique({
    where: {
      id: data.id,
    },
    select: {
      status: true,
    },
  });

  if (!vote) {
    throw createError({ statusCode: 404, statusMessage: "Vote not found" });
  }

  const result = await prisma.vote.delete({
    where: {
      id: data.id,
    },
  });
  await broadcastVote("vote");
  return result;
});
