<script setup lang="ts">
import { StatusRencontre, TypeRencontre } from "@prisma/client";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { FormSubmitEvent } from "@nuxt/ui";

const {
  data: rencontres,
  status: rencontreStatus,
  execute: updateRencontres,
} = useLazyFetch("/api/rencontre");
const { data: user, status: userStatus } = await useLazyFetch("/api/role");
watch(user, async () => {
  await updateRencontresAndDetails();
});

const updateRencontresAndDetails = async () => {
  await updateRencontres();
  if (user!.value!.role === "admin") {
    details.value = await Promise.all(
      rencontres.value!.map((i) => $fetch(`/api/rencontre/syndicat/${i.id}`)),
    );
  }
};

const {
  open,
  send,
  status: wsStatus,
} = useWebSocket("/api/ws/rencontre", {
  immediate: false,
  async onMessage() {
    await updateRencontresAndDetails();
  },
  autoReconnect: true,
});

const details = ref<string[][]>([]);
onMounted(async () => {
  open();
});

const updateAll = async (self: boolean = true) => {
  send("");
  if (self) {
    await updateRencontresAndDetails();
  }
};

const new_rencontre = reactive({
  type: TypeRencontre.CF,
  dates: shallowRef({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()).add({ days: 2 }),
  }),
});

const toast = useToast();
async function onSubmit(event: FormSubmitEvent<typeof new_rencontre>) {
  console.log(typeof event.data.dates.start);
  const result = await $fetch("/api/rencontre", {
    method: "POST",
    body: {
      type: event.data.type,
      dateDebut: event.data.dates.start.toDate(getLocalTimeZone()),
      dateFin: event.data.dates.end.toDate(getLocalTimeZone()),
    },
    ignoreResponseError: true,
  });

  if (result) {
    toast.add({
      title: "Success",
      description: result.dateDebut,
      color: "success",
    });
    new_rencontre.type = TypeRencontre.CF;
    await updateAll();
  } else {
    toast.add({ title: "Error", description: "NOPE", color: "error" });
  }
}

async function onSyndicatAdd(index: number, id: number) {
  const result = await $fetch("/api/rencontre/syndicat", {
    method: "POST",
    body: {
      id,
      syndicats: syndicat.value[index]?.map((s) => ({ nom: s })),
    },
  });

  if (result) {
    toast.add({ title: "Success", color: "success" });
    syndicat.value[index] = [];
    await updateAll();
  } else {
    toast.add({ title: "Error", description: "NOPE", color: "error" });
  }
}

const launch = async (id: number) => {
  await $fetch(`/api/rencontre/start/${id}`);
  updateAll();
};

const stop = async () => {
  await $fetch(`/api/rencontre/stop`);
  updateAll();
};

const reinit = async (id: number) => {
  await $fetch(`/api/rencontre/reinit/${id}`);
  updateAll();
};

const syndicat = ref([[]]);
</script>

<template>
  <ListCreation>
    <template #header>
      <AppHeader
        title="Rencontres"
        :user="user"
        :status="userStatus"
        :ws-status="wsStatus"
      />
    </template>

    <template #creation>
      <p v-if="userStatus !== 'success'">Loading...</p>
      <UForm
        v-else
        :state="new_rencontre"
        class="w-full flex flex-wrap gap-5 m-5 justify-center"
        @submit.prevent="onSubmit"
      >
        <UFormField label="Nouvelle rencontre:" name="nom" class="basis-80">
          <USelect
            v-model="new_rencontre.type"
            :items="Object.values(TypeRencontre)"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Date:" name="dates" class="basis-80">
          <UInputDate ref="inputDate" v-model="new_rencontre.dates" range>
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
                    v-model="new_rencontre.dates"
                    class="p-2"
                    :number-of-months="2"
                    range
                  />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <UButton type="submit"> Créer </UButton>
      </UForm>
    </template>

    <template
      v-if="rencontreStatus === 'success' && userStatus === 'success'"
      #list
    >
      <template v-for="(rencontre, index) in rencontres" :key="rencontre.id">
        <RencontreCard
          class="basis-150 shrink-0"
          :user="user"
          :rencontre
          :execute="updateAll"
        >
          <template v-if="user!.role === 'admin'">
            <UForm
              v-if="
                details[index] && rencontre.status === StatusRencontre.INITIAL
              "
              :state="details[index]"
              class="flex flex-row gap-5 justify-center"
              @submit.prevent="onSyndicatAdd(index, rencontre.id)"
            >
              <UFormField
                label="Syndicats à ajouter:"
                name="syndicats"
                class="basis-80"
              >
                <UInputMenu
                  v-model="syndicat[index]"
                  multiple
                  :items="details[index]"
                />
              </UFormField>
              <UButton
                type="submit"
                icon="mingcute:add-square-line"
                color="success"
                variant="solid"
              />
            </UForm>

            <UButton
              v-if="rencontre.status === StatusRencontre.INITIAL"
              icon="mingcute:rocket-line"
              color="success"
              variant="solid"
              @click.prevent="launch(rencontre.id)"
            >
              Démarrer la rencontre
            </UButton>
            <UButton
              v-if="rencontre.status === StatusRencontre.DEMARE"
              icon="mingcute:alert-octagon-line"
              color="error"
              variant="solid"
              @click.prevent="stop()"
            >
              Clôturer la rencontre
            </UButton>
            <UButton
              v-if="rencontre.status === StatusRencontre.CLOTURE"
              icon="mingcute:refresh-2-line"
              color="warning"
              variant="solid"
              @click.prevent="reinit(rencontre.id)"
            >
              Réinitialiser la rencontre
            </UButton>
          </template>
        </RencontreCard>
      </template>
    </template>
  </ListCreation>
</template>

<style scoped></style>
