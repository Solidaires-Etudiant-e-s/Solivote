<script setup lang="ts">

const { data: user, status: userStatus } = await useLazyFetch("/api/role");
const { data: rawSyndicats, status: syndicatsStatus, execute } = await useLazyFetch("/api/syndicat");

const syndicats = computed(() => rawSyndicats.value);

const refresh = async () => {
  await $fetch('/api/syndicat/populate', {method: 'POST'})
  execute()
}

const toast = useToast();
const updateState = async (
  syndicat: Syndicat
) => {
  try {
    await $fetch("/api/syndicat", {
      method: "POST",
      body: {
        id: syndicat.id,
        defaultMandats: syndicat.defaultMandats,
        actif: syndicat.actif,
      },
    });
    toast.add({
      title: displayName(syndicat.nom) + " mis à jour",
      // description: "Le nombre de mandats a été enregistré.",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Mise à jour impossible",
      description: "Le nombre de mandats n'a pas pu être enregistré.",
      color: "error",
    });
  }
};
</script>

<template>
  <AppHeader
    title="Syndicats"
    :user="user"
    :status="userStatus"
  />
  <div class="flex justify-center">
    <UButton icon="mingcute:refresh-3-fill" @click.prevent="refresh"> Rafraîchir </UButton>
  </div>

  <div v-if="syndicatsStatus" class="flex items-center flex-wrap">
    <template v-for="(syndicat, index) in syndicats" :key="syndicat.id">
      <div class="w-130 text-center flex flex-col items-center">
        {{displayName(syndicat.nom)}}
        <UInputNumber v-model="syndicat.defaultMandats"
        @blur="
          updateState(
            syndicat,
          )
        " :min="0"/>
        <USwitch v-model="syndicat.actif" @change="updateState(syndicat)"/>
      </div>
    </template>
  </div>
</template>
