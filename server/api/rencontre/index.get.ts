export default defineEventHandler((_event) => {
    return prisma.rencontre.findMany({
        include: {
            participants: true,
            sessions: true,
        }
    });
})