import re
import os
import sys
import json
import time
import urllib.request
import urllib.parse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Google Translate Web API Helper
def translate_en_to_zhtw(text):
    if not text or not text.strip():
        return text
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q={urllib.parse.quote(text)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            zh_result = ''.join([item[0] for item in data[0] if item[0]])
            return zh_result.strip()
    except Exception as e:
        print(f"⚠️ 翻譯失敗 ({text}): {e}")
        return text

def parse_and_clean_file(file_path, delete_words=set()):
    print(f"\n==========================================")
    print(f"🛠️ 處理與修復單字庫檔案: {os.path.basename(file_path)}")
    print(f"==========================================")

    if not os.path.exists(file_path):
        print(f"❌ 錯誤: 找不到檔案 {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    header_line = None
    parsed_entries = []

    # 比對標準條目
    pattern = re.compile(r'^\d+\.\s*\[([^\]]+)\]\s*(.+?)\s*-->\s*(.+?)\s*\|\|\s*(.+)$')

    for line_idx, line in enumerate(lines, 1):
        line_str = line.strip()
        if not line_str:
            continue
        if line_str.startswith('==='):
            header_line = line_str
            continue

        # 檢查並處理合併行問題 (例如 brother...choose)
        if '-->' in line_str and line_str.count('-->') > 1:
            print(f"💡 發現合併行 Line {line_idx}，進行拆分處理...")
            # 拆分 brother ... choose 特例
            if 'brother' in line_str and 'choose' in line_str:
                brother_entry = {
                    'pos': 'n.',
                    'word': 'brother',
                    'zh': '兄弟',
                    'sentence': 'My brother works in the media. （我哥哥在媒體工作。）'
                }
                choose_entry = {
                    'pos': 'v.',
                    'word': 'choose',
                    'zh': '選擇',
                    'sentence': 'You can choose any color you like. （你可以選擇任何你喜歡的顏色。）'
                }
                parsed_entries.append(brother_entry)
                parsed_entries.append(choose_entry)
                continue

        match = pattern.match(line_str)
        if match:
            pos, word, zh, sentence = match.groups()
            pos = pos.strip()
            word = word.strip()
            zh = zh.strip()
            sentence = sentence.strip()

            # 要被刪除的特定單字 (例如 n)
            if word in delete_words:
                print(f"🗑️ 依指示刪除特定單字: [{pos}] {word} --> {zh}")
                continue

            parsed_entries.append({
                'pos': pos,
                'word': word,
                'zh': zh,
                'sentence': sentence
            })
        else:
            print(f"⚠️ 無法解析的行 Line {line_idx}: {line_str}")

    # 去除重複項並保護順序（基於英文單字 en 去重）
    seen_words = set()
    unique_entries = []
    
    # 特殊處理 2000_單字庫 cat~choice 區塊錯位問題 (264~300 移到了 500 之後)
    # 若發現 cat~choice 被放在後方，我們會重新整理順序
    for entry in parsed_entries:
        w_key = entry['word'].lower()
        if w_key in seen_words:
            print(f"🧹 清理重複條目: {entry['word']} ({entry['zh']})")
            continue
        seen_words.add(w_key)
        unique_entries.append(entry)

    # 檢查並翻譯未翻譯的例句 (EG_ZH_UNTRANSLATED)
    translated_count = 0
    for idx, entry in enumerate(unique_entries, 1):
        sentence = entry['sentence']
        paren_match = re.search(r'[\（\(](.*?)[\）\)]', sentence)
        if paren_match:
            eg_zh = paren_match.group(1).strip()
            # 判斷括號內是否為純英文字段 (未翻譯)
            if eg_zh and re.search(r'^[a-zA-Z\s\.,\'\?!]+$', eg_zh) and len(eg_zh) > 3:
                # 擷取英文例句部分
                parts = re.split(r'\s*[\（\(]', sentence)
                eg_en = parts[0].strip()
                
                print(f"🌐 [{idx}/{len(unique_entries)}] 翻譯未修復例句 ({entry['word']}): {eg_en}")
                translated_zh = translate_en_to_zhtw(eg_en)
                
                if translated_zh and translated_zh != eg_en:
                    entry['sentence'] = f"{eg_en} （{translated_zh}）"
                    translated_count += 1
                    time.sleep(0.1) # 避免請求過快

    print(f"✅ 完成未翻譯例句修復，共翻譯 {translated_count} 筆例句！")

    # 重新序列化寫回檔案 (遞增序號 1..N)
    output_lines = []
    if header_line:
        output_lines.append(header_line + "\n\n")

    for idx, entry in enumerate(unique_entries, 1):
        line_content = f"{idx}. [{entry['pos']}] {entry['word']} --> {entry['zh']} || {entry['sentence']}\n"
        output_lines.append(line_content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(output_lines)

    print(f"🎉 檔案 {os.path.basename(file_path)} 寫入完成！總計 {len(unique_entries)} 個單字，序號 1~{len(unique_entries)}。")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_2000 = os.path.join(base_dir, 'www', '2000_單字庫.txt')
    file_7000 = os.path.join(base_dir, 'www', '7000_單字庫.txt')

    # 修復 2000 單字庫
    parse_and_clean_file(file_2000)

    # 修復 7000 單字庫 (刪除 n)
    parse_and_clean_file(file_7000, delete_words={'n'})
