<script setup lang="ts">
const props = defineProps(['title', 'user'])
</script>

<template>
  <UHeader>
    <template #title>
      {{ props.title }}
    </template>

    <template #right>
      <ULink>
        <u-user :name="props.user.name" :description="props.user.role"/>
      </ULink>
    </template>
  </UHeader>
</template>

<style scoped>

</style>