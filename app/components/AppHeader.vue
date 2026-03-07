<script setup lang="ts">
const props = defineProps<{
  title: string;
  user?: { name?: string; role: string } | null;
  status?: string;
  sseStatus?: string;
}>();

const displayName = computed(() => {
  const name = props.user?.name?.trim();
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1);
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
      <template v-if="props.status && props.status === 'success'">
        <UBadge v-if="props.sseStatus === 'connected'">Connecté</UBadge>
        <UBadge v-else-if="props.sseStatus === 'connecting'" color="warning">
          Connexion...
        </UBadge>
        <UBadge v-else color="error">Déconnecté</UBadge>

        <UUser
          v-if="props.user && displayName"
          :name="displayName"
          class="hidden sm:flex"
        />
      </template>
    </template>
  </UHeader>
</template>

<style scoped></style>
