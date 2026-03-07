export type SanitizedChoix = {
  type: string | number;
  mandat: number;
};

export function sanitizeChoix(input: unknown): SanitizedChoix[] {
  // Legacy scalar enum format: "POUR"
  if (typeof input === "string" || typeof input === "number") {
    return [{ type: input, mandat: 1 }];
  }

  // Legacy object-map format: { POUR: 2, CONTRE: 1 }
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return Object.entries(input as Record<string, unknown>)
      .map(([rawType, rawMandat]) => {
        const mandat = Number(rawMandat);
        if (!Number.isFinite(mandat) || mandat <= 0) return null;

        const type = /^[0-9]+$/.test(rawType)
          ? Number.parseInt(rawType, 10)
          : rawType;
        return { type, mandat: Math.trunc(mandat) };
      })
      .filter((entry): entry is SanitizedChoix => entry !== null);
  }

  if (!Array.isArray(input)) return [];

  // Current canonical format: [{ type, mandat }]
  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      const rawType = (entry as Record<string, unknown>).type;
      const rawMandat = (entry as Record<string, unknown>).mandat;
      const mandat = Number(rawMandat);

      if (!Number.isFinite(mandat) || mandat <= 0) return null;
      if (typeof rawType !== "string" && typeof rawType !== "number") {
        return null;
      }

      const type =
        typeof rawType === "string" && /^[0-9]+$/.test(rawType)
          ? Number.parseInt(rawType, 10)
          : rawType;

      return { type, mandat: Math.trunc(mandat) };
    })
    .filter((entry): entry is SanitizedChoix => entry !== null);
}
