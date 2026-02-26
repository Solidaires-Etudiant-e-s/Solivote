export default defineEventHandler(async (_event) => {
  const rencontre = await currentRencontre();

  return await prisma.syndicat.findMany({
    include: {
      mandats: true,
    },
    where: {
      mandats: {
        some: {
          rencontreId: rencontre?.id,
        },
      },
    },
  });
});
