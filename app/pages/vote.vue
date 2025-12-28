<script setup lang="ts">
  import {Type} from "@prisma/client";

  const {data: votes, status: voteStatus, execute: updateVotes} = await useLazyFetch("/api/votes")
  const {data: user, status: userStatus} = await useLazyFetch("/api/role")
  const {data: currentVote, status: currentVoteStatus, execute: updateCurrent} = await useLazyFetch("/api/vote/current")

  const { open, send } = useWebSocket('/api/ws/vote', {
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
  }

  const launch = async (id: number) => {
    await $fetch(`/api/vote/start/${id}`)
    updateAll()
  }

  const voter = async (type: Type) => {
    await $fetch(`/api/vote/current`, {
      method: 'POST',
      body: {
        type: type
      }
    })
    updateAll()
  }

</script>

<template>
  <div class="w-full">
    <app-header title="votes" :user="user" :status="userStatus"/>
    <div>

      <p v-if="userStatus !== 'success'"> Loading... </p>
      <template v-else-if="user.role === 'syndicat'">
        <vote-card v-if="currentVoteStatus === 'success' && currentVote" :vote="currentVote" :user="user" :execute="updateAll">
          <UButton icon="i-lucide-square-check" color="success" variant="solid" @click.prevent="voter(Type.POUR)"> Pour </UButton>
          <UButton icon="i-lucide-square-x" color="error" variant="solid" @click.prevent="voter(Type.CONTRE)"> Contre </UButton>
        </vote-card>
      </template>
      <vote-admin v-else-if="user.role === 'admin'" :execute="updateAll" :current-vote="currentVote" :user="user" :user-status="userStatus" :current-vote-status="currentVoteStatus"/>

    </div>

    <USeparator class="w-full m-5"/>

    <div class="flex flex-wrap gap-5 m-5 justify-center">
      <template v-if="voteStatus === 'success' && userStatus === 'success'">
        <template v-for="vote in votes" :key="vote.id">
          <vote-card v-if="vote.status !== 'EN_VOTE'" class="basis-100" :vote="vote" :user="user" :execute="updateAll">
            <UButton icon="i-lucide-rocket" color="success" variant="solid" :disabled="!!currentVote" @click.prevent="launch(vote.id)"> Lancer le vote </UButton>
          </vote-card>
        </template>
      </template>
      <template v-for="i in 30" v-else :key="i">
        <USkeleton class="h-35 w-60 m-5"/>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>