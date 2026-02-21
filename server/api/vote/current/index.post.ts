import { z } from "zod";
import { StatusVote, TypeChoix } from "@prisma/client";

const userSchema = z.partialRecord(z.enum(TypeChoix), z.int().min(1));

export default defineEventHandler(async (event) => {
    const choix = await readValidatedBody(event, (body) =>
        userSchema.parse(body),
    );

    const syndicat = await currentSyndicat(event);

    if (!syndicat) {
        throw new Error(`Current syndicat not found`);
    }

    let total_mandats = 0;
    for (const i in choix) {
        total_mandats += choix[i];
    }

    if (total_mandats !== syndicat.mandats[0].mandat) {
        throw createError({
            statusCode: 400,
            statusMessage: "mandats suplied is not the totality of mandats",
        });
    }

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
            choix,
            date: new Date(),
        },
        create: {
            choix,
            syndicatId: syndicat.id,
            voteId: vote.id,
        },
    });
});
