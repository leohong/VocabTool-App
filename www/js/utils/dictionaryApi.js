// ==========================================
// --- 🌐 字典 API 與網路翻譯工具 (dictionaryApi.js) ---
// ==========================================

window.translateText = async (text) => {
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-TW`);
    const json = await res.json();
    return json.responseData.translatedText || '';
  } catch (e) {
    console.error('Translation error:', e);
    return '';
  }
};

window.fetchDictionaryData = async (queryStr) => {
  const query = queryStr.trim().toLowerCase();
  if (!query) throw new Error('請輸入查詢單字');

  const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query}`);
  if (!dictRes.ok) {
    if (dictRes.status === 404) {
      throw new Error('找不到該單字的定義');
    }
    throw new Error('Dictionary API 連線失敗');
  }

  const dictData = await dictRes.json();
  if (!dictData || dictData.length === 0) {
    throw new Error('未找到單字定義');
  }

  const wordZh = await window.translateText(query);
  const allExamples = [];
  dictData.forEach(entry => {
    entry.meanings.forEach(meaning => {
      const pos = window.mapPos(meaning.partOfSpeech);
      meaning.definitions.forEach(def => {
        if (def.example) {
          allExamples.push({ pos, egEn: def.example });
        }
      });
    });
  });

  const results = [];
  const firstEntry = dictData[0];

  firstEntry.meanings.forEach(meaning => {
    const pos = window.mapPos(meaning.partOfSpeech);
    meaning.definitions.forEach(def => {
      let chosenEgEn = def.example || '';
      if (!chosenEgEn) {
        const samePosEg = allExamples.find(e => e.pos === pos);
        if (samePosEg) {
          chosenEgEn = samePosEg.egEn;
        } else if (allExamples.length > 0) {
          chosenEgEn = allExamples[0].egEn;
        }
      }

      if (!chosenEgEn && def.definition) {
        const cleanWord = queryStr.trim();
        const article = /^[aeiou]/i.test(cleanWord) ? 'An' : 'A';
        chosenEgEn = `${article} ${cleanWord} is defined as: ${def.definition}`;
      }

      results.push({
        word: queryStr.trim(),
        pos: pos,
        enDef: def.definition,
        egEn: chosenEgEn,
        zh: wordZh || '',
        eg: ''
      });
    });
  });

  if (results.length === 0) {
    throw new Error('未找到單字定義內容');
  }

  const translationPromises = results.slice(0, 4).map(async (item) => {
    if (item.egEn) {
      const egZh = await window.translateText(item.egEn);
      item.eg = egZh ? `${item.egEn} (${egZh})` : item.egEn;
    }
  });

  await Promise.all(translationPromises);
  return results;
};
