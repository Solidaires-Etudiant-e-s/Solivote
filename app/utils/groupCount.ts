export default function (key: string, choiceGroups) {
  let total = 0;
  for (const i in choiceGroups[key]) {
    total += choiceGroups[key][i].mandat;
  }
  return total;
}
