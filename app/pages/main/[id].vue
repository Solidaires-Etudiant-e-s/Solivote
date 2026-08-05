<script setup lang="ts">
import type { Ref } from "vue";
import type { TypeChoix } from "~/utils/backendTypes";


type Panache = Record<string, number>;

const rencontreId = ref(Number(useRoute().params.id))
const isCurrent = ref(useRoute().params.id === "current")
const upcomingVotesPage = ref(1)
const finishedVotesPage = ref(1)

if (useRoute().params.id !== "current" && Number.isNaN(rencontreId.value)) {
  throw createError({
    status: 404,
    statusText: 'Rencontre is invalid',
  })
}

const { data: textes, status: textesStatus } = await useLazyFetch<TextePayload[]>(
  "/api/votes",
  { query: { id: rencontreId } },
);
const { data: user, status: userStatus } = await useLazyFetch("/api/role");
const { data: currentVote, status: currentVoteStatus } =
  await useLazyFetch<VotePayload & { texte: Texte } | null>("/api/vote/current", {
    key: "vote-current",
  });
const { data: rencontre, status: rencontreStatus } =
  await useLazyFetch<Rencontre | null>("/api/rencontre/current", { query: { id: rencontreId } });
const { data: syndicat, status: syndicatStatus, execute: syndicatExecute } = await useLazyFetch<Syndicat | null>(
  "/api/syndicat/current",
);
const { data: syndicatsCurrent, execute: syndicatsCurrentExecute } = await useLazyFetch<Syndicat[]>(
  "/api/syndicat/current/all",
);
const syndicatsRemaining = ref<Syndicat[]>([]);
const syndicatsRemainingExecute = async () => {
  syndicatsRemaining.value = await $fetch<Syndicat[]>("/api/syndicat/remaining");
};
await syndicatsRemainingExecute();

const wsStatus = ref("disconnected");
let voteStream: EventSource | null = null;
let rencontreStream: EventSource | null = null;
const { sync } = usePatchedFetchState();


watchEffect(() => {
  if (rencontreStatus.value === "success" && rencontre.value == undefined) {
    // throw createError({
    //   status: 404,
    //   statusText: 'Rencontre Not Found',
    // })
  }
})


const syncVotesFromServer = async () => {
  await sync(
    textes,
    () => $fetch("/api/votes", { query: { id: rencontreId.value } }),
    "byId",
  );
};

const syncCurrentVoteFromServer = async () => {
  await sync(
    currentVote as Ref<(VotePayload & { texte: Texte }) | null | undefined>,
    () => $fetch<(VotePayload & { texte: Texte }) | null>("/api/vote/current"),
    "value",
  );
  await syndicatsRemainingExecute();
};

const syncRencontreFromServer = async () => {
  await sync(
    rencontre as Ref<Rencontre | null | undefined>,
    () => $fetch<Rencontre | null>(`/api/rencontre/current?id=${rencontreId.value}`),
    "value",
  );
};

const syncSyndicatFromServer = async () => {
  await Promise.all([syndicatExecute(), syndicatsCurrentExecute()]);
  voteCardLiveRef.value?.refreshSyndicats();
  voteCurrentAdminRef.value?.refreshSyndicats();
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
    await syncRencontreFromServer();
  });
};

const connectRencontreStream = () => {
  rencontreStream = new EventSource("/api/sse/rencontre");
  rencontreStream.addEventListener("rencontre", async (event) => {
    if (!(event instanceof MessageEvent)) return;
    if (event.data === "rencontre") {
      await syncSyndicatFromServer();
      await syncRencontreFromServer();
    }
  });
};

onMounted(() => {
  connectVoteStream();
  connectRencontreStream();
});

onBeforeUnmount(() => {
  voteStream?.close();
  rencontreStream?.close();
});

const updateAll = async () => {
  await Promise.all([
    syncVotesFromServer(),
    syncCurrentVoteFromServer(),
    syncRencontreFromServer(),
  ]);
};

const toast = useToast();
const isLaunchingVoteId = ref<number | null>(null);
const isDeletingVote = ref(false);
const voteCardLiveRef = ref<{ refreshSyndicats: () => Promise<void> } | null>(null);
const voteCurrentAdminRef = ref<{ refreshSyndicats: () => Promise<void> } | null>(null);

const cloneValue = <T,>(value: T): T => structuredClone(value);

const totalMandats = (value: Syndicat) =>
  value.mandats!.reduce((sum, mandat) => sum + mandat.mandat, 0);

const resolveSyndicat = async (selected?: string): Promise<Syndicat | null> => {
  if (syndicat.value) {
    return syndicat.value;
  }
  if (!selected) return null;

  const fromCurrent = (syndicatsCurrent.value ?? []).find(
    (item) => item.nom.toLowerCase() === selected.toLowerCase(),
  );
  if (fromCurrent) return fromCurrent;

  const fallback = await $fetch<Syndicat>(`/api/syndicat/${selected}`);
  return fallback;
};

const launch = async (id: number) => {
  if (isLaunchingVoteId.value !== null) return;

  const previousTextes = cloneValue(textes.value ?? []);
  const previousCurrentVote = cloneValue(currentVote.value);
  const selectedVote = (textes.value ?? []).flatMap((texte) => texte.votes).find((vote) => vote.id === id);
  if (!selectedVote) return;

  isLaunchingVoteId.value = id;
  if (textes.value) {
    textes.value = textes.value.map((texte) => ({
      ...texte,
      votes: texte.votes.map((vote) => ({
        ...vote,
        status: vote.id === id ? StatusVote.EN_VOTE : vote.status,
      }))

    }));
  }
  const parentTexte = (textes.value ?? []).find((texte) =>
    texte.votes.some((vote) => vote.id === id),
  );
  currentVote.value = {
    ...selectedVote,
    status: StatusVote.EN_VOTE,
    choix: selectedVote.choix ?? [],
    possibilites: selectedVote.possibilites ?? [],
    texte: parentTexte as Texte,
  };

  try {
    await $fetch(`/api/vote/start/${id}`, { method: "POST" });
    await syncVotesFromServer();
  } catch {
    textes.value = previousTextes;
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
    choix: [] as Array<{ type: TypeChoix | number; mandat: number }>,
    syndicat: null as Syndicat | null,
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
    choix: [] as Array<{ type: TypeChoix | number; mandat: number }>,
    syndicat: null as Syndicat | null,
  };

  for (const type in panache) {
    const mandat = Number(panache[type]);
    if (!Number.isFinite(mandat) || mandat < 0) continue;
    body.choix.push({ type: type as TypeChoix, mandat: Math.trunc(mandat) });
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

const condorcet = async (
  rankings: {
    ranking: { key: number | string; label: string }[];
    mandat: number;
  }[],
  selected: string | undefined = undefined,
) => {
  const body = {
    choix: [] as ({vote: number[]; mandat: number})[],
    syndicat: null as Syndicat | null,
  };
  body.syndicat = await resolveSyndicat(selected);
  for (const r of rankings) {
    body.choix.push({
      vote: r.ranking.map((e) => Number(e.key)),
      mandat: r.mandat,
    });
  }
  try {
    await $fetch(`/api/vote/current`, {
      method: "POST",
      body,
    });
  } catch {
    toast.add({
      title: "Vote non pris en compte",
      description: "Une erreur est survenue. Réessayez.",
      color: "error",
    });
  }
}

const upcomingSearch = ref("");
const finishedSearch = ref("");

const fuzzyMatch = (query: string, target: string): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  const trigrams = (s: string) => {
    const padded = ` ${s} `;
    const set: string[] = [];
    for (let i = 0; i < padded.length - 2; i++)
      set.push(padded.slice(i, i + 3));
    return set;
  };
  const qt = trigrams(q);
  const tt = trigrams(t);
  if (qt.length === 0) return true;
  const ttCounts = new Map<string, number>();
  for (const g of tt) ttCounts.set(g, (ttCounts.get(g) ?? 0) + 1);
  let matches = 0;
  for (const g of qt) {
    const c = ttCounts.get(g) ?? 0;
    if (c > 0) { matches++; ttCounts.set(g, c - 1); }
  }
  return matches / qt.length >= 0.4;
};

const fuzzyFilterTextes = (list: TextePayload[], query: string) => {
  const q = query.trim();
  if (!q) return list;

  return list.map((texte) => {
    if (fuzzyMatch(q, texte.titre)) return texte;

    const votes = texte.votes.filter(
      (vote) => fuzzyMatch(q, vote.nom) ||
        (vote.description != null && fuzzyMatch(q, vote.description)),
    )

    if (votes.length === 0) return null;

    return {
      ...texte,
      votes: votes,
    }
  }).filter((texte) => texte !== null)
};

const upcomingTextes = computed(() => {
  return fuzzyFilterTextes(
    (textes.value ?? []).map((texte) => ({ ...texte, votes: texte?.votes.filter((vote) => vote.status === "INITIAL") })),
    upcomingSearch.value,
  )
}
);

const finishedTextes = computed(() => {
  return fuzzyFilterTextes(
    (textes.value ?? []).map((texte) => ({ ...texte, votes: texte?.votes.filter((vote) => vote.status === "CLOTURE") })),
    finishedSearch.value,
  )
}
);

const voteToDelete = ref<number | null>(null);
const showNewVote = ref(false);
const showNewTexte = ref(false);
const voteEdited = ref<(VotePayload & { texteId: number }) | null>(null);
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

  const previousTextes = cloneValue(textes.value ?? []);
  const previousCurrentVote = cloneValue(currentVote.value);
  isDeletingVote.value = true;

  if (textes.value) {
    textes.value = textes.value.map((texte) => ({
      ...texte,
      votes: texte.votes.filter((vote) => vote.id !== id)
    }));
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
    textes.value = previousTextes;
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

const deleteTexte = async (texteId: number) => {
  await $fetch("/api/texte", {method: 'DELETE', body: {texteId}})
}

const openVoteModal = (vote: (VotePayload & { texteId: number }) | null = null) => {
  voteEdited.value = vote;
  showNewVote.value = true;
};

const openTexteModal = () => {
  showNewTexte.value = true;
};

const updateVoteModalOpen = (value: boolean) => {
  showNewVote.value = value;
  if (!value) {
    voteEdited.value = null;
  }
};

const updateTexteModalOpen = (value: boolean) => {
  showNewTexte.value = value;
};

const pageSize = 8

const upcomingPagedTextes = computed(() => {
  const start = (upcomingVotesPage.value - 1) * pageSize
  const end = start + pageSize
  return upcomingTextes.value.slice(start, end)
})

const finishedPagedTextes = computed(() => {
  const start = (finishedVotesPage.value - 1) * pageSize
  const end = start + pageSize
  return finishedTextes.value.slice(start, end)
})
</script>

<template>
  <div>
    <AppHeader
      :title="rencontreStatus === 'success' && rencontre
      ? getRencontreName(rencontre)
      : 'Chargement de la rencontre'
      " :user="user" :status="userStatus" :sse-status="wsStatus" />

    <div class="w-full max-w-4xl mx-auto px-3 sm:px-4">
      <p v-if="userStatus !== 'success'">Chargement des informations...</p>
      <template v-else-if="!isCurrent" />
      <template v-else-if="user!.role === 'syndicat'">
        <VoteCardLive
          v-if="
          currentVoteStatus === 'success' &&
          currentVote &&
          syndicatStatus === 'success' &&
          syndicat &&
          (syndicat.mandats?.length ?? 0) > 0
        " ref="voteCardLiveRef" :vote="currentVote" :user="user"
          :syndicats-remaining="syndicatsRemaining" @vote="(type, _selected) => voter(type as TypeChoix)"
          @panacher="(panache, _selected) => panacher(panache as Panache)"
          @condorcet="(choiceMeta, _vote_pour) => condorcet(choiceMeta)" />
      </template>
      <VoteCurrentAdmin
        v-else-if="user!.role === 'admin'" ref="voteCurrentAdminRef"
        :current-vote="currentVote" :user="user" :current-vote-status="currentVoteStatus"
        :syndicats-remaining="syndicatsRemaining" @vote="(type, selected) => voter(type as TypeChoix, selected)"
        @panacher="(panache, selected) => panacher(panache, selected)"
        @condorcet="(choiceMeta, selected) => condorcet(choiceMeta, selected)" />
    </div>

    <USeparator v-if="currentVote" class="w-full my-5" />

    <div v-if="textesStatus === 'success' && userStatus === 'success'" class="w-full px-2 sm:px-4 pb-24 sm:pb-50">
      <div class="w-full max-w-4xl mx-auto">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between my-4 gap-3">
          <h2 class="text-xl font-bold">Votes à venir</h2>
          <UPopover v-if="user!.role === 'admin'">
            <UButton
              icon="mingcute:add-square-line" color="primary"
              :variant="upcomingTextes.length ? 'soft' : 'solid'" :disabled="!isCurrent"
              trailing-icon="i-lucide-chevron-down">
              Ajouter
            </UButton>
            <template #content>
              <UButton label="Texte" icon="mingcute:document-2-line" variant="ghost" class="w-full justify-start rounded-none" @click="openTexteModal()" />
              <UButton label="Vote" icon="mingcute:check-line" variant="ghost" class="w-full justify-start rounded-none" @click="openVoteModal()" />
            </template>
          </UPopover>
        </div>
        <UInput v-model="upcomingSearch" icon="mingcute:search-line" placeholder="Rechercher..." class="w-full mb-4" />
        <template v-if="upcomingTextes.length">
          <div class="gap-4 flex flex-col w-auto">
            <div v-for="texte in upcomingPagedTextes" :key="texte.id">
              <UCollapsible class="flex flex-col gap-2 w-auto">
                <div class="flex">
                <UButton
                  class="group" :label="texte.titre" color="neutral" variant="subtle"
                  trailing-icon="i-lucide-chevron-down" :ui="{
                    trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
                  }" block />
                  <UButton icon="mingcute:delete-2-line" :disabled="(textes ?? []).find((t) => t.id === texte.id)!.votes.length > 0" @click.stop="deleteTexte(texte.id)"/>
                </div>

                <template #content>
                  <div class="flex">
                    <UButton v-for="pdf in texte.pdfs" :key="pdf.id" icon="mingcute:document-2-line" :to="'/uploads/' + pdf.nom" external target="_blank"/>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mx-2">
                    <VoteCardUpcoming v-for="vote in texte.votes" :key="vote.id" :vote="vote" class="my-2">
                      <template v-if="user!.role === 'admin'" #actions>
                        <div class="flex flex-col flex-wrap sm:flex-row gap-2">
                          <UButton
                            icon="mingcute:rocket-line" color="primary" class="w-full justify-center"
                            :variant="currentVote ? 'soft' : 'solid'" :loading="isLaunchingVoteId === vote.id"
                            :disabled="!isCurrent || currentVote !== undefined || isLaunchingVoteId !== null
                              " @click.prevent="launch(vote.id)">
                            Lancer le vote
                          </UButton>
                          <div class="flex w-full gap-2">
                            <UButton
                              icon="mingcute:delete-line" color="primary" variant="soft"
                              class="w-full sm:w-1/2 justify-center" :disabled="isDeletingVote ||
                                vote.status !== 'INITIAL' ||
                                vote.choix.length !== 0
                                " @click.prevent="confirmDelete(vote.id)">
                              Supprimer
                            </UButton>
                            <UButton
                              icon="mingcute:edit-line" color="primary" variant="soft"
                              class="w-full sm:w-1/2 justify-center" :disabled="isDeletingVote ||
                                vote.status !== 'INITIAL' ||
                                vote.choix.length !== 0
                                " @click.prevent="openVoteModal({ ...vote, texteId: texte.id })">
                              Éditer
                            </UButton>
                          </div>
                        </div>
                      </template>
                    </VoteCardUpcoming>
                  </div>
                </template>
              </UCollapsible>
            </div>
          </div>
          <div v-if="upcomingTextes.length > pageSize" class="flex justify-center">
            <UPagination v-model:page="upcomingVotesPage" :total="upcomingTextes.length" :items-per-page="pageSize" />
          </div>
        </template>
        <p v-else class="text-sm text-muted">{{ upcomingSearch.trim() ? "Aucun résultat." : "Aucun vote planifié." }}
        </p>

        <h2 class="text-xl mb-3 mt-12 font-bold">Votes terminés</h2>
        <UInput v-model="finishedSearch" icon="mingcute:search-line" placeholder="Rechercher..." class="w-full mb-4" />
        <template v-if="finishedTextes.length">
          <div class="gap-4 flex flex-col w-auto">
            <div v-for="texte in finishedPagedTextes" :key="texte.id" class="flex flex-col gap-2">
              <UCollapsible class="flex flex-col gap-2 w-auto">
                <UButton
                  class="group" :label="texte.titre" color="neutral" variant="subtle"
                  trailing-icon="i-lucide-chevron-down" :ui="{
                    trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
                  }" block />

                <template #content>
                  <div class="flex">
                    <UButton v-for="pdf in texte.pdfs" :key="pdf.id" icon="mingcute:document-2-line" :to="'/uploads/' + pdf.nom" external target="_blank"/>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mx-2">
                    <VoteCardSummary v-for="vote in texte.votes" :key="vote.id" :vote="vote" class="my-2">
                      <template v-if="user!.role === 'admin'" #actions>
                        <div class="flex w-full items-center gap-2">
                          <UButton
                            :disabled="!isCurrent || currentVote !== undefined || isLaunchingVoteId !== null"
                            icon="mingcute:refresh-2-line" variant="soft" class="w-full sm:w-1/2 justify-center"
                            @click.prevent="launch(vote.id)">
                            Relancer le vote
                          </UButton>
                          <UButton
                            icon="mingcute:delete-line" variant="soft" class="w-full sm:w-1/2 justify-center"
                            :disabled="isDeletingVote" @click.prevent="confirmDelete(vote.id)">
                            Supprimer
                          </UButton>
                        </div>
                      </template>
                    </VoteCardSummary>
                  </div>
                </template>
              </UCollapsible>
            </div>
          </div>
          <div v-if="finishedTextes.length > pageSize" class="flex justify-center">
            <UPagination v-model:page="finishedVotesPage" :total="finishedTextes.length" :items-per-page="pageSize" />
          </div>
        </template>
        <p v-else class="text-sm text-muted">{{ finishedSearch.trim() ? "Aucun résultat." : "Aucun vote terminé." }}</p>
      </div>
    </div>

    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <div class="text-lg font-semibold">Supprimer le vote</div>
          </template>
          <p class="text-sm text-muted">
            Confirmer la suppression de ce vote ?
          </p>
          <template #footer>
            <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <UButton color="neutral" variant="ghost" class="w-full sm:w-auto" @click="cancelDelete">
                Annuler
              </UButton>
              <UButton
                color="primary" variant="soft" class="w-full sm:w-auto" :loading="isDeletingVote"
                :disabled="isDeletingVote" @click="runDelete">
                Supprimer
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <VoteCreateModal
      v-if="textesStatus === 'success' && textes" :open="showNewVote" :vote="voteEdited" :textes="textes"
      @update:open="updateVoteModalOpen" @saved="updateAll" />
    <TexteCreateModal :open="showNewTexte" @update:open="updateTexteModalOpen" @saved="updateAll" />
  </div>
</template>
