import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def check_duplicates_in_file(file_path):
    filename = os.path.basename(file_path)
    print(f"\n==========================================")
    print(f"🔍 檢測單字庫內部重複英文單字: {filename}")
    print(f"==========================================")

    if not os.path.exists(file_path):
        print(f"❌ 錯誤: 找不到檔案 {file_path}")
        return set()

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    pattern = re.compile(r'^\d+\.\s*\[([^\]]+)\]\s*(.+?)\s*-->\s*(.+?)\s*\|\|\s*(.+)$')
    word_locations = {}

    for line_idx, line in enumerate(lines, 1):
        line_str = line.strip()
        m = pattern.match(line_str)
        if m:
            pos, word, zh, eg = m.groups()
            w_clean = word.strip()
            w_lower = w_clean.lower()
            if w_lower not in word_locations:
                word_locations[w_lower] = []
            word_locations[w_lower].append({
                'line': line_idx,
                'word': w_clean,
                'pos': pos.strip(),
                'zh': zh.strip(),
                'raw': line_str
            })

    duplicates = {w: locs for w, locs in word_locations.items() if len(locs) > 1}

    total_entries = sum(len(l) for l in word_locations.values())
    print(f"📊 總單字數: {total_entries}")
    print(f"獨立單字數: {len(word_locations)}")
    print(f"🚨 內部重複單字數量: {len(duplicates)}")

    if duplicates:
        print("\n--- 內部重複單字列表 ---")
        for w, locs in duplicates.items():
            print(f"\n🔹 單字: \"{w}\" (出現 {len(locs)} 次):")
            for loc in locs:
                print(f"    - Line {loc['line']:4d} | [{loc['pos']}] {loc['word']} --> {loc['zh']}")
    else:
        print(f"✅ 恭喜！{filename} 內部「無任何重複單字」！")

    return set(word_locations.keys())

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_2000 = os.path.join(base_dir, 'www', '2000_單字庫.txt')
    file_7000 = os.path.join(base_dir, 'www', '7000_單字庫.txt')

    set_2000 = check_duplicates_in_file(file_2000)
    set_7000 = check_duplicates_in_file(file_7000)

    if set_2000 and set_7000:
        overlap = set_2000.intersection(set_7000)
        print(f"\n==========================================")
        print(f"🔄 2000 字庫與 7000 字庫跨庫重疊 (交集單字數): {len(overlap)}")
        print(f"==========================================")
