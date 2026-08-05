<script setup lang="ts">

const { data: user, status: userStatus } = await useLazyFetch("/api/role");
const { data: syndicats, status: syndicatsStatus, execute } = await useLazyFetch("/api/syndicat");

const sortedSyndicats = computed(() =>
  [...(syndicats.value ?? [])].sort((a, b) => Number(b.actif) - Number(a.actif))
);

const refresh = async () => {
  await $fetch('/api/syndicat/populate', {method: 'POST'})
  await execute()
}

const toast = useToast();

const save = async (syndicat: Syndicat) => {
  try {
    const updated = await $fetch<Syndicat[]>("/api/syndicat", {
      method: "POST",
      body: {
        id: syndicat.id,
        defaultMandats: syndicat.defaultMandats,
        actif: syndicat.actif,
      },
    });
    syndicats.value = updated;
    toast.add({
      title: displayName(syndicat.nom) + " mis à jour",
      color: "success",
    });
  } catch {
    await execute();
    toast.add({
      title: "Mise à jour impossible",
      description: "Le nombre de mandats n'a pas pu être enregistré.",
      color: "error",
    });
  }
};

const debouncedSave = useDebounceFn(save, 500);
</script>

<template>
  <div>
  <AppHeader
    title="Syndicats"
    :user="user"
    :status="userStatus"
  />
  <div class="flex justify-center mt-4">
    <UButton icon="mingcute:refresh-3-fill" @click.prevent="refresh"> Rafraîchir </UButton>
  </div>

  <TransitionGroup v-if="syndicatsStatus" name="syndicat" tag="div" class="flex flex-wrap gap-4 p-4 justify-center">
    <UCard v-for="syndicat in sortedSyndicats" :key="syndicat.id" class="w-64">
      <template #header>
        <div class="text-base font-serif">
          {{ displayName(syndicat.nom) }}
        </div>
      </template>

      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <ULabel>Mandats par défaut</ULabel>
          <UInputNumber
            v-model="syndicat.defaultMandats"
            :min="0"
            @update:model-value="debouncedSave(syndicat)"
          />
        </div>
        <div class="flex flex-col gap-1">
          <ULabel>Actif</ULabel>
          <USwitch
            v-model="syndicat.actif"
            @change="save(syndicat)"
          />
        </div>
      </div>
    </UCard>
  </TransitionGroup>
  </div>
</template>

<style scoped>
.syndicat-move,
.syndicat-enter-active,
.syndicat-leave-active {
  transition: all 0.3s ease;
}

.syndicat-enter-from,
.syndicat-leave-to {
  opacity: 0;
}
</style>
