<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";
import type { Vote } from "~/utils/backendTypes";
import { StatusVote, TypeVote } from "~/utils/backendTypes";

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
        type: z.enum(Object.values(TypeVote)),
    })
    .refine((input) => {
        if (input.type === TypeVote.STANDARD) {
            input.possibilites = [];
            return true;
        }
        if (input.possibilites.length == 0) return false;
        if (input.type === TypeVote.EN_CONTRE && input.possibilites.length != 2)
            return false;
        return true;
    });

type Schema = z.output<typeof schema>;

const new_vote = reactive<{
    nom: string;
    description: string;
    type: TypeVote;
    possibilites: string[];
}>({
    nom: "",
    description: "",
    type: TypeVote.STANDARD,
    possibilites: [],
});

const toast = useToast();
const { data: votesCache } = useNuxtData<Vote[]>("votes");
const isCreatingVote = ref(false);
async function onSubmit(event: FormSubmitEvent<Schema>) {
    if (isCreatingVote.value) return;

    const previousVotes = structuredClone(votesCache.value ?? []);
    const tempId = -Date.now();
    const optimisticVote = {
        id: tempId,
        date: new Date(),
        nom: event.data.nom,
        type: event.data.type,
        description: event.data.description,
        content: "",
        rencontreId: 0,
        status: StatusVote.INITIAL,
        choix: [],
        possibilites:
            event.data.type === TypeVote.CONDORCET
                ? event.data.possibilites.map((nom, index) => ({
                      id: tempId - index - 1,
                      nom,
                      voteId: tempId,
                  }))
                : [],
        rencontre: {} as Vote["rencontre"],
    } as Vote;

    votesCache.value = [optimisticVote, ...(votesCache.value ?? [])];
    isCreatingVote.value = true;
    emit("update:open", false);

    try {
        const result = await $fetch("/api/vote", {
            method: "POST",
            body: event.data,
        });
        toast.add({
            title: "Vote créé",
            description: result.nom,
            color: "success",
        });
        new_vote.nom = "";
        new_vote.description = "";
        new_vote.possibilites = [];
        emit("created");
    } catch {
        votesCache.value = previousVotes;
        emit("update:open", true);
        toast.add({
            title: "Création impossible",
            description: "Vérifiez les champs puis réessayez.",
            color: "error",
        });
    } finally {
        isCreatingVote.value = false;
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
                            Un titre court, un résumé et possiblement des choix
                            du vote.
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

                        <template v-if="new_vote.type === TypeVote.CONDORCET">
                            <UInputTags
                                v-model="new_vote.possibilites"
                                placeholder="choix du condorcet"
                            />
                        </template>

                        <template v-if="new_vote.type === TypeVote.EN_CONTRE">
                            <UInputTags
                                v-model="new_vote.possibilites"
                                :max="2"
                                placeholder="choix du vote en contre ( toujour 2 )"
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
                        <div
                            class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3"
                        >
                            <UButton
                                color="neutral"
                                variant="ghost"
                                class="w-full sm:w-auto"
                                @click="emit('update:open', false)"
                            >
                                Annuler
                            </UButton>
                            <UButton
                                type="submit"
                                color="primary"
                                class="w-full sm:w-auto"
                                :loading="isCreatingVote"
                                :disabled="isCreatingVote"
                            >
                                Créer le vote
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </UForm>
        </template>
    </UModal>
</template>
