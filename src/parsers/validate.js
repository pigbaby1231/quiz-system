export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

const TRUTHY = new Set(['是', 'y', 'yes', 'true', '1', 'v', '✓', '固定'])

export function indicesToLetters(indices) {
  return indices.map(i => LETTERS[i]).join('')
}

function parseAnswer(raw, optionCount, errors) {
  let indices = []
  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (typeof v === 'number' && Number.isInteger(v)) {
        indices.push(v)
      } else if (typeof v === 'string' && LETTERS.includes(v.trim().toUpperCase())) {
        indices.push(LETTERS.indexOf(v.trim().toUpperCase()))
      } else {
        errors.push(`答案「${v}」無法解讀（需為選項索引或 A~F 字母）`)
      }
    }
  } else if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const letters = String(raw).toUpperCase().replace(/[\s,、，.]/g, '')
    for (const ch of letters) {
      const idx = LETTERS.indexOf(ch)
      if (idx === -1) errors.push(`答案含無法解讀的字元「${ch}」（需為 A~F 字母）`)
      else indices.push(idx)
    }
  } else {
    errors.push('缺答案')
    return []
  }
  indices = [...new Set(indices)].sort((a, b) => a - b)
  for (const idx of indices) {
    if (idx < 0 || idx >= optionCount) {
      errors.push(`答案「${LETTERS[idx] ?? idx}」沒有對應的選項`)
    }
  }
  return indices
}

function parseTags(raw) {
  const list = Array.isArray(raw) ? raw : String(raw ?? '').split(/[,、，;；]/)
  return [...new Set(list.map(t => String(t).trim()).filter(Boolean))]
}

// raw: { question, options, answerRaw, explanation, tags, fixedOrderRaw, label }
// 回傳 { question, errors }；errors 非空代表此題不合格
export function normalizeQuestion(raw) {
  const errors = []

  const question = String(raw.question ?? '').trim()
  if (!question) errors.push('缺題目')

  const trimmed = (raw.options ?? []).map(o => String(o ?? '').trim())
  const lastFilled = trimmed.reduce((last, o, i) => (o ? i : last), -1)
  const options = trimmed.slice(0, lastFilled + 1)
  const holes = options
    .map((o, i) => (o ? null : LETTERS[i]))
    .filter(Boolean)
  if (holes.length) {
    errors.push(`選項不連續（${holes.join('、')} 留空但後面還有選項）`)
  }
  if (options.length < 2) errors.push('選項至少要 2 個')
  if (options.length > LETTERS.length) errors.push(`選項最多 ${LETTERS.length} 個`)

  const answer = parseAnswer(raw.answerRaw, options.length, errors)

  const fixedRaw = raw.fixedOrderRaw
  const fixedOrder =
    fixedRaw === true ||
    TRUTHY.has(String(fixedRaw ?? '').trim().toLowerCase()) ||
    options.some(o => o.includes('以上皆'))

  return {
    errors,
    question: {
      question,
      options,
      answer,
      type: answer.length > 1 ? 'multi' : 'single',
      explanation: String(raw.explanation ?? '').trim(),
      tags: parseTags(raw.tags),
      fixedOrder
    }
  }
}

export function validateAll(raws) {
  const questions = []
  const errors = []
  for (const raw of raws) {
    const { question, errors: msgs } = normalizeQuestion(raw)
    if (msgs.length) errors.push({ label: raw.label, messages: msgs })
    else questions.push(question)
  }
  return { questions, errors }
}
