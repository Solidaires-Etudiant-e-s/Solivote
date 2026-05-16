import { z } from "zod";

const userSchema = z
  .object({
    texteId: z.number(),
  });

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, (body) => userSchema.parse(body));

  const texte = await prisma.texte.delete({
    where: {
      id: data.texteId,
    },
    include: {
      pdfs: true,
    }
  });

  const storage = useStorage("uploads");
  texte.pdfs.forEach((pdf) => storage.remove(pdf.nom))

  await broadcastVote("vote");
});
