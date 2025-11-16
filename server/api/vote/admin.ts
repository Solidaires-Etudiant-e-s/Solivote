export default defineEventHandler(async (_event) => {
    const b = prisma.choix.deleteMany()
    const c = prisma.vote.deleteMany()
    return prisma.$transaction([b, c])
})
