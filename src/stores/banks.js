import { defineStore } from 'pinia'
import { db } from '../db'

function summarize(questions) {
  const tags = new Set()
  let singleCount = 0
  for (const q of questions) {
    if (q.type === 'single') singleCount++
    for (const t of q.tags) tags.add(t)
  }
  return {
    total: questions.length,
    singleCount,
    multiCount: questions.length - singleCount,
    tags: [...tags]
  }
}

export const useBanksStore = defineStore('banks', {
  state: () => ({ banks: [], loaded: false }),

  actions: {
    async load() {
      this.banks = await db.banks.orderBy('createdAt').toArray()
      this.loaded = true
    },

    // mode: 'new' 新增題庫；'replace' 覆蓋既有題庫（targetId）
    async importBank({ name, questions, mode, targetId }) {
      // 題目可能是 Vue 響應式 Proxy，IndexedDB 無法結構化複製，先轉回純物件
      questions = JSON.parse(JSON.stringify(questions))
      await db.transaction('rw', db.banks, db.questions, db.stats, async () => {
        let bankId
        if (mode === 'replace') {
          bankId = targetId
          await db.questions.where('bankId').equals(bankId).delete()
          await db.stats.where('bankId').equals(bankId).delete()
          await db.banks.update(bankId, { name, ...summarize(questions) })
        } else {
          bankId = await db.banks.add({ name, createdAt: Date.now(), ...summarize(questions) })
        }
        await db.questions.bulkAdd(questions.map(q => ({ ...q, bankId })))
      })
      await this.load()
    },

    async remove(bankId) {
      await db.transaction('rw', db.banks, db.questions, db.stats, async () => {
        await db.questions.where('bankId').equals(bankId).delete()
        await db.stats.where('bankId').equals(bankId).delete()
        await db.banks.delete(bankId)
      })
      await this.load()
    }
  }
})
