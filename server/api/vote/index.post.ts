import { z } from "zod";

const userSchema = z.object({
  nom: z.string().min(1),
  description: z.string().min(1),
  content: z.string().min(1),
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

  return prisma.vote.create({
    data: {
      nom: data.nom,
      description: data.description,
      content: data.content,
      rencontre: {
        connect: current,
      },
    },
  });
});
