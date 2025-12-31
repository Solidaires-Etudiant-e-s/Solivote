<script setup lang="ts">
</script>

<template>
  <div class="w-full">
    <slot name="header"/>
    <slot name="creation"/>

    <USeparator class="w-full m-5"/>

    <div class="flex flex-wrap justify-center overflow-y-auto max-h-screen gap-2 pb-50 p-2">
      <slot name="list">
        <template v-for="i in 30" :key="i">
          <USkeleton class="h-35 w-60 m-1"/>
        </template>
      </slot>
    </div>
  </div>
</template>

<style scoped>

</style>