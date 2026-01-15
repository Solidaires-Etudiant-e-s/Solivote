<script setup lang="ts">
import type { TypeVote, TypeChoix } from "@prisma/client";

type VoteChoice = {
  date: Date | string;
  choix: TypeChoix;
  syndicat?: { nom?: string } | null;
  [key: string]: unknown;
};

type VoteLike = {
  id: number;
  nom: string;
  type: TypeVote;
  description?: string;
  choix: VoteChoice[];
  status: string;
};

const props = defineProps<{
  vote: VoteLike;
}>();

const choiceGroups = computed(() => {
  const base = {
    POUR: [] as VoteChoice[],
    CONTRE: [] as VoteChoice[],
    ABSTENTION: [] as VoteChoice[],
    NPPV: [] as VoteChoice[],
  };

  for (const choix of props.vote.choix || []) {
    const key = choix.choix;
    if (key in base) {
      base[key].push(choix);
    }
  }

  return base;
});

const choiceMeta = [
  { key: "POUR", label: "Pour" },
  { key: "CONTRE", label: "Contre" },
  { key: "ABSTENTION", label: "Abstention" },
  { key: "NPPV", label: "NPPV" },
];

const totalVotes = computed(() => props.vote.choix?.length || 0);

const groupCount = (key: TypeChoix) => choiceGroups.value[key]?.length || 0;

const groupPercent = (key: TypeChoix) => {
  const total = totalVotes.value;
  if (total === 0) {
    return 0;
  }
  return Math.round((groupCount(key) / total) * 100);
};

const winnerKeys = computed(() => {
  let max = -1;
  const keys: TypeChoix[] = [];

  for (const option of choiceMeta) {
    const count = groupCount(option.key);
    if (count > max) {
      max = count;
      keys.length = 0;
      keys.push(option.key);
    } else if (count === max && max > 0) {
      keys.push(option.key);
    }
  }

  return max > 0 ? keys : [];
});

const winnerLabel = computed(() => {
  if (winnerKeys.value.length === 0) {
    return "—";
  }
  return winnerKeys.value
    .map((key) => choiceMeta.find((option) => option.key === key)?.label || key)
    .join(" / ");
});

const winnerPercent = computed(() => {
  if (winnerKeys.value.length === 0) {
    return 0;
  }
  return Math.max(...winnerKeys.value.map((key) => groupPercent(key)));
});
</script>

<template>
  <UCard class="w-full">
    <template #header>
      <div class="flex justify-between items-start">
        <div class="flex flex-col gap-1">
          <div class="text-base font-serif">
            {{ props.vote.nom }}
          </div>
          <div v-if="props.vote.description" class="text-xs text-muted">
            {{ props.vote.description }}
          </div>
        </div>
      </div>
    </template>

    <div class="flex items-center gap-3">
      <div class="w-28 shrink-0 text-sm font-semibold">
        {{ winnerLabel }}
      </div>
      <div
        class="relative h-6 w-full rounded-sm bg-secondary-200 overflow-hidden"
      >
        <div
          class="h-full transition-[width] duration-500 ease-out bg-primary"
          :style="{ width: `${winnerPercent}%` }"
        />
        <div
          class="absolute inset-0 flex items-center justify-start pl-2 text-[11px] font-semibold text-white"
        >
          {{ winnerPercent }}%
        </div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-3 text-xs text-muted">
      <span
        v-for="group in choiceMeta"
        :key="group.key"
        class="inline-flex items-center gap-1"
      >
        <span class="font-semibold">{{ group.label }}:</span>
        <span
          >{{ groupCount(group.key) }} ({{ groupPercent(group.key) }}%)</span
        >
      </span>
    </div>

    <div v-if="$slots.actions" class="mt-4">
      <slot name="actions" />
    </div>
  </UCard>
</template>
