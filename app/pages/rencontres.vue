<script setup lang="ts">
import { toRaw, type Ref } from "vue";

const { data: rencontres, status: rencontreStatus } =
  useLazyFetch("/api/rencontre");
const { data: user, status: userStatus } = await useLazyFetch("/api/role");
const { sync } = usePatchedFetchState();

const syncRencontresFromServer = async () => {
  return sync(
    rencontres as Ref<Rencontre[] | undefined>,
    () => $fetch<Rencontre[]>("/api/rencontre"),
    "byId",
  );
};

const syncDetailsFromServer = async () => {
  if (user.value?.role !== "admin" || !rencontres.value) return;
  const nextDetails = await Promise.all(
    rencontres.value.map((item) =>
      $fetch<string[]>(`/api/rencontre/syndicat/${item.id}`),
    ),
  );
  await sync(details, () => Promise.resolve(nextDetails), "array");
};

const updateRencontresAndDetails = async (forceDetails = false) => {
  const changed = await syncRencontresFromServer();
  if (forceDetails || changed || !details.value.length) {
    await syncDetailsFromServer();
  }
};

watch(user, async () => {
  await updateRencontresAndDetails(true);
});

const wsStatus = ref("disconnected");
let rencontreStream: EventSource | null = null;

const connectRencontreStream = () => {
  wsStatus.value = "connecting";
  rencontreStream = new EventSource("/api/sse/rencontre");
  rencontreStream.onopen = () => {
    wsStatus.value = "connected";
  };
  rencontreStream.onerror = () => {
    wsStatus.value = "disconnected";
  };
  rencontreStream.addEventListener("rencontre", async () => {
    await updateRencontresAndDetails();
  });
};

const details = ref<string[][]>([]);
await updateRencontresAndDetails();
onMounted(async () => {
  connectRencontreStream();
});

onBeforeUnmount(() => {
  rencontreStream?.close();
});

const updateAll = async (self: boolean = true) => {
  if (self) {
    await updateRencontresAndDetails(true);
  }
};

const toast = useToast();
const isMutatingRencontre = ref(false);

function cloneValue<T>(value: T): T {
  return structuredClone(toRaw(value));
}

async function onSyndicatAdd(index: number, id: number) {
  if (isMutatingRencontre.value) return;

  const selected = [...(syndicat.value[index] ?? [])];
  if (!selected.length) return;

  const previousRencontres = cloneValue(rencontres.value ?? []);
  const previousDetailsAtIndex = details.value[index]
    ? [...details.value[index]]
    : undefined;
  const previousSyndicatsAtIndex = syndicat.value[index]
    ? [...syndicat.value[index]]
    : undefined;
  isMutatingRencontre.value = true;

  const rencontre = rencontres.value?.find((item) => item.id === id);
  if (rencontre) {
    const existing = new Set(
      (rencontre.mandats ?? []).map((mandat) => mandat.syndicat.nom),
    );
    let tempId = -Date.now();
    for (const nom of selected) {
      if (existing.has(nom)) continue;
      rencontre.mandats.push({
        syndicatId: tempId,
        rencontreId: id,
        syndicat: { id: tempId, nom },
        mandat: 1,
      });
      tempId -= 1;
    }
  }
  if (details.value[index]) {
    details.value[index] = details.value[index].filter(
      (name) => !selected.includes(name),
    );
  }
  syndicat.value[index] = [];

  try {
    await $fetch("/api/rencontre/syndicat", {
      method: "POST",
      body: {
        id,
        syndicats: selected.map((s) => ({ nom: s })),
      },
    });
    toast.add({
      title: "Syndicats ajoutés",
      description: "Les syndicats ont été associés à la rencontre.",
      color: "success",
    });
    await updateRencontresAndDetails(true);
  } catch {
    rencontres.value = previousRencontres;
    details.value[index] = previousDetailsAtIndex ?? [];
    syndicat.value[index] = previousSyndicatsAtIndex ?? [];
    toast.add({
      title: "Ajout impossible",
      description: "Veuillez vérifier la sélection et réessayer.",
      color: "error",
    });
  } finally {
    isMutatingRencontre.value = false;
  }
}

const launch = async (id: number) => {
  if (isMutatingRencontre.value) return;
  const previousRencontres = cloneValue(rencontres.value ?? []);
  isMutatingRencontre.value = true;

  if (rencontres.value) {
    rencontres.value = rencontres.value.map((rencontre) => ({
      ...rencontre,
      status: rencontre.id === id ? StatusRencontre.DEMARE : rencontre.status,
    }));
  }

  try {
    await $fetch(`/api/rencontre/start/${id}`, { method: "POST" });
  } catch {
    rencontres.value = previousRencontres;
    toast.add({
      title: "Démarrage impossible",
      description: "La rencontre n'a pas pu être démarrée.",
      color: "error",
    });
  } finally {
    isMutatingRencontre.value = false;
  }
};

const stop = async () => {
  if (isMutatingRencontre.value) return;
  const previousRencontres = cloneValue(rencontres.value ?? []);
  isMutatingRencontre.value = true;

  if (rencontres.value) {
    rencontres.value = rencontres.value.map((rencontre) => ({
      ...rencontre,
      status:
        rencontre.status === StatusRencontre.DEMARE
          ? StatusRencontre.CLOTURE
          : rencontre.status,
    }));
  }

  try {
    await $fetch(`/api/rencontre/stop`, { method: "POST" });
  } catch {
    rencontres.value = previousRencontres;
    toast.add({
      title: "Clôture impossible",
      description: "La rencontre n'a pas pu être clôturée.",
      color: "error",
    });
  } finally {
    isMutatingRencontre.value = false;
  }
};

const reinit = async (id: number) => {
  if (isMutatingRencontre.value) return;
  const previousRencontres = cloneValue(rencontres.value ?? []);
  isMutatingRencontre.value = true;

  if (rencontres.value) {
    rencontres.value = rencontres.value.map((rencontre) => ({
      ...rencontre,
      status: rencontre.id === id ? StatusRencontre.INITIAL : rencontre.status,
    }));
  }

  try {
    await $fetch(`/api/rencontre/reinit/${id}`, { method: "POST" });
  } catch {
    rencontres.value = previousRencontres;
    toast.add({
      title: "Réinitialisation impossible",
      description: "La rencontre n'a pas pu être réinitialisée.",
      color: "error",
    });
  } finally {
    isMutatingRencontre.value = false;
  }
};

const exporte = async (rencontre: Rencontre) => {
  try {
    const data = await $fetch(`/api/rencontre/export/${rencontre.id}`);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rencontre.nom}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    toast.add({
      title: "Export impossible",
      description: "La rencontre n'a pas pu être exporté.",
      color: "error",
    });
  }
};

const syndicat = ref<string[][]>([]);
</script>

<template>
  <AppHeader
    title="Rencontres"
    :user="user"
    :status="userStatus"
    :sse-status="wsStatus"
  />

  <div
    v-if="rencontreStatus === 'success' && userStatus === 'success'"
    class="flex flex-wrap justify-center gap-2 pb-50 p-2"
  >
    <template v-for="(rencontre, index) in rencontres" :key="rencontre.id">
      <RencontreCard
        class="basis-150 shrink-0"
        :user="user"
        :rencontre
        :execute="updateAll"
      >
        <div v-if="user!.role === 'admin'" class="flex justify-center gap-5">
          <UForm
            v-if="
              details[index] &&
              (rencontre.status === StatusRencontre.INITIAL ||
                rencontre.status === StatusRencontre.DEMARE)
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
              :loading="isMutatingRencontre"
              :disabled="isMutatingRencontre"
            />
          </UForm>

          <UButton
            v-if="rencontre.status === StatusRencontre.INITIAL"
            icon="mingcute:rocket-line"
            color="success"
            variant="solid"
            :loading="isMutatingRencontre"
            :disabled="isMutatingRencontre"
            @click.prevent="launch(rencontre.id)"
          >
            Démarrer la rencontre
          </UButton>
          <UButton
            v-if="rencontre.status === StatusRencontre.DEMARE"
            icon="mingcute:alert-octagon-line"
            color="error"
            variant="solid"
            :loading="isMutatingRencontre"
            :disabled="isMutatingRencontre"
            @click.prevent="stop()"
          >
            Clôturer la rencontre
          </UButton>
          <UButton
            v-if="rencontre.status === StatusRencontre.CLOTURE"
            icon="mingcute:refresh-2-line"
            color="warning"
            variant="solid"
            :loading="isMutatingRencontre"
            :disabled="isMutatingRencontre"
            @click.prevent="reinit(rencontre.id)"
          >
            Réinitialiser la rencontre
          </UButton>
        </div>
        <div v-else class="flex justify-center gap-5">
          <UButton
            v-if="rencontre.status !== StatusRencontre.INITIAL"
            icon="mingcute:file-export-line"
            color="secondary"
            variant="solid"
            @click.prevent="exporte(rencontre)"
          >
            Exporter la rencontre
          </UButton>
        </div>
      </RencontreCard>
    </template>
  </div>
</template>

<style scoped></style>
