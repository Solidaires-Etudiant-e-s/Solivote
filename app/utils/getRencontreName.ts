type RencontreLike = {
  dateDebut: Date | string;
  type: string;
  nom?: string | null;
};

export default function (rencontre: RencontreLike) {
  if (rencontre.nom && rencontre.nom.trim()) {
    return rencontre.nom.trim();
  }
  const date = new Date(rencontre.dateDebut);
  return `${rencontre.type} de ${new Intl.DateTimeFormat(useI18n().locale.value, { month: "long" }).format(date)} ${date.getFullYear()}`;
}
