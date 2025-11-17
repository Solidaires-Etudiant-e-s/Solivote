<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([
  {
    label: 'Vote',
    icon: 'i-lucide-vote',
    to: '/vote',
  },
  {
    label: 'Syndicats',
    icon: 'i-lucide-users',
    children: [
      {
        label: 'List',
        icon: 'i-lucide-database',
        description: 'Define shortcuts for your application.',
        to: '/'
      },
      {
        label: 'JSP',
        icon: 'i-lucide-file-text',
        description: 'Display a modal/slideover within your application.',
        to: '/'
      },
      {
        label: 'Autre',
        icon: 'i-lucide-file-text',
        description: 'Display a toast within your application.',
        to: '/'
      }
    ]
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