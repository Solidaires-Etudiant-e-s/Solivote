<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";

type VoteChoice = {
  date: Date | string;
  type: string;
  syndicat?: { nom?: string } | null;
  [key: string]: unknown;
};

type VoteLike = {
  id: number;
  nom: string;
  status: string;
  choix: VoteChoice[];
};

const props = withDefaults(
  defineProps<{
    user?: { name?: string; role: string } | null;
    execute: () => Promise<void> | void;
    currentVote?: VoteLike | null;
    currentVoteStatus?: string | null;
  }>(),
  {
    user: null,
    currentVote: null,
    currentVoteStatus: null,
  },
);

const schema = z.object({
  nom: z.string().min(1),
});

type Schema = z.output<typeof schema>;

const new_vote = reactive({
  nom: "",
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const result = await $fetch("/api/vote", {
    method: "POST",
    body: event.data,
  });
  if (result) {
    toast.add({ title: "Success", description: result.nom, color: "success" });
    new_vote.nom = "";
    await props.execute();
  } else {
    toast.add({ title: "Error", description: "NOPE", color: "error" });
  }
}

const stop = async () => {
  await $fetch(`/api/vote/stop`);
  await props.execute();
};
</script>

<template>
  <UForm
    :schema="schema"
    :state="new_vote"
    class="w-full flex flex-wrap gap-5 m-5 justify-center"
    @submit.prevent="onSubmit"
  >
    <UFormField label="Nouveau vote:" name="nom" class="basis-80">
      <UInput v-model="new_vote.nom" class="w-full" />
    </UFormField>

    <UButton type="submit"> Créer </UButton>
  </UForm>

  <div class="flex justify-center">
    <VoteCard
      v-if="props.currentVoteStatus === 'success' && props.currentVote"
      :vote="props.currentVote"
      :user="props.user"
      :execute="props.execute"
    >
      {{ props.currentVote.choix.length }}/??
      <UButton
        icon="i-lucide-vote"
        color="info"
        variant="solid"
        @click.prevent="stop()"
      >
        Clôturer le vote
      </UButton>
    </VoteCard>
  </div>
</template>

<style scoped></style>
