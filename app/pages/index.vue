<script setup lang="ts">
type Panache = Record<string, number>;

const {
    data: votes,
    status: voteStatus,
    execute: updateVotes,
} = await useLazyFetch("/api/votes");
const { data: user, status: userStatus } = await useLazyFetch("/api/role");
const {
    data: currentVote,
    status: currentVoteStatus,
    execute: updateCurrent,
} = await useLazyFetch("/api/vote/current");
const {
    data: currentRencontre,
    status: currentRencontreStatus,
    execute: updateCurrentRencontre,
} = await useLazyFetch("/api/rencontre/current");
const { data: syndicat, status: syndicatStatus } = await useLazyFetch(
    "/api/syndicat/current",
);

const {
    open,
    send,
    status: wsStatus,
} = useWebSocket("/api/ws/vote", {
    immediate: false,
    async onMessage(ws, event) {
        if (typeof event.data === "string") {
            if (event.data === "vote") {
                await updateVotes();
            }
            if (event.data === "current") {
                await updateCurrent();
            }
        }
        await updateCurrentRencontre();
    },
});

onMounted(() => {
    open();
});

const updateAll = async () => {
    send("vote");
    send("current");
    await Promise.all([
        updateVotes(),
        updateCurrent(),
        updateCurrentRencontre(),
    ]);
};

const toast = useToast();

const launch = async (id: number) => {
    try {
        await $fetch(`/api/vote/start/${id}`);
        await updateAll();
    } catch {
        toast.add({
            title: "Vote déjà en cours",
            description: "Veuillez d'abord clôturer le vote en cours.",
            color: "warning",
        });
    }
};

const voter = async (
    type: TypeChoix,
    selected: string | undefined = undefined,
) => {
    const body = { choix: [], syndicat: "" };

    if (syndicat.value !== undefined) {
        body.syndicat = syndicat.value!;
    } else if (selected !== undefined) {
        body.syndicat = await $fetch(`/api/syndicat/${selected}`);
    } else {
        return;
    }

    body.choix.push({ type: type, mandat: body.syndicat.mandats[0]!.mandat });

    await $fetch(`/api/vote/current`, {
        method: "POST",
        body,
    });
    send("current");
    await updateCurrent();
};

const panacher = async (
    panache: Panache,
    selected: string | undefined = undefined,
) => {
    const body = { choix: [], syndicat: "" };

    for (const type in panache) {
        body.choix.push({ type: type, mandat: panache[type] });
    }

    if (syndicat.value !== undefined) {
        body.syndicat = syndicat.value!;
    } else if (selected !== undefined) {
        body.syndicat = await $fetch(`/api/syndicat/${selected}`);
    } else {
        return;
    }

    await $fetch(`/api/vote/current`, {
        method: "POST",
        body,
    });
    send("current");
    await updateCurrent();
};

const upcomingVotes = computed(() =>
    (votes.value ?? []).filter((vote) => vote.status === "INITAL"),
);

const finishedVotes = computed(() =>
    (votes.value ?? []).filter((vote) => vote.status === "CLOTURE"),
);

const voteToDelete = ref<number | null>(null);
const showNewVote = ref(false);
const showDeleteModal = computed({
    get: () => voteToDelete.value !== null,
    set: (val) => {
        if (!val) voteToDelete.value = null;
    },
});
const confirmDelete = (id: number) => {
    voteToDelete.value = id;
};
const cancelDelete = () => {
    voteToDelete.value = null;
};
const runDelete = async () => {
    if (voteToDelete.value == null) return;
    await $fetch("/api/vote", {
        method: "delete",
        body: { id: voteToDelete.value },
    });
    voteToDelete.value = null;
    await updateAll();
};
</script>

<template>
    <div>
        <NuxtLayout>
            <AppHeader
                :title="
                    currentRencontreStatus === 'success' && currentRencontre
                        ? getRencontreName(currentRencontre)
                        : 'Votes'
                "
                :user="user"
                :status="userStatus"
                :ws-status="wsStatus"
            />

            <div class="w-4xl mx-auto">
                <p v-if="userStatus !== 'success'">
                    Chargement des informations...
                </p>
                <template v-else-if="user!.role === 'syndicat'">
                    <VoteCardLive
                        v-if="
                            currentVoteStatus === 'success' &&
                            currentVote &&
                            syndicatStatus === 'success' &&
                            syndicat &&
                            syndicat.mandats.length > 0
                        "
                        :vote="currentVote"
                        :user="user"
                        @vote="(type, _selected) => voter(type as TypeChoix)"
                        @panacher="
                            (panache, _selected) => panacher(panache as Panache)
                        "
                    />
                </template>
                <VoteCurrentAdmin
                    v-else-if="user!.role === 'admin'"
                    :execute="updateAll"
                    :current-vote="currentVote"
                    :user="user"
                    :current-vote-status="currentVoteStatus"
                    @vote="
                        (type, selected) => voter(type as TypeChoix, selected)
                    "
                    @panacher="
                        (panache, selected) =>
                            panacher(panache as Panache, selected)
                    "
                />
            </div>

            <USeparator class="w-full my-5" />

            <div
                v-if="voteStatus === 'success' && userStatus === 'success'"
                class="flex flex-wrap justify-center gap-2 pb-50 p-2"
            >
                <div class="w-4xl mx-auto">
                    <div class="flex items-center justify-between my-4">
                        <h2 class="text-xl font-bold">Votes à venir</h2>
                        <UButton
                            v-if="user!.role === 'admin'"
                            icon="mingcute:add-square-line"
                            color="primary"
                            :variant="upcomingVotes.length ? 'soft' : 'solid'"
                            @click="showNewVote = true"
                        >
                            Nouveau vote
                        </UButton>
                    </div>
                    <div
                        v-if="upcomingVotes.length"
                        class="flex flex-wrap gap-4"
                    >
                        <div
                            v-for="vote in upcomingVotes"
                            :key="vote.id"
                            class="flex flex-col gap-2 basis-[calc(50%-0.5rem)]"
                        >
                            <VoteCardUpcoming :vote="vote">
                                <template #actions>
                                    <div
                                        v-if="user!.role === 'admin'"
                                        class="flex gap-2"
                                    >
                                        <UButton
                                            icon="mingcute:rocket-line"
                                            color="primary"
                                            class="w-1/2 justify-center"
                                            :variant="
                                                currentVote ? 'soft' : 'solid'
                                            "
                                            @click.prevent="launch(vote.id)"
                                        >
                                            Lancer le vote
                                        </UButton>
                                        <UButton
                                            icon="mingcute:delete-line"
                                            color="primary"
                                            variant="soft"
                                            class="w-1/2 justify-center"
                                            :disabled="
                                                vote.status !== 'INITAL' ||
                                                vote.choix.length !== 0
                                            "
                                            @click.prevent="
                                                confirmDelete(vote.id)
                                            "
                                        >
                                            Supprimer
                                        </UButton>
                                    </div>
                                </template>
                            </VoteCardUpcoming>
                        </div>
                    </div>
                    <p v-else class="text-sm text-muted">
                        Aucun vote planifié.
                    </p>

                    <h2 class="text-xl mb-4 mt-12 font-bold">Votes terminés</h2>
                    <div
                        v-if="finishedVotes.length"
                        class="flex flex-wrap gap-4"
                    >
                        <div
                            v-for="vote in finishedVotes"
                            :key="vote.id"
                            class="flex flex-col gap-2 basis-[calc(50%-0.5rem)]"
                        >
                            <VoteCardSummary :vote="vote" />
                        </div>
                    </div>
                    <p v-else class="text-sm text-muted">Aucun vote terminé.</p>
                </div>
            </div>
        </NuxtLayout>

        <UModal v-model:open="showDeleteModal">
            <template #content>
                <UCard>
                    <template #header>
                        <div class="text-lg font-semibold">
                            Supprimer le vote
                        </div>
                    </template>
                    <p class="text-sm text-muted">
                        Confirmer la suppression de ce vote ?
                    </p>
                    <template #footer>
                        <div class="flex justify-end gap-3">
                            <UButton
                                color="neutral"
                                variant="ghost"
                                @click="cancelDelete"
                            >
                                Annuler
                            </UButton>
                            <UButton
                                color="primary"
                                variant="soft"
                                @click="runDelete"
                            >
                                Supprimer
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

        <VoteCreateModal v-model:open="showNewVote" @created="updateAll" />
    </div>
</template>
