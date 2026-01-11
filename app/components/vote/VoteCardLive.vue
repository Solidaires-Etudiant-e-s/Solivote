<script setup lang="ts">
import { UBadge } from "#components";

type VoteChoice = {
  date: Date | string;
  type: string;
  syndicat?: { nom?: string } | null;
  [key: string]: unknown;
};

type VoteLike = {
  id: number;
  nom: string;
  description?: string;
  choix: VoteChoice[];
  status: string;
};

const props = withDefaults(
  defineProps<{
    vote: VoteLike;
    user?: { role: string; name?: string } | null;
  }>(),
  {
    user: null,
  },
);

const emit = defineEmits<{
  (event: "vote", type: string): void;
}>();

const choiceGroups = computed(() => {
  const base = {
    POUR: [] as VoteChoice[],
    CONTRE: [] as VoteChoice[],
    ABSTENTION: [] as VoteChoice[],
    NPPV: [] as VoteChoice[],
  };

  for (const choix of props.vote.choix || []) {
    const key = choix.type as keyof typeof base;
    if (key in base) {
      base[key].push(choix);
    }
  }

  for (const key of Object.keys(base) as Array<keyof typeof base>) {
    base[key].sort((a, b) =>
      String(a.syndicat?.nom || "").localeCompare(String(b.syndicat?.nom || "")),
    );
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

const groupCount = (key: string) =>
  choiceGroups.value[key as keyof typeof choiceGroups.value]?.length || 0;

const groupPercent = (key: string) => {
  const total = totalVotes.value;
  if (total === 0) {
    return 0;
  }
  return Math.round((groupCount(key) / total) * 100);
};

const groupNames = (key: string) =>
  choiceGroups.value[key as keyof typeof choiceGroups.value]
    ?.map((choice) => choice.syndicat?.nom)
    .filter(Boolean)
    .join(", ");

const userChoice = computed(() => {
  const userName = props.user?.name?.toLowerCase();
  if (!userName) {
    return null;
  }
  const found = props.vote.choix.find(
    (choice) => choice.syndicat?.nom?.toLowerCase() === userName,
  );
  return found?.type ?? null;
});
</script>

<template>
  <UCard class="w-full h-max mt-4">
    <template #header>
      <div class="flex justify-between items-start">
        <div class="flex flex-col gap-1">
          <div class="text-xl font-serif">
            {{ props.vote.nom }}
          </div>
          <div v-if="props.vote.description" class="text-xs text-muted">
            {{ props.vote.description }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UBadge label="En cours..." color="primary">
            <template #leading>
              <UIcon name="mingcute:loading-fill" class="animate-spin" />
            </template>
          </UBadge>
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-6">
      <div
        v-for="group in choiceMeta"
        :key="group.key"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-3">
          <label class="w-28 shrink-0 flex items-center gap-2 text-sm font-semibold">
            <UCheckbox
              v-if="props.user?.role === 'syndicat'"
              :model-value="userChoice === group.key"
              @update:model-value="(val) => val && emit('vote', group.key)"
            />
            <span>{{ group.label }}</span>
          </label>
          <div class="relative h-8 w-full rounded-sm bg-secondary-200 overflow-hidden">
            <div
              class="h-full transition-[width] duration-500 ease-out"
              :class="
                groupPercent(group.key) > 0 ? 'bg-primary' : 'bg-secondary'
              "
              :style="{ width: `${groupPercent(group.key)}%` }"
            />
            <div
              class="absolute inset-0 flex items-center justify-start pl-3 text-xs font-semibold"
              :class="groupPercent(group.key) === 0 ? 'text-muted' : 'text-white'"
            >
              {{ groupCount(group.key) }} ({{ groupPercent(group.key) }}%)
            </div>
          </div>
        </div>
        <div class="text-xs text-muted">
          {{ groupNames(group.key) || "—" }}
        </div>
      </div>
      <div v-if="$slots.actions" class="flex items-center justify-between gap-3">
        <slot name="actions" />
      </div>
    </div>
  </UCard>
</template>

