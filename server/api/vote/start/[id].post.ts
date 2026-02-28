import { StatusVote } from "@prisma/client";
import { prisma } from "../../../utils/prisma";
import { getUser, Groupe } from "../../../utils/role";
import { enVote } from "../../../utils/enVote";
import { broadcastVote } from "../../../utils/sse";
export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const id = Number.parseInt(<string>getRouterParam(event, "id"));
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "invalid id" });
  }

  try {
    await enVote();
  } catch {
    const result = await prisma.vote.update({
      where: {
        id: id,
      },
      data: {
        status: StatusVote.EN_VOTE,
      },
    });
    await broadcastVote("vote");
    await broadcastVote("current");
    return result;
  }

  throw createError({
    statusCode: 400,
    statusMessage: "A vote is already started",
  });
});
