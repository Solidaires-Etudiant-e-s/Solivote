<script setup lang="ts">
const {vote, user, execute} = defineProps(['vote', 'user', 'execute'])

const del = async (id: number) => {
  await $fetch('/api/vote', {method: 'delete', body: {id: id}})
  await execute()
}

const voteData = ref(vote.choix)

</script>

<template>
  <UCard  class="basis-80">
    <template #header>
      <div class="flex justify-between items-center">
        {{ vote.nom }}
        <UButton v-if="user.role === 'admin'" icon="i-lucide-trash" color="error" variant="solid" @click.prevent="del(vote.id)"/>
      </div>
    </template>

    <UTable :data="voteData" class="flex-1 max-h-20" :loading="vote.status === 'EN_VOTE'"/>

    <template #footer>
      <div class="flex justify-around items-center">
        <slot/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>