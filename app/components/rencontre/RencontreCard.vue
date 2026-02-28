<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
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

const { data: rencontresCache } = useNuxtData<RencontreLike[]>("/api/rencontre");
const isDeletingRencontre = ref(false);
const isMutatingMandats = ref(false);
const mandatSnapshots = ref<Record<string, number>>({});
const mandatKey = (syndicatId: number, rencontreId: number) =>
    `${syndicatId}:${rencontreId}`;

const del = async (id: number) => {
    if (isDeletingRencontre.value) return;
    const previousRencontres = structuredClone(rencontresCache.value ?? []);
    isDeletingRencontre.value = true;

    if (rencontresCache.value) {
        rencontresCache.value = rencontresCache.value.filter(
            (rencontre) => rencontre.id !== id,
        );
    }

    try {
        await $fetch("/api/rencontre", { method: "delete", body: { id } });
        await props.execute();
    } catch {
        rencontresCache.value = previousRencontres;
        toast.add({
            title: "Suppression impossible",
            description: "La rencontre n'a pas pu être supprimée.",
            color: "error",
        });
    } finally {
        isDeletingRencontre.value = false;
    }
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
    if (isMutatingMandats.value) return;
    const previousMandats = structuredClone(rencontreData.value);
    const previousRencontres = structuredClone(rencontresCache.value ?? []);
    isMutatingMandats.value = true;

    rencontreData.value = rencontreData.value.filter(
        (mandat) => mandat.syndicatId !== id,
    );
    if (rencontresCache.value) {
        const rencontre = rencontresCache.value.find(
            (item) => item.id === props.rencontre.id,
        );
        if (rencontre) {
            rencontre.mandats = rencontre.mandats.filter(
                (mandat) => mandat.syndicatId !== id,
            );
        }
    }

    try {
        await $fetch("/api/rencontre/syndicat", {
            method: "delete",
            body: {
                id: props.rencontre.id,
                syndicatID: id,
            },
        });
        toast.add({
            title: "Syndicat retiré",
            description: "Le syndicat a été retiré de la rencontre.",
            color: "success",
        });
        await props.execute();
    } catch {
        rencontreData.value = previousMandats;
        rencontresCache.value = previousRencontres;
        toast.add({
            title: "Retrait impossible",
            description: "Le syndicat n'a pas pu être retiré.",
            color: "error",
        });
    } finally {
        isMutatingMandats.value = false;
    }
};

const updateMandat = async (
    syndicatId: number,
    rencontreId: number,
    newmandat: number,
) => {
    if (isMutatingMandats.value) return;
    const row = rencontreData.value.find(
        (mandat) =>
            mandat.syndicatId === syndicatId &&
            mandat.rencontreId === rencontreId,
    );
    const key = mandatKey(syndicatId, rencontreId);
    const previousMandat = mandatSnapshots.value[key] ?? row?.mandat ?? newmandat;
    isMutatingMandats.value = true;

    try {
        await $fetch("/api/rencontre/mandat", {
            method: "POST",
            body: {
                syndicatId,
                rencontreId,
                mandat: newmandat,
            },
        });
        mandatSnapshots.value[key] = newmandat;
        toast.add({
            title: "Mandat mis à jour",
            description: "Le nombre de mandats a été enregistré.",
            color: "success",
        });
    } catch {
        if (row) {
            row.mandat = previousMandat;
        }
        toast.add({
            title: "Mise à jour impossible",
            description: "Le nombre de mandats n'a pas pu être enregistré.",
            color: "error",
        });
    } finally {
        isMutatingMandats.value = false;
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
                    :disabled="
                        isDeletingRencontre ||
                        props.rencontre.mandats.length !== 0 ||
                        isDemareOrCloture
                    "
                    icon="mingcute:delete-line"
                    color="error"
                    variant="solid"
                    :loading="isDeletingRencontre"
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
                    @focus="
                        mandatSnapshots[
                            mandatKey(
                                row.original!.syndicatId,
                                row.original!.rencontreId,
                            )
                        ] = row.original!.mandat
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
                    :loading="isMutatingMandats"
                    :disabled="isMutatingMandats"
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
