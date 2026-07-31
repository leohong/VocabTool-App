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

// 獲取本日進度單字清單
window.getDailyWordsList = (vocabList, currentDay, wordsPerDay) => {
  if (!vocabList || vocabList.length === 0) return [];
  const startIdx = (currentDay - 1) * wordsPerDay;
  return vocabList.slice(startIdx, startIdx + wordsPerDay);
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

// Pure function: 計算今日基本單字 + 幽靈字，供多個 Hook 共用
// 不依賴 React state，所有資料皆由參數傳入
window.computeDailyWords = (vocabList, currentDay, wordsPerDay, ghostsPerDay, historicalMistakes) => {
  const startIndex = (currentDay - 1) * wordsPerDay;
  let baseWords = vocabList.slice(startIndex, startIndex + wordsPerDay);
  if (baseWords.length === 0 && vocabList.length > 0) baseWords = vocabList.slice(-wordsPerDay);

  const baseEnSet = new Set(baseWords.map(w => w.en));
  const now = Date.now();

  const ghostWords = Object.values(historicalMistakes || {})
    .filter(h => !h.immune && (now - h.archivedDate) >= (h.interval * 24 * 60 * 60 * 1000))
    .filter(h => !baseEnSet.has(h.data.en))
    .slice(0, ghostsPerDay)
    .map(h => ({ ...h.data, _hasCountedMistake: false, _isGhost: true, _historyData: h }));

  return { baseWords, ghostWords };
};
