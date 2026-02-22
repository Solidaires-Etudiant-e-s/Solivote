<script setup lang="ts">
import { UBadge } from "#components";
import { TypeVote, type Choix, type Syndicat } from "@prisma/client";
import type { JsonArray } from "@prisma/client/runtime/client";

type Possibilite = {
  id: number;
  nom: string;
};

type VoteLike = {
  id: number;
  nom: string;
  description?: string;
  type: TypeVote;
  possibilites: Possibilite[];
  choix: Choix[];
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

const { data: syndicats, status: syndicatsStatus } = await useLazyFetch(
  "/api/syndicat/current/all",
);

const syndicatsName = computed(() => {
  const s = syndicats.value!.map((e) => e.nom);
  return s;
});

const emit = defineEmits<{
  (event: "vote", type: string, selected: string): void;
  (event: "panacher", values: Panache, selected: string): void;
}>();

const choiceGroups = computed(() => {
  const base: Record<
    string,
    Array<{ syndicat: Syndicat; mandat: number }>
  > = {};

  for (const i of props.vote.choix) {
    for (const y of i.choix as JsonArray) {
      if (!base[y!.type]) {
        base[y!.type] = [];
      }
      base[y!.type]!.push({ syndicat: i.syndicat, mandat: y!.mandat });
    }
  }

  return base;
});

const choiceMeta = computed(() => {
  const base = [];
  if (props.vote.type === TypeVote.STANDARD) {
    base.push({ key: "POUR", label: "Pour" });
    base.push({ key: "CONTRE", label: "Contre" });
    base.push({ key: "ABSTENTION", label: "Abstention" });
    base.push({ key: "NPPV", label: "NPPV" });
  } else if (props.vote.type === TypeVote.EN_CONTRE) {
    base.push({ key: "POUR", label: "Pour" });
    base.push({ key: "CONTRE", label: "Contre" });
  } else {
    for (const i of props.vote.possibilites) {
      base.push({ key: i.id, label: i.nom });
    }
  }
  return base;
});

type Panache = Record<string, number>;

const en_panachage = ref(false);
const panachage = ref({} as Panache);

const totalVotes = computed(() => {
  let total = 0;
  for (const i of props.vote.choix) {
    for (const y of i.choix as JsonArray) {
      total += y!.mandat;
    }
  }

  return total;
});

const userChoice = computed(() => {
  let userName = "";
  if (props.user?.role === "admin" && vote_pour.value) {
    userName = vote_pour.value.toLowerCase();
  } else if (props.user?.role === "syndicat") {
    userName = props.user!.name!.toLowerCase();
  }
  const found = props.vote.choix.find((choice) => {
    console.log(choice.syndicat.nom?.toLowerCase());
    return choice.syndicat.nom?.toLowerCase() === userName;
  });
  const choix = found?.choix as Array<{
    type: string | number;
    mandat: number;
  }>;
  return choix ?? null;
});

const vote_pour = ref("");
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
          <UBadge>{{ props.vote.type }}</UBadge>
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
        v-if="props.user?.role === 'admin' && syndicatsStatus === 'success'"
        class="flex items-center gap-x-4"
      >
        voter pour:
        <UInputMenu v-model="vote_pour" :items="syndicatsName" />
      </div>
      <div
        v-if="props.user?.role === 'syndicat' || vote_pour"
        class="flex items-center gap-x-4"
      >
        <span>Panachage</span>
        <USwitch v-model="en_panachage" />
      </div>
      <div
        v-for="group in choiceMeta"
        :key="group.key"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-3">
          <label
            class="w-28 shrink-0 flex items-center gap-2 text-sm font-semibold"
          >
            <template v-if="props.user?.role === 'syndicat' || vote_pour">
              <UButton
                v-if="!en_panachage"
                @click="emit('vote', group.key, vote_pour)"
              />
              <template v-else>
                <UInputNumber v-model="panachage[group.key]" />
                {{ panachage[group.key] }}
              </template>
            </template>
            <span>{{ group.label }}</span>
          </label>
          <div
            class="relative h-8 w-full rounded-sm bg-secondary-200 overflow-hidden"
          >
            <div
              class="h-full transition-[width] duration-500 ease-out"
              :class="
                groupPercent(group.key, totalVotes, choiceGroups) > 0
                  ? 'bg-primary'
                  : 'bg-secondary'
              "
              :style="{
                width: `${groupPercent(group.key, totalVotes, choiceGroups)}%`,
              }"
            />
            <div
              class="absolute inset-0 flex items-center justify-start pl-3 text-xs font-semibold"
              :class="
                groupPercent(group.key, totalVotes, choiceGroups) === 0
                  ? 'text-muted'
                  : 'text-white'
              "
            >
              {{ groupCount(group.key, choiceGroups) }} ({{
                groupPercent(group.key, totalVotes, choiceGroups)
              }}%)
            </div>
          </div>
        </div>
        <div class="text-xs text-muted">
          {{ groupNames(group.key, choiceGroups) || "—" }}
        </div>
      </div>
      <div
        v-if="$slots.actions"
        class="flex items-center justify-between gap-3"
      >
        <slot name="actions" />
      </div>
      <UButton
        v-if="en_panachage"
        @click="emit('panacher', panachage, vote_pour)"
      >
        Panacher !
      </UButton>
    </div>
  </UCard>
</template>
