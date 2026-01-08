<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { type Mandat, StatusRencontre } from "@prisma/client";
import getRencontreName from "~/utils/getRencontreName";

type RencontreLike = {
  id: number;
  status: StatusRencontre;
  mandats: Mandat[];
  dateDebut: Date | string;
  type: string;
};

const props = withDefaults(
  defineProps<{
    rencontre: RencontreLike;
    user?: { role: string } | null;
    execute: (self?: boolean) => Promise<void> | void;
  }>(),
  {
    user: null,
  },
);

const isDemareOrCloture = computed(
  () =>
    props.rencontre.status === StatusRencontre.DEMARE ||
    props.rencontre.status === StatusRencontre.CLOTURE,
);

const del = async (id: number) => {
  await $fetch("/api/rencontre", { method: "delete", body: { id: id } });
  await props.execute();
};

const rencontreData = ref<Mandat[]>(props.rencontre.mandats);

const columns: TableColumn<Mandat>[] = [
  {
    accessorKey: "syndicat.nom",
    header: "Syndicats présents",
  },
  {
    accessorKey: "mandat",
    header: "Mandats",
  },
  {
    id: "action",
  },
];

const toast = useToast();
const delSyndicat = async (id: number) => {
  const result = await $fetch("/api/rencontre/syndicat", {
    method: "delete",
    body: {
      id: props.rencontre.id,
      syndicatID: id,
    },
  });

  if (result) {
    toast.add({ title: "Success", color: "success" });
    await props.execute();
  }
};

const updateMandat = async (
  syndicatId: number,
  rencontreId: number,
  newmandat: number,
) => {
  const result = await $fetch("/api/rencontre/mandat", {
    method: "POST",
    body: {
      syndicatId,
      rencontreId,
      mandat: newmandat,
    },
  });

  if (result) {
    toast.add({ title: "Success", color: "success" });
    await props.execute(false);
  }
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        {{ getRencontreName(props.rencontre) }}
        <UBadge>{{ props.rencontre.status }}</UBadge>
        <UButton
          v-if="props.user?.role === 'admin'"
          :disabled="props.rencontre.mandats.length !== 0 || isDemareOrCloture"
          icon="mingcute:delete-line"
          color="error"
          variant="solid"
          @click.prevent="del(props.rencontre.id)"
        />
      </div>
    </template>

    <UTable
      :data="rencontreData"
      class="flex-1 max-h-50"
      :columns
      :loading="props.rencontre.status === 'DEMARE'"
    >
      <template
        v-if="props.user?.role === 'admin' && !isDemareOrCloture"
        #mandat-cell="{ row }"
      >
        <UInputNumber
          v-model="row.original!.mandat"
          :min="1"
          @blur="
            updateMandat(
              row.original!.syndicatId,
              row.original!.rencontreId,
              row.original!.mandat,
            )
          "
        />
      </template>
      <template
        v-if="props.user?.role === 'admin' && !isDemareOrCloture"
        #action-cell="{ row }"
      >
        <UButton
          color="error"
          icon="mingcute:delete-line"
          @click="delSyndicat(row.original!.syndicatId)"
        />
      </template>
    </UTable>

    <template #footer>
      <div class="flex justify-around items-center">
        <slot />
      </div>
    </template>
  </UCard>
</template>

<style scoped></style>
