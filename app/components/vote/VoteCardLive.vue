<script setup lang="ts">
import { UBadge } from "#components";
import { TypeVote } from "~/utils/backendTypes";

const props = withDefaults(
  defineProps<{
    vote: Vote & {texte: Texte};
    user?: { role: string; name?: string } | null;
    syndicatsRemaining?: Syndicat[] | null;
  }>(),
  {
    user: null,
    syndicatsRemaining: null,
  },
);

const { data: syndicats, status: syndicatsStatus } = await useLazyFetch(
  "/api/syndicat/current/all",
);

const syndicatsName = computed(() => {
  const s = (syndicats.value as Syndicat[] | null)?.map((e) => e.nom) ?? [];
  return s;
});

const emit = defineEmits<{
  (event: "vote", type: string, selected: string): void;
  (event: "panacher", values: Panache, selected: string): void;
  (
    event: "condorcet",
    values: { key: number | string; label: string }[],
    selected: string,
  ): void;
}>();

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

const choiceMeta = ref(computed(() => {
  const base = [];
  if (props.vote.type === TypeVote.STANDARD) {
    base.push({ key: "POUR", label: "Pour" });
    base.push({ key: "CONTRE", label: "Contre" });
    base.push({ key: "ABSTENTION", label: "Abstention" });
    base.push({ key: "NPPV", label: "NPPV" });
  } else if (props.vote.type === TypeVote.EN_CONTRE) {
    for (const i of props.vote.possibilites ?? []) {
      base.push({ key: i.id, label: i.nom });
    }
    base.push({ key: "ABSTENTION", label: "Abstention" });
    base.push({ key: "NPPV", label: "NPPV" });
  } else {
    for (const i of props.vote.possibilites ?? []) {
      base.push({ key: i.id, label: i.nom });
    }
  }
  return base;
}).value);

type Panache = Record<string, number>;

const en_panachage = ref(false);
const panachage = ref({} as Panache);
const sum_panachage = computed(() => {
  let sum = 0;
  for (const i in panachage.value) {
    sum += panachage.value[i]!;
  }
  return sum;
});
const selectedUnionName = computed(() =>
  props.user?.role === "syndicat" ? (props.user?.name ?? "") : vote_pour.value,
);
const selectedChoiceKey = computed(() => {
  const name = selectedUnionName.value.trim().toLowerCase();
  if (!name) return null;

  const voteChoice = props.vote.choix.find(
    (choice) => choice.syndicat?.nom?.toLowerCase() === name,
  );
  if (!voteChoice) return null;

  const positive = voteChoice.choix.filter((entry) => Number(entry.mandat) > 0);
  if (positive.length !== 1) return null;

  return String(positive[0]!.type);
});
const availableMandats = computed(() => {
  const name = selectedUnionName.value.trim().toLowerCase();
  if (!name) return 0;
  const list = (syndicats.value as Syndicat[] | null) ?? [];
  const found = list.find((item) => item.nom.toLowerCase() === name);
  if (!found) return 0;
  const forCurrentRencontre = found.mandats.filter(
    (m) => m.rencontreId === props.vote.texte.rencontreId,
  );
  return forCurrentRencontre.reduce((sum, m) => sum + (m.mandat ?? 0), 0);
});

const totalVotes = computed(() => {
  let total = 0;
  for (const i of props.vote.choix) {
    for (const y of i.choix) {
      const mandat = Number(y?.mandat ?? 0);
      total += Number.isFinite(mandat) ? mandat : 0;
    }
  }

  return total;
});

const percentFor = (key: string | number) => {
  const count = Number(groupCount(String(key), choiceGroups.value));
  const total = Number(totalVotes.value);

  if (!Number.isFinite(count) || !Number.isFinite(total)) {
    return 0;
  }

  if (total <= 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
};

const vote_pour = ref("");

watch(vote_pour, () => {
  en_panachage.value = false;
  panachage.value = {};
});
</script>

<template>
  <UCard class="w-full h-max mt-3 sm:mt-4">
    <template #header>
      <div class="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div class="flex flex-col gap-1 min-w-0">
          <div class="text-lg sm:text-xl font-serif wrap-break-word">
            {{ props.vote.nom }}
          </div>
          <div v-if="props.vote.description" class="text-xs text-muted wrap-break-word">
            {{ props.vote.description }}
          </div>
        </div>
        <div class="flex items-center gap-2 flex-wrap shrink-0">
          <!-- <UButton icon="mingcute:refresh-3-fill" @click.prevent="props.execute" /> -->
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
        class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-4">
        Voter à la place de :
        <UInputMenu v-model="vote_pour" :items="syndicatsName" class="w-full sm:w-auto" />
      </div>
      <div
        v-if="(props.user?.role === 'syndicat' && availableMandats > 1) || vote_pour && vote.type !== 'CONDORCET'"
        class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-4">
        <span>Panachage ({{ availableMandats }} mandat{{
          availableMandats > 1 ? "s" : ""
          }})</span>
        <USwitch v-model="en_panachage" />
      </div>
      <template v-if="vote.type !== TypeVote.CONDORCET">
        <div v-for="group in choiceMeta" :key="group.key" class="flex flex-col gap-2">
          <div class="flex items-start gap-3">
            <div v-if="props.user?.role === 'syndicat' || vote_pour" class="shrink-0 self-center flex items-center">
              <UButton
                v-if="!en_panachage" :icon="selectedChoiceKey === String(group.key)
                ? 'mingcute:check-fill'
                : 'mingcute:square-line'
                " :color="selectedChoiceKey === String(group.key) ? 'primary' : 'neutral'
                  " :variant="selectedChoiceKey === String(group.key) ? 'solid' : 'outline'
                    " @click="emit('vote', String(group.key), vote_pour)" />
              <UInputNumber
                v-else v-model="panachage[group.key]" :min="0" :max="(panachage[group.key] ?? 0) + availableMandats - sum_panachage
                " :default-value="0" class="w-20 sm:w-24" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col gap-1.5">
              <span class="text-sm font-medium sm:font-normal">{{
                group.label
              }}</span>
              <div class="relative h-8 w-full rounded-sm bg-secondary-200 overflow-hidden">
                <div
                  class="h-full transition-[width] duration-500 ease-out" :class="percentFor(group.key) > 0 ? 'bg-primary' : 'bg-secondary'
                  " :style="{
                    width: `${percentFor(group.key)}%`,
                  }" />
                <div
                  class="absolute inset-0 flex items-center justify-start pl-3 text-xs font-semibold" :class="percentFor(group.key) === 0 ? 'text-muted' : 'text-white'
                  ">
                  {{ groupCount(String(group.key), choiceGroups) }}
                  ({{ percentFor(group.key) }}%)
                </div>
              </div>
              <div class="text-xs text-muted">
                {{ groupNames(String(group.key), choiceGroups) || "—" }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="props.user?.role === 'syndicat' || vote_pour">
        <draggable v-model="choiceMeta" :animation="150">
          <div v-for="group in choiceMeta" :key="group.key" class="flex flex-col gap-2 drag-item">
            {{ group.label }}
          </div>
        </draggable>
        <UButton
          class="w-full sm:w-auto"
          @click="emit('condorcet', choiceMeta, vote_pour)">
          Voter !
        </UButton>
      </template>
      <UButton
        v-if="en_panachage" class="w-full sm:w-auto" :disabled="sum_panachage !== availableMandats"
        @click="emit('panacher', panachage, vote_pour)">
        Panacher !
        <template v-if="sum_panachage !== availableMandats">
          manque {{ availableMandats - sum_panachage }} mandats
        </template>
      </UButton>
      <slot name="actions" />

    </div>
    <template v-if="syndicatsRemaining && syndicatsRemaining.length > 0" #footer>
      <span class="text-sm">Syndicats restants:</span>
      <div class="w-full flex flex-row gap-3 pt-2">
        <UBadge v-for="syndicat in syndicatsRemaining" :key="syndicat.id">{{ syndicat.nom }}</UBadge>
      </div>

    </template>
  </UCard>
</template>
