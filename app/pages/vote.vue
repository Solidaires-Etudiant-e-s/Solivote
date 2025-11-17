<script setup lang="ts">
  const {data: votes, status: voteStatus, execute} = await useLazyFetch("/api/votes")
  const {data: user, status: roleStatus} = await useLazyFetch("/api/role")

  const {name: _, role} = user.value
</script>

<template>
  <div class="w-full">
    <app-header title="votes" :user="user"/>
    <div v-if="roleStatus === 'success'">

      <template v-if="role === 'syndicat'">
        Syndicat
      </template>
      <vote-admin v-else-if="role === 'admin'" :execute="execute"/>

    </div>

    <USeparator class="w-full m-5"/>

    <div class="flex flex-wrap gap-5 m-5 justify-center">
      <template v-if="voteStatus === 'success'">
        <UCard v-for="vote in votes" :key="vote.id" class="basis-80">
          <template #header>
            {{ vote.nom }} <UBadge color="neutral"> {{vote.statut}} </UBadge>
          </template>

          content
        </UCard>
      </template>
      <template v-for="i in 1" v-else :key="i">
        <USkeleton class="h-35 w-60 m-5"/>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>