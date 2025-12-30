<script setup lang="ts">
import type {TableColumn} from "#ui/components/Table.vue";
import type {Sydicat} from "@prisma/client";

const {recontre, user, execute} = defineProps(['recontre', 'user', 'execute'])

const del = async (id: number) => {
  await $fetch('/api/rencontre', {method: 'delete', body: {id: id}})
  await execute()
}

const rencontreData = ref<Sydicat[]>(recontre.participant)

const columns: TableColumn<Sydicat>[] = [
  {
    accessorKey: 'nom',
    header: 'Syndicats présent',
  }
]

</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        {{ recontre.nom }}
        <UButton v-if="user.role === 'admin'" icon="i-lucide-trash" color="error" variant="solid" @click.prevent="del(recontre.id)"/>
      </div>
    </template>

    <UTable :data="rencontreData" class="flex-1 max-h-50" :columns :loading="recontre.status === 'EN_VOTE'"/>

    <template #footer>
      <div class="flex justify-around items-center">
        <slot/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>