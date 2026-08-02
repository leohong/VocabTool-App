// ==========================================
// --- 📁 資料匯入匯出與備份工具 (exportImportUtils.js) ---
// ==========================================

// 通用檔案下載與跨平台分享 (相容 App 原生沙盒寫入與 Web Blob 下載)
window.downloadFile = async (filename, content, contentType) => {
  try {
    const isNative = typeof window !== 'undefined' && 
                      window.Capacitor && 
                      window.Capacitor.isNativePlatform && 
                      window.Capacitor.isNativePlatform();

    if (isNative && window.Capacitor.Plugins.Filesystem) {
      const Filesystem = window.Capacitor.Plugins.Filesystem;
      const Share = window.Capacitor.Plugins.Share;

      // 寫入 Native CACHE 目錄
      const result = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: 'CACHE',
        encoding: 'utf8'
      });

      if (Share) {
        try {
          await Share.share({
            title: filename,
            text: `匯出檔案: ${filename}`,
            url: result.uri,
            dialogTitle: '分享或儲存備份檔案'
          });
        } catch (shareErr) {
          // 使用者取消分享不應拋出例外警告
          if (shareErr && (shareErr.message === 'Share canceled' || shareErr.name === 'AbortError')) {
            console.log('[Storage] User canceled share dialog.');
            return;
          }
          console.warn('[Storage] Share dialog error:', shareErr);
        }
      }
      return;
    }

    // Web 瀏覽器環境
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[Storage] downloadFile error:', err);
    alert(`檔案匯出失敗：${err.message || err}`);
  }
};

window.exportDictionaryTXT = (vocabList, dbName) => {
  let content = "=== 特訓完整字庫 ===\n\n";
  vocabList.forEach((w, idx) => {
    content += `${idx + 1}. [${w.pos}] ${w.en} --> ${w.zh}${w.eg ? ` || ${w.eg}` : ''}\n`;
  });
  window.downloadFile(`字典_${dbName}.txt`, content, 'text/plain');
};

window.exportHistoryTXT = (historicalMistakes, vocabList, dbName) => {
  const historyList = Object.values(historicalMistakes || {});
  if (historyList.length === 0) return alert("歷史殿堂目前空空如也，無需匯出。");
  let content = `=== 歷史殿堂單字個人紀錄 ===\n\n`;
  historyList.forEach((m, idx) => {
    const itemData = window.getWordData(m, vocabList);
    const vocabWord = (vocabList || []).find(w => window.normalizeKey(w.en) === window.normalizeKey(itemData.en));
    const currentEg = (vocabWord && vocabWord.eg) || itemData.eg || '';
    content += `${idx + 1}. 錯誤次數: ${m.mistakesCount || m.totalFails || 0}次 | [${itemData.pos || 'n.'}] ${itemData.en || ''} --> ${itemData.zh || ''}${currentEg ? ` || ${currentEg}` : ''}\n`;
  });
  window.downloadFile(`歷史殿堂_${dbName}.txt`, content, 'text/plain');
};

// ==========================================
// --- 🌐 正規化極致輕量與無鎖相容備份系統 ---
// ==========================================
window.exportImportUtils = {
  // 正規化極致輕量備份打包 (v3.1：外鍵 key 導向正規化、剝離重複 data 實體，附帶 schemaVersion 與 meta.schemaSpec 詮釋資料)
  buildNormalizedBackup: (allDatabasesData, globalSettings) => {
    const normalizedDbs = {};

    for (const [db, dbObj] of Object.entries(allDatabasesData || {})) {
      const origState = dbObj.state ? JSON.parse(JSON.stringify(dbObj.state)) : null;
      if (origState) {
        // 1. 瘦身歷史殿堂 (historicalMistakes)
        if (origState.historicalMistakes) {
          const normalizedHistorical = {};
          for (const [enKey, mistakeObj] of Object.entries(origState.historicalMistakes)) {
            if (!mistakeObj) continue;
            const cleanKey = window.normalizeKey(enKey) || enKey;
            const { data, ...rest } = mistakeObj;
            normalizedHistorical[cleanKey] = { ...rest, en: cleanKey };
          }
          origState.historicalMistakes = normalizedHistorical;
        }

        // 2. 瘦身當日特訓錯題庫 (mistakes)
        if (origState.mistakes && typeof origState.mistakes === 'object' && !Array.isArray(origState.mistakes)) {
          const normalizedMistakes = {};
          for (const [enKey, mistakeObj] of Object.entries(origState.mistakes)) {
            if (!mistakeObj) continue;
            const cleanKey = window.normalizeKey(enKey) || enKey;
            const { data, ...rest } = mistakeObj;
            normalizedMistakes[cleanKey] = { ...rest, en: cleanKey };
          }
          origState.mistakes = normalizedMistakes;
        }
      }

      normalizedDbs[db] = {
        settings: {
          wordsPerDay: dbObj.wordsPerDay ?? 50,
          ghostsPerDay: dbObj.ghostsPerDay ?? 10
        },
        vocabList: dbObj.vocabList || null,
        state: origState
      };
    }

    return {
      version: "3.1",
      schemaVersion: "3.1.0",
      appVersion: "1.9.0",
      backupType: "normalized_system",
      exportDate: new Date().toISOString(),
      meta: {
        generator: "VocabTool-App",
        specNotice: "v3.1 Normalized Foreign Key Architecture",
        schemaSpec: {
          wordEntity: ["en", "pos", "zh", "eg"],
          activeMistake: ["mistakesCount", "correctCount"],
          historicalMistake: ["mistakesCount", "totalFails", "archivedDate", "step", "interval", "immune"],
          dbState: ["currentDay", "completedWordsCount", "learnedWords", "mistakes", "historicalMistakes", "streak"]
        }
      },
      globalSettings: {
        currentDB: globalSettings.currentDB || 'vocab_2000',
        dbList: globalSettings.dbList || ['vocab_2000', 'vocab_7000'],
        speechRate: globalSettings.speechRate ?? 0.8,
        speechEnabled: (globalSettings.speechEnabled === true || globalSettings.speechEnabled === 'true')
      },
      databases: normalizedDbs
    };
  },

  // 通用防禦型匯入解析與數據轉譯
  parseUniversalBackup: (data, rawVocabMap = {}) => {
    // 防禦 5: 嚴格布林型態轉換
    const parseStrictBoolean = (val, fallback = true) => {
      if (val === undefined || val === null) return fallback;
      if (val === true || val === 'true') return true;
      if (val === false || val === 'false') return false;
      return Boolean(val);
    };

    // 重建錯題實體 (雙重比對防禦：優先以現有字庫更新，若字庫無此字但錯題本身帶有實體 data 則安全保留)
    const rehydrateMistakes = (mistakesObj, vocabList) => {
      if (!mistakesObj || typeof mistakesObj !== 'object') return {};
      const vocabMap = new Map();
      (vocabList || []).forEach(w => {
        if (w && w.en) vocabMap.set(w.en, w);
      });

      const rehydrated = {};
      const entries = Array.isArray(mistakesObj)
        ? mistakesObj.map(item => [item.en || item.word || '', item])
        : Object.entries(mistakesObj);

      for (const [enKey, entry] of entries) {
        if (!entry) continue;
        let wordData = entry.data || ((entry.en || entry.word) ? entry : null);
        const targetKey = (wordData && (wordData.en || wordData.word)) ? (wordData.en || wordData.word) : enKey;
        if (!targetKey) continue;

        const found = vocabMap.get(targetKey) || (wordData && (wordData.en || wordData.word) ? wordData : null);

        if (found) {
          rehydrated[targetKey] = {
            ...entry,
            data: {
              en: found.en || found.word || targetKey,
              zh: found.zh || found.meaning || '[無譯義]',
              pos: found.pos || found.partOfSpeech || 'n.',
              eg: found.eg || found.example || ''
            }
          };
        }
      }
      return rehydrated;
    };

    const isSystemOrDbBackup = data && (data.backupType || data.databases || data.allDatabases || data.globalSettings || data.global || data.state);

    // 1. 全系統備份或單一字庫狀態備份 (優先解析系統備份，防止帶有 vocabList 陣列的系統備份被誤判為純單字清單)
    if (isSystemOrDbBackup) {
      if (data.backupType === 'normalized_system' || data.backupType === 'full_system' || data.databases || data.allDatabases || data.globalSettings || data.global) {
        const gs = data.globalSettings || data.global || {};
        const importedDbList = Array.isArray(gs.dbList) && gs.dbList.length > 0 ? gs.dbList : ['vocab_2000', 'vocab_7000'];
        const importedCurrentDB = gs.currentDB || data.dbName || importedDbList[0] || 'vocab_2000';
        const importedSpeechRate = typeof gs.speechRate === 'number' ? gs.speechRate : 0.8;
        const importedSpeechEnabled = parseStrictBoolean(gs.speechEnabled, true);

        const parsedDatabases = {};
        const dbsObj = data.databases || data.allDatabases || (data.state ? { [importedCurrentDB]: { state: data.state, vocabList: data.vocabList, wordsPerDay: data.wordsPerDay, ghostsPerDay: data.ghostsPerDay } } : {});

        for (const dbName of Object.keys(dbsObj)) {
          const rawDb = dbsObj[dbName] || {};
          let vocabList = Array.isArray(rawDb.vocabList) && rawDb.vocabList.length > 0 ? rawDb.vocabList : null;
          
          // 防禦 3: 空字庫降級 (自動自 rawVocabMap 載入)
          if (!vocabList || vocabList.length === 0) {
            if (rawVocabMap && rawVocabMap[dbName]) vocabList = rawVocabMap[dbName];
          }

          const rawState = rawDb.state || rawDb.userState || rawDb || {};
          const rawHistorical = rawState.historicalMistakes || rawState.history || rawState.historical || {};
          const rawActiveMistakes = rawState.mistakes || rawState.activeMistakes || rawState.mistakeList || {};

          const rehydratedHistorical = rehydrateMistakes(rawHistorical, vocabList);
          const rehydratedActiveMistakes = rehydrateMistakes(rawActiveMistakes, vocabList);

          const rawWordsPerDay = rawDb.settings?.wordsPerDay ?? rawDb.wordsPerDay;
          const rawGhostsPerDay = rawDb.settings?.ghostsPerDay ?? rawDb.ghostsPerDay;

          const safeWPD = parseInt(rawWordsPerDay, 10) || 50;
          const parsedCurrentDay = parseInt(rawState.currentDay, 10) || 1;
          const parsedCompletedCount = (typeof rawState.completedWordsCount === 'number' && !isNaN(rawState.completedWordsCount) && rawState.completedWordsCount >= 0)
            ? rawState.completedWordsCount
            : Math.max(0, (parsedCurrentDay - 1) * safeWPD);

          parsedDatabases[dbName] = {
            vocabList,
            state: {
              currentDay: Math.floor(parsedCompletedCount / safeWPD) + 1,
              completedWordsCount: parsedCompletedCount,
              learnedWords: Array.isArray(rawState.learnedWords) ? rawState.learnedWords : (Array.isArray(rawState.learned) ? rawState.learned : []),
              mistakes: rehydratedActiveMistakes,
              historicalMistakes: rehydratedHistorical,
              streak: rawState.streak || { count: 0, lastDate: null }
            },
            wordsPerDay: safeWPD,
            ghostsPerDay: parseInt(rawGhostsPerDay, 10) || 10
          };
        }

        return {
          type: 'full_system',
          globalSettings: {
            dbList: importedDbList,
            currentDB: importedCurrentDB,
            speechRate: importedSpeechRate,
            speechEnabled: importedSpeechEnabled
          },
          databases: parsedDatabases
        };
      }

      if (data.state || data.customVocab) {
        const targetDb = data.dbName || 'vocab_2000';
        let vocabList = Array.isArray(data.vocabList) && data.vocabList.length > 0 ? data.vocabList : (Array.isArray(data.customVocab) ? data.customVocab : null);
        if (!vocabList || vocabList.length === 0) {
          if (rawVocabMap && rawVocabMap[targetDb]) vocabList = rawVocabMap[targetDb];
        }
        const rawState = data.state || {};
        const rawHistorical = rawState.historicalMistakes || rawState.history || rawState.historical || {};
        const rawActiveMistakes = rawState.mistakes || rawState.activeMistakes || rawState.mistakeList || {};

        const rehydratedHistorical = rehydrateMistakes(rawHistorical, vocabList);
        const rehydratedActiveMistakes = rehydrateMistakes(rawActiveMistakes, vocabList);

        const safeWPD = parseInt(data.wordsPerDay, 10) || 50;
        const parsedCurrentDay = parseInt(rawState.currentDay, 10) || 1;
        const parsedCompletedCount = (typeof rawState.completedWordsCount === 'number' && !isNaN(rawState.completedWordsCount) && rawState.completedWordsCount >= 0)
          ? rawState.completedWordsCount
          : Math.max(0, (parsedCurrentDay - 1) * safeWPD);

        return {
          type: 'single_db',
          dbName: targetDb,
          vocabList,
          state: {
            currentDay: Math.floor(parsedCompletedCount / safeWPD) + 1,
            completedWordsCount: parsedCompletedCount,
            learnedWords: Array.isArray(rawState.learnedWords) ? rawState.learnedWords : (Array.isArray(rawState.learned) ? rawState.learned : []),
            mistakes: rehydratedActiveMistakes,
            historicalMistakes: rehydratedHistorical,
            streak: rawState.streak || { count: 0, lastDate: null }
          },
          wordsPerDay: safeWPD,
          ghostsPerDay: parseInt(data.ghostsPerDay, 10) || 10
        };
      }
    }

    // 2. 純單字 JSON 陣列或包裝於物件的單字清單 [{en, zh...}]
    const rawListCandidate = Array.isArray(data) ? data : (data && (Array.isArray(data.vocabList) ? data.vocabList : (Array.isArray(data.words) ? data.words : (Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : null)))));
    if (rawListCandidate) {
      const importedWords = rawListCandidate.map(item => ({
        en: (item.en || item.word || item.English || item.Word || '').trim(),
        zh: (item.zh || item.meaning || item.Chinese || item.Translation || '').trim(),
        pos: (item.pos || item.partOfSpeech || 'n.').trim(),
        eg: (item.eg || item.example || item.sentence || '').trim()
      })).filter(item => item.en && item.zh);

      if (importedWords.length > 0) {
        return {
          type: 'word_list',
          vocabList: importedWords
        };
      }
    }

    throw new Error("JSON 格式不符，請確認是正確的備份檔案。");
  }
};

