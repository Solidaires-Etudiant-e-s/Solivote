<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { TypeVote } from "@prisma/client";
import { z } from "zod";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "created"): void;
}>();

const schema = z
  .object({
    nom: z.string().min(1),
    description: z.string().nullable(),
    possibilites: z.array(z.string().min(1)),
    type: z.enum(TypeVote),
  })
  .refine((input) => {
    if (input.type != TypeVote.CONDORCET) {
      input.possibilites = [];
      return true;
    }
    if (input.possibilites.length == 0) return false;
    return true;
  });

type Schema = z.output<typeof schema>;

const new_vote = reactive({
  nom: "",
  description: "",
  type: TypeVote.STANDARD,
  possibilites: [],
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const result = await $fetch("/api/vote", {
    method: "POST",
    body: event.data,
  });
  if (result) {
    toast.add({
      title: "Vote créé",
      description: result.nom,
      color: "success",
    });
    new_vote.nom = "";
    new_vote.description = "";
    new_vote.possibilites = [];
    emit("update:open", false);
    emit("created");
  } else {
    toast.add({
      title: "Création impossible",
      description: "Vérifiez les champs puis réessayez.",
      color: "error",
    });
  }
}
</script>

<template>
  <UModal :open="props.open" @update:open="emit('update:open', $event)">
    <template #content>
      <UForm
        :schema="schema"
        :state="new_vote"
        class="w-full"
        @submit.prevent="onSubmit"
      >
        <UCard>
          <template #header>
            <div class="text-lg font-semibold">Nouveau vote</div>
            <p class="text-sm text-muted">
              Un titre court, un résumé et le texte complet du vote.
            </p>
          </template>

          <div class="grid gap-4">
            <UFormField label="Titre du vote" name="nom">
              <UInput
                v-model="new_vote.nom"
                placeholder="Ex. Adoption du budget 2026"
              />
            </UFormField>
            <UFormField label="Type" name="type">
              <USelect
                v-model="new_vote.type"
                :items="Object.values(TypeVote)"
              />
            </UFormField>

            <template v-if="new_vote.type == TypeVote.CONDORCET">
              <UInputTags
                v-model="new_vote.possibilites"
                placeholder="choix du condorcet"
              />
            </template>

            <UFormField
              label="Résumé (optionel)"
              name="description"
              help="Affiché dans la liste (1–2 phrases)."
            >
              <UTextarea
                v-model="new_vote.description"
                class="w-full"
                placeholder="Ex. Vote de principe sur la proposition présentée."
                :rows="2"
              />
            </UFormField>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                @click="emit('update:open', false)"
              >
                Annuler
              </UButton>
              <UButton type="submit" color="primary">Créer le vote</UButton>
            </div>
          </template>
        </UCard>
      </UForm>
    </template>
  </UModal>
</template>
