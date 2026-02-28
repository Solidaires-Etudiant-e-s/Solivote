<script setup lang="ts">
import type { TypeVote } from "~/utils/backendTypes";
type Possibilite = {
    id: number;
    nom: string;
};

type VoteLike = {
    id: number;
    nom: string;
    description?: string | null;
    status: string;
    type: TypeVote;
    possibilites?: Possibilite[];
};

const props = defineProps<{
    vote: VoteLike;
}>();
</script>

<template>
    <UCard class="w-full">
        <template #header>
            <div>
                <div class="flex flex-col gap-1 w-full">
                    <div
                        class="text-base font-serif flex items-start justify-between gap-2"
                    >
                        <span class="break-words">{{ props.vote.nom }}</span>
                        <UBadge class="shrink-0">{{ props.vote.type }}</UBadge>
                    </div>
                    <div
                        v-if="props.vote.description"
                        class="text-xs text-muted break-words"
                    >
                        {{ props.vote.description }}
                    </div>
                    <div
                        v-if="props.vote.type == TypeVote.CONDORCET"
                        class="flex gap-2 flex-wrap"
                    >
                        <template
                            v-for="possibilite in props.vote.possibilites ?? []"
                            :key="possibilite.id"
                        >
                            <UBadge>{{ possibilite.nom }}</UBadge>
                        </template>
                    </div>
                </div>
            </div>
        </template>

        <div v-if="$slots.actions" class="mt-2">
            <slot name="actions" />
        </div>
    </UCard>
</template>
