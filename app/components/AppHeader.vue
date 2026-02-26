<script setup lang="ts">
const props = defineProps<{
    title: string;
    user?: { name?: string; role: string } | null;
    status?: string;
    wsStatus?: string;
}>();

const displayName = computed(() => {
    const name = props.user?.name?.trim();
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1);
});
</script>

<template>
    <UHeader>
        <template #title>
            <h2>{{ props.title }}</h2>
        </template>

        <template v-if="props.status && props.status === 'success'" #right>
            <UBadge v-if="props.wsStatus == 'OPEN'">Connecté</UBadge>
            <UBadge v-else color="error">Déconnecté</UBadge>

            <UUser v-if="props.user && displayName" :name="displayName" />
        </template>
    </UHeader>
</template>

<style scoped></style>
