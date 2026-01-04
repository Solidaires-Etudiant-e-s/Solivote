export default defineEventHandler(async (_event) => {
    const current = await currentRencontre()

    if (!current){
        return prisma.vote.findMany({
            include: {
                choix: {
                    include: {
                        syndicat: true,
                    }
                },
            }
        });
    }

    return prisma.vote.findMany({
        where: {
            rencontre: {
                is: current
            }
        },
        include: {
            choix: {
                include: {
                    syndicat: true,
                }
            },
        }
    });
})