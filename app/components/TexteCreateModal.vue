<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";

const props = defineProps<{
    open: boolean;
  }>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "saved"): void;
}>();

const schema = z
  .object({
    titre: z.string().min(1)
  });

type Schema = z.output<typeof schema>;
const formState = reactive({
  titre: "",
});

// watch(
//   [() => props.open],
//   ([isOpen]) => {
//     if (isOpen) {
//       syncForm();
//     }
//   },
//   { immediate: true },
// );

const toast = useToast();
const isSubmitting = ref(false);

const close = () => {
  emit("update:open", false);
};

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (isSubmitting.value) return;

  const payload = {
    titre: event.data.titre.trim()
  };
  isSubmitting.value = true;

  try {
    const result = await $fetch("/api/texte", {
      method: "POST",
      body: payload,
    });
    toast.add({
      title: "Texte créé",
      description: result.titre,
      color: "success",
    });
    close();
    emit("saved");
  } catch {
    toast.add({
      title: "Création du texte impossible",
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
      <UForm :schema="schema" :state="formState" class="w-full" @submit.prevent="onSubmit">
        <UCard>
          <template #header>
            <div class="text-lg font-semibold">
              Nouveau Texte
            </div>
            <p class="text-sm text-muted">
              Un titre court, TODO
            </p>
          </template>

          <div class="grid gap-4">
            <UFormField label="Titre du Texte" name="titre">
              <UInput v-model="formState.titre" placeholder="Texte budget 2026"/>
            </UFormField>
          </div>

          <template #footer>
            <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <UButton color="neutral" variant="ghost" class="w-full sm:w-auto" @click="close">
                Annuler
              </UButton>
              <UButton type="submit" color="primary" class="w-full sm:w-auto" :loading="isSubmitting" :disabled="isSubmitting">
                Créer le Texte
              </UButton>
            </div>
          </template>
        </UCard>
      </UForm>
    </template>
  </UModal>
</template>
