export default defineEventHandler((event) => {
  const id = Number.parseInt(<string>getRouterParam(event, "id"));
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "invalid id" });
  }

  return prisma.rencontre.findUnique({
    where: {
      id,
    },
    include: {
      mandats: {
        include: {
          syndicat: true,
        },
      },
      votes: {
        include: {
          possibilites: true,
          choix: true,
        },
      },
    },
  });
});
