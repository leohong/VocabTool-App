// ==========================================
// --- 🪟 AllPreviewModal 元件 ---
// ==========================================
window.AllPreviewModal = ({
  showAllPreviewModal,
  setShowAllPreviewModal,
  dbName,
  vocabList,
  allSearchQuery,
  setAllSearchQuery,
  setAllPage,
  allPage,
  itemsPerPage,
  getFilteredVocab,
  speak,
  startEditing,
  handleDeleteWord
}) => {
  if (!showAllPreviewModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100">🗂️ 全字庫單字預覽</h3>
            <p className="text-xs text-slate-400 mt-0.5">目前字庫：{dbName} • 總共 {vocabList.length} 個單字</p>
          </div>
          <button onClick={() => setShowAllPreviewModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        {/* Filter and Search */}
        <div className="p-4 border-b border-slate-700/50 flex gap-2">
          <input
            type="text"
            value={allSearchQuery}
            onChange={(e) => { setAllSearchQuery(e.target.value); setAllPage(1); }}
            placeholder="輸入關鍵字篩選單字、詞性或釋義..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono text-indigo-300"
          />
        </div>

        {/* List Container */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2 font-sans">
          {(() => {
            const filtered = getFilteredVocab();
            if (filtered.length === 0) {
              return <div className="text-center py-12 text-slate-500">無符合篩選條件的單字。</div>;
            }
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            const currentPage = Math.min(allPage, totalPages);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

            return (
              <>
                <div className="space-y-2">
                  {paginated.map((word) => (
                    <div key={word.originalIdx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/60 gap-2.5 sm:gap-3 group">
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
                            <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">#{word.originalIdx + 1}</span>
                          </div>
                          <span className="text-xs sm:text-sm text-slate-400 break-words block mt-0.5">{word.zh}</span>
                          {word.eg && <div className="text-xs text-slate-500 italic mt-1 font-sans break-words">{word.eg}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(word.originalIdx)}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-900 text-indigo-300 rounded border border-slate-700 text-xs"
                          title="編輯"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteWord(word.originalIdx)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900 text-rose-300 rounded border border-slate-700 text-xs"
                          title="刪除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Navigation */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center gap-1 sm:gap-2 pt-3 text-xs font-mono border-t border-slate-700/40 mt-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setAllPage(p => Math.max(1, p - 1))}
                      className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded text-slate-200 shrink-0 whitespace-nowrap"
                    >
                      ◀ 上一頁
                    </button>
                    <span className="text-slate-400 font-sans text-[11px] sm:text-xs text-center truncate px-1">
                      第 {currentPage} / {totalPages} 頁 (共 {filtered.length} 字)
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setAllPage(p => Math.min(totalPages, p + 1))}
                      className="px-2.5 sm:px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded text-slate-200 shrink-0 whitespace-nowrap"
                    >
                      下一頁 ▶
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};


// --- 7. 編輯單字 Modal ---
