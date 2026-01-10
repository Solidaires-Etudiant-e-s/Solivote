<script setup lang="ts">
import { UBadge } from "#components";

type VoteLike = {
  id: number;
  nom: string;
  description?: string;
  choix: VoteChoice[];
  status: string;
};

type VoteChoice = {
  date: Date | string;
  type: string;
  syndicat?: { nom?: string } | null;
  [key: string]: unknown;
};

const props = withDefaults(
  defineProps<{
    vote: VoteLike;
    user?: { role: string; name?: string } | null;
    featured?: boolean;
    execute: () => Promise<void> | void;
  }>(),
  {
    user: null,
  },
);

const emit = defineEmits<{
  (event: "vote", type: string): void;
}>();

const del = async (id: number) => {
  await $fetch("/api/vote", { method: "delete", body: { id: id } });
  await props.execute();
};

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

const winnerKeys = computed(() => {
  let max = -1;
  const keys: string[] = [];

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
  <UCard
    :class="props.featured ? 'w-full h-max mt-4' : 'w-full'"
  >
    <template #header>
      <div class="flex justify-between items-start">
        <div class="flex flex-col gap-1">
          <div :class="props.featured ? 'text-xl' : 'text-base'" class="font-serif">
            {{ props.vote.nom }}
          </div>
          <div
            v-if="props.vote.description"
            class="text-xs text-muted"
          >
            {{ props.vote.description }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <UBadge
            :label="props.featured ? 'En cours' : 'Clos'"
            :color="props.featured ? 'primary' : 'secondary'"
          >
            <template v-if="props.featured" #leading>
              <UIcon name="mingcute:loading-fill" class="animate-spin" />
            </template>
          </UBadge>
          <UButton
            v-if="props.user?.role === 'admin'"
            :disabled="props.vote.choix.length !== 0"
            icon="mingcute:delete-line"
            color="error"
            variant="solid"
            @click.prevent="del(props.vote.id)"
          />
        </div>
      </div>
    </template>

    <div v-if="props.featured" class="flex flex-col gap-6">
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
          <div class="relative h-8 w-full rounded-sm bg-muted overflow-hidden">
            <div
              class="h-full transition-[width] duration-500 ease-out"
              :class="
                winnerKeys.includes(group.key)
                  ? 'bg-primary'
                  : 'bg-secondary'
              "
              :style="{ width: `${groupPercent(group.key)}%` }"
            ></div>
            <div
              class="absolute inset-0 flex items-center justify-start pl-3 text-xs font-semibold"
              :class="groupPercent(group.key) === 0 ? 'text-[var(--ui-text-muted)]' : 'text-white'"
            >
              {{ groupCount(group.key) }} ({{ groupPercent(group.key) }}%)
            </div>
          </div>
        </div>
        <div class="text-xs text-[var(--ui-text-muted)]">
          {{ groupNames(group.key) || "—" }}
        </div>
      </div>
    </div>

    <template v-else>
      <div class="flex items-center gap-3">
        <div class="w-28 shrink-0 text-sm font-semibold">
          {{ winnerLabel }}
        </div>
        <div class="relative h-6 w-full rounded-sm bg-muted overflow-hidden">
          <div
            class="h-full transition-[width] duration-500 ease-out bg-primary"
            :style="{ width: `${winnerPercent}%` }"
          ></div>
          <div class="absolute inset-0 flex items-center justify-start pl-2 text-[11px] font-semibold text-white">
            {{ winnerPercent }}%
          </div>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-3 text-xs text-[var(--ui-text-muted)]">
        <span
          v-for="group in choiceMeta"
          :key="group.key"
          class="inline-flex items-center gap-1"
        >
          <span class="font-semibold">{{ group.label }}:</span>
          <span>{{ groupCount(group.key) }} ({{ groupPercent(group.key) }}%)</span>
        </span>
      </div>
    </template>

  </UCard>
</template>

<style scoped></style>
