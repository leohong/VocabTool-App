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
    const vocabWord = (vocabList || []).find(w => w.en === m.data.en);
    const currentEg = (vocabWord && vocabWord.eg) || m.data.eg || '';
    content += `${idx + 1}. 錯誤次數: ${m.mistakesCount}次 | [${m.data.pos}] ${m.data.en} --> ${m.data.zh}${currentEg ? ` || ${currentEg}` : ''}\n`;
  });
  window.downloadFile(`歷史殿堂_${dbName}.txt`, content, 'text/plain');
};
