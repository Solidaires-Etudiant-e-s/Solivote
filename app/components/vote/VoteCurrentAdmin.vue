<script setup lang="ts">
import type { Vote } from "@prisma/client";

type VoteLike = Pick<Vote, "id" | "nom" | "description" | "status"> & {
  choix: {
    date: Date | string;
    type: string;
    syndicat?: { nom?: string } | null;
  }[];
};

const props = defineProps<{
  user?: { role: string; name?: string } | null;
  execute: () => Promise<void> | void;
  currentVote?: VoteLike | null;
  currentVoteStatus?: string | null;
}>();

const { data: syndicats } = await useLazyFetch("/api/syndicat");
const syndicatCount = computed(() => syndicats.value?.length ?? 0);

const stop = async () => {
  await $fetch(`/api/vote/stop`);
  await props.execute();
};
</script>

<template>
  <div class="flex justify-center">
    <VoteCardLive
      v-if="props.currentVoteStatus === 'success' && props.currentVote"
      :vote="props.currentVote"
      :user="props.user"
    >
      <template #actions>
        <UButton
          icon="mingcute:choice-line"
          color="primary"
          @click.prevent="stop()"
        >
          Clôturer ({{
            syndicatCount - props.currentVote.choix.length
          }}
          restant{{
            syndicatCount - props.currentVote.choix.length === 1 ? "" : "s"
          }})
        </UButton>
      </template>
    </VoteCardLive>
  </div>
</template>
