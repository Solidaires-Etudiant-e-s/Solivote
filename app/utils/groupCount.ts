export default function (key: string, choiceGroups) {
  if (!choiceGroups?.[key]) {
    return 0;
  }

  let total = 0;
  for (const i in choiceGroups[key]) {
    const mandat = Number(choiceGroups[key][i].mandat);
    total += Number.isFinite(mandat) ? mandat : 0;
  }
  return total;
}
