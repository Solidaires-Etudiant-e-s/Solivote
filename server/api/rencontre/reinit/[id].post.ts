import { StatusRencontre } from "@prisma/client";
export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const id = Number.parseInt(<string>getRouterParam(event, "id"));
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "invalid id" });
  }

  if (!(await currentRencontre())) {
    const result = await prisma.rencontre.update({
      where: {
        id: id,
        status: StatusRencontre.CLOTURE,
      },
      data: {
        status: StatusRencontre.INITIAL,
      },
    });
    await broadcastRencontre("rencontre");
    return result;
  }

  throw createError({
    statusCode: 400,
    statusMessage: "A Rencontre is already started",
  });
});
