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
