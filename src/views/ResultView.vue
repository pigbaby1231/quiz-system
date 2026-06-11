<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '../stores/quiz'
import { LETTERS } from '../parsers/validate'

const router = useRouter()
const quiz = useQuizStore()

if (!quiz.session) {
  router.replace('/')
}

const answered = computed(() => quiz.session?.items.filter(i => i.judged) ?? [])
const wrongItems = computed(() => answered.value.filter(i => !i.correct))
const rate = computed(() =>
  answered.value.length
    ? Math.round((quiz.session.correctCount / answered.value.length) * 100)
    : 0
)

function letters(item, indices) {
  // 原始索引 → 本次顯示的字母
  return indices
    .map(orig => LETTERS[item.perm.indexOf(orig)])
    .sort()
    .join('')
}
function pickedLetters(item) {
  return item.picked.map(i => LETTERS[i]).sort().join('') || '（未選）'
}

async function retry() {
  await quiz.restart()
  router.push('/quiz')
}
</script>

<template>
  <template v-if="quiz.session">
    <h1>測驗結果：{{ quiz.session.bankName }}</h1>

    <div class="card score">
      <div class="rate" :class="{ good: rate >= 80, bad: rate < 60 }">{{ rate }}%</div>
      <p>
        作答 {{ answered.length }} 題・答對 {{ quiz.session.correctCount }} 題・答錯
        {{ wrongItems.length }} 題
      </p>
      <p>
        <button class="btn btn-primary" @click="retry">再測一次（同設定重新出題）</button>
        <RouterLink to="/" class="btn">回首頁</RouterLink>
      </p>
    </div>

    <template v-if="wrongItems.length">
      <h2>錯題回顧</h2>
      <details v-for="(item, i) in wrongItems" :key="i" class="card wrong-item">
        <summary>{{ item.q.question }}</summary>
        <ul>
          <li
            v-for="(origIdx, dispIdx) in item.perm"
            :key="dispIdx"
            :class="{ ans: item.q.answer.includes(origIdx) }"
          >
            {{ LETTERS[dispIdx] }}. {{ item.q.options[origIdx] }}
            <span v-if="item.q.answer.includes(origIdx)">✔</span>
          </li>
        </ul>
        <p>
          你的答案：<strong class="bad-text">{{ pickedLetters(item) }}</strong>
          正確答案：<strong class="good-text">{{ letters(item, item.q.answer) }}</strong>
        </p>
        <p v-if="item.q.explanation">💡 {{ item.q.explanation }}</p>
      </details>
    </template>
  </template>
</template>

<style scoped>
.score {
  text-align: center;
  padding: 1.5rem;
}
.rate {
  font-size: 3rem;
  font-weight: 700;
  color: #d97706;
}
.rate.good {
  color: #16a34a;
}
.rate.bad {
  color: #dc2626;
}
.score .btn {
  margin: 0 0.3rem;
}
.wrong-item summary {
  font-weight: 600;
  cursor: pointer;
}
.wrong-item ul {
  list-style: none;
  padding-left: 0.5rem;
}
.wrong-item li.ans {
  color: #16a34a;
  font-weight: 600;
}
.bad-text {
  color: #dc2626;
}
.good-text {
  color: #16a34a;
}
</style>
