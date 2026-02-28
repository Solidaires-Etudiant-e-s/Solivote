<script setup lang="ts">
import type { Ref } from "vue";

type Panache = Record<string, number>;
type ResolvedSyndicat = {
    id: number;
    nom: string;
    mandats: Array<{ mandat: number; rencontreId?: number }>;
};

const {
    data: votes,
    status: voteStatus,
} = await useLazyFetch("/api/votes", { key: "votes" });
const { data: user, status: userStatus } = await useLazyFetch("/api/role");
const {
    data: currentVote,
    status: currentVoteStatus,
} = await useLazyFetch("/api/vote/current", { key: "vote-current" });
const {
    data: currentRencontre,
    status: currentRencontreStatus,
} = await useLazyFetch("/api/rencontre/current", { key: "rencontre-current" });
const { data: syndicat, status: syndicatStatus } = await useLazyFetch(
    "/api/syndicat/current",
);
const { data: syndicatsCurrent } = await useLazyFetch("/api/syndicat/current/all");

const wsStatus = ref("disconnected");
let voteStream: EventSource | null = null;
const { sync } = usePatchedFetchState();

const syncVotesFromServer = async () => {
    await sync(votes, () => $fetch<Vote[]>("/api/votes"), "byId");
};

const syncCurrentVoteFromServer = async () => {
    await sync(
        currentVote as Ref<Vote | null | undefined>,
        () => $fetch<Vote | null>("/api/vote/current"),
        "value",
    );
};

const syncCurrentRencontreFromServer = async () => {
    await sync(
        currentRencontre as Ref<Rencontre | null | undefined>,
        () =>
            $fetch<Rencontre | null>(
                "/api/rencontre/current",
            ),
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

const cloneValue = <T>(value: T): T => structuredClone(value);
const normalizeSyndicat = (value: unknown): ResolvedSyndicat | null => {
    if (!value || typeof value !== "object") return null;
    const raw = value as Record<string, unknown>;
    const id = Number(raw.id);
    const nom = typeof raw.nom === "string" ? raw.nom : "";
    if (!Number.isInteger(id) || !nom) return null;

    const currentRencontreId =
        currentVote.value?.rencontreId ?? currentRencontre.value?.id;
    if (currentRencontreId == null) return null;
    const mandats = (Array.isArray(raw.mandats) ? raw.mandats : [])
        .map((entry) => {
            if (!entry || typeof entry !== "object") return null;
            const data = entry as Record<string, unknown>;
            const mandat = Number(data.mandat);
            if (!Number.isFinite(mandat) || mandat <= 0) return null;

            const rencontreId = Number(data.rencontreId);
            return {
                mandat: Math.trunc(mandat),
                rencontreId: Number.isInteger(rencontreId)
                    ? rencontreId
                    : undefined,
            };
        })
        .filter(
            (entry): entry is { mandat: number; rencontreId?: number } =>
                entry !== null,
        );

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
        syndicat: null as
            | {
                  id: number;
                  nom: string;
                  mandats: Array<{ mandat: number; rencontreId?: number }>;
              }
            | null,
    };

    body.syndicat = await resolveSyndicat(selected);

    if (!body.syndicat) return;
    body.choix.push({ type: type, mandat: totalMandats(body.syndicat) });

    const previousChoices = cloneValue(currentVote.value?.choix ?? []);
    const optimisticChoice = {
        id: -Date.now(),
        date: new Date(),
        syndicat: body.syndicat,
        choix: body.choix,
    } as unknown as Choix;

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
        syndicat: null as
            | {
                  id: number;
                  nom: string;
                  mandats: Array<{ mandat: number; rencontreId?: number }>;
              }
            | null,
    };

    for (const type in panache) {
        const mandat = Number(panache[type]);
        if (!Number.isFinite(mandat) || mandat < 0) continue;
        body.choix.push({ type, mandat: Math.trunc(mandat) });
    }

    body.syndicat = await resolveSyndicat(selected);

    if (!body.syndicat) return;
    const previousChoices = cloneValue(currentVote.value?.choix ?? []);
    const optimisticChoice = {
        id: -Date.now(),
        date: new Date(),
        syndicat: body.syndicat,
        choix: body.choix,
    } as unknown as Choix;

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
                                            :loading="
                                                isLaunchingVoteId === vote.id
                                            "
                                            :disabled="
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
                                            class="w-1/2 justify-center"
                                            :disabled="
                                                isDeletingVote ||
                                                vote.status !== 'INITIAL' ||
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
