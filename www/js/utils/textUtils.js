// ==========================================
// --- 🧮 文字與單字演算法工具 (textUtils.js) ---
// ==========================================

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
  return pos;
};

window.cleanApostrophe = (str) => {
  return (str || '').trim().toLowerCase().replace(/[’‘`′]/g, "'");
};

window.maskText = (text, word) => {
  if (!text || !word) return '';
  let maskedTextStr = text;
  const w = word.trim();
  const escaped = w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  const regex1 = new RegExp('\\b' + escaped + '[a-zA-Z]*\\b', 'gi');
  maskedTextStr = maskedTextStr.replace(regex1, '______');
  
  if (w.toLowerCase().includes('acknowledg')) {
    maskedTextStr = maskedTextStr.replace(/\backnowledg(e)?ment(s)?\b/gi, '______');
  } else if (w.toLowerCase().includes('judg')) {
    maskedTextStr = maskedTextStr.replace(/\bjudg(e)?ment(s)?\b/gi, '______');
  }
  
  return maskedTextStr;
};

window.maskExample = (eg, word) => {
  if (!eg || !word) return '';
  const parts = eg.split(/\s*(\([^)]+\))\s*$/);
  const enPart = parts[0];
  const zhPart = parts[1] || '';
  
  const maskedEn = window.maskText(enPart, word);
  return zhPart ? `${maskedEn} ${zhPart}` : maskedEn;
};
