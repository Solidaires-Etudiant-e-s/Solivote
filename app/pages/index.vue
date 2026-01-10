<script setup lang="ts">
import type { TypeChoix } from "@prisma/client";

const {
  data: votes,
  status: voteStatus,
  execute: updateVotes,
} = await useLazyFetch("/api/votes");
const { data: user, status: userStatus } = await useLazyFetch("/api/role");
const {
  data: currentVote,
  status: currentVoteStatus,
  execute: updateCurrent,
} = await useLazyFetch("/api/vote/current");
const {
  data: currentRencontre,
  status: currentRencontreStatus,
  execute: updateCurrentRencontre,
} = await useLazyFetch("/api/rencontre/current");

const {
  open,
  send,
  status: wsStatus,
} = useWebSocket("/api/ws/vote", {
  immediate: false,
  async onMessage(ws, event) {
    if (typeof event.data === "string") {
      if (event.data === "vote") {
        await updateVotes();
      }
      if (event.data === "current") {
        await updateCurrent();
      }
    }
    await updateCurrentRencontre();
  },
});

onMounted(() => {
  open();
});

const updateAll = async () => {
  send("vote");
  send("current");
  await Promise.all([updateVotes(), updateCurrent(), updateCurrentRencontre()]);
};

const launch = async (id: number) => {
  await $fetch(`/api/vote/start/${id}`);
  await updateAll();
};

const voter = async (type: TypeChoix) => {
  await $fetch(`/api/vote/current`, {
    method: "POST",
    body: {
      type: type,
    },
  });
  send("current");
  await updateCurrent();
};

const finishedVotes = computed(() =>
  (votes.value ?? []).filter((vote) => vote.status !== "EN_VOTE"),
);

</script>

<template>
  <NuxtLayout>
    <template #header>
      <AppHeader
        v-if="currentRencontreStatus === 'success' && currentRencontre"
        :title="getRencontreName(currentRencontre)"
        :user="user"
        :status="userStatus"
        :ws-status="wsStatus"
      />
      <AppHeader
        v-else
        title="Votes"
        :user="user"
        :status="userStatus"
        :ws-status="wsStatus"
      />
    </template>

    <template #creation>
      <div class="w-4xl mx-auto">
        <p v-if="userStatus !== 'success'">Loading...</p>
        <template v-else-if="user!.role === 'syndicat'">
          <VoteCard
            v-if="currentVote"
            :vote="currentVote"
            :user="user"
            :execute="updateAll"
            :featured="true"
            @vote="(type) => voter(type as TypeChoix)"
          />
        </template>
        <VoteAdmin
          v-else-if="user!.role === 'admin'"
          :execute="updateAll"
          :current-vote="currentVote"
          :user="user"
          :current-vote-status="currentVoteStatus"
        />
      </div>
    </template>

    <template v-if="voteStatus === 'success' && userStatus === 'success'" #list>
      <div class="w-4xl mx-auto">
        <h2 class="text-xl my-4 font-bold">Votes terminés</h2>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="vote in finishedVotes"
            :key="vote.id"
            class="flex flex-col gap-2 basis-[320px] grow max-w-[420px]"
          >
            <VoteCard
              :featured="false"
              :vote="vote"
              :user="user"
              :execute="updateAll"
            />
            <UButton
              v-if="user!.role === 'admin'"
              icon="mingcute:rocket-line"
              color="success"
              variant="solid"
              :disabled="!!currentVote"
              @click.prevent="launch(vote.id)"
            >
              Lancer le vote
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </NuxtLayout>
</template>
