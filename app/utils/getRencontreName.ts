import type { TypeRencontre } from "#imports";

export default function (rencontre: {nom: string, dateDebut: string, type: TypeRencontre}) {
  if (rencontre.nom && rencontre.nom.trim()) {
    return rencontre.nom.trim();
  }
  const date = new Date(rencontre.dateDebut);
  return `${rencontre.type} de ${new Intl.DateTimeFormat(useI18n().locale.value, { month: "long" }).format(date)} ${date.getFullYear()}`;
}
