// ==========================================
// --- ⚓ Custom Hook: useVocabState.js ---
// ==========================================
// 已重構為支持異步持久化儲存（Preferences & Filesystem）
// 配合 `isStorageLoaded` 防禦標記，防止加載期間將預設空狀態寫入覆蓋存檔。

window.useVocabState = () => {
  const defaultState = {
    currentDay: 1,
    completedWordsCount: 0,
    learnedWords: [],
    mistakes: {},
    historicalMistakes: {},
    streak: { count: 0, lastDate: null }
  };

  const [dbName, setDbName] = React.useState('vocab_2000');
  const [dbList, setDbList] = React.useState(['vocab_2000', 'vocab_7000']);
  const [state, setState] = React.useState(defaultState);
  const [vocabList, setVocabList] = React.useState(() => window.rawVocab || []);
  const [wordsPerDay, setWordsPerDay] = React.useState(50);
  const [ghostsPerDay, setGhostsPerDay] = React.useState(10);
  const [isStorageLoaded, setIsStorageLoaded] = React.useState(false);

  // 切換資料庫時同步異步加載
  const loadDatabaseData = async (targetDb) => {
    console.log(`[Storage] loadDatabaseData for: ${targetDb}`);
    
    // 讀取每日新字數與幽靈數限制
    const savedWords = await window.persistentStorage.getSetting(`vocab_wordsPerDay_${targetDb}`, 50);
    const safeWords = (typeof savedWords === 'number' && !isNaN(savedWords) && savedWords > 0) ? savedWords : 50;
    setWordsPerDay(safeWords);

    const savedGhosts = await window.persistentStorage.getSetting(`vocab_ghostsPerDay_${targetDb}`, 10);
    const safeGhosts = (typeof savedGhosts === 'number' && !isNaN(savedGhosts) && savedGhosts >= 0) ? savedGhosts : 10;
    setGhostsPerDay(safeGhosts);

    // 讀取狀態
    const savedState = await window.persistentStorage.loadDbState(targetDb);
    const loadedState = savedState ? { ...defaultState, ...savedState } : { ...defaultState };
    if (typeof loadedState.completedWordsCount !== 'number' || isNaN(loadedState.completedWordsCount)) {
      loadedState.completedWordsCount = Math.max(0, ((loadedState.currentDay || 1) - 1) * safeWords);
    }
    loadedState.currentDay = Math.floor(loadedState.completedWordsCount / safeWords) + 1;
    setState(loadedState);

    // 讀取單字庫
    const savedVocab = await window.persistentStorage.loadDatabase(targetDb);
    setVocabList(savedVocab && savedVocab.length > 0 ? savedVocab : window.rawVocab || []);
  };

  // 全域初始化讀取 (僅在 App 載入時執行一次)
  const initAllData = async () => {
    try {
      await window.persistentStorage.initStorage();
      
      let savedDbList = await window.persistentStorage.getDbList();
      if (!savedDbList || !Array.isArray(savedDbList) || savedDbList.length === 0) {
        savedDbList = ['vocab_2000', 'vocab_7000'];
        await window.persistentStorage.saveDbList(savedDbList);
      }

      let currentDB = await window.persistentStorage.getSetting('vocab_currentDB', 'vocab_2000');
      if (!savedDbList.includes(currentDB)) {
        currentDB = savedDbList[0] || 'vocab_2000';
        await window.persistentStorage.setSetting('vocab_currentDB', currentDB);
      }
      
      setDbName(currentDB);
      setDbList(savedDbList);
      
      await loadDatabaseData(currentDB);
      setIsStorageLoaded(true);
      console.log('[Storage] All data loaded successfully.');
    } catch (e) {
      console.error('[Storage] initAllData failed:', e);
      setIsStorageLoaded(true); // 出錯也開啟鎖，防止完全卡死
    }
  };

  // 手動切換資料庫
  const changeDatabase = async (newDb) => {
    setIsStorageLoaded(false); // 暫時鎖定，避免切換載入中觸發自動存檔
    setDbName(newDb);
    await window.persistentStorage.setSetting('vocab_currentDB', newDb);
    await loadDatabaseData(newDb);
    setIsStorageLoaded(true);
  };

  // 自動持久化 (僅在 isStorageLoaded 爲 true 時執行)
  React.useEffect(() => {
    if (isStorageLoaded && dbName) {
      window.persistentStorage.saveDbState(dbName, state);
    }
  }, [state, dbName, isStorageLoaded]);

  React.useEffect(() => {
    if (isStorageLoaded && dbName) {
      const safeWPD = Math.max(1, parseInt(wordsPerDay, 10) || 50);
      window.persistentStorage.setSetting(`vocab_wordsPerDay_${dbName}`, safeWPD);
      setState(prev => {
        const count = typeof prev.completedWordsCount === 'number' ? prev.completedWordsCount : Math.max(0, ((prev.currentDay || 1) - 1) * safeWPD);
        const newDay = Math.floor(count / safeWPD) + 1;
        if (newDay !== prev.currentDay) {
          return { ...prev, currentDay: newDay };
        }
        return prev;
      });
    }
  }, [wordsPerDay, dbName, isStorageLoaded]);

  React.useEffect(() => {
    if (isStorageLoaded && dbName) {
      window.persistentStorage.setSetting(`vocab_ghostsPerDay_${dbName}`, ghostsPerDay);
    }
  }, [ghostsPerDay, dbName, isStorageLoaded]);

  React.useEffect(() => {
    if (isStorageLoaded) {
      window.persistentStorage.saveDbList(dbList);
    }
  }, [dbList, isStorageLoaded]);

  // 建立全域 O(1) 哈希快取與安全單字 Selector
  const vocabMap = React.useMemo(() => {
    const map = new Map();
    (vocabList || []).forEach(w => {
      if (w && w.en) map.set(window.normalizeKey(w.en), w);
    });
    return map;
  }, [vocabList]);

  const getWord = React.useCallback((keyOrEntry) => {
    return window.getWordData(keyOrEntry, vocabMap);
  }, [vocabMap]);

  return {
    dbName,
    setDbName: changeDatabase,
    dbList,
    setDbList,
    state,
    setState,
    vocabList,
    setVocabList,
    vocabMap,
    getWord,
    wordsPerDay,
    setWordsPerDay,
    ghostsPerDay,
    setGhostsPerDay,
    defaultState,
    isStorageLoaded,
    initAllData
  };
};

