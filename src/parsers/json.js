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
