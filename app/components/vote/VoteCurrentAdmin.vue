<script setup lang="ts">
const props = defineProps<{
  user?: { role: string; name?: string } | null;
  currentVote?: Vote | null;
  currentVoteStatus?: string | null;
  syndicatsRemaining?: Syndicat[] | null;
}>();

const { data: votesCache } = useNuxtData<Vote[]>("votes");
const { data: currentVoteCache } = useNuxtData<Vote | null>("vote-current");
const isStoppingVote = ref(false);
const optimisticallyStopped = ref(false);
const displayCurrentVote = computed(() =>
  optimisticallyStopped.value ? null : props.currentVote,
);

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
  (
      event: "condorcet",
      values: { ranking: { key: number | string; label: string }[]; mandat: number }[],
      selected: string,
    ): void;
}>();

const voteCardLiveRef = ref<{ refreshSyndicats: () => Promise<void> } | null>(null);
defineExpose({
  refreshSyndicats: () => voteCardLiveRef.value?.refreshSyndicats(),
});
</script>

<template>
  <div class="w-full">
    <VoteCardLive
      v-if="props.currentVoteStatus === 'success' && displayCurrentVote"
      ref="voteCardLiveRef"
      :vote="displayCurrentVote"
      :user="props.user"
      :syndicats-remaining="syndicatsRemaining"
      @vote="(type, selected) => emit('vote', type, selected)"
      @panacher="(panache, selected) => emit('panacher', panache, selected)"
      @condorcet="
        (choiceMeta, vote_pour) => emit('condorcet', choiceMeta, vote_pour)
      "
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
          Clôturer ({{ props.syndicatsRemaining?.length }} restant{{
            props.syndicatsRemaining?.length === 1 ? "" : "s"
          }})
        </UButton>
      </template>
    </VoteCardLive>
  </div>
</template>
