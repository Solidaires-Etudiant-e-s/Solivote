<script setup lang="ts">
import type {TableColumn} from "#ui/components/Table.vue";
import type {mandat} from "@prisma/client";

const {rencontre, user, execute} = defineProps(['rencontre', 'user', 'execute'])

const del = async (id: number) => {
  await $fetch('/api/rencontre', {method: 'delete', body: {id: id}})
  await execute()
}

const rencontreData = ref<mandat[]>(rencontre.mandats)

const columns: TableColumn<mandat>[] = [
  {
    accessorKey: 'syndicat.nom',
    header: 'Syndicats présent',
  },
  {
    accessorKey: 'mandat',
    header: 'Mandats'
  },
  {
    id: 'action'
  }
]

const toast = useToast()
const delSyndicat = async (id: number) => {
  const result = await $fetch('/api/rencontre/syndicat', {
    method: 'delete',
    body: {
      id: rencontre.id,
      syndicatID: id,
    }
  })

  if (result) {
    toast.add({title: 'Success', color: 'success'})
    await execute()
  }
}

const updateMandat = async (syndicatId: number, rencontreId: number, newmandat: number) => {
  const result = await $fetch('/api/rencontre/mandat', {
    method: 'POST',
    body: {
      syndicatId,
      rencontreId,
      mandat: newmandat
    }
  })

  if (result) {
    toast.add({title: 'Success', color: 'success'})
    await execute(false)
  }
}

const { locale } = useI18n()
const date = new Date(rencontre.dateDebut)

</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        {{ rencontre.type }} de {{ new Intl.DateTimeFormat(locale, { month: "long" }).format(date) }} {{ date.getFullYear() }}
        <UButton v-if="user.role === 'admin'" :disabled="rencontre.mandats.length !== 0" icon="i-lucide-trash" color="error" variant="solid" @click.prevent="del(rencontre.id)"/>
      </div>
    </template>

    <UTable :data="rencontreData" class="flex-1 max-h-50" :columns :loading="rencontre.status === 'DEMARE'">
      <template v-if="user.role === 'admin'" #mandat-cell="{ row }">
        <UInputNumber v-model="row.original!.mandat" :min="1" @blur="updateMandat(row.original!.syndicatId, row.original!.rencontreId, row.original!.mandat)"/>
      </template>
      <template v-if="user.role === 'admin'" #action-cell="{ row }">
        <UButton color="error" icon="i-lucide-trash" @click="delSyndicat(row.original!.syndicatId)"/>
      </template>
    </UTable>

    <template #footer>
      <div class="flex justify-around items-center">
        <slot/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>