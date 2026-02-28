import type { H3Event } from "h3";
import { prisma } from "./prisma";
import { currentRencontre } from "./currentRencontre";

export async function currentSyndicat(event: H3Event): Promise<
    | ({
          mandats: {
              syndicatId: number;
              rencontreId: number;
              mandat: number;
          }[];
      } & {
          id: number;
          nom: string;
      })
    | null
> {
    const nom = String(event.node.req.headers["ynh_user"] ?? "");

    const rencontre = await currentRencontre();

    return await prisma.syndicat.findUnique({
        where: {
            nom,
        },
        include: {
            mandats: {
                where: {
                    rencontreId: rencontre?.id,
                },
            },
        },
    });
}
