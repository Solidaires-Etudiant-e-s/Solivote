type ChoiceEntry = { mandat: number };

export default function (
    key: string,
    totalVotes: number,
    choiceGroups: Record<string, ChoiceEntry[]>,
) {
    const total = Number(totalVotes);
    if (!Number.isFinite(total) || total <= 0) {
        return 0;
    }
    const count = Number(groupCount(key, choiceGroups));
    if (!Number.isFinite(count) || count <= 0) {
        return 0;
    }
    return Math.round((count / total) * 100);
}
