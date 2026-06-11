import Dexie from 'dexie'

export const db = new Dexie('quiz-system')

db.version(1).stores({
  banks: '++id, name, createdAt',
  questions: '++id, bankId, *tags',
  stats: 'questionId, bankId'
})
