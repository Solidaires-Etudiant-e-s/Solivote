export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const body = await readBody<{ voteId?: number }>(event);
  if (!body?.voteId) {
    throw createError({ statusCode: 400, statusMessage: "voteId required" });
  }

  const vote = await prisma.vote.findUnique({ where: { id: body.voteId } });
  if (!vote) {
    throw createError({ statusCode: 404, statusMessage: "Vote not found" });
  }

  const updated = await prisma.vote.update({
    where: { id: vote.id },
    data: { hideResults: !vote.hideResults },
  });

  await broadcastVote("vote");
  await broadcastVote("current");

  return { hideResults: updated.hideResults };
});
