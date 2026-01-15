import { z } from "zod";
import { TypeChoix } from "@prisma/client";

const userSchema = z.object({
  type: z.enum(TypeChoix),
});

export default defineEventHandler(async (event) => {
  const { type } = await readValidatedBody(event, (body) =>
    userSchema.parse(body),
  );

  const nom = <string>event.node.req.headers["ynh_user"];

  const syndicat = await prisma.syndicat.upsert({
    where: {
      nom,
    },
    create: {
      nom,
    },
    update: {},
  });

  const vote = await enVote();

  return prisma.choix.upsert({
    where: {
      syndicatId_voteId: {
        syndicatId: syndicat.id,
        voteId: vote.id,
      },
    },
    update: {
      choix: type,
      date: new Date(),
    },
    create: {
      choix: type,
      syndicat: {
        connect: syndicat,
      },
      vote: {
        connect: { id: vote?.id },
      },
    },
  });
});
