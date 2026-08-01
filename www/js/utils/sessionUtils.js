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

  const baseEnSet = new Set(baseWords.map(w => w.en));
  const now = Date.now();

  const ghostWords = Object.values(historicalMistakes || {})
    .filter(h => !h.immune && (now - h.archivedDate) >= (h.interval * 24 * 60 * 60 * 1000))
    .filter(h => !baseEnSet.has(h.data.en))
    .slice(0, safeGPD)
    .map(h => ({ ...h.data, _hasCountedMistake: false, _isGhost: true, _historyData: h }));

  return { baseWords, ghostWords, isMasteredMode };
};
