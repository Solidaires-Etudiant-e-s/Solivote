import { prisma } from "../../utils/prisma";
import { getUser, Groupe } from "../../utils/role";

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const b = prisma.choix.deleteMany();
  const c = prisma.vote.deleteMany();
  return prisma.$transaction([b, c]);
});
