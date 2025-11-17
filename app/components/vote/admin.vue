<script setup lang="ts">
  import * as v from "valibot";
  import type {FormSubmitEvent} from "@nuxt/ui";

  const {execute} = defineProps(['execute'])

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
</script>

<template>
  <UForm :schema="schema" :state="new_vote" class="w-full flex flex-wrap gap-5 m-5 justify-center" @submit.prevent="onSubmit">
    <UFormField label="Nom" name="nom" class="basis-80">
      <UInput v-model="new_vote.nom" class="w-full"/>
    </UFormField>

    <UButton type="submit">
      Submit
    </UButton>
  </UForm>
</template>

<style scoped>

</style>