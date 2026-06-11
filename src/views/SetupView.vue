<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db'
import { useQuizStore, matchesFilter } from '../stores/quiz'

const props = defineProps({ bankId: String })
const router = useRouter()
const quiz = useQuizStore()

const bank = ref(null)
const questions = ref([])

const type = ref('all')
const optionCounts = ref([])
const tags = ref([])
const countMode = ref('all')
const count = ref(10)
const shuffleQuestions = ref(true)
const shuffleOptions = ref(true)

const allOptionCounts = computed(() =>
  [...new Set(questions.value.map(q => q.options.length))].sort((a, b) => a - b)
)
const allTags = computed(() => {
  const set = new Set()
  let hasUntagged = false
  for (const q of questions.value) {
    if (q.tags.length) q.tags.forEach(t => set.add(t))
    else hasUntagged = true
  }
  const list = [...set].sort()
  if (hasUntagged) list.push('未分類')
  return list
})

onMounted(async () => {
  const id = Number(props.bankId)
  bank.value = await db.banks.get(id)
  if (!bank.value) {
    router.replace('/')
    return
  }
  questions.value = await db.questions.where('bankId').equals(id).toArray()
  optionCounts.value = [...allOptionCounts.value]
  tags.value = [...allTags.value]
})

const settings = computed(() => ({
  bankId: Number(props.bankId),
  bankName: bank.value?.name ?? '',
  type: type.value,
  optionCounts: optionCounts.value,
  tags: tags.value.length === allTags.value.length ? null : tags.value,
  count: countMode.value === 'all' ? 0 : Math.max(1, count.value),
  shuffleQuestions: shuffleQuestions.value,
  shuffleOptions: shuffleOptions.value
}))

const matchCount = computed(
  () => questions.value.filter(q => matchesFilter(q, settings.value)).length
)

function toggleAllTags() {
  tags.value = tags.value.length === allTags.value.length ? [] : [...allTags.value]
}

async function start() {
  await quiz.start(settings.value)
  router.push('/quiz')
}
</script>

<template>
  <template v-if="bank">
    <h1>出題設定：{{ bank.name }}</h1>

    <div class="card">
      <h2>題型</h2>
      <label><input type="radio" value="all" v-model="type" /> 全部</label>
      <label><input type="radio" value="single" v-model="type" /> 只出單選</label>
      <label><input type="radio" value="multi" v-model="type" /> 只出多選</label>
    </div>

    <div class="card" v-if="allOptionCounts.length > 1">
      <h2>選項數</h2>
      <label v-for="n in allOptionCounts" :key="n">
        <input type="checkbox" :value="n" v-model="optionCounts" /> {{ n }} 個選項
      </label>
    </div>

    <div class="card" v-if="allTags.length > 1">
      <h2>
        標籤範圍
        <button class="btn btn-small" @click="toggleAllTags">
          {{ tags.length === allTags.length ? '全不選' : '全選' }}
        </button>
      </h2>
      <label v-for="t in allTags" :key="t">
        <input type="checkbox" :value="t" v-model="tags" /> {{ t }}
      </label>
    </div>

    <div class="card">
      <h2>題數與順序</h2>
      <p>
        <label><input type="radio" value="all" v-model="countMode" /> 全部符合的題目</label>
        <label>
          <input type="radio" value="limit" v-model="countMode" /> 只出
          <input
            type="number"
            v-model.number="count"
            min="1"
            style="width: 5em"
            :disabled="countMode !== 'limit'"
          />
          題
        </label>
      </p>
      <p>
        <label><input type="checkbox" v-model="shuffleQuestions" /> 題目隨機排序</label>
        <label><input type="checkbox" v-model="shuffleOptions" /> 選項隨機排序</label>
      </p>
    </div>

    <div class="card start-bar">
      <strong :class="{ none: matchCount === 0 }">符合條件的題目：{{ matchCount }} 題</strong>
      <button class="btn btn-primary" :disabled="matchCount === 0" @click="start">
        開始測驗
      </button>
    </div>
  </template>
</template>

<style scoped>
label {
  margin-right: 1.2rem;
  display: inline-block;
}
.btn-small {
  padding: 0.1rem 0.6rem;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}
.start-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.none {
  color: #dc2626;
}
</style>
