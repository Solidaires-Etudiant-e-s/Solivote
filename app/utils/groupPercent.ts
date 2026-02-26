export default function (key: string, totalVotes: number, choiceGroups) {
  const total = totalVotes;
  if (total === 0) {
    return 0;
  }
  return Math.round((groupCount(key, choiceGroups) / total) * 100);
}
