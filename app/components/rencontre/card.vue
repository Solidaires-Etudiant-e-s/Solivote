<script setup lang="ts">
import type {TableColumn} from "#ui/components/Table.vue";
import type {Sydicat} from "@prisma/client";

const {rencontre, user, execute} = defineProps(['rencontre', 'user', 'execute'])

const del = async (id: number) => {
  await $fetch('/api/rencontre', {method: 'delete', body: {id: id}})
  await execute()
}

const rencontreData = ref<Sydicat[]>(rencontre.participants)

const columns: TableColumn<Sydicat>[] = [
  {
    accessorKey: 'nom',
    header: 'Syndicats présent',
  }
]

const { locale } = useI18n()
const date = new Date(rencontre.dateDebut)

</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        {{ rencontre.type }} de {{ new Intl.DateTimeFormat(locale, { month: "long" }).format(date) }} {{ date.getFullYear() }}
        <UButton v-if="user.role === 'admin'" icon="i-lucide-trash" color="error" variant="solid" @click.prevent="del(rencontre.id)"/>
      </div>
    </template>

    <UTable :data="rencontreData" class="flex-1 max-h-50" :columns :loading="rencontre.status === 'DEMARE'"/>

    <template #footer>
      <div class="flex justify-around items-center">
        <slot/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>