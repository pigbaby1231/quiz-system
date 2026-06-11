import * as XLSX from 'xlsx'
import { LETTERS } from './validate'

const ALIASES = {
  question: ['題目', '题目', 'question'],
  answer: ['答案', 'answer', '正解'],
  explanation: ['解析', 'explanation', '詳解', '說明'],
  tags: ['標籤', '标签', 'tags', '分類', '章節'],
  fixed: ['選項固定', 'fixedorder', '固定']
}

function findColumn(headers, names) {
  return headers.findIndex(h => names.includes(h.toLowerCase()))
}

// data: ArrayBuffer（xlsx）或 string（csv，UTF-8 解碼後的文字）
export function parseSheet(data, fileName) {
  const wb = XLSX.read(data, { type: typeof data === 'string' ? 'string' : 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (!rows.length) throw new Error('檔案是空的')

  const headers = rows[0].map(h => String(h).trim())
  const col = {
    question: findColumn(headers, ALIASES.question),
    answer: findColumn(headers, ALIASES.answer),
    explanation: findColumn(headers, ALIASES.explanation),
    tags: findColumn(headers, ALIASES.tags),
    fixed: findColumn(headers, ALIASES.fixed)
  }
  if (col.question === -1) throw new Error('找不到「題目」欄，請確認第一行是標題行')
  if (col.answer === -1) throw new Error('找不到「答案」欄，請確認第一行是標題行')

  const optionCols = LETTERS.map(letter =>
    headers.findIndex(h => h.toUpperCase() === letter || h.toUpperCase() === `選項${letter}`)
  )
  if (optionCols[0] === -1 || optionCols[1] === -1) {
    throw new Error('找不到選項欄（標題需為 A、B、C… 或 選項A、選項B…）')
  }

  const raws = []
  rows.slice(1).forEach((row, i) => {
    if (row.every(cell => String(cell).trim() === '')) return
    raws.push({
      question: row[col.question],
      options: optionCols.map(c => (c === -1 ? '' : row[c])),
      answerRaw: row[col.answer],
      explanation: col.explanation === -1 ? '' : row[col.explanation],
      tags: col.tags === -1 ? '' : row[col.tags],
      fixedOrderRaw: col.fixed === -1 ? '' : row[col.fixed],
      label: `第 ${i + 2} 行`
    })
  })

  return { name: fileName.replace(/\.[^.]+$/, ''), raws }
}

export function downloadTemplate() {
  const aoa = [
    ['題目', 'A', 'B', 'C', 'D', 'E', 'F', '答案', '解析', '標籤', '選項固定'],
    ['範例單選題：1 + 1 = ?', '1', '2', '3', '4', '', '', 'B', '基本加法', '數學', ''],
    ['範例多選題：下列哪些是質數？', '2', '3', '4', '5', '6', '', 'ABD', '質數只能被 1 和自己整除', '數學,質數', ''],
    ['範例固定選項題：下列敘述何者正確？', '地球繞太陽', '太陽繞地球', '以上皆非', '', '', '', 'A', '', '常識', '是']
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), '題庫')
  XLSX.writeFile(wb, '題庫範本.xlsx')
}
