import {getSyndicats} from "~~/server/utils/syndicats";

export default defineEventHandler(async (event) => {
    const {role} = await getUser(event)
    if (role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'forbidden' })

    const syndicats = await getSyndicats(event)

    for (const syndicat of syndicats) {
        await prisma.syndicat.upsert({
            where: {
                nom: syndicat
            },
            create: {
                nom: syndicat
            },
            update: {}
        })
    }

    return $fetch('/api/syndicat')
})