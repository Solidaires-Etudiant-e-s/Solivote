<script setup lang="ts">
import type { TypeChoix, TypeVote } from "~/utils/backendTypes";

const props = defineProps<{
  vote: Vote;
}>();

const choiceMeta: Array<{ key: TypeChoix; label: string }> = [
  { key: "POUR", label: "Pour" },
  { key: "CONTRE", label: "Contre" },
  { key: "ABSTENTION", label: "Abstention" },
  { key: "NPPV", label: "NPPV" },
];

const sortedChoiceMeta = computed(() =>
  [...choiceMeta].sort((left, right) => {
    const totalDiff = choiceTotals.value[right.key] - choiceTotals.value[left.key];
    if (totalDiff !== 0) {
      return totalDiff;
    }

    return choiceMeta.findIndex((choice) => choice.key === left.key)
      - choiceMeta.findIndex((choice) => choice.key === right.key);
  }),
);

const choiceTotals = computed<Record<TypeChoix, number>>(() => {
  const base: Record<TypeChoix, number> = {
    POUR: 0,
    CONTRE: 0,
    ABSTENTION: 0,
    NPPV: 0,
  };

  for (const choix of props.vote.choix || []) {
    for (const entry of choix.choix) {
      const type = String(entry.type);
      const mandat = Number(entry.mandat ?? 0);
      if (type in base && Number.isFinite(mandat) && mandat > 0) {
        base[type as TypeChoix] += mandat;
      }
    }
  }

  return base;
});

const totalVotes = computed(() =>
  Object.values(choiceTotals.value).reduce((sum, count) => sum + count, 0),
);

const choiceGroups = computed(() => {
  const base: Record<
    string,
    Array<{ syndicat: Syndicat; mandat: number }>
  > = {};

  for (const i of props.vote.choix) {
    for (const y of i.choix) {
      if (!base[y.type]) {
        base[y.type] = [];
      }
      base[y.type]!.push({ syndicat: i.syndicat, mandat: y.mandat });
    }
  }

  return base;
});
</script>

<template>
  <UCard class="w-full">
    <template #header>
      <div class="flex flex-col gap-1 w-full">
        <div
          class="text-base font-serif flex items-start justify-between gap-2"
        >
          <span class="`wrap-break-word`">{{ props.vote.nom }}</span>
          <UBadge class="shrink-0">{{ props.vote.type }}</UBadge>
        </div>
        <div
          v-if="props.vote.description"
          class="text-xs text-muted `wrap-break-word`"
        >
          {{ props.vote.description }}
        </div>
        <div
          v-if="props.vote.type == TypeVote.CONDORCET"
          class="flex gap-2 flex-wrap"
        >
          <template
            v-for="possibilite in props.vote.possibilites ?? []"
            :key="possibilite.id"
          >
            <UBadge>{{ possibilite.nom }}</UBadge>
          </template>
        </div>
      </div>
    </template>

    <div
      v-for="group in sortedChoiceMeta"
      :key="group.key"
      class="flex flex-col gap-2 "
    >
      <div class="flex items-start gap-3">
        <div class="shrink-0 self-center flex items-center w-full">
          <div class="flex-1 min-w-0 flex flex-col gap-1.5">
            <span class="text-sm font-medium sm:font-normal">{{
              group.label
            }}</span>
            <div
              class="relative h-8 w-full rounded-sm bg-secondary-200 overflow-hidden"
            >
              <div
                class="h-full transition-[width] duration-500 ease-out"
                :class="
                  percentFor(group.key, choiceGroups, totalVotes) > 0
                    ? 'bg-primary'
                    : 'bg-secondary'
                "
                :style="{
                  width: `${percentFor(group.key, choiceGroups, totalVotes)}%`,
                }"
              />
              <div
                class="absolute inset-0 flex items-center justify-start pl-3 text-xs font-semibold"
                :class="
                  percentFor(group.key, choiceGroups, totalVotes) === 0
                    ? 'text-muted'
                    : 'text-white'
                "
              >
                {{ groupCount(String(group.key), choiceGroups) }}
                ({{ percentFor(group.key, choiceGroups, totalVotes) }}%)
              </div>
            </div>
            <div class="text-xs text-muted">
              {{ groupNames(String(group.key), choiceGroups) || "—" }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer v-if="$slots.actions" class="mt-4">
      <slot name="actions" />
    </template>
  </UCard>
</template>
