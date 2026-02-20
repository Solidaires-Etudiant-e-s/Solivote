import { z } from "zod";
import { StatusVote, TypeChoix } from "@prisma/client";

const userSchema = z.object({
  type: z.enum(TypeChoix),
});

export default defineEventHandler(async (event) => {
  const { type } = await readValidatedBody(event, (body) =>
    userSchema.parse(body),
  );

  const nom = <string>event.node.req.headers["ynh_user"];

  const syndicat = await prisma.syndicat.findFirstOrThrow({
    where: {
      nom,
    },
  });

  const vote = await prisma.vote.findFirstOrThrow({
    where: {
      status: StatusVote.EN_VOTE,
      rencontre: {
        mandats: {
          some: {
            syndicatId: syndicat.id,
          },
        },
      },
    },
  });

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
