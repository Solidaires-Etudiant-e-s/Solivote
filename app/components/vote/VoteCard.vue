<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import { UBadge } from "#components";

type VoteLike = {
  id: number;
  nom: string;
  choix: VoteChoice[];
  status: string;
};

type VoteChoice = {
  date: Date | string;
  type: string;
  syndicat?: { nom?: string } | null;
  [key: string]: unknown;
};

const props = withDefaults(
  defineProps<{
    vote: VoteLike;
    user?: { role: string } | null;
    execute: () => Promise<void> | void;
  }>(),
  {
    user: null,
  },
);

const del = async (id: number) => {
  await $fetch("/api/vote", { method: "delete", body: { id: id } });
  await props.execute();
};

const columns: TableColumn<VoteChoice>[] = [
  {
    accessorKey: "syndicat.nom",
    header: "Syndicat",
    cell: ({ row }) => {
      return (
        (row.getValue("syndicat_nom") as string).charAt(0).toUpperCase() +
        (row.getValue("syndicat_nom") as string).slice(1)
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const color = {
        POUR: "success" as const,
        CONTRE: "error" as const,
      }[row.getValue("type") as string];

      return h(UBadge, { class: "capitalize", variant: "subtle", color }, () =>
        row.getValue("type"),
      );
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      return new Date(row.getValue("date")).toLocaleString("fr-FR"); //todo faire affichage date
    },
  },
];
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center">
        {{ props.vote.nom }}
        <UButton
          v-if="props.user?.role === 'admin'"
          :disabled="props.vote.choix.length !== 0"
          icon="i-lucide-trash"
          color="error"
          variant="solid"
          @click.prevent="del(props.vote.id)"
        />
      </div>
    </template>

    <UTable
      :data="props.vote.choix"
      class="flex-1 max-h-50"
      :columns
      :loading="props.vote.status === 'EN_VOTE'"
    />

    <template #footer>
      <div class="flex justify-around items-center">
        <slot />
      </div>
    </template>
  </UCard>
</template>

<style scoped></style>
