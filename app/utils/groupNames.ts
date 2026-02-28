type ChoiceEntry = { syndicat: { nom: string }; mandat: number };

export default function (
    key: string,
    choiceGroups: Record<string, ChoiceEntry[]>,
) {
    return choiceGroups[key]
        ?.map((choice) => `${choice.syndicat.nom} (${choice.mandat})`)
        .join(", ");
}
