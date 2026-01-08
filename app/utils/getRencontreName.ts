type RencontreLike = {
  dateDebut: Date | string;
  type: string;
};

export default function (rencontre: RencontreLike) {
  const date = new Date(rencontre.dateDebut);
  return `${rencontre.type} de ${new Intl.DateTimeFormat(useI18n().locale.value, { month: "long" }).format(date)} ${date.getFullYear()}`;
}
