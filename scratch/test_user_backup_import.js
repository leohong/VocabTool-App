const fs = require('fs');
const path = require('path');

const utilsCode = fs.readFileSync(path.join(__dirname, '../www/js/utils/exportImportUtils.js'), 'utf8');
global.window = {};
eval(utilsCode);

const file2Path = 'C:\\Users\\hys82\\Downloads\\極限完整備份_20260729_232244.json';
const data2 = JSON.parse(fs.readFileSync(file2Path, 'utf8'));

// Mock rawVocabMap for 7000/2000
const rawVocabMap = {
  vocab_2000: [ { en: 'system', zh: '系統', pos: 'n.' }, { en: 'acknowledgement', zh: '承認', pos: 'n.' } ],
  vocab_7000: [ { en: 'exercise', zh: '運動', pos: 'n.' }, { en: 'compromise', zh: '妥協', pos: 'n.' } ]
};

const parsed2 = window.exportImportUtils.parseUniversalBackup(data2, rawVocabMap);

console.log('--- TEST RESULT FOR FILE 2 (232244) ---');
console.log('Type:', parsed2.type);
console.log('GlobalSettings:', parsed2.globalSettings);
for (const db of Object.keys(parsed2.databases || {})) {
  const dbObj = parsed2.databases[db];
  console.log(`Database [${db}]:`);
  console.log(`  Current Day: ${dbObj.state.currentDay}`);
  console.log(`  Learned Words Count: ${dbObj.state.learnedWords.length}`);
  console.log(`  Historical Mistakes Count: ${Object.keys(dbObj.state.historicalMistakes).length}`);
  console.log(`  Active Mistakes Count: ${Object.keys(dbObj.state.mistakes).length}`);
  const histKeys = Object.keys(dbObj.state.historicalMistakes);
  console.log(`  Sample Historical Mistakes:`, histKeys.slice(0, 5));
}
