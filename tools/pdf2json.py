# 把公路局汽車筆試題庫 PDF 轉成刷題系統的 JSON 題庫格式
# 用法: python pdf2json.py <input.pdf> <output.json>
import json
import re
import sys

import pdfplumber

SECTION_RE = re.compile(r'^架構[一二三四五六七八九十]+\s*(.+)$')
QROW_RE = re.compile(r'^(\d+)\s*\((\d)\)')
# 選項標記：(1) （１） （1） 等
OPT_RE = re.compile(r'[(（]\s*([1-3１-３])\s*[)）]')
FULLWIDTH = {'１': '1', '２': '2', '３': '3'}
# 需要看圖才能作答的題目特徵
IMAGE_RE = re.compile(r'圖|以上標誌|以下標誌|此標誌|本標誌|此手勢|此標線|以上號誌|以下號誌')


def join_wrapped(text):
    lines = [ln.strip() for ln in text.split('\n') if ln.strip()]
    out = ''
    for ln in lines:
        if out and out[-1].isascii() and out[-1].isalnum() and ln[0].isascii() and ln[0].isalnum():
            out += ' '
        out += ln
    return out


def split_options(text):
    """回傳 (題幹, [選項1, 選項2, 選項3])；切不出三個選項時回傳 None"""
    marks = []
    for m in OPT_RE.finditer(text):
        n = int(FULLWIDTH.get(m.group(1), m.group(1)))
        marks.append((n, m.start(), m.end()))
    seq = None
    for i in range(len(marks) - 2):
        if marks[i][0] == 1 and marks[i + 1][0] == 2 and marks[i + 2][0] == 3:
            seq = marks[i:i + 3]  # 取第一組 1,2,3
            break
    if not seq:
        return None
    stem = text[:seq[0][1]].strip()
    opts = [
        text[seq[0][2]:seq[1][1]].strip(),
        text[seq[1][2]:seq[2][1]].strip(),
        text[seq[2][2]:].strip(),
    ]
    if not all(opts):
        return None
    return stem, opts


def main(pdf_path, out_path):
    rows = []          # (qnum, answer, raw_text)
    qnum_section = {}  # 題號 -> 章節標籤
    current_section = '未分類'

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ''
            for ln in text.split('\n'):
                ln = ln.strip()
                m = SECTION_RE.match(ln)
                if m:
                    current_section = m.group(1).strip()
                    continue
                m = QROW_RE.match(ln)
                if m:
                    qnum_section.setdefault(int(m.group(1)), current_section)

            for table in page.extract_tables():
                for row in table:
                    cells = [c.strip() for c in row if c and c.strip()]
                    if not cells or cells[0].startswith('▎') or cells[0] == '題號':
                        continue
                    if re.fullmatch(r'\d+', cells[0]):
                        ans = next((c for c in cells[1:] if re.fullmatch(r'\(\d\)', c)), None)
                        body = cells[-1] if cells[-1] != ans else ''
                        rows.append([int(cells[0]), ans, join_wrapped(body)])
                    elif rows and len(cells) >= 1:
                        # 沒有題號的列＝跨頁延續，接到上一題
                        rows[-1][2] += join_wrapped(cells[-1])

    questions, image_skipped, problems = [], [], []
    for qnum, ans, body in rows:
        if not ans:
            problems.append((qnum, '找不到答案'))
            continue
        parsed = split_options(body)
        if not parsed:
            if not body or IMAGE_RE.search(body[:30]):
                image_skipped.append(qnum)
            else:
                problems.append((qnum, f'切不出選項: {body[:60]}'))
            continue
        stem, opts = parsed
        if not stem or IMAGE_RE.search(stem):
            image_skipped.append(qnum)
            continue
        answer_idx = int(ans.strip('()')) - 1
        if answer_idx > 2:
            problems.append((qnum, f'答案超出範圍: {ans}'))
            continue
        questions.append({
            'question': stem,
            'options': opts,
            'answer': [answer_idx],
            'explanation': '',
            'tags': [qnum_section.get(qnum, '未分類')],
        })

    bank = {'name': '汽車筆試題庫 115.05.29', 'questions': questions}
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(bank, f, ensure_ascii=False, indent=1)

    print(f'PDF 列數: {len(rows)}')
    print(f'轉出題數: {len(questions)}')
    print(f'看圖題排除: {len(image_skipped)} 題')
    print(f'問題列: {len(problems)}')
    for qnum, msg in problems[:20]:
        print(f'  題 {qnum}: {msg}')
    tags = {}
    for q in questions:
        tags[q['tags'][0]] = tags.get(q['tags'][0], 0) + 1
    for t, n in tags.items():
        print(f'  [{t}] {n} 題')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
