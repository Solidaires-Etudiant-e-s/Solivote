import z from "zod";

const userSchema = z.object({
  id: z.number(),
  defaultMandats: z.number().min(0),
  actif: z.boolean()
});

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  await prisma.syndicat.update({
    where: {
      id: data.id
    },
    data: {
      defaultMandats: data.defaultMandats,
      actif: data.actif,
    }
  });

  return prisma.syndicat.findMany();
});
