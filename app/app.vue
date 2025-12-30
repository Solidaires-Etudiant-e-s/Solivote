<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([
  {
    label: 'Vote',
    icon: 'i-lucide-vote',
    to: '/vote',
  },
  {
    label: 'Rencontres',
    icon: 'i-lucide-calendar-range',
    to: '/rencontres'
  },
  {
    label: 'Syndicats',
    icon: 'i-lucide-users',
    to: '/syndicats'
  },
  {
    label: 'Aide',
    icon: 'i-lucide-circle-help',
    to: '/'
  }
])
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar>

      <template #header>
        <logo class="h-5 w-auto" />
      </template>

      <UNavigationMenu
          :items="items"
          orientation="vertical"
      />
    </UDashboardSidebar>
    <UApp>
      <NuxtPage/>
    </UApp>
  </UDashboardGroup>
</template>