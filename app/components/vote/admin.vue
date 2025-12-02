<script setup lang="ts">
  import * as v from "valibot";
  import type {FormSubmitEvent} from "@nuxt/ui";

  const {user, execute, currentVote, currentVoteStatus} = defineProps(['user', 'execute', 'currentVote', 'currentVoteStatus'])

  const schema = v.object({
    nom: v.pipe(v.string()),
  })

  type Schema = v.InferOutput<typeof schema>

  const new_vote = reactive({
    nom: '',
  })

  const toast = useToast()
  async function onSubmit(event: FormSubmitEvent<Schema>) {
    const result = await $fetch("/api/vote", {
      method: 'POST',
      body: event.data,
    })
    if (result) {
      toast.add({title: 'Success', description: result.nom, color: 'success'})
      await execute()
    } else {
      toast.add({title: 'Error', description: "NOPE", color: 'error'})
    }
  }

  const stop = async () => {
    await $fetch(`/api/vote/stop`)
    await execute()
  }
</script>

<template>
  <UForm :schema="schema" :state="new_vote" class="w-full flex flex-wrap gap-5 m-5 justify-center" @submit.prevent="onSubmit">
    <UFormField label="Nouveau vote:" name="nom" class="basis-80">
      <UInput v-model="new_vote.nom" class="w-full"/>
    </UFormField>

    <UButton type="submit">
      Créer
    </UButton>
  </UForm>

  <div class="flex justify-center">
    <vote-card v-if="currentVoteStatus === 'success' && currentVote" :vote="currentVote" :user="user" :execute="execute">
      {{currentVote.choix.length}}/??
      <UButton icon="i-lucide-vote" color="info" variant="solid" @click.prevent="stop()"> Clôturer le vote </UButton>
    </vote-card>
  </div>
</template>

<style scoped>

</style>