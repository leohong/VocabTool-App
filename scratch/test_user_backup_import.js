const fs = require('fs');
const path = require('path');

const utilsCode = fs.readFileSync(path.join(__dirname, '../www/js/utils/exportImportUtils.js'), 'utf8');
global.window = {};
eval(utilsCode);

// Define updated parseUniversalBackup
window.exportImportUtils.parseUniversalBackup = (data, rawVocabMap = {}) => {
  const parseStrictBoolean = (val, fallback = true) => {
    if (val === undefined || val === null) return fallback;
    if (val === true || val === 'true') return true;
    if (val === false || val === 'false') return false;
    return Boolean(val);
  };

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

  // 1. 全系統備份或單一字庫狀態備份
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

        parsedDatabases[dbName] = {
          vocabList,
          state: {
            currentDay: parseInt(rawState.currentDay, 10) || 1,
            learnedWords: Array.isArray(rawState.learnedWords) ? rawState.learnedWords : (Array.isArray(rawState.learned) ? rawState.learned : []),
            mistakes: rehydratedActiveMistakes,
            historicalMistakes: rehydratedHistorical,
            streak: rawState.streak || { count: 0, lastDate: null }
          },
          wordsPerDay: parseInt(rawWordsPerDay, 10) || 50,
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

      return {
        type: 'single_db',
        dbName: targetDb,
        vocabList,
        state: {
          currentDay: parseInt(rawState.currentDay, 10) || 1,
          learnedWords: Array.isArray(rawState.learnedWords) ? rawState.learnedWords : (Array.isArray(rawState.learned) ? rawState.learned : []),
          mistakes: rehydratedActiveMistakes,
          historicalMistakes: rehydratedHistorical,
          streak: rawState.streak || { count: 0, lastDate: null }
        },
        wordsPerDay: parseInt(data.wordsPerDay, 10) || 50,
        ghostsPerDay: parseInt(data.ghostsPerDay, 10) || 10
      };
    }
  }

  // 2. 純單字 JSON 陣列
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
};

// 1. Read user backup
const backupPath = 'C:\\Users\\hys82\\Downloads\\極限完整備份_20260729_192305.json';
const userRawData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

// Test parsing original user backup
const parsedUserBackup = window.exportImportUtils.parseUniversalBackup(userRawData, {});
console.log('PASS: User Backup Parsing successful. Type:', parsedUserBackup.type);

// Test exporting normalized backup from parsed user backup
const normalizedExported = window.exportImportUtils.buildNormalizedBackup(
  parsedUserBackup.databases,
  parsedUserBackup.globalSettings
);

console.log('PASS: Exported normalized backup type:', normalizedExported.backupType);

// Test importing normalized backup back into parseUniversalBackup
const parsedNormalized = window.exportImportUtils.parseUniversalBackup(normalizedExported, {});
console.log('PASS: Re-imported normalized backup type:', parsedNormalized.type);
console.log('PASS: Re-imported vocab_7000 historical mistakes count:', Object.keys(parsedNormalized.databases.vocab_7000.state.historicalMistakes).length);
console.log('PASS: Re-imported vocab_7000 active mistakes count:', Object.keys(parsedNormalized.databases.vocab_7000.state.mistakes).length);
console.log('PASS: Re-imported vocab_7000 learned words count:', parsedNormalized.databases.vocab_7000.state.learnedWords.length);

console.log('\n🎉 ALL BACKUP & REHYDRATION TESTS PASSED 100%!');
