export function downloadTemplate() {
  const sample = {
    name: '題庫範本',
    questions: [
      {
        question: '範例單選題：1 + 1 = ?',
        options: ['1', '2', '3', '4'],
        answer: [1],
        explanation: '基本加法',
        tags: ['數學']
      },
      {
        question: '範例多選題：下列哪些是質數？',
        options: ['2', '3', '4', '5', '6'],
        answer: [0, 1, 3],
        explanation: '質數只能被 1 和自己整除',
        tags: ['數學', '質數']
      },
      {
        question: '範例固定選項題：下列敘述何者正確？',
        options: ['地球繞太陽', '太陽繞地球', '以上皆非'],
        answer: 'A',
        explanation: 'answer 也可以用字母寫法',
        tags: ['常識'],
        fixedOrder: true
      }
    ]
  }
  const blob = new Blob([JSON.stringify(sample, null, 2)], {
    type: 'application/json'
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = '題庫範本.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

export function parseJson(text, fileName) {
  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    throw new Error(`JSON 格式錯誤：${e.message}`)
  }

  const list = Array.isArray(data) ? data : data?.questions
  if (!Array.isArray(list)) {
    throw new Error('JSON 須為題目陣列，或含 "questions" 陣列的物件')
  }

  const raws = list.map((q, i) => ({
    question: q?.question ?? q?.['題目'] ?? '',
    options: Array.isArray(q?.options ?? q?.['選項']) ? (q.options ?? q['選項']) : [],
    answerRaw: q?.answer ?? q?.['答案'],
    explanation: q?.explanation ?? q?.['解析'] ?? '',
    tags: q?.tags ?? q?.['標籤'] ?? [],
    fixedOrderRaw: q?.fixedOrder ?? q?.['選項固定'] ?? false,
    label: `第 ${i + 1} 題`
  }))

  const name = (!Array.isArray(data) && data.name) || fileName.replace(/\.[^.]+$/, '')
  return { name, raws }
}
