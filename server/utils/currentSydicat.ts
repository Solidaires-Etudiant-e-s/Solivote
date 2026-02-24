export async function currentSyndicat(event): Promise<
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
    const nom = <string>event.node.req.headers["ynh_user"];

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
