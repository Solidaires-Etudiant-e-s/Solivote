<script setup lang="ts">
type VoteLike = Pick<Vote, "id" | "nom" | "description" | "status"> & {
    choix: {
        date: Date | string;
        type: string;
        syndicat?: { nom?: string } | null;
    }[];
};

const props = defineProps<{
    user?: { role: string; name?: string } | null;
    execute: () => Promise<void> | void;
    currentVote?: VoteLike | null;
    currentVoteStatus?: string | null;
}>();

const { data: syndicats } = await useLazyFetch("/api/syndicat");
const syndicatCount = computed(() => syndicats.value?.length ?? 0);

const stop = async () => {
    await $fetch(`/api/vote/stop`);
    await props.execute();
};

type Panache = Record<string, number>;

const emit = defineEmits<{
    (event: "vote", type: string, selected: string): void;
    (event: "panacher", values: Panache, selected: string): void;
}>();
</script>

<template>
    <div class="flex justify-center">
        <VoteCardLive
            v-if="props.currentVoteStatus === 'success' && props.currentVote"
            :vote="props.currentVote"
            :user="props.user"
            @vote="(type, selected) => emit('vote', type, selected)"
            @panacher="
                (panache, selected) => emit('panacher', panache, selected)
            "
        >
            <template #actions>
                <UButton
                    icon="mingcute:choice-line"
                    color="primary"
                    @click.prevent="stop()"
                >
                    Clôturer ({{
                        syndicatCount - props.currentVote.choix.length
                    }}
                    restant{{
                        syndicatCount - props.currentVote.choix.length === 1
                            ? ""
                            : "s"
                    }})
                </UButton>
            </template>
        </VoteCardLive>
    </div>
</template>
