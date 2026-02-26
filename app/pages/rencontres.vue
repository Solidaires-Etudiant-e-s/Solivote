<script setup lang="ts">
const {
    data: rencontres,
    status: rencontreStatus,
    execute: updateRencontres,
} = useLazyFetch("/api/rencontre");
const { data: user, status: userStatus } = await useLazyFetch("/api/role");
watch(user, async () => {
    await updateRencontresAndDetails();
});

const updateRencontresAndDetails = async () => {
    await updateRencontres();
    if (user!.value!.role === "admin") {
        details.value = await Promise.all(
            rencontres.value!.map((i) =>
                $fetch(`/api/rencontre/syndicat/${i.id}`),
            ),
        );
    }
};

const {
    open,
    send,
    status: wsStatus,
} = useWebSocket("/api/ws/rencontre", {
    immediate: false,
    async onMessage() {
        await updateRencontresAndDetails();
    },
    autoReconnect: true,
});

const details = ref<string[][]>([]);
onMounted(async () => {
    open();
});

const updateAll = async (self: boolean = true) => {
    send("");
    if (self) {
        await updateRencontresAndDetails();
    }
};

const toast = useToast();

async function onSyndicatAdd(index: number, id: number) {
    const result = await $fetch("/api/rencontre/syndicat", {
        method: "POST",
        body: {
            id,
            syndicats: syndicat.value[index]?.map((s) => ({ nom: s })),
        },
    });

    if (result) {
        toast.add({
            title: "Syndicats ajoutés",
            description: "Les syndicats ont été associés à la rencontre.",
            color: "success",
        });
        syndicat.value[index] = [];
        await updateAll();
    } else {
        toast.add({
            title: "Ajout impossible",
            description: "Veuillez vérifier la sélection et réessayer.",
            color: "error",
        });
    }
}

const launch = async (id: number) => {
    await $fetch(`/api/rencontre/start/${id}`);
    updateAll();
};

const stop = async () => {
    await $fetch(`/api/rencontre/stop`);
    updateAll();
};

const reinit = async (id: number) => {
    await $fetch(`/api/rencontre/reinit/${id}`);
    updateAll();
};

const syndicat = ref([[]]);
</script>

<template>
    <NuxtLayout name="default">
        <AppHeader
            title="Rencontres"
            :user="user"
            :status="userStatus"
            :ws-status="wsStatus"
        />

        <div
            v-if="rencontreStatus === 'success' && userStatus === 'success'"
            class="flex flex-wrap justify-center gap-2 pb-50 p-2"
        >
            <template
                v-for="(rencontre, index) in rencontres"
                :key="rencontre.id"
            >
                <RencontreCard
                    class="basis-150 shrink-0"
                    :user="user"
                    :rencontre
                    :execute="updateAll"
                >
                    <template v-if="user!.role === 'admin'">
                        <UForm
                            v-if="
                                details[index] &&
                                rencontre.status === StatusRencontre.INITIAL
                            "
                            :state="details[index]"
                            class="flex flex-row gap-5 justify-center"
                            @submit.prevent="onSyndicatAdd(index, rencontre.id)"
                        >
                            <UFormField
                                label="Syndicats à ajouter:"
                                name="syndicats"
                                class="basis-80"
                            >
                                <UInputMenu
                                    v-model="syndicat[index]"
                                    multiple
                                    :items="details[index]"
                                />
                            </UFormField>
                            <UButton
                                type="submit"
                                icon="mingcute:add-square-line"
                                color="success"
                                variant="solid"
                            />
                        </UForm>

                        <UButton
                            v-if="rencontre.status === StatusRencontre.INITIAL"
                            icon="mingcute:rocket-line"
                            color="success"
                            variant="solid"
                            @click.prevent="launch(rencontre.id)"
                        >
                            Démarrer la rencontre
                        </UButton>
                        <UButton
                            v-if="rencontre.status === StatusRencontre.DEMARE"
                            icon="mingcute:alert-octagon-line"
                            color="error"
                            variant="solid"
                            @click.prevent="stop()"
                        >
                            Clôturer la rencontre
                        </UButton>
                        <UButton
                            v-if="rencontre.status === StatusRencontre.CLOTURE"
                            icon="mingcute:refresh-2-line"
                            color="warning"
                            variant="solid"
                            @click.prevent="reinit(rencontre.id)"
                        >
                            Réinitialiser la rencontre
                        </UButton>
                    </template>
                </RencontreCard>
            </template>
        </div>
    </NuxtLayout>
</template>

<style scoped></style>
