<script setup lang="ts">
import { TypeVote } from "@prisma/client";

type Possibilite = {
  id: number;
  nom: string;
};

type VoteLike = {
  id: number;
  nom: string;
  description?: string;
  status: string;
  type: TypeVote;
  possibilites: Possibilite[];
};

const props = defineProps<{
  vote: VoteLike;
}>();
</script>

<template>
  <UCard class="w-full">
    <template #header>
      <div class="">
        <div class="flex flex-col gap-1 w-all">
          <div class="text-base font-serif flex justify-between">
            {{ props.vote.nom }}
            <UBadge>{{ props.vote.type }}</UBadge>
          </div>
          <div v-if="props.vote.description" class="text-xs text-muted">
            {{ props.vote.description }}
          </div>
          <div
            v-if="props.vote.type == TypeVote.CONDORCET"
            class="flex space-x-4 flex-wrap"
          >
            <template v-for="test in props.vote.possibilites" :key="test.id">
              <UBadge>{{ test.nom }}</UBadge>
            </template>
          </div>
        </div>
      </div>
    </template>

    <div v-if="$slots.actions" class="mt-2">
      <slot name="actions" />
    </div>
  </UCard>
</template>
