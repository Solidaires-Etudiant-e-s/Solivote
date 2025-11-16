<script setup lang="ts">
  import * as v from 'valibot'
  import type { FormSubmitEvent } from '@nuxt/ui'


  const {data: votes, status: voteStatus, execute} = await useLazyFetch("/api/votes")
  const {data: role, status: roleStatus} = await useLazyFetch("/api/role")


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
  <div class="w-full">
    <div v-if="roleStatus === 'success'">

      <template v-if="role === 'syndicat'">

      </template>
      <template v-else-if="role === 'admin'">
        <UForm :schema="schema" :state="new_vote" class="space-y-4 w-full" @submit.prevent="onSubmit">
          <UFormField label="Nom" name="nom">
            <UInput v-model="new_vote.nom" />
          </UFormField>

          <UButton type="submit">
            Submit
          </UButton>
        </UForm>
      </template>

    </div>

    <USeparator class="w-full m-5"/>

    <div class="w-fit flex flex-wrap gap-5 m-5">
      <template v-if="voteStatus === 'success'">
        <div  v-for="vote in votes" :key="vote.id" class="basis-1/4">
          <UCard class="">
            <template #header>
              {{ vote.nom }} <UBadge color="neutral"> {{vote.statut}} </UBadge>
            </template>

            content
          </UCard>
        </div>
      </template>
      <template v-for="i in 1" v-else :key="i">
        <USkeleton class="h-35 w-60 m-5"/>
      </template>
    </div>
  </div>
</template>

<style scoped>

</style>