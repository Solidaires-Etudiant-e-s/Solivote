<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import * as locales from "@nuxt/ui/locale";
import getRencontreName from "~/utils/getRencontreName";

const { data: currentRencontre } = await useLazyFetch("/api/rencontre/current");

const baseItems: NavigationMenuItem[] = [
  {
    label: "Rencontres passées",
    icon: "mingcute:history-anticlockwise-line",
    to: "/rencontres",
  },
];

const items = computed<NavigationMenuItem[]>(() => {
  if (!currentRencontre.value) {
    return baseItems;
  }

  return [
    {
      label: getRencontreName(currentRencontre.value),
      slot: "current-event",
      to: "/",
      class:
        "bg-[var(--color-solired-500)] text-[var(--ui-text-inverted)] font-semibold hover:bg-[var(--color-solired-600)]",
      ui: {
        link: "!text-[var(--ui-text-inverted)] hover:!text-[var(--ui-text-inverted)]",
        linkLabel: "!text-[var(--ui-text-inverted)]",
      },
    },
    ...baseItems,
  ];
});

const { locale } = useI18n();

useHead({
  link: [
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  ],
});
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <div class="pt-2 flex items-center justify-center">
          <LogoItem class="h-10 w-auto" />
          <h1 class="ml-4 font-bold text-2xl">SoliVote</h1>
        </div>
      </template>

      <UNavigationMenu :items="items" orientation="vertical">
        <template #current-event-leading>
          <span
            class="mx-0.5 size-4 rounded-[40px] bg-[var(--ui-text-inverted)] animate-pulse"
          />
        </template>
      </UNavigationMenu>
    </UDashboardSidebar>
    <UApp :locale="locales[locale]">
      <NuxtPage />
    </UApp>
  </UDashboardGroup>
</template>
