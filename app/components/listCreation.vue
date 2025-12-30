<script setup lang="ts">
</script>

<template>
  <div class="w-full">
    <slot name="header"/>
    <slot name="creation"/>

    <USeparator class="w-full m-5"/>

    <div class="flex flex-wrap gap-5 m-5 justify-center">
      <slot name="list">
        <template v-for="i in 30" :key="i">
          <USkeleton class="h-35 w-60 m-5"/>
        </template>
      </slot>
    </div>
  </div>
</template>

<style scoped>

</style>