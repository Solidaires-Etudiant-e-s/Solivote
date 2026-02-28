export const sameJson = (a: unknown, b: unknown) =>
    JSON.stringify(a) === JSON.stringify(b);

export function patchArrayInPlace<T>(
    target: T[],
    next: T[],
    same: (a: T, b: T) => boolean = (a, b) => a === b,
) {
    const merged = next.map((item, index) =>
        index < target.length && same(target[index]!, item)
            ? target[index]!
            : item,
    );

    const changed =
        target.length !== merged.length ||
        target.some((item, index) => item !== merged[index]);

    if (changed) {
        target.splice(0, target.length, ...merged);
    }

    return changed;
}

export function patchByIdInPlace<T extends { id: number }>(
    target: T[],
    next: T[],
    same: (a: T, b: T) => boolean = sameJson as (a: T, b: T) => boolean,
) {
    const currentById = new Map(target.map((item) => [item.id, item]));
    const merged = next.map((item) => {
        const current = currentById.get(item.id);
        return current && same(current, item) ? current : item;
    });

    const changed =
        target.length !== merged.length ||
        target.some((item, index) => item !== merged[index]);

    if (changed) {
        target.splice(0, target.length, ...merged);
    }

    return changed;
}
