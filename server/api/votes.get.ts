import { Vote } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const current = await currentRencontre();

  const id = Number(getQuery(event).id)
  if (Number.isInteger(id) && id > 0) {
    return await prisma.vote.findMany({
      where: {
        rencontreId: id
      },
      include: {
        choix: {
          include: {
            syndicat: true,
          },
        },
        possibilites: true,
      },
    });
  }

  if (current) {
    return await prisma.vote.findMany({
      where: {
        rencontreId: current.id
      },
      include: {
        choix: {
          include: {
            syndicat: true,
          },
        },
        possibilites: true,
      },
    });
  }

  return null
});
