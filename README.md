# 刷題系統

個人用的測驗刷題網站。匯入自己的題庫（Excel / CSV / JSON），設定出題條件後開始刷題，答完立即看解析。純前端、無伺服器，所有資料存在瀏覽器本機（IndexedDB）。

線上版：部署到 GitHub Pages 後，網址為 `https://<你的帳號>.github.io/<repo 名稱>/`

## 功能

- **三種題庫格式匯入**：`.xlsx`、`.csv`（UTF-8）、`.json`，共用同一套驗證，格式錯誤會列出第幾行、錯在哪
- **出題條件**：題型（單選/多選）、選項數（2~6）、標籤/章節範圍、題數、題目隨機排序
- **選項隨機排序**：防止背答案位置；含「以上皆是/皆非」的題目自動不打亂，也可逐題指定固定
- **即時判定與解析**：單選點了就判、多選按確認後判，答錯立即顯示正解與解析
- **結算頁**:答對率、錯題回顧、同設定再測一次
- 每題作答統計（做幾次、錯幾次、連對幾次）已寫入資料庫，供錯題本功能使用

## 題庫格式

### Excel / CSV

第一行為標題列，一行一題：

| 題目 | A | B | C | D | E | F | 答案 | 解析 | 標籤 | 選項固定 |
|------|---|---|---|---|---|---|------|------|------|----------|
| 下列哪些是質數？ | 2 | 3 | 4 | 5 | | | ABD | 質數只能被 1 和自己整除 | 數學,質數 | |

- 選項至少填 A、B 兩欄，留空表示該題沒有此選項
- 答案填字母：一個字母＝單選，多個（如 `ABD`）＝多選
- 標籤多個用逗號分隔；「選項固定」填 `是` 代表不隨機打亂
- 匯入頁有「下載 Excel 範本」按鈕可直接取得空白範本
- CSV 請使用 UTF-8 編碼

### JSON

```json
{
  "name": "題庫名稱",
  "questions": [
    {
      "question": "下列哪些是質數？",
      "options": ["2", "3", "4", "5"],
      "answer": [0, 1, 3],
      "explanation": "質數只能被 1 和自己整除。",
      "tags": ["數學", "質數"],
      "fixedOrder": false
    }
  ]
}
```

- `answer` 用選項索引（0 起算），一個元素＝單選；也接受 `"answer": "ABD"` 字母寫法
- `explanation`、`tags`、`fixedOrder` 皆選填
- `samples/` 內附範例題庫可直接測試

## 本機開發

需求：Node.js 20+

```bash
npm install
npm run dev      # 開發伺服器 http://localhost:5173
npm run build    # 產出靜態檔到 dist/
```

## 部署到 GitHub Pages

本 repo 已附 `.github/workflows/deploy.yml`，推上 GitHub 後自動建置部署：

1. 在 GitHub 建立 repo，把程式碼推上 `main` 分支
2. 到 repo 的 **Settings → Pages**，Source 選 **GitHub Actions**
3. 之後每次 push 到 `main` 都會自動重新部署

> 注意：workflow 會自動以 repo 名稱作為網址子路徑（`--base=/<repo名稱>/`）。若 repo 名稱是 `<帳號>.github.io`（部署在根網址），請把 workflow 中的 `--base` 參數改為 `/`。

## 資料存放與備份

- 題庫與作答紀錄存在**瀏覽器的 IndexedDB**，跟著「瀏覽器＋網址」走：不同裝置、不同瀏覽器各自獨立，互不同步
- 清除瀏覽器網站資料會一併刪除題庫，**請保留原始題庫檔作為備份**，隨時可重新匯入
- 916 題的題庫約佔 600KB，瀏覽器配額動輒數 GB，容量不是問題

## 工具

`tools/pdf2json.py`：把公路局公告的汽車筆試題庫 PDF 轉成本系統 JSON 格式（需 Python 3 + pdfplumber）：

```bash
pip install pdfplumber
python tools/pdf2json.py 題庫.pdf 輸出.json
```

看圖題（標誌、手勢圖）會自動排除並回報數量。

## 技術

Vue 3（Composition API）+ Vite + Pinia + Vue Router（hash 模式）・Dexie.js（IndexedDB）・SheetJS（Excel/CSV 解析）
