<script setup lang="ts">
const props = defineProps(['title', 'user', 'status', "wsStatus"])
</script>

<template>
  <UHeader>
    <template #title>
      {{ props.title }}
    </template>

    <template v-if="props.status && props.status === 'success'" #right>

      <UBadge v-if="props.wsStatus == 'OPEN'">Connecté</UBadge>
      <UBadge v-else color="error">Déconnecté</UBadge>

      <ULink v-if="props.user">
        <u-user :name="props.user.name.charAt(0).toUpperCase() + props.user.name.slice(1)" :description="props.user.role"/>
      </ULink>
    </template>
  </UHeader>
</template>

<style scoped>

</style>