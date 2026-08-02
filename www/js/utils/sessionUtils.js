// ==========================================
// --- 🧮 特訓演算法與狀態計算 (sessionUtils.js) ---
// ==========================================

// 計算當前狀態指示燈號與顏色
window.calculateIndicator = (mistakesTotal, historicalMistakesCount = 0) => {
  const currentTotal = mistakesTotal || 0;
  if (currentTotal === 0 && historicalMistakesCount === 0) {
    return {
      status: 'safe',
      icon: '🟢',
      title: '完美狀態',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/60'
    };
  } else if (currentTotal <= 5) {
    return {
      status: 'warning',
      icon: '🟡',
      title: '輕度積壓',
      color: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/60'
    };
  } else {
    return {
      status: 'danger',
      icon: '🔴',
      title: '錯題警戒',
      color: 'text-rose-400',
      bg: 'bg-rose-950/40',
      border: 'border-rose-800/60'
    };
  }
};

// 邏輯換日線（凌晨 4:00 前算前一天的邏輯日期，防止夜貓子跨夜暫存與打卡失敗）
window.getLogicalDate = () => {
  return new Date(Date.now() - 4 * 60 * 60 * 1000).toDateString();
};

// 獲取本日進度單字清單
window.getDailyWordsList = (vocabList, currentDay, wordsPerDay, completedWordsCount) => {
  if (!vocabList || vocabList.length === 0) return [];
  const safeWPD = Math.max(1, parseInt(wordsPerDay, 10) || 50);
  let startIdx;
  if (typeof completedWordsCount === 'number' && !isNaN(completedWordsCount) && completedWordsCount >= 0) {
    startIdx = completedWordsCount;
  } else {
    startIdx = Math.max(0, ((currentDay || 1) - 1) * safeWPD);
  }
  if (startIdx >= vocabList.length) {
    return vocabList.slice(-safeWPD);
  }
  return vocabList.slice(startIdx, startIdx + safeWPD);
};

// 獲取過濾搜尋單字清單
window.getFilteredVocabList = (vocabList, query) => {
  if (!vocabList) return [];
  if (!query || !query.trim()) return vocabList;
  const q = query.trim().toLowerCase();
  return vocabList.filter(w => 
    w.en.toLowerCase().includes(q) || 
    w.zh.includes(q) || 
    (w.pos && w.pos.toLowerCase().includes(q))
  );
};

// 全域 Key 正規化處理 (去首尾空格並轉小寫，確保單字 Key 絕對一致)
window.normalizeKey = (key) => (typeof key === 'string' ? key.trim().toLowerCase() : '');

// 全域 Safe Word Resolver (多階層動態安全單字檢索器)
// 支持零資料冗餘外鍵 Key 檢索、舊版 hydrated 結構相容與孤兒單字保底
window.getWordData = (entry, vocabMapOrList) => {
  if (!entry) return { en: '', pos: 'n.', zh: '[無單字資料]', eg: '' };
  
  // 1. 舊版 Hydrated 結構相容 (若 entry 內建 data 或本身為 Word 實體)
  if (typeof entry === 'object' && entry.data && entry.data.en) return entry.data;
  if (typeof entry === 'object' && entry.en && entry.zh) return entry;
  
  // 2. 提取 en key 並進行全域正規化
  const rawKey = typeof entry === 'string' ? entry : (entry.en || entry.word || '');
  const cleanKey = window.normalizeKey(rawKey);
  if (!cleanKey) return { en: '', pos: 'n.', zh: '[無單字資料]', eg: '' };

  // 3. $O(1)$ 哈希快速查找 (Map) 或 $O(N)$ 陣列查找 (Array)
  let found = null;
  if (vocabMapOrList instanceof Map) {
    found = vocabMapOrList.get(cleanKey);
  } else if (Array.isArray(vocabMapOrList)) {
    found = vocabMapOrList.find(w => w && w.en && window.normalizeKey(w.en) === cleanKey);
  }

  if (found) return found;
  return { en: rawKey || cleanKey, pos: 'n.', zh: '[單字已自字典移除]', eg: '' };
};

// Pure function: 計算今日基本單字 + 幽靈字，供多個 Hook 共用
// 不依賴 React state，所有資料皆由參數傳入
window.computeDailyWords = (vocabList, currentDay, wordsPerDay, ghostsPerDay, historicalMistakes, completedWordsCount) => {
  // 防禦：onBlur 前 state 可能暫時為空字串或 NaN，強制回落預設值
  const safeWPD = Math.max(1, parseInt(wordsPerDay, 10) || 50);
  const safeGPD = Math.max(0, parseInt(ghostsPerDay, 10) || 0);
  
  let startIndex;
  if (typeof completedWordsCount === 'number' && !isNaN(completedWordsCount) && completedWordsCount >= 0) {
    startIndex = completedWordsCount;
  } else {
    startIndex = Math.max(0, ((currentDay || 1) - 1) * safeWPD);
  }

  let baseWords;
  let isMasteredMode = false;

  if (vocabList && vocabList.length > 0) {
    if (startIndex >= vocabList.length) {
      // 🏆 全字庫通關模式：每日保養隨機抽查
      isMasteredMode = true;
      const maintenanceCount = Math.min(safeWPD, vocabList.length);
      baseWords = [...vocabList].sort(() => 0.5 - Math.random()).slice(0, maintenanceCount);
    } else {
      baseWords = vocabList.slice(startIndex, startIndex + safeWPD);
    }
  } else {
    baseWords = [];
  }

  const baseEnSet = new Set(baseWords.map(w => window.normalizeKey(w.en)));
  const now = Date.now();

  const ghostWords = Object.values(historicalMistakes || {})
    .filter(h => h && !h.immune && (now - (h.archivedDate || 0)) >= ((h.interval || 7) * 24 * 60 * 60 * 1000))
    .filter(h => {
      const wordData = window.getWordData(h, vocabList);
      return wordData && wordData.en && !baseEnSet.has(window.normalizeKey(wordData.en));
    })
    .slice(0, safeGPD)
    .map(h => {
      const wordData = window.getWordData(h, vocabList);
      return { ...wordData, _hasCountedMistake: false, _isGhost: true, _historyData: h };
    });

  return { baseWords, ghostWords, isMasteredMode };
};

