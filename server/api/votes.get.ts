export default defineEventHandler((_event) => {
    return prisma.vote.findMany({
        include: {
            choix: {
                include: {
                    syndicat: true,
                }
            },
        }
    });
})