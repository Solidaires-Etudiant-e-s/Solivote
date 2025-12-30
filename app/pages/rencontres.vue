<script setup lang="ts">

  import type {FormSubmitEvent} from "@nuxt/ui";
  import {z} from "zod";
  import {TypeRencontre} from "@prisma/client";

  const {data: rencontres, status: rencontreStatus, execute: updateRencontres} = useLazyFetch("/api/rencontre")
  const {data: user, status: userStatus} = await useLazyFetch("/api/role")

  const { open, send, status: wsStatus } = useWebSocket('/api/ws/rencontre', {
    immediate: false,
    async onMessage() {
      updateRencontres()
    },
    autoReconnect: true
  })

  onMounted(() => {
    open()
  })

  const updateAll = () => {
    send("")
    updateRencontres()
  }

  const new_rencontre = reactive({
    nom: '',
    type: TypeRencontre.CF,
  })

  const schema = z.object({
    nom: z.string().min(1, "msg Erreur TODO"),
    type: z.nativeEnum(TypeRencontre)
  })

  type Schema = z.output<typeof schema>

  const toast = useToast()
  async function onSubmit(event: FormSubmitEvent<Schema>) {
    const result = await $fetch("/api/rencontre", {
      method: 'POST',
      body: event.data,
    })
    if (result) {
      toast.add({title: 'Success', description: result.nom, color: 'success'})
      new_rencontre.nom = ""
      new_rencontre.type = TypeRencontre.CF
      await updateAll()
    } else {
      toast.add({title: 'Error', description: "NOPE", color: 'error'})
    }
  }

</script>

<template>
  <list-creation>
    <template #header>
      <app-header title="Rencontres" :user="user" :status="userStatus" :ws-status="wsStatus"/>
    </template>

    <template #creation>
      <p v-if="userStatus !== 'success'"> Loading... </p>
      <UForm v-else :schema="schema" :state="new_rencontre" class="w-full flex flex-wrap gap-5 m-5 justify-center" @submit.prevent="onSubmit">
        <UFormField label="Nouvelle rencontre:" name="nom" class="basis-80">
          <UInput v-model="new_rencontre.nom" class="w-full"/>
          <USelect v-model="new_rencontre.type" :items="Object.values(TypeRencontre)" class="w-full"/>
        </UFormField>

        <UButton type="submit">
          Créer
        </UButton>
      </UForm>
    </template>

    <template v-if="rencontreStatus === 'success' && userStatus === 'success'" #list>
      <div v-for="rencontre in rencontres" :key="rencontre.id">
        <rencontre-card :user="user" :recontre="rencontre" :execute="updateAll"/>
      </div>
    </template>
  </list-creation>
</template>

<style scoped>

</style>