export default defineEventHandler(async (event) => {
    const rencontre = await currentRencontre();

    return await prisma.syndicat.findMany({
        include: {
            mandats: {
                where: {
                    rencontreId: rencontre?.id,
                },
            },
        },
    });
});
