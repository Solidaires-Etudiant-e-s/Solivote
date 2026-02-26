export default function (key: string, choiceGroups) {
  return choiceGroups[key as keyof typeof choiceGroups.value]
    ?.map((choice) => choice.syndicat.nom + " (" + choice.mandat + ")")
    .join(", ");
}
