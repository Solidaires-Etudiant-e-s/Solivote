<script setup lang="ts">
  const {data: votes, status: voteStatus, execute: executeVotes} = await useLazyFetch("/api/votes")
  const {data: user, status: userStatus} = await useLazyFetch("/api/role")
  const {data: currentVote, status: currentVoteStatus, execute: executeCurrent} = await useLazyFetch("/api/vote/current")

  const execute = () => {
    executeVotes()
    executeCurrent()
  }

</script>

<template v-if="VoteStatus">
  <div class="w-full">
    <app-header title="votes" :user="user" :status="userStatus"/>
    <div>

      <p v-if="userStatus !== 'success'"> Loading... </p>
      <template v-else-if="user.role === 'syndicat'">
        Syndicat
      </template>
      <vote-admin v-else-if="user.role === 'admin'" :execute="execute" :current-vote="currentVote" :user="user" :user-status="userStatus" :current-vote-status="currentVoteStatus"/>

    </div>

    <USeparator class="w-full m-5"/>

    <div class="flex flex-wrap gap-5 m-5 justify-center">
      <template v-if="voteStatus === 'success' && userStatus === 'success'">
        <template v-for="vote in votes" :key="vote.id">
          <vote-card v-if="vote.status !== 'EN_VOTE'" :vote="vote" :user="user" :user-status="userStatus" :execute="execute"/>
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