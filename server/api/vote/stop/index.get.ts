import { StatusVote } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const user = await getUser(event);
  if (user.role !== Groupe.ADMIN)
    throw createError({ statusCode: 403, statusMessage: "forbidden" });

  return prisma.vote.updateMany({
    where: {
      status: StatusVote.EN_VOTE,
    },
    data: {
      status: StatusVote.CLOTURE,
    },
  });
});
