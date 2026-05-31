<script setup lang="ts">

const props = defineProps<{ choix: Choix[], choiceMeta: {
    key: number;
    label: string;
}[] }>();

const votes = computed(() => {
  const votes: ({vote: number[], mandat: number, syndicat: string})[] = []

  for (const choi of props.choix) {
    for (const vote of choi.choix) {
      votes.push({vote: vote.vote, mandat: vote.mandat, syndicat: choi.syndicat.nom})
    }
  }

  return votes
})

const votesSum = computed(() => votes.value.reduce((acc, item) => {
  const existing = acc.find(x => JSON.stringify(x.vote) === JSON.stringify(item.vote));

  if (existing) {
    existing.mandat += item.mandat;
  } else {
    acc.push({ vote: item.vote, mandat: item.mandat });
  }

  return acc;
}, [] as ({vote: number[], mandat: number})[]))

const matrix = computed(() => {
  const matrix: (string)[][] = []
  props.choiceMeta.forEach((x) => {
    const line: (string)[] = []
    props.choiceMeta.forEach((y) => {
      if (x.key == y.key) {
        line.push("-")
        return
      }
      let win = 0
      votesSum.value.forEach((vote) => {
        win += vote.vote.indexOf(x.key)<vote.vote.indexOf(y.key) ? vote.mandat : -vote.mandat
      })
      line.push(String(win))
    })
    matrix.push(line)
  })
  return matrix
})

const result = computed(() => {
  const index = matrix.value.findIndex((line) => line.every((value) => value === ' ' || value === '-' || Number(value) > 0))
  if (index == -1) {
    return "Paradox"
  }
  return props.choiceMeta[index]?.label
})

</script>

<template>
  <div>
    <div class="flex-1">
      <div v-for="(vote, voteIndex) in votes" :key="voteIndex" class="flex flex-col h-fit">
        {{vote.syndicat}}({{vote.mandat}}):
        <template v-for="(v, index) in vote.vote.map((v) => props.choiceMeta.find((c) => c.key === v)?.label)"> {{v}} {{index !== vote.vote.length-1 ? " > " : ""}}</template>
      </div>
    </div>
    <div class="flex-1">
      <div class="grid text-center" :style="'grid-template-columns: repeat(' + (matrix.length + 1) + ', minmax(0, 1fr))'">
        <template v-for="(row, rowIndex) in matrix" :key="rowIndex">
          <template v-if="rowIndex === 0">
            <div>{{ }}</div>
            <template v-for="(_, colIndex) in row" :key="colIndex">
              <div>{{props.choiceMeta[colIndex]?.label}}</div>
            </template>
          </template>


          <div>{{props.choiceMeta[rowIndex]?.label}}</div>
          <template v-for="(cell, colIndex) in row" :key="colIndex">
            <div>{{ cell }}</div>
          </template>
        </template>
      </div>
      <div class="text-center">
        Résultat: {{result}}
      </div>
    </div>
  </div>
</template>
