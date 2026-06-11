<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import { LETTERS, indicesToLetters } from '../parsers/validate'

const router = useRouter()
const quiz = useQuizStore()

if (!quiz.session || !quiz.session.items.length) {
  router.replace('/')
}

const picked = ref([])

const item = computed(() => quiz.session?.items[quiz.session.index])
const isLast = computed(() => quiz.session.index === quiz.session.items.length - 1)
const answeredCount = computed(
  () => quiz.session.items.filter(i => i.judged).length
)
const displayOptions = computed(() =>
  item.value.perm.map(origIdx => item.value.q.options[origIdx])
)
const correctDisplayLetters = computed(() =>
  item.value.perm
    .map((origIdx, dispIdx) => (item.value.q.answer.includes(origIdx) ? LETTERS[dispIdx] : null))
    .filter(Boolean)
    .join('')
)

async function pickSingle(dispIdx) {
  if (item.value.judged) return
  picked.value = [dispIdx]
  await quiz.judge([dispIdx])
}

function toggleMulti(dispIdx) {
  if (item.value.judged) return
  const i = picked.value.indexOf(dispIdx)
  if (i === -1) picked.value.push(dispIdx)
  else picked.value.splice(i, 1)
}

async function confirmMulti() {
  await quiz.judge([...picked.value])
}

function optionClass(dispIdx) {
  if (!item.value.judged) {
    return { selected: picked.value.includes(dispIdx) }
  }
  const isAnswer = item.value.q.answer.includes(item.value.perm[dispIdx])
  const wasPicked = item.value.picked.includes(dispIdx)
  return {
    correct: isAnswer,
    wrong: wasPicked && !isAnswer,
    judged: true
  }
}

function goNext() {
  if (quiz.next()) picked.value = []
  else router.push('/result')
}

function endEarly() {
  if (confirm('確定提前結束？已作答的題目會列入結算。')) {
    router.push('/result')
  }
}
</script>

<template>
  <template v-if="item">
    <div class="quiz-head">
      <div>
        <strong>{{ quiz.session.bankName }}</strong>
        <span class="muted">
          　第 {{ quiz.session.index + 1 }} / {{ quiz.session.items.length }} 題
          答對 {{ quiz.session.correctCount }} / {{ answeredCount }}
        </span>
      </div>
      <button class="btn" @click="endEarly">結束測驗</button>
    </div>
    <div class="progress">
      <div
        class="progress-bar"
        :style="{ width: ((quiz.session.index + (item.judged ? 1 : 0)) / quiz.session.items.length) * 100 + '%' }"
      ></div>
    </div>

    <div class="card">
      <p class="qtext">
        <span class="tag" :class="item.q.type">
          {{ item.q.type === 'multi' ? '多選' : '單選' }}
        </span>
        {{ item.q.question }}
      </p>

      <div class="options">
        <button
          v-for="(opt, i) in displayOptions"
          :key="i"
          class="option"
          :class="optionClass(i)"
          @click="item.q.type === 'single' ? pickSingle(i) : toggleMulti(i)"
        >
          <span class="letter">{{ LETTERS[i] }}</span>
          <span>{{ opt }}</span>
        </button>
      </div>

      <p v-if="item.q.type === 'multi' && !item.judged">
        <button class="btn btn-primary" :disabled="!picked.length" @click="confirmMulti">
          確認作答
        </button>
      </p>

      <div v-if="item.judged" class="feedback" :class="item.correct ? 'ok' : 'no'">
        <p class="verdict">
          {{ item.correct ? '✅ 答對了！' : `❌ 答錯了，正確答案：${correctDisplayLetters}` }}
        </p>
        <p v-if="item.q.explanation" class="explanation">💡 {{ item.q.explanation }}</p>
        <button class="btn btn-primary" @click="goNext">
          {{ isLast ? '看結果' : '下一題' }}
        </button>
      </div>
    </div>
  </template>
</template>

<style scoped>
.quiz-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.progress {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin-bottom: 1rem;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #2563eb;
  transition: width 0.25s;
}
.qtext {
  font-size: 1.1rem;
  font-weight: 600;
}
.tag.multi {
  background: #fef3c7;
  color: #92400e;
}
.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.option {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  text-align: left;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  font-size: 1rem;
  cursor: pointer;
  font-family: inherit;
}
.option:hover:not(.judged) {
  border-color: #2563eb;
  background: #eff6ff;
}
.option.selected {
  border-color: #2563eb;
  background: #dbeafe;
}
.option.correct {
  border-color: #16a34a;
  background: #dcfce7;
}
.option.wrong {
  border-color: #dc2626;
  background: #fee2e2;
}
.option.judged {
  cursor: default;
}
.letter {
  font-weight: 700;
  color: #6b7280;
}
.feedback {
  margin-top: 1rem;
  border-radius: 8px;
  padding: 0.8rem 1rem;
}
.feedback.ok {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.feedback.no {
  background: #fef2f2;
  border: 1px solid #fecaca;
}
.verdict {
  font-weight: 600;
  margin: 0 0 0.4rem;
}
.explanation {
  margin: 0 0 0.6rem;
}
</style>
