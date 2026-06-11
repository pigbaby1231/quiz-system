<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBanksStore } from '../stores/banks'
import { parseFile, parseText } from '../parsers'
import { downloadTemplate } from '../parsers/sheet'
import { downloadTemplate as downloadJsonTemplate } from '../parsers/json'
import { indicesToLetters } from '../parsers/validate'

const router = useRouter()
const banks = useBanksStore()
banks.load()

const dragging = ref(false)
const parseError = ref('')
const result = ref(null) // { name, questions, errors, total }
const mode = ref('new')
const newName = ref('')
const targetId = ref(null)
const showHelp = ref(false)

const summary = computed(() => {
  if (!result.value) return null
  const qs = result.value.questions
  const tagCount = {}
  for (const q of qs) {
    for (const t of q.tags.length ? q.tags : ['未分類']) {
      tagCount[t] = (tagCount[t] ?? 0) + 1
    }
  }
  return {
    single: qs.filter(q => q.type === 'single').length,
    multi: qs.filter(q => q.type === 'multi').length,
    tagCount
  }
})

function applyParsed(parsed) {
  result.value = parsed
  newName.value = parsed.name
  mode.value = 'new'
  if (banks.banks.length) targetId.value = banks.banks[0].id
}

async function handleFile(file) {
  parseError.value = ''
  result.value = null
  if (!file) return
  try {
    applyParsed(await parseFile(file))
  } catch (e) {
    parseError.value = e.message
  }
}

const pasteText = ref('')

function handlePaste() {
  parseError.value = ''
  result.value = null
  try {
    applyParsed(parseText(pasteText.value))
  } catch (e) {
    parseError.value = e.message
  }
}

function onDrop(e) {
  dragging.value = false
  handleFile(e.dataTransfer.files[0])
}

async function confirmImport() {
  await banks.importBank({
    name: mode.value === 'new' ? newName.value.trim() : banks.banks.find(b => b.id === targetId.value)?.name,
    questions: result.value.questions,
    mode: mode.value,
    targetId: targetId.value
  })
  router.push('/')
}

const canImport = computed(() => {
  if (!result.value || result.value.errors.length || !result.value.questions.length) return false
  if (mode.value === 'new') return !!newName.value.trim()
  return targetId.value != null
})
</script>

<template>
  <h1>匯入題庫</h1>

  <div
    class="card dropzone"
    :class="{ dragging }"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <p>把題庫檔拖到這裡，或</p>
    <label class="btn btn-primary">
      選擇檔案
      <input
        type="file"
        accept=".xlsx,.xls,.csv,.json"
        hidden
        @change="e => handleFile(e.target.files[0])"
      />
    </label>
    <p class="muted">支援 .xlsx / .csv（UTF-8）/ .json</p>
    <p>
      <button class="btn" @click="downloadTemplate">下載 Excel 範本</button>
      <button class="btn" @click="downloadJsonTemplate">下載 JSON 範本</button>
      <button class="btn" @click="showHelp = !showHelp">格式說明</button>
    </p>
  </div>

  <details class="card paste-area">
    <summary>或直接貼上 JSON / CSV 內容</summary>
    <textarea
      v-model="pasteText"
      rows="10"
      placeholder='{"name": "題庫名稱", "questions": [...]}&#10;&#10;或 CSV（第一行為標題列）：&#10;題目,A,B,C,D,答案,解析,標籤'
    ></textarea>
    <button class="btn btn-primary" :disabled="!pasteText.trim()" @click="handlePaste">
      解析貼上的內容
    </button>
  </details>

  <div v-if="showHelp" class="card help">
    <h2>Excel / CSV 格式</h2>
    <p>第一行為標題：<code>題目、A、B、C、D、E、F、答案、解析、標籤、選項固定</code>，一行一題。</p>
    <ul>
      <li>選項至少 A、B 兩欄，留空表示該題沒有此選項（2~6 個選項）</li>
      <li>答案填字母，如 <code>B</code> 或 <code>AC</code>（一個字母＝單選，多個＝多選）</li>
      <li>標籤多個用逗號分隔；「選項固定」填「是」代表該題選項不隨機打亂</li>
      <li>含「以上皆是 / 以上皆非」的題目會自動不打亂選項</li>
    </ul>
    <h2>JSON 格式</h2>
    <pre>{
  "name": "題庫名稱",
  "questions": [
    {
      "question": "下列何者正確？",
      "options": ["甲", "乙", "丙", "丁"],
      "answer": [0, 2],
      "explanation": "因為…",
      "tags": ["內科"],
      "fixedOrder": false
    }
  ]
}</pre>
    <p class="muted">answer 用選項索引（0 起算），也接受 "AC" 字母寫法。</p>
  </div>

  <div v-if="parseError" class="card error-box">⚠️ {{ parseError }}</div>

  <template v-if="result">
    <div v-if="result.errors.length" class="card error-box">
      <h2>發現 {{ result.errors.length }} 題有問題（共 {{ result.total }} 題），請修正後重新匯入：</h2>
      <ul>
        <li v-for="err in result.errors" :key="err.label">
          <strong>{{ err.label }}</strong>：{{ err.messages.join('；') }}
        </li>
      </ul>
    </div>

    <template v-else>
      <div class="card">
        <h2>✅ 解析成功：共 {{ result.questions.length }} 題</h2>
        <p>單選 {{ summary.single }} 題・多選 {{ summary.multi }} 題</p>
        <p>
          <span v-for="(n, t) in summary.tagCount" :key="t" class="tag">{{ t }}（{{ n }}）</span>
        </p>
        <details>
          <summary class="muted">預覽前 5 題</summary>
          <ol>
            <li v-for="(q, i) in result.questions.slice(0, 5)" :key="i">
              {{ q.question }}
              <span class="muted">［答案 {{ indicesToLetters(q.answer) }}］</span>
            </li>
          </ol>
        </details>
      </div>

      <div class="card">
        <h2>匯入方式</h2>
        <p>
          <label>
            <input type="radio" value="new" v-model="mode" />
            新增為新題庫，名稱：
          </label>
          <input type="text" v-model="newName" :disabled="mode !== 'new'" />
        </p>
        <p v-if="banks.banks.length">
          <label>
            <input type="radio" value="replace" v-model="mode" />
            覆蓋現有題庫：
          </label>
          <select v-model="targetId" :disabled="mode !== 'replace'">
            <option v-for="b in banks.banks" :key="b.id" :value="b.id">
              {{ b.name }}（{{ b.total }} 題）
            </option>
          </select>
          <span class="muted">（原題目與作答紀錄會被清除）</span>
        </p>
        <button class="btn btn-primary" :disabled="!canImport" @click="confirmImport">
          確認匯入
        </button>
      </div>
    </template>
  </template>
</template>

<style scoped>
.dropzone {
  text-align: center;
  padding: 2rem 1rem;
  border: 2px dashed #d1d5db;
}
.dropzone.dragging {
  border-color: #2563eb;
  background: #eff6ff;
}
.paste-area summary {
  cursor: pointer;
  font-weight: 600;
}
.paste-area textarea {
  display: block;
  width: 100%;
  margin: 0.8rem 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.9rem;
  font-family: Consolas, monospace;
  resize: vertical;
}
.error-box {
  border-color: #fca5a5;
  background: #fef2f2;
}
.help pre {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.8rem;
  overflow-x: auto;
  font-size: 0.85rem;
}
.help code {
  background: #f3f4f6;
  padding: 0 0.3rem;
  border-radius: 4px;
}
</style>
