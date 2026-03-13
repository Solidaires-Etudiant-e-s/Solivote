<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import type { Vote } from "~/utils/backendTypes";
import { TypeVote } from "~/utils/backendTypes";

const props = withDefaults(
  defineProps<{
    open: boolean;
    vote?: Vote | null;
  }>(),
  {
    vote: null,
  },
);

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "saved"): void;
}>();

const schema = z
  .object({
    nom: z.string().trim().min(1),
    description: z.string(),
    possibilites: z.array(z.string().trim().min(1)),
    type: z.enum(Object.values(TypeVote)),
  })
  .superRefine((input, ctx) => {
    if (input.type === TypeVote.STANDARD) {
      return;
    }
    if (input.possibilites.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ajoutez au moins un choix.",
        path: ["possibilites"],
      });
    }
    if (input.type === TypeVote.EN_CONTRE && input.possibilites.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le vote en contre doit contenir exactement deux choix.",
        path: ["possibilites"],
      });
    }
  });

type Schema = z.output<typeof schema>;
const formState = reactive({
  nom: "",
  description: "",
  type: TypeVote.STANDARD as Vote["type"],
  possibilites: [] as string[],
});
const isEditing = computed(() => !!props.vote);
const syncForm = () => {
  formState.nom = props.vote?.nom ?? "";
  formState.description = props.vote?.description ?? "";
  formState.type = props.vote?.type ?? TypeVote.STANDARD;
  formState.possibilites = props.vote?.possibilites?.map((entry) => entry.nom) ?? [];
};

watch(
  [() => props.open, () => props.vote],
  ([isOpen]) => {
    if (isOpen) {
      syncForm();
    }
  },
  { immediate: true },
);

watch(
  () => formState.type,
  (type) => {
    if (type === TypeVote.STANDARD) {
      formState.possibilites = [];
    }
    if (type === TypeVote.EN_CONTRE && formState.possibilites.length > 2) {
      formState.possibilites = formState.possibilites.slice(0, 2);
    }
  },
);

const toast = useToast();
const isSubmitting = ref(false);

const close = () => {
  emit("update:open", false);
};

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;

  const payload = {
    nom: event.data.nom.trim(),
    description: event.data.description.trim() || null,
    type: event.data.type,
    possibilites:
      event.data.type === TypeVote.STANDARD
        ? []
        : event.data.possibilites.map((entry) => entry.trim()).filter(Boolean),
  };
  isSubmitting.value = true;

  try {
    const result = await $fetch("/api/vote", {
      method: isEditing.value ? "PUT" : "POST",
      body: isEditing.value
        ? {
            id: props.vote!.id,
            ...payload,
          }
        : payload,
    });
    toast.add({
      title: isEditing.value ? "Vote modifié" : "Vote créé",
      description: result.nom,
      color: "success",
    });
    close();
    emit("saved");
  } catch {
    toast.add({
      title: isEditing.value ? "Modification impossible" : "Création impossible",
      description: "Vérifiez les champs puis réessayez.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal :open="props.open" @update:open="emit('update:open', $event)">
    <template #content>
      <UForm
        :schema="schema"
        :state="formState"
        class="w-full"
        @submit.prevent="onSubmit"
      >
        <UCard>
          <template #header>
            <div class="text-lg font-semibold">
              {{ isEditing ? "Modifier le vote" : "Nouveau vote" }}
            </div>
            <p class="text-sm text-muted">
              Un titre court, un résumé et possiblement des choix du vote.
            </p>
          </template>

          <div class="grid gap-4">
            <UFormField label="Titre du vote" name="nom">
              <UInput
                v-model="formState.nom"
                placeholder="Ex. Adoption du budget 2026"
              />
            </UFormField>
            <UFormField label="Type" name="type">
              <USelect
                v-model="formState.type"
                :items="Object.values(TypeVote)"
              />
            </UFormField>

            <UFormField
              v-if="formState.type === TypeVote.CONDORCET"
              label="Choix"
              name="possibilites"
            >
              <UInputTags
                v-model="formState.possibilites"
                placeholder="Choix du vote condorcet"
              />
            </UFormField>

            <UFormField
              v-if="formState.type === TypeVote.EN_CONTRE"
              label="Choix"
              name="possibilites"
            >
              <UInputTags
                v-model="formState.possibilites"
                :max="2"
                placeholder="Deux choix pour le vote en contre"
              />
            </UFormField>

            <UFormField
              label="Résumé (optionel)"
              name="description"
              help="Affiché dans la liste (1–2 phrases)."
            >
              <UTextarea
                v-model="formState.description"
                class="w-full"
                placeholder="Ex. Vote de principe sur la proposition présentée."
                :rows="2"
              />
            </UFormField>
          </div>

          <template #footer>
            <div
              class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3"
            >
              <UButton
                color="neutral"
                variant="ghost"
                class="w-full sm:w-auto"
                @click="close"
              >
                Annuler
              </UButton>
              <UButton
                type="submit"
                color="primary"
                class="w-full sm:w-auto"
                :loading="isSubmitting"
                :disabled="isSubmitting"
              >
                {{ isEditing ? "Enregistrer" : "Créer le vote" }}
              </UButton>
            </div>
          </template>
        </UCard>
      </UForm>
    </template>
  </UModal>
</template>
