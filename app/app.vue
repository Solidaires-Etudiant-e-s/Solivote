<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import * as locales from "@nuxt/ui/locale";
import { TypeRencontre } from "@prisma/client";
import { today, getLocalTimeZone } from "@internationalized/date";
import getRencontreName from "~/utils/getRencontreName";

const { data: currentRencontre, execute: updateCurrentRencontre } =
  await useLazyFetch("/api/rencontre/current");
const { data: user } = await useLazyFetch("/api/role");
const { data: lasts, execute: _updateLastsRencontre } = await useLazyFetch(
  "/api/rencontre/last",
);

const isSuperadmin = computed(
  () =>
    user.value?.role === "admin" &&
    user.value?.name?.toLowerCase() === "superadmin",
);

const baseItems: NavigationMenuItem[] = [
  {
    label: "Rencontres passées",
    icon: "mingcute:history-anticlockwise-line",
    to: "/rencontres",
  },
];

const items = computed<NavigationMenuItem[][]>(() => {
  const final: NavigationMenuItem[][] = [];

  if (currentRencontre.value) {
    final.push([
      {
        label: getRencontreName(currentRencontre.value),
        slot: "current-event",
        to: "/",
      },
    ]);
  }

  if (lasts.value) {
    const lastRencontre: NavigationMenuItem[] = lasts.value.map((last) => ({
      label: last.nom,
    }));
    final.push(lastRencontre);
  }

  final.push(baseItems);

  return final;
});

const { locale } = useI18n();

const showNewRencontre = ref(false);
const newRencontre = reactive({
  nom: "",
  type: TypeRencontre.CF,
  dates: shallowRef({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()).add({ days: 2 }),
  }),
});
const toast = useToast();

const inferredRencontreName = computed(() => {
  const start = newRencontre.dates.start?.toDate(getLocalTimeZone());
  if (!start) return "";
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
    start,
  );
  return `${newRencontre.type} de ${month} ${start.getFullYear()}`;
});

const displayRencontreName = computed(() =>
  newRencontre.nom.trim()
    ? newRencontre.nom.trim()
    : inferredRencontreName.value,
);

const createRencontre = async () => {
  const nom = displayRencontreName.value.trim();
  if (!nom) {
    toast.add({
      title: "Nom manquant",
      description: "Veuillez saisir un nom pour la rencontre.",
      color: "error",
    });
    return;
  }
  const result = await $fetch("/api/rencontre", {
    method: "POST",
    body: {
      nom,
      type: newRencontre.type,
      dateDebut: newRencontre.dates.start.toDate(getLocalTimeZone()),
      dateFin: newRencontre.dates.end.toDate(getLocalTimeZone()),
    },
    ignoreResponseError: true,
  });

  if (result) {
    toast.add({
      title: "Rencontre créée",
      description: result.nom || "La rencontre a été créée avec succès.",
      color: "success",
    });
    newRencontre.nom = "";
    newRencontre.type = TypeRencontre.CF;
    showNewRencontre.value = false;
    await updateCurrentRencontre();
  } else {
    toast.add({
      title: "Création impossible",
      description: "Une erreur est survenue. Réessayez.",
      color: "error",
    });
  }
};

useHead({
  link: [
    { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      href: "/favicon-32x32.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
  ],
});
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <div class="flex items-center justify-center">
          <LogoItem class="h-10 w-auto" />
          <h1 class="ml-4 font-bold text-2xl">SoliVote</h1>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UButton
          v-if="isSuperadmin"
          icon="mingcute:add-square-line"
          color="primary"
          variant="soft"
          class="w-full"
          :block="collapsed"
          @click="showNewRencontre = true"
        >
          Nouvelle rencontre
        </UButton>

        <UNavigationMenu
          :collapsed="collapsed"
          :items="items"
          orientation="vertical"
        >
          <template #current-event-leading>
            <span
              class="mx-0.5 size-4 rounded-[40px] bg-(--color-solired-500) animate-pulse"
            />
          </template>
        </UNavigationMenu>
      </template>
    </UDashboardSidebar>
    <UApp :locale="locales[locale]">
      <div class="min-h-screen overflow-y-auto w-full">
        <NuxtPage />
      </div>
      <UModal v-model:open="showNewRencontre">
        <template #content>
          <UCard>
            <template #header>
              <div class="text-lg font-semibold">Nouvelle rencontre</div>
            </template>

            <UForm
              :state="newRencontre"
              class="flex flex-col gap-4"
              @submit.prevent="createRencontre"
            >
              <UFormField label="Nom" name="nom">
                <UInput
                  v-model="newRencontre.nom"
                  :placeholder="inferredRencontreName || 'Nom de la rencontre'"
                />
              </UFormField>

              <UFormField label="Type" name="type">
                <USelect
                  v-model="newRencontre.type"
                  :items="Object.values(TypeRencontre)"
                />
              </UFormField>

              <UFormField label="Dates" name="dates">
                <UInputDate v-model="newRencontre.dates" range>
                  <template #trailing>
                    <UPopover>
                      <UButton
                        color="neutral"
                        variant="link"
                        size="sm"
                        icon="mingcute:calendar-line"
                        aria-label="Select a date range"
                        class="px-0"
                      />

                      <template #content>
                        <UCalendar
                          v-model="newRencontre.dates"
                          class="p-2"
                          :number-of-months="2"
                          range
                        />
                      </template>
                    </UPopover>
                  </template>
                </UInputDate>
              </UFormField>

              <div class="flex justify-end gap-3">
                <UButton
                  color="neutral"
                  variant="ghost"
                  @click="showNewRencontre = false"
                >
                  Annuler
                </UButton>
                <UButton type="submit" color="primary"> Créer </UButton>
              </div>
            </UForm>
          </UCard>
        </template>
      </UModal>
    </UApp>
  </UDashboardGroup>
</template>
