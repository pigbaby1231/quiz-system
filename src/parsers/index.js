import { parseSheet } from './sheet'
import { parseJson } from './json'
import { validateAll } from './validate'

function finalize(parsed) {
  const { questions, errors } = validateAll(parsed.raws)
  return { name: parsed.name, questions, errors, total: parsed.raws.length }
}

export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  let parsed
  if (ext === 'json') {
    parsed = parseJson(await file.text(), file.name)
  } else if (ext === 'xlsx' || ext === 'xls') {
    parsed = parseSheet(await file.arrayBuffer(), file.name)
  } else if (ext === 'csv') {
    // 以文字讀入確保 UTF-8 正確解碼
    parsed = parseSheet(await file.text(), file.name)
  } else {
    throw new Error(`不支援的檔案格式 .${ext}（支援 .xlsx / .csv / .json）`)
  }
  return finalize(parsed)
}

// 貼上的純文字：開頭是 { 或 [ 視為 JSON，其餘當 CSV
export function parseText(text) {
  const trimmed = (text ?? '').trim()
  if (!trimmed) throw new Error('貼上的內容是空的')
  const fallbackName = `貼上的題庫 ${new Date().toLocaleDateString('zh-TW')}`
  const parsed =
    trimmed.startsWith('{') || trimmed.startsWith('[')
      ? parseJson(trimmed, fallbackName)
      : parseSheet(trimmed, fallbackName)
  return finalize(parsed)
}
