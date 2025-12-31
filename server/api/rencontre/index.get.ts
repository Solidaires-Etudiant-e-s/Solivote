export default defineEventHandler((_event) => {
    return prisma.rencontre.findMany({
        include: {
            mandats: {
                include: {
                    syndicat: true,
                }
            },
            sessions: true,
        }
    });
})