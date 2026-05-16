import type { H3Event } from "h3";
import type { Syndicat } from "../../app/utils/backendTypes";

export async function currentSyndicat(event: H3Event): Promise<Syndicat> {
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
