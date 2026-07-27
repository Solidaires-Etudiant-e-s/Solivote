import { StatusVote } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { getUser, Groupe } from "../../../utils/role";
import { broadcastVote } from "../../../utils/sse";
export default defineEventHandler(async (event) => {
  const user = await getUser(event);
  if (user.role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const result = await prisma.vote.updateMany({
    where: {
      status: StatusVote.EN_VOTE,
    },
    data: {
      status: StatusVote.CLOTURE,
      hideResults: false,
    },
  });
  await broadcastVote("vote");
  await broadcastVote("current");
  return result;
});
