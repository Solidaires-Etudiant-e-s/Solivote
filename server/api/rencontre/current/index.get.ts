export default defineEventHandler(async (e) => {
  const i = getQuery(e).id
  const id = Number(i)

  return (Number.isInteger(id) && id > 0) ? currentRencontre(id) : currentRencontre()
});
