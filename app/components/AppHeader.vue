<script setup lang="ts">
const props = defineProps<{
  title: string;
  user?: { name?: string; role: string } | null;
  status?: string;
  sseStatus?: string | null;
}>();

const display = computed(() => {
  return displayName(props.user?.name)
});
</script>

<template>
  <UHeader :toggle="false">
    <template #left>
      <div class="flex items-center gap-2 min-w-0">
        <UDashboardSidebarToggle side="left" />
        <h2 class="truncate">{{ props.title }}</h2>
      </div>
    </template>

    <template #right>
      <UBadge v-if="props.sseStatus === 'connected'">Connecté</UBadge>
      <UBadge v-else-if="props.sseStatus === 'connecting'" color="warning">
        Connexion...
      </UBadge>
      <UBadge v-else-if="props.sseStatus" color="error">Déconnecté</UBadge>
      <UUser
        v-if="props.status && props.status === 'success' && props.user && display"
        :name="display"
        class="hidden sm:flex"
      />
      <UIcon v-else name="mingcute:loading-fill" class="animate-spin"></UIcon>
      <UColorModeSelect />
    </template>
  </UHeader>
</template>

<style scoped></style>
