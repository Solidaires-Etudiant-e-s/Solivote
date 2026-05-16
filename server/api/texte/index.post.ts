import { z } from "zod";

const userSchema = z.object({
  titre: z.string().min(1),
  pdf: z.array(z.object({
    filename: z.string(),
    data: z.instanceof(Buffer)
  }))
});

export default defineEventHandler(async (event) => {
  // const data = await readValidatedBody(event, (body) => userSchema.parse(body));
  const formData = await readMultipartFormData(event);

  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "Form invalid",
    });
  }

  const titre = formData.find(field => field.name === 'titre')?.data?.toString();
  const pdfFiles = formData.filter(field => field.name === 'pdf');

  const data = userSchema.parse({
    titre,
    pdf: pdfFiles
  });

  const storage = useStorage("uploads");
  const files = [] as {titre: string, nom: string}[]
  try {
    pdfFiles.forEach(async (file) => {
      const fileName = `${Date.now()}-${file.filename!}`;
      await storage.setItemRaw(`${fileName}`, file.data);
      files.push({titre: file.filename!, nom: fileName});
    })
  } catch (error) {
    if (error instanceof H3Error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Error uploading files",
    });
  }

  const current = await currentRencontre();

  if (!current) {
    throw createError({
      statusCode: 400,
      statusMessage: "No rencontre is currently started",
    });
  }

  const result = await prisma.texte.create({
    data: {
      titre: data.titre,
      rencontreId: current.id,
      pdfs: {
        createMany: {
          data: files,
        }
      }
    },
  });

  await broadcastVote("vote");

  return result
});
