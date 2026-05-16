export default defineEventHandler(async (event) => {
  const id = Number(getQuery(event).id)
  if (Number.isInteger(id) && id > 0) {
    return await prisma.texte.findMany({
      where: {
        rencontreId: id,
      },
      include: {
        votes: {
          include: {
            choix: {
              include: {
                syndicat: true
              }
            },
            possibilites: true,
            texte: true,
          }
        }
      }
    })
  }

  const current = await currentRencontre();
  if (current) {
    return await prisma.texte.findMany({
      where: {
        rencontreId: current.id,
      },
      include: {
        votes: {
          include: {
            choix: {
              include: {
                syndicat: true
              }
            },
            possibilites: true
          }
        }
      }
    })
  }

  return null
});
