import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
});

export default defineEventHandler(async (event) => {
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

  if (vote.status === "CLOTURE") {
    throw createError({
      statusCode: 400,
      statusMessage: "Closed votes cannot be deleted",
    });
  }

  return prisma.vote.delete({
    where: {
      id: data.id,
    },
  });
});
