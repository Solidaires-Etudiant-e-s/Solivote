import { z } from "zod";

const userSchema = z
  .object({
    texteId: z.number(),
  });

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  console.log(data.texteId)

  await prisma.texte.delete({
    where: {
      id: data.texteId,
    }
  });

  await broadcastVote("vote");
});
