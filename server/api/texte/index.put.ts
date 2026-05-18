import { z } from "zod";

const userSchema = z.object({
  id: z.number().int(),
  titre: z.string().min(1),
  // pdfs: z.array(z.object({
  //   filename: z.string(),
  //   data: z.instanceof(Buffer)
  // }))
});

export default defineEventHandler(async (event) => {
  const { role } = await getUser(event);
  if (role !== Groupe.ADMIN) {
    throw createError({ statusCode: 403, statusMessage: "forbidden" });
  }

  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "Form invalid",
    });
  }

  const id = formData.find(field => field.name === 'id');
  const titre = formData.find(field => field.name === 'titre')?.data?.toString();
  // const pdfFiles = formData.filter(field => field.name === 'pdf');

  const data = userSchema.parse({
    id,
    titre,
    // pdfs: pdfFiles
  });

  const result =  await prisma.texte.update({
    where: {
      id: data.id,
    },
    data: {
      titre: data.titre,
      // pdfs: {
      //   deleteMany: {},
      //   updateMany: {
      //     data: files
      //   },
      // }
    }
  })

  await broadcastVote("vote");

  return result
})
