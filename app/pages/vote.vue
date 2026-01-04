<script setup lang="ts">
  import {TypeChoix} from "@prisma/client";

  const {data: votes, status: voteStatus, execute: updateVotes} = await useLazyFetch("/api/votes")
  const {data: user, status: userStatus} = await useLazyFetch("/api/role")
  const {data: currentVote, status: currentVoteStatus, execute: updateCurrent} = await useLazyFetch("/api/vote/current")
  const {data: currentRencontre, status: currentRencontreStatus, execute: updateCurrentRencontre} = await useLazyFetch("/api/rencontre/current")

  const { open, send, status: wsStatus } = useWebSocket('/api/ws/vote', {
    immediate: false,
    async onMessage(ws, event) {
      if (typeof event.data === 'string') {
        if (event.data === "vote") {
          await updateVotes()
        }
        if (event.data === "current") {
          await updateCurrent()
        }
      }
      await updateCurrentRencontre()
    },
  })

  onMounted(() => {
    open()
  })

  const updateAll = () => {
    send('vote')
    updateVotes()
    send('current')
    updateCurrent()
    updateCurrentRencontre()
  }

  const launch = async (id: number) => {
    await $fetch(`/api/vote/start/${id}`)
    updateAll()
  }

  const voter = async (type: TypeChoix) => {
    await $fetch(`/api/vote/current`, {
      method: 'POST',
      body: {
        type: type
      }
    })
    send('current')
    updateCurrent()
  }

</script>

<template>
  <list-creation>
    <template #header>
      <app-header v-if="currentRencontreStatus === 'success' && currentRencontre" :title="getRencontreName(currentRencontre)" :user="user" :status="userStatus" :ws-status="wsStatus"/>
      <app-header v-else title="Votes" :user="user" :status="userStatus" :ws-status="wsStatus"/>
    </template>

    <template #creation>
        <p v-if="userStatus !== 'success'"> Loading... </p>
        <template v-else-if="user!.role === 'syndicat'">
          <vote-card v-if="currentVote" :vote="currentVote" :user="user" :execute="updateAll">
            <UButton icon="i-lucide-square-check" color="success" variant="solid" @click.prevent="voter(TypeChoix.POUR)"> Pour </UButton>
            <UButton icon="i-lucide-square-x" color="error" variant="solid" @click.prevent="voter(TypeChoix.CONTRE)"> Contre </UButton>
          </vote-card>
        </template>
        <vote-admin v-else-if="user!.role === 'admin'" :execute="updateAll" :current-vote="currentVote" :user="user" :current-vote-status="currentVoteStatus"/>
    </template>

    <template v-if="voteStatus === 'success' && userStatus === 'success'" #list>
      <template v-for="vote in votes" :key="vote.id">
        <vote-card v-if="vote.status !== 'EN_VOTE'" class="basis-100" :vote="vote" :user="user" :execute="updateAll">
          <UButton v-if="user!.role === 'admin'" icon="i-lucide-rocket" color="success" variant="solid" :disabled="!!currentVote" @click.prevent="launch(vote.id)"> Lancer le vote </UButton>
        </vote-card>
      </template>
    </template>
  </list-creation>
</template>

<style scoped>

</style>