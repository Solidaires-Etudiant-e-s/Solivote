export default defineEventHandler(async (_event) => {
  const rencontre = await currentRencontre();
  if (!rencontre) {
    return [];
  }

  return await prisma.syndicat.findMany({
    include: {
      mandats: {
        where: {
          rencontreId: rencontre.id,
        },
      },
    },
    where: {
      mandats: {
        some: {
          rencontreId: rencontre.id,
        },
      },
    },
  });
});
