type ChoiceEntry = { mandat: number };

export default function (
  key: string | number,
  choiceGroups: Record<string, ChoiceEntry[]>,
  totalVotes: number,
) {
  const count = Number(groupCount(String(key), choiceGroups));
  const total = Number(totalVotes);

  if (!Number.isFinite(count) || !Number.isFinite(total)) {
    return 0;
  }

  if (total <= 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
}
