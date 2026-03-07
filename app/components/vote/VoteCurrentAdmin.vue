<script setup lang="ts">
type VoteLike = VotePayload;

const props = defineProps<{
  user?: { role: string; name?: string } | null;
  execute: () => Promise<void> | void;
  currentVote?: VoteLike | null;
  currentVoteStatus?: string | null;
  syndicatsRemaining?: Syndicat[] | null;
}>();

const { data: syndicats } = await useLazyFetch("/api/syndicat");
const { data: votesCache } = useNuxtData<VoteLike[]>("votes");
const { data: currentVoteCache } = useNuxtData<VoteLike | null>("vote-current");
const syndicatCount = computed(() => syndicats.value?.length ?? 0);
const isStoppingVote = ref(false);
const optimisticallyStopped = ref(false);
const displayCurrentVote = computed(() =>
  optimisticallyStopped.value ? null : props.currentVote,
);
const remainingCount = computed(() => {
  const current = displayCurrentVote.value;
  if (!current) return syndicatCount.value;
  return syndicatCount.value - current.choix.length;
});

watch(
  () => props.currentVote?.id,
  (id) => {
    if (id != null) {
      optimisticallyStopped.value = false;
    }
  },
);

const stop = async () => {
  if (isStoppingVote.value) return;
  const previousVotes = structuredClone(votesCache.value ?? []);
  const previousCurrentVote = structuredClone(currentVoteCache.value);
  const previousOptimisticState = optimisticallyStopped.value;
  isStoppingVote.value = true;
  optimisticallyStopped.value = true;

  if (props.currentVote && votesCache.value) {
    votesCache.value = votesCache.value.map((vote) => ({
      ...vote,
      status:
        vote.id === props.currentVote!.id ? StatusVote.CLOTURE : vote.status,
    }));
  }
  currentVoteCache.value = null;

  try {
    await $fetch(`/api/vote/stop`, { method: "POST" });
  } catch {
    votesCache.value = previousVotes;
    currentVoteCache.value = previousCurrentVote;
    optimisticallyStopped.value = previousOptimisticState;
  } finally {
    isStoppingVote.value = false;
  }
};

type Panache = Record<string, number>;

const emit = defineEmits<{
  (event: "vote", type: string, selected: string): void;
  (event: "panacher", values: Panache, selected: string): void;
}>();
</script>

<template>
  <div class="w-full">
    <VoteCardLive
      v-if="props.currentVoteStatus === 'success' && displayCurrentVote"
      :vote="displayCurrentVote"
      :user="props.user"
      :execute="execute"
      :syndicats-remaining="syndicatsRemaining"
      @vote="(type, selected) => emit('vote', type, selected)"
      @panacher="(panache, selected) => emit('panacher', panache, selected)"
    >
      <template #actions>
        <UButton
          icon="mingcute:choice-line"
          color="primary"
          class="w-full sm:w-auto"
          :loading="isStoppingVote"
          :disabled="isStoppingVote"
          @click.prevent="stop()"
        >
          Clôturer ({{ remainingCount }} restant{{
            remainingCount === 1 ? "" : "s"
          }})
        </UButton>
      </template>
    </VoteCardLive>
  </div>
</template>
