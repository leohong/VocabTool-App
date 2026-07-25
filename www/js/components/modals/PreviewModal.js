// ==========================================
// --- 🪟 PreviewModal 元件 ---
// ==========================================
window.PreviewModal = ({
  showPreviewModal,
  setShowPreviewModal,
  dbName,
  getDailyWords,
  speak,
  startEditing,
  handleDeleteWord,
  vocabList
}) => {
  if (!showPreviewModal) return null;
  const { baseWords = [] } = getDailyWords();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[80vh] border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100">本日學習單字預覽</h3>
            <p className="text-xs text-slate-400 mt-0.5">資料庫：{dbName} • 共有 {baseWords.length} 個新字</p>
          </div>
          <button onClick={() => setShowPreviewModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {baseWords.length === 0 ? (
            <div className="text-center py-12 text-slate-500">此天數目前沒有單字。</div>
          ) : (
            baseWords.map((word, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/60 gap-2.5 sm:gap-3 group">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => speak(word.en, true)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg border border-slate-700 shrink-0"
                    title="發音"
                  >
                    <IconVolume />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                      <span className="font-bold font-mono text-sm sm:text-base text-slate-200 break-all">{word.en}</span>
                      <span className="text-xs text-indigo-400 font-mono whitespace-nowrap">({word.pos})</span>
                    </div>
                    <span className="text-xs sm:text-sm text-slate-400 break-words block mt-0.5">{word.zh}</span>
                    {word.eg && <div className="text-xs text-slate-500 italic mt-1 font-sans break-words">{word.eg}</div>}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(vocabList.findIndex(w => w.en.trim().toLowerCase() === word.en.trim().toLowerCase()))}
                    className="p-1.5 bg-slate-800 hover:bg-indigo-900 text-indigo-300 rounded border border-slate-700 text-xs"
                    title="編輯"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteWord(vocabList.findIndex(w => w.en.trim().toLowerCase() === word.en.trim().toLowerCase()), word)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-900 text-rose-300 rounded border border-slate-700 text-xs"
                    title="刪除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


// --- 3. 當前錯題集中營 Modal ---
