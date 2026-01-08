<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import * as locales from "@nuxt/ui/locale";

const items = ref<NavigationMenuItem[]>([
  {
    label: "Vote",
    icon: "mingcute:choice-line",
    to: "/vote",
  },
  {
    label: "Rencontres",
    icon: "mingcute:calendar-3-line",
    to: "/rencontres",
  },
  {
    label: "Syndicats",
    icon: "mingcute:group-line",
    to: "/syndicats",
  },
  {
    label: "Aide",
    icon: "mingcute:question-line",
    to: "/",
  },
]);

const { locale } = useI18n();
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <LogoItem class="h-5 w-auto" />
      </template>

      <UNavigationMenu :items="items" orientation="vertical" />
    </UDashboardSidebar>
    <UApp :locale="locales[locale]">
      <NuxtPage />
    </UApp>
  </UDashboardGroup>
</template>
