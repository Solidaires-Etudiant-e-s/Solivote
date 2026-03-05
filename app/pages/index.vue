<script setup lang="ts">
import type { Ref } from "vue";
import type { TypeChoix } from "~/utils/backendTypes";
import type { VoteChoice, VotePayload } from "~/utils/frontendTypes";

type Panache = Record<string, number>;
type ResolvedSyndicat = {
    id: number;
    nom: string;
    mandats: Array<{ mandat: number; rencontreId?: number }>;
};

const { data: votes, status: voteStatus } = await useLazyFetch<VotePayload[]>(
    "/api/votes",
    { key: "votes" },
);
const { data: user, status: userStatus } = await useLazyFetch("/api/role");
const { data: currentVote, status: currentVoteStatus } =
    await useLazyFetch<VotePayload | null>("/api/vote/current", {
        key: "vote-current",
    });
const { data: currentRencontre, status: currentRencontreStatus } =
    await useLazyFetch("/api/rencontre/current", { key: "rencontre-current" });
const { data: syndicat, status: syndicatStatus } = await useLazyFetch(
    "/api/syndicat/current",
);
const { data: syndicatsCurrent } = await useLazyFetch(
    "/api/syndicat/current/all",
);
const { data: syndicatsRemaining, execute: syndicatsRemainingExecute } =
    await useLazyFetch("/api/syndicat/remaining");

const wsStatus = ref("disconnected");
let voteStream: EventSource | null = null;
const { sync } = usePatchedFetchState();

const syncVotesFromServer = async () => {
    await sync(
        votes as Ref<VotePayload[] | undefined>,
        () => $fetch<VotePayload[]>("/api/votes"),
        "byId",
    );
};

const syncCurrentVoteFromServer = async () => {
    await sync(
        currentVote as Ref<VotePayload | null | undefined>,
        () => $fetch<VotePayload | null>("/api/vote/current"),
        "value",
    );
    await syndicatsRemainingExecute();
};

const syncCurrentRencontreFromServer = async () => {
    await sync(
        currentRencontre as Ref<Rencontre | null | undefined>,
        () => $fetch<Rencontre | null>("/api/rencontre/current"),
        "value",
    );
};

const connectVoteStream = () => {
    wsStatus.value = "connecting";
    voteStream = new EventSource("/api/sse/vote");
    voteStream.onopen = () => {
        wsStatus.value = "connected";
    };
    voteStream.onerror = () => {
        wsStatus.value = "disconnected";
    };
    voteStream.addEventListener("vote", async (event) => {
        if (!(event instanceof MessageEvent)) return;
        if (event.data === "vote") {
            await syncVotesFromServer();
        }
        if (event.data === "current") {
            await syncCurrentVoteFromServer();
        }
        await syncCurrentRencontreFromServer();
    });
};

onMounted(() => {
    connectVoteStream();
});

onBeforeUnmount(() => {
    voteStream?.close();
});

const updateAll = async () => {
    await Promise.all([
        syncVotesFromServer(),
        syncCurrentVoteFromServer(),
        syncCurrentRencontreFromServer(),
    ]);
};

const toast = useToast();
const isLaunchingVoteId = ref<number | null>(null);
const isDeletingVote = ref(false);

const cloneValue = <T,>(value: T): T => structuredClone(value);
const normalizeSyndicat = (value: unknown): ResolvedSyndicat | null => {
    if (!value || typeof value !== "object") return null;
    const raw = value as Record<string, unknown>;
    const id = Number(raw.id);
    const nom = typeof raw.nom === "string" ? raw.nom : "";
    if (!Number.isInteger(id) || !nom) return null;

    const currentRencontreId =
        currentVote.value?.rencontreId ?? currentRencontre.value?.id;
    if (currentRencontreId == null) return null;
    const mandats: Array<{ mandat: number; rencontreId?: number }> = [];
    for (const entry of Array.isArray(raw.mandats) ? raw.mandats : []) {
        if (!entry || typeof entry !== "object") continue;
        const data = entry as Record<string, unknown>;
        const mandat = Number(data.mandat);
        if (!Number.isFinite(mandat) || mandat <= 0) continue;
        const rencontreId = Number(data.rencontreId);

        mandats.push({
            mandat: Math.trunc(mandat),
            ...(Number.isInteger(rencontreId) ? { rencontreId } : {}),
        });
    }

    const scopedMandats = mandats.filter(
        (mandat) => mandat.rencontreId === currentRencontreId,
    );
    if (!scopedMandats.length) return null;

    return { id, nom, mandats: scopedMandats };
};

const totalMandats = (value: ResolvedSyndicat) =>
    value.mandats.reduce((sum, mandat) => sum + mandat.mandat, 0);

const resolveSyndicat = async (selected?: string) => {
    const ownSyndicat = normalizeSyndicat(syndicat.value);
    if (ownSyndicat) {
        return ownSyndicat;
    }
    if (!selected) return null;

    const fromCurrent = (syndicatsCurrent.value ?? []).find(
        (item) => item.nom.toLowerCase() === selected.toLowerCase(),
    );
    const resolvedFromCurrent = normalizeSyndicat(fromCurrent);
    if (resolvedFromCurrent) return resolvedFromCurrent;

    const fallback = await $fetch(`/api/syndicat/${selected}`);
    return normalizeSyndicat(fallback);
};

const launch = async (id: number) => {
    if (isLaunchingVoteId.value !== null) return;

    const previousVotes = cloneValue(votes.value ?? []);
    const previousCurrentVote = cloneValue(currentVote.value);
    const selectedVote = (votes.value ?? []).find((vote) => vote.id === id);
    if (!selectedVote) return;

    isLaunchingVoteId.value = id;
    if (votes.value) {
        votes.value = votes.value.map((vote) => ({
            ...vote,
            status: vote.id === id ? StatusVote.EN_VOTE : vote.status,
        }));
    }
    currentVote.value = {
        ...selectedVote,
        status: StatusVote.EN_VOTE,
        choix: selectedVote.choix ?? [],
        possibilites: selectedVote.possibilites ?? [],
    };

    try {
        await $fetch(`/api/vote/start/${id}`, { method: "POST" });
        await syncVotesFromServer();
    } catch {
        votes.value = previousVotes;
        currentVote.value = previousCurrentVote;
        toast.add({
            title: "Vote déjà en cours",
            description: "Veuillez d'abord clôturer le vote en cours.",
            color: "warning",
        });
    } finally {
        isLaunchingVoteId.value = null;
    }
};

const voter = async (
    type: TypeChoix,
    selected: string | undefined = undefined,
) => {
    const body = {
        choix: [] as Array<{ type: string | number; mandat: number }>,
        syndicat: null as {
            id: number;
            nom: string;
            mandats: Array<{ mandat: number; rencontreId?: number }>;
        } | null,
    };

    body.syndicat = await resolveSyndicat(selected);

    if (!body.syndicat) return;
    body.choix.push({ type: type, mandat: totalMandats(body.syndicat) });

    const previousChoices = cloneValue(currentVote.value?.choix ?? []);
    const optimisticChoice: VoteChoice = {
        id: -Date.now(),
        date: new Date().toISOString(),
        syndicat: body.syndicat,
        choix: body.choix,
    };

    if (currentVote.value) {
        const idx = currentVote.value.choix.findIndex(
            (choice) => choice.syndicat?.id === body.syndicat!.id,
        );
        if (idx >= 0) {
            currentVote.value.choix[idx] = optimisticChoice;
        } else {
            currentVote.value.choix.push(optimisticChoice);
        }
    }

    try {
        await $fetch(`/api/vote/current`, {
            method: "POST",
            body,
        });
    } catch {
        if (currentVote.value) {
            currentVote.value.choix = previousChoices;
        }
        toast.add({
            title: "Vote non pris en compte",
            description: "Une erreur est survenue. Réessayez.",
            color: "error",
        });
    }
};

const panacher = async (
    panache: Panache,
    selected: string | undefined = undefined,
) => {
    const body = {
        choix: [] as Array<{ type: string | number; mandat: number }>,
        syndicat: null as {
            id: number;
            nom: string;
            mandats: Array<{ mandat: number; rencontreId?: number }>;
        } | null,
    };

    for (const type in panache) {
        const mandat = Number(panache[type]);
        if (!Number.isFinite(mandat) || mandat < 0) continue;
        body.choix.push({ type, mandat: Math.trunc(mandat) });
    }

    body.syndicat = await resolveSyndicat(selected);

    if (!body.syndicat) return;
    const previousChoices = cloneValue(currentVote.value?.choix ?? []);
    const optimisticChoice: VoteChoice = {
        id: -Date.now(),
        date: new Date().toISOString(),
        syndicat: body.syndicat,
        choix: body.choix,
    };

    if (currentVote.value) {
        const idx = currentVote.value.choix.findIndex(
            (choice) => choice.syndicat?.id === body.syndicat!.id,
        );
        if (idx >= 0) {
            currentVote.value.choix[idx] = optimisticChoice;
        } else {
            currentVote.value.choix.push(optimisticChoice);
        }
    }

    try {
        await $fetch(`/api/vote/current`, {
            method: "POST",
            body,
        });
    } catch {
        if (currentVote.value) {
            currentVote.value.choix = previousChoices;
        }
        toast.add({
            title: "Panachage non pris en compte",
            description: "Une erreur est survenue. Réessayez.",
            color: "error",
        });
    }
};

const upcomingVotes = computed(() =>
    (votes.value ?? []).filter((vote) => vote.status === "INITIAL"),
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
    const id = voteToDelete.value;
    if (id == null || isDeletingVote.value) return;

    const previousVotes = cloneValue(votes.value ?? []);
    const previousCurrentVote = cloneValue(currentVote.value);
    isDeletingVote.value = true;

    if (votes.value) {
        votes.value = votes.value.filter((vote) => vote.id !== id);
    }
    if (currentVote.value?.id === id) {
        currentVote.value = null;
    }
    voteToDelete.value = null;

    try {
        await $fetch("/api/vote", {
            method: "delete",
            body: { id },
        });
    } catch {
        votes.value = previousVotes;
        currentVote.value = previousCurrentVote;
        toast.add({
            title: "Suppression impossible",
            description: "Le vote n'a pas pu être supprimé.",
            color: "error",
        });
    } finally {
        isDeletingVote.value = false;
    }
};
</script>

<template>
    <div>
        <AppHeader
            :title="
                currentRencontreStatus === 'success' && currentRencontre
                    ? getRencontreName(currentRencontre)
                    : 'Votes'
            "
            :user="user"
            :status="userStatus"
            :sse-status="wsStatus"
        />

        <div class="w-full max-w-4xl mx-auto px-3 sm:px-4">
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
                    :execute="updateAll"
                    :syndicats-remaining="syndicatsRemaining"
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
                :syndicats-remaining="syndicatsRemaining"
                @vote="(type, selected) => voter(type as TypeChoix, selected)"
                @panacher="
                    (panache, selected) =>
                        panacher(panache as Panache, selected)
                "
            />
        </div>

        <USeparator class="w-full my-5" />

        <div
            v-if="voteStatus === 'success' && userStatus === 'success'"
            class="w-full px-2 sm:px-4 pb-24 sm:pb-50"
        >
            <div class="w-full max-w-4xl mx-auto">
                <div
                    class="flex flex-col sm:flex-row sm:items-center sm:justify-between my-4 gap-3"
                >
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
                    class="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div
                        v-for="vote in upcomingVotes"
                        :key="vote.id"
                        class="flex flex-col gap-2"
                    >
                        <VoteCardUpcoming :vote="vote">
                            <template #actions>
                                <div
                                    v-if="user!.role === 'admin'"
                                    class="flex flex-col sm:flex-row gap-2"
                                >
                                    <UButton
                                        icon="mingcute:rocket-line"
                                        color="primary"
                                        class="w-full sm:w-1/2 justify-center"
                                        :variant="
                                            currentVote ? 'soft' : 'solid'
                                        "
                                        :loading="isLaunchingVoteId === vote.id"
                                        :disabled="
                                            currentVote !== undefined ||
                                            isLaunchingVoteId !== null
                                        "
                                        @click.prevent="launch(vote.id)"
                                    >
                                        Lancer le vote
                                    </UButton>
                                    <UButton
                                        icon="mingcute:delete-line"
                                        color="primary"
                                        variant="soft"
                                        class="w-full sm:w-1/2 justify-center"
                                        :disabled="
                                            isDeletingVote ||
                                            vote.status !== 'INITIAL' ||
                                            vote.choix.length !== 0
                                        "
                                        @click.prevent="confirmDelete(vote.id)"
                                    >
                                        Supprimer
                                    </UButton>
                                </div>
                            </template>
                        </VoteCardUpcoming>
                    </div>
                </div>
                <p v-else class="text-sm text-muted">Aucun vote planifié.</p>

                <h2 class="text-xl mb-4 mt-12 font-bold">Votes terminés</h2>
                <div
                    v-if="finishedVotes.length"
                    class="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div
                        v-for="vote in finishedVotes"
                        :key="vote.id"
                        class="flex flex-col gap-2"
                    >
                        <VoteCardSummary :vote="vote" />
                    </div>
                </div>
                <p v-else class="text-sm text-muted">Aucun vote terminé.</p>
            </div>
        </div>

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
                        <div
                            class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3"
                        >
                            <UButton
                                color="neutral"
                                variant="ghost"
                                class="w-full sm:w-auto"
                                @click="cancelDelete"
                            >
                                Annuler
                            </UButton>
                            <UButton
                                color="primary"
                                variant="soft"
                                class="w-full sm:w-auto"
                                :loading="isDeletingVote"
                                :disabled="isDeletingVote"
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
