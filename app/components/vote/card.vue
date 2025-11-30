<script setup lang="ts">
const {vote, user, userStatus, execute} = defineProps(['vote', 'user', 'userStatus', 'execute'])

const del = async (id: number) => {
  await $fetch('/api/vote', {method: 'delete', body: {id: id}})
  await execute()
}

const launch = async (id: number) => {
  await $fetch(`/api/vote/start/${id}`)
  await execute()
}

const stop = async () => {
  await $fetch(`/api/vote/stop`)
  await execute()
}

</script>

<template>
  <UCard  class="basis-80">
    <template #header>
      <div class="flex justify-between items-center">
        {{ vote.nom }}
        <UButton v-if="user.role === 'admin'" icon="i-lucide-trash" color="error" variant="solid" @click.prevent="del(vote.id)"/>
      </div>
    </template>

    <div v-if="userStatus === 'success' && user.role === 'admin'" class="flex justify-around items-center">
      <template v-if="vote.status === 'INITAL'">
        <UButton icon="i-lucide-rocket" color="success" variant="solid" @click.prevent="launch(vote.id)"> Lancer le vote </UButton>
      </template>
      <template v-else-if="vote.status === 'EN_VOTE'">
        <UButton icon="i-lucide-vote" color="info" variant="solid" @click.prevent="stop()"> Clôturer le vote </UButton>
      </template>
    </div>
  </UCard>
</template>

<style scoped>

</style>