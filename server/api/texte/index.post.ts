import { z } from "zod";

const userSchema = z
  .object({
    titre: z.string().min(1)
  });

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const current = await currentRencontre();

  if (!current) {
    throw createError({
      statusCode: 400,
      statusMessage: "No rencontre is currently started",
    });
  }

  const result = await prisma.texte.create({
    data: {
      titre: data.titre,
      rencontreId: current.id
    },
  });

  await broadcastVote("vote");

  return result
});
