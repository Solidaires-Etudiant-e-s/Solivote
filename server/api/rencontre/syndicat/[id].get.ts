export default defineEventHandler(async (event) => {
    const id = Number.parseInt(<string>getRouterParam(event, 'id'))

    const presents = (await prisma.rencontre.findUniqueOrThrow({
        where: {
            id
        },
        select: {
            participants: true
        }
    })).participants.map(a => a.nom);

    return (await prisma.syndicat.findMany({
        select: {
            nom: true
        }
    })).map(a => a.nom).filter((a => !presents.includes(a)));
})