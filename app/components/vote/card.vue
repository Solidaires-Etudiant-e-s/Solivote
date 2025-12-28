<script setup lang="ts">
import type {TableColumn} from "#ui/components/Table.vue";
import type {Vote} from "@prisma/client";
import {UBadge} from "#components";

const {vote, user, execute} = defineProps(['vote', 'user', 'execute'])

const del = async (id: number) => {
  await $fetch('/api/vote', {method: 'delete', body: {id: id}})
  await execute()
}

const voteData = ref<Vote[]>(vote.choix)

const columns: TableColumn<Vote>[] = [
  {
    accessorKey: 'syndicat',
    header: 'Syndicat',
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const color = {
        POUR: 'success' as const,
        CONTRE: 'error' as const,
      }[row.getValue('VoteStatus') as string]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
          row.getValue('type')
      )
    }
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      return new Date(row.getValue('date')).toLocaleString('fr-FR') //todo faire affichage date
    }
  }
]

</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        {{ vote.nom }}
        <UButton v-if="user.role === 'admin'" icon="i-lucide-trash" color="error" variant="solid" @click.prevent="del(vote.id)"/>
      </div>
    </template>

    <UTable :data="voteData" class="flex-1 max-h-50" :columns :loading="vote.status === 'EN_VOTE'"/>

    <template #footer>
      <div class="flex justify-around items-center">
        <slot/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>