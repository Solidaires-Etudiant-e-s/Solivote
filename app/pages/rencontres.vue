<script setup lang="ts">

  import {TypeRencontre} from "@prisma/client";
  import { CalendarDate } from '@internationalized/date'

  const {data: rencontres, status: rencontreStatus, execute: updateRencontres} = useLazyFetch("/api/rencontre")
  const {data: user, status: userStatus} = await useLazyFetch("/api/role")

  const { open, send, status: wsStatus } = useWebSocket('/api/ws/rencontre', {
    immediate: false,
    async onMessage() {
      updateRencontres()
    },
    autoReconnect: true
  })

  onMounted(() => {
    open()
  })

  const updateAll = () => {
    send("")
    updateRencontres()
  }

  const new_rencontre = reactive({
    type: TypeRencontre.CF,
    dates: {
      start: new CalendarDate(2025, 1, 10),
      end: new CalendarDate(2025, 1, 20),
    }
  })

  // const schema = z.object({
  //   type: z.nativeEnum(TypeRencontre),
  //   dateDebut: z.string().datetime(),
  //   dateFin: z.string().datetime(),
  // })
  //
  // type Schema = z.output<typeof schema>

  const toast = useToast()
  async function onSubmit(event) {
    const result = await $fetch("/api/rencontre", {
      method: 'POST',
      body: {
        type: event.data.type,
        dateDebut: event.data.dates.start.toDate(),
        dateFin: event.data.dates.end.toDate(),
      },
    })

    if (result) {
      toast.add({title: 'Success', description: result.dateDebut, color: 'success'})
      new_rencontre.type = TypeRencontre.CF
      //todo
      await updateAll()
    } else {
      toast.add({title: 'Error', description: "NOPE", color: 'error'})
    }


  }

</script>

<template>
  <list-creation>
    <template #header>
      <app-header title="Rencontres" :user="user" :status="userStatus" :ws-status="wsStatus"/>
    </template>

    <template #creation>
      <p v-if="userStatus !== 'success'"> Loading... </p>
      <UForm v-else :state="new_rencontre" class="w-full flex flex-wrap gap-5 m-5 justify-center" @submit.prevent="onSubmit">
        <UFormField label="Nouvelle rencontre:" name="nom" class="basis-80">
          <USelect v-model="new_rencontre.type" :items="Object.values(TypeRencontre)" class="w-full"/>
        </UFormField>

        <UFormField label="Date:" name="dates" class="basis-80">
          <UInputDate ref="inputDate" v-model="new_rencontre.dates" range>
            <template #trailing>
              <UPopover>
                <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    aria-label="Select a date range"
                    class="px-0"
                />

                <template #content>
                  <UCalendar v-model="new_rencontre.dates" class="p-2" :number-of-months="2" range />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>

        <UButton type="submit">
          Créer
        </UButton>
      </UForm>
    </template>

    <template v-if="rencontreStatus === 'success' && userStatus === 'success'" #list>
      <template v-for="rencontre in rencontres" :key="rencontre.id">
        <rencontre-card class="basis-150" :user="user" :rencontre :execute="updateAll"/>
      </template>
    </template>
  </list-creation>
</template>

<style scoped>

</style>