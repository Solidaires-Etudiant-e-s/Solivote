export default defineEventHandler(async (event) => {
    return await getRole(event)
})