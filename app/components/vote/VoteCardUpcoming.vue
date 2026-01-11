<script setup lang="ts">
type VoteLike = {
  id: number;
  nom: string;
  description?: string;
  status: string;
};

const props = defineProps<{
  vote: VoteLike;
}>();
</script>

<template>
  <UCard class="w-full">
    <template #header>
      <div class="flex justify-between items-start">
        <div class="flex flex-col gap-1">
          <div class="text-base font-serif">
            {{ props.vote.nom }}
          </div>
          <div v-if="props.vote.description" class="text-xs text-muted">
            {{ props.vote.description }}
          </div>
        </div>
      </div>
    </template>

    <div v-if="$slots.actions" class="mt-2">
      <slot name="actions" />
    </div>
  </UCard>
</template>

