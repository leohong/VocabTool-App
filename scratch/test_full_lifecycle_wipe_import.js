const fs = require('fs');
const path = require('path');

// 1. Load exportImportUtils.js
const utilsCode = fs.readFileSync(path.join(__dirname, '../www/js/utils/exportImportUtils.js'), 'utf8');

global.window = {};
eval(utilsCode);

// Load 2000 & 7000 text files to simulate auto-fetch built-in dictionaries
const txt2000 = fs.readFileSync(path.join(__dirname, '../www/2000_單字庫.txt'), 'utf8');
const txt7000 = fs.readFileSync(path.join(__dirname, '../www/7000_單字庫.txt'), 'utf8');

const parseTxtToVocab = (content) => {
  const lines = content.split('\n');
  const vocab = [];
  const lineRegex = /^(?:\d+\.\s*)?\[(.*?)\]\s*(.*?)\s*-->\s*(.*)/;
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('===')) continue;
    const match = line.match(lineRegex);
    if (match) {
      const pos = match[1].trim();
      const en = match[2].trim();
      let rest = match[3].trim();
      let zh = rest;
      let eg = '';
      if (rest.includes('||')) {
        const parts = rest.split('||');
        zh = parts[0].trim();
        eg = parts[1].trim();
      }
      vocab.push({ en, zh, pos, eg });
    }
  }
  return vocab;
};

const rawVocab2000 = parseTxtToVocab(txt2000);
const rawVocab7000 = parseTxtToVocab(txt7000);

const rawVocabMap = {
  vocab_2000: rawVocab2000,
  vocab_7000: rawVocab7000
};

console.log(`[INIT] Loaded built-in dictionary text files: vocab_2000 (${rawVocab2000.length} words), vocab_7000 (${rawVocab7000.length} words)`);

// Simulated In-Memory Storage Engine
class SimulatedStorage {
  constructor() {
    this.wipeAllData();
  }

  wipeAllData() {
    this.settings = {
      vocab_currentDB: 'vocab_2000',
      vocab_dbList: ['vocab_2000', 'vocab_7000'],
      vocab_speechRate: 0.8,
      vocab_speechEnabled: true
    };
    this.databases = {};
    this.dbStates = {};
  }
}

const storage = new SimulatedStorage();

const performImportSequence = (backupFilePath, label) => {
  console.log(`\n==================================================`);
  console.log(`[ACTION] 1. 執行全資料清除 (Complete Data Wipe)...`);
  storage.wipeAllData();
  console.log(`  State after wipe: DBs = ${Object.keys(storage.databases).length}, CurrentDB = ${storage.settings.vocab_currentDB}`);

  console.log(`[ACTION] 2. 匯入檔案 [${label}]: ${path.basename(backupFilePath)}...`);
  const fileContent = fs.readFileSync(backupFilePath, 'utf8');
  const rawObj = JSON.parse(fileContent);

  const parsed = window.exportImportUtils.parseUniversalBackup(rawObj, rawVocabMap);
  console.log(`  [Parsed Type]: ${parsed.type}`);

  if (parsed.type === 'full_system') {
    const { dbList, currentDB, speechRate, speechEnabled } = parsed.globalSettings;
    storage.settings.vocab_dbList = dbList;
    storage.settings.vocab_currentDB = currentDB;
    storage.settings.vocab_speechRate = speechRate;
    storage.settings.vocab_speechEnabled = speechEnabled;

    for (const [db, dbData] of Object.entries(parsed.databases)) {
      storage.databases[db] = dbData.vocabList || rawVocabMap[db] || [];
      storage.dbStates[db] = dbData.state;
      storage.settings[`vocab_wordsPerDay_${db}`] = dbData.wordsPerDay;
      storage.settings[`vocab_ghostsPerDay_${db}`] = dbData.ghostsPerDay;
    }
  }

  console.log(`\n[RESULTS SUMMARY - ${label}]`);
  console.log(`  Global Current DB: ${storage.settings.vocab_currentDB}`);
  console.log(`  Global DB List: JSON.stringify(${JSON.stringify(storage.settings.vocab_dbList)})`);

  for (const db of storage.settings.vocab_dbList) {
    const vocabList = storage.databases[db] || [];
    const state = storage.dbStates[db] || { currentDay: 1, learnedWords: [], mistakes: {}, historicalMistakes: {} };
    const histCount = Object.keys(state.historicalMistakes || {}).length;
    const activeCount = Object.keys(state.mistakes || {}).length;
    const learnedCount = (state.learnedWords || []).length;
    const wpd = storage.settings[`vocab_wordsPerDay_${db}`];
    const gpd = storage.settings[`vocab_ghostsPerDay_${db}`];

    console.log(`\n  --- 📊 資料庫 【${db}】 ---`);
    console.log(`    - 字典單字總數 (Vocab Count): ${vocabList.length} 字`);
    console.log(`    - 目前學習天數 (Current Day): 第 ${state.currentDay} 天`);
    console.log(`    - 已學習單字數 (Learned Words): ${learnedCount} 字`);
    console.log(`    - 當日錯題數量 (Active Mistakes): ${activeCount} 筆`);
    console.log(`    - 歷史殿堂數量 (Historical Mistakes): ${histCount} 筆`);
    console.log(`    - 每日規劃 (Words/Ghosts Per Day): ${wpd} 字 / ${gpd} 幽靈`);

    // Verify sample historical mistake rehydration
    const histEntries = Object.entries(state.historicalMistakes || {});
    if (histEntries.length > 0) {
      const [sampleKey, sampleObj] = histEntries[0];
      console.log(`    - [驗證歷史錯題 Rehydration] 錯題關鍵字 '${sampleKey}':`);
      console.log(`        英文: ${sampleObj.data?.en || 'MISSING'}`);
      console.log(`        中文: ${sampleObj.data?.zh || 'MISSING'}`);
      console.log(`        詞性: ${sampleObj.data?.pos || 'MISSING'}`);
      console.log(`        失誤次數: ${sampleObj.totalFails || sampleObj.mistakesCount}`);
      console.log(`        SRS 階段: ${sampleObj.step}`);
    }
  }
};

// 1. Run New Backup Import Lifecycle
const newBackupPath = 'C:\\Users\\hys82\\Downloads\\極限完整備份_20260729_232244.json';
performImportSequence(newBackupPath, '新資料 (232244)');

// 2. Run Old Backup Import Lifecycle
const oldBackupPath = 'C:\\Users\\hys82\\Downloads\\極限完整備份_20260729_192305.json';
performImportSequence(oldBackupPath, '舊資料 (192305)');

console.log('\n==================================================');
console.log('🎉 FULL WIPE & IMPORT LIFECYCLE TEST COMPLETE!');
