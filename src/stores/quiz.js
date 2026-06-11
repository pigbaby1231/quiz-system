import { defineStore } from 'pinia'
import { db } from '../db'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function matchesFilter(q, settings) {
  if (settings.type !== 'all' && q.type !== settings.type) return false
  if (settings.optionCounts?.length && !settings.optionCounts.includes(q.options.length)) return false
  if (settings.tags) {
    const qTags = q.tags.length ? q.tags : ['未分類']
    if (!qTags.some(t => settings.tags.includes(t))) return false
  }
  return true
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({ session: null, settings: null }),

  actions: {
    async start(settings) {
      let qs = await db.questions.where('bankId').equals(settings.bankId).toArray()
      qs = qs.filter(q => matchesFilter(q, settings))
      if (settings.shuffleQuestions) qs = shuffle(qs)
      if (settings.count > 0) qs = qs.slice(0, settings.count)

      this.settings = settings
      this.session = {
        bankName: settings.bankName,
        items: qs.map(q => ({
          q,
          // perm[顯示位置] = 原始選項索引
          perm:
            settings.shuffleOptions && !q.fixedOrder
              ? shuffle(q.options.map((_, i) => i))
              : q.options.map((_, i) => i),
          picked: [],
          judged: false,
          correct: false
        })),
        index: 0,
        correctCount: 0
      }
      return this.session.items.length
    },

    async restart() {
      if (this.settings) await this.start(this.settings)
    },

    // pickedDisplay: 顯示順序的索引陣列
    async judge(pickedDisplay) {
      const item = this.session.items[this.session.index]
      if (item.judged) return

      const pickedOriginal = pickedDisplay.map(i => item.perm[i]).sort((a, b) => a - b)
      item.picked = pickedDisplay
      item.correct =
        pickedOriginal.length === item.q.answer.length &&
        pickedOriginal.every((v, i) => v === item.q.answer[i])
      item.judged = true
      if (item.correct) this.session.correctCount++

      const q = item.q
      const prev = (await db.stats.get(q.id)) ?? {
        questionId: q.id,
        bankId: q.bankId,
        attempts: 0,
        wrongCount: 0,
        streak: 0
      }
      await db.stats.put({
        ...prev,
        attempts: prev.attempts + 1,
        wrongCount: prev.wrongCount + (item.correct ? 0 : 1),
        streak: item.correct ? prev.streak + 1 : 0,
        lastAt: Date.now(),
        lastPicked: pickedOriginal.map(i => q.options[i])
      })
    },

    next() {
      if (this.session.index < this.session.items.length - 1) {
        this.session.index++
        return true
      }
      return false
    }
  }
})
