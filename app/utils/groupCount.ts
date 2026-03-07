type ChoiceEntry = { mandat: number };

export default function (
  key: string,
  choiceGroups: Record<string, ChoiceEntry[]>,
) {
  if (!choiceGroups?.[key]) {
    return 0;
  }

  let total = 0;
  for (const entry of choiceGroups[key]) {
    const mandat = Number(entry.mandat);
    total += Number.isFinite(mandat) ? mandat : 0;
  }
  return total;
}
