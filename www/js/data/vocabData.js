// ==========================================
// --- 📚 單字資料庫預設資料與遮罩常數 ---
// ==========================================

window.rawVocab = [
  { en: 'system', zh: '系統 (範例字)', pos: 'n.' },
  { en: 'acknowledgement', zh: '承認/確認 (範例字)', pos: 'n.' }
];

window.mapPos = (pos) => {
  if (!pos) return 'n.';
  const p = pos.toLowerCase().trim();
  if (p.includes('noun')) return 'n.';
  if (p.includes('verb')) return 'v.';
  if (p.includes('adjective')) return 'adj.';
  if (p.includes('adverb')) return 'adv.';
  if (p.includes('preposition')) return 'prep.';
  if (p.includes('conjunction')) return 'conj.';
  if (p.includes('pronoun')) return 'pron.';
  if (p.includes('determiner')) return 'det.';
  if (p.includes('article')) return 'art.';
  if (p.includes('idiom')) return 'idiom';
  if (['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'det.', 'art.', 'phrase', 'abbr.'].includes(p)) return p;
  return 'n.';
};

window.sampleSentences = {
  "system": "The solar system contains eight planets. (太陽系包含八顆行星。)",
  "acknowledgement": "She sent a note of acknowledgement for the gift. (她寄了一張感謝信表示收到禮物。)"
};

window.maskText = (text, targetWord) => {
  if (!text || !targetWord) return text;
  const escapedTarget = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedTarget}\\b`, 'gi');
  return text.replace(regex, (match) => '＿'.repeat(match.length));
};

window.maskSentenceText = (eg, word) => {
  if (!eg) return '';
  const parts = eg.split(/\s*(\([^)]+\))\s*$/);
  const enPart = parts[0];
  const zhPart = parts[1] || '';
  
  const maskedEn = window.maskText(enPart, word);
  return zhPart ? `${maskedEn} ${zhPart}` : maskedEn;
};
