<script setup lang="ts">
const props = defineProps(['title', 'user', 'status'])
</script>

<template>
  <UHeader>
    <template #title>
      {{ props.title }}
    </template>

    <template v-if="props.status && props.status === 'success'" #right>
      <ULink>
        <u-user :name="props.user.name" :description="props.user.role"/>
      </ULink>
    </template>
  </UHeader>
</template>

<style scoped>

</style>