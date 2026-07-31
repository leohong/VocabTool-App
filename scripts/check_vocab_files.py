import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def check_vocab_file(file_path):
    filename = os.path.basename(file_path)
    print(f"\n==========================================")
    print(f"🔍 檢查單字庫檔案: {filename}")
    print(f"==========================================")

    if not os.path.exists(file_path):
        print(f"❌ 錯誤: 找不到檔案 {file_path}")
        return []

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    errors = []
    total_words = 0
    expected_num = 1

    # 正則表達式比對標準行格式
    # 範例: 1. [adj.] able --> 有能力的 || He is able to speak three languages. （他能說三種語言。）
    line_pattern = re.compile(r'^(\d+)\.\s*\[([^\]]+)\]\s*(.+?)\s*-->\s*(.+?)\s*\|\|\s*(.+)$')

    for line_idx, line in enumerate(lines, 1):
        line_str = line.strip()
        if not line_str:
            continue
        # 跳過標頭 (例如 === 8週 2000 單字 特訓完整字庫 ===)
        if line_str.startswith('==='):
            continue

        match = line_pattern.match(line_str)
        if not match:
            if '-->' in line_str and line_str.count('-->') > 1:
                errors.append({
                    'line': line_idx,
                    'type': 'MULTI_ENTRY_MERGED',
                    'detail': '單行包含多個 --> 條目 (可能行被合併)',
                    'content': line_str
                })
            else:
                errors.append({
                    'line': line_idx,
                    'type': 'INVALID_FORMAT',
                    'detail': '無法解析為標準格式 Number. [pos] word --> translation || sentence (translation.)',
                    'content': line_str
                })
            continue

        num_str, pos, word, zh_translation, sentence_part = match.groups()
        actual_num = int(num_str)
        total_words += 1

        # 1. 檢查序號是否連續
        if actual_num != expected_num:
            errors.append({
                'line': line_idx,
                'type': 'DISCONTINUOUS_NUMBER',
                'detail': f'單字序號不連續: 預期 {expected_num}, 實際為 {actual_num}',
                'content': line_str
            })
            expected_num = actual_num + 1
        else:
            expected_num += 1

        # 2. 特別檢查 "--> 中文翻譯" 內容 (重點需求)
        zh_clean = zh_translation.strip()
        
        # 2a. 檢查中文翻譯是否包含英文字母
        en_match = re.search(r'[a-zA-Z]', zh_clean)
        if en_match:
            errors.append({
                'line': line_idx,
                'type': 'ZH_CONTAINS_ENGLISH',
                'detail': f'中文翻譯包含英文字母: "{zh_clean}" (發現 \'{en_match.group(0)}\')',
                'content': line_str
            })

        # 2b. 檢查中文翻譯是否包含數字
        num_match = re.search(r'[0-9]', zh_clean)
        if num_match:
            errors.append({
                'line': line_idx,
                'type': 'ZH_CONTAINS_DIGITS',
                'detail': f'中文翻譯包含數字: "{zh_clean}" (發現 \'{num_match.group(0)}\')',
                'content': line_str
            })

        # 2c. 檢查中文翻譯是否包含被連著的 [ 或 ]
        if '[' in zh_clean or ']' in zh_clean:
            errors.append({
                'line': line_idx,
                'type': 'ZH_CONTAINS_BRACKET',
                'detail': f'中文翻譯包含詞性方括號: "{zh_clean}"',
                'content': line_str
            })

        # 3. 檢查例句括號內翻譯
        paren_match = re.search(r'[\（\(](.*?)[\）\)]', sentence_part)
        if paren_match:
            eg_zh = paren_match.group(1).strip()
            # 若例句翻譯全英文
            if eg_zh and re.search(r'^[a-zA-Z\s\.,\'\?!]+$', eg_zh) and len(eg_zh) > 3:
                errors.append({
                    'line': line_idx,
                    'type': 'EG_ZH_UNTRANSLATED',
                    'detail': f'例句翻譯未翻譯為中文 (為英文片段): "{eg_zh}"',
                    'content': line_str
                })
        else:
            errors.append({
                'line': line_idx,
                'type': 'EG_MISSING_PAREN',
                'detail': '例句缺乏括號中文翻譯 （...）',
                'content': line_str
            })

    # 分類統計
    type_counts = {}
    for err in errors:
        t = err['type']
        type_counts[t] = type_counts.get(t, 0) + 1

    print(f"📊 總計檢查單字數: {total_words}")
    print(f"🚨 發現異常總項目數: {len(errors)}")
    print("📈 異常類別統計:")
    for t_name, count in type_counts.items():
        print(f"   - {t_name:22s}: {count} 筆")

    # 優先列印 "--> 中文翻譯" 有中英/數字混和或結構異常的項目
    zh_errors = [e for e in errors if e['type'] in ('ZH_CONTAINS_ENGLISH', 'ZH_CONTAINS_DIGITS', 'ZH_CONTAINS_BRACKET', 'MULTI_ENTRY_MERGED', 'INVALID_FORMAT', 'DISCONTINUOUS_NUMBER')]
    
    if zh_errors:
        print(f"\n⚠️ 【重點檢視】「--> 中文翻譯」與結構異常項目 ({len(zh_errors)} 筆):")
        for err in zh_errors:
            print(f"Line {err['line']:4d} | [{err['type']}] {err['detail']}")
            print(f"          內容: {err['content']}")
            print("-" * 65)
    
    eg_errors = [e for e in errors if e['type'] == 'EG_ZH_UNTRANSLATED']
    if eg_errors:
        print(f"\nℹ️ 例句未翻譯為中文項目 ({len(eg_errors)} 筆，前 10 筆預覽):")
        for err in eg_errors[:10]:
            print(f"Line {err['line']:4d} | {err['detail']}")

    return errors

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_2000 = os.path.join(base_dir, 'www', '2000_單字庫.txt')
    file_7000 = os.path.join(base_dir, 'www', '7000_單字庫.txt')

    errs_2000 = check_vocab_file(file_2000)
    errs_7000 = check_vocab_file(file_7000)

    total_errs = len(errs_2000) + len(errs_7000)
    sys.exit(0 if total_errs == 0 else 1)
