<script setup lang="ts">
import { sumCondorcetVotes, buildCondorcetMatrix, findCondorcetWinner, type CondorcetChoix, type CondorcetChoiceMeta } from "~/utils/condorcet";

const props = defineProps<{ choix: CondorcetChoix[], choiceMeta: CondorcetChoiceMeta[] }>();

const votes = computed(() => sumCondorcetVotes(props.choix))

const matrix = computed(() => buildCondorcetMatrix(props.choix, props.choiceMeta))

const hasVotes = computed(() => votes.value.length > 0)

const winnerIndex = computed(() => {
  if (!hasVotes.value) return -1
  return findCondorcetWinner(matrix.value)
})

const isParadox = computed(() => winnerIndex.value === -1)

const result = computed(() => {
  if (isParadox.value) {
    return null
  }
  return props.choiceMeta[winnerIndex.value]?.label
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-2">
      <h4 class="text-sm font-semibold text-muted uppercase tracking-wide">Classements exprimés</h4>
      <div v-for="(vote, voteIndex) in votes" :key="voteIndex" class="flex flex-col gap-0.5 text-sm">
        <span class="font-medium">{{ vote.syndicat }} <span class="text-muted">({{ vote.mandat }} mandat{{ vote.mandat > 1 ? 's' : '' }})</span></span>
        <div class="flex flex-wrap items-center gap-1 pl-2">
          <template v-for="(v, index) in vote.vote.map((v) => props.choiceMeta.find((c) => c.key === v)?.label)" :key="index">
            <span class="inline-flex items-center gap-1">
              <span class="text-xs font-mono text-muted bg-secondary-200 rounded px-1">{{ index + 1 }}</span>
              <span>{{ v }}</span>
            </span>
            <span v-if="index !== vote.vote.length - 1" class="text-muted">›</span>
          </template>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div class="overflow-x-auto">
        <div class="grid text-center text-sm" :style="'grid-template-columns: repeat(' + (matrix.length + 1) + ', minmax(0, 1fr))'">
          <template v-for="(row, rowIndex) in matrix" :key="rowIndex">
            <template v-if="rowIndex === 0">
              <div></div>
              <template v-for="(_, colIndex) in row" :key="colIndex">
                <div class="font-medium text-xs px-1 truncate" :title="props.choiceMeta[colIndex]?.label">{{props.choiceMeta[colIndex]?.label}}</div>
              </template>
            </template>

            <div class="font-medium text-xs px-1 truncate text-left" :class="winnerIndex >= 0 && rowIndex === winnerIndex ? 'text-primary font-bold' : ''" :title="props.choiceMeta[rowIndex]?.label">{{props.choiceMeta[rowIndex]?.label}}</div>
            <template v-for="(cell, colIndex) in row" :key="colIndex">
              <div
                class="font-mono text-xs rounded px-1 py-0.5"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400': cell > 0,
                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400': cell < 0,
                  'bg-secondary-200 text-muted': cell === 0 && colIndex !== rowIndex,
                  'text-muted': cell === 0 && colIndex === rowIndex,
                  'ring-2 ring-primary/50': winnerIndex >= 0 && rowIndex === winnerIndex && colIndex !== rowIndex,
                }"
              >{{ cell === 0 && colIndex === rowIndex ? '—' : cell }}</div>
            </template>
          </template>
        </div>
      </div>
    </div>

    <div v-if="hasVotes" class="text-center text-sm border-t pt-3">
      <template v-if="result">
        <span class="text-muted">Vainqueur de Condorcet :</span>
        <span class="font-bold text-primary ml-1">{{ result }}</span>
      </template>
      <template v-else>
        <div class="flex flex-col gap-1">
          <span class="font-semibold text-amber-600 dark:text-amber-400">Paradoxe de Condorcet</span>
          <span class="text-muted text-xs">Aucun candidat ne bat tous les autres en duel. Les préférences exprimées ne permettent pas de désigner un vainqueur unanime.</span>
        </div>
      </template>
    </div>
  </div>
</template>
