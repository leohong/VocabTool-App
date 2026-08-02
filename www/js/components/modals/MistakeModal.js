// ==========================================
// --- 🪟 MistakeModal 元件 ---
// ==========================================
window.MistakeModal = ({
  showMistakeModal,
  setShowMistakeModal,
  activeMistakesList,
  speak,
  vocabList,
  startEditing,
  handleDeleteWord,
  setState,
  getWord
}) => {
  if (!showMistakeModal) return null;

  const resolveWord = (item) => {
    if (getWord) return getWord(item);
    return window.getWordData(item, vocabList);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100">當前錯題集中營</h3>
            <p className="text-xs text-slate-400 mt-0.5">需連續答對 (錯誤數 × 2) 次方可晉升歷史殿堂。</p>
          </div>
          <button onClick={() => setShowMistakeModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {activeMistakesList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">目前沒有弱點負債，大腦狀態極佳！🎉</div>
          ) : (
            (activeMistakesList || []).sort((a, b) => (b?.mistakesCount || 0) - (a?.mistakesCount || 0)).map((item) => {
              const wordData = resolveWord(item);
              const target = Math.min((item?.mistakesCount || 1) * 2, 6);
              const current = item?.correctCount || 0;
              const progress = Math.min((current / target) * 100, 100);
              const cleanEn = window.normalizeKey(wordData.en);
              const vocabIndex = (vocabList || []).findIndex(w => window.normalizeKey(w.en) === cleanEn);
              return (
                <div key={wordData.en || Math.random()} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/60 gap-4 group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => speak(wordData.en, true)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg border border-slate-700 shrink-0"
                      title="發音"
                    >
                      <IconVolume />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                        <span className="font-bold font-mono text-base text-slate-200 break-all">{wordData.en}</span>
                        <span className="text-xs text-indigo-400 font-mono whitespace-nowrap">({wordData.pos})</span>
                      </div>
                      <span className="text-xs sm:text-sm text-slate-400 break-words block mt-0.5">{wordData.zh}</span>
                      {wordData.eg && <div className="text-xs text-slate-500 italic mt-1 font-sans break-words">{wordData.eg}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex flex-col gap-1 w-32 sm:w-36 flex-shrink-0">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-red-400">總失誤: {item?.mistakesCount || 0}</span>
                        <span className="text-emerald-400">連對: {current} / {target}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                        <div className="bg-emerald-500 h-2 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (vocabIndex !== -1) {
                            startEditing(vocabIndex);
                          } else {
                            alert('此單字不在目前字庫中，無法編輯。如需編輯，請先將此單字新增至字庫。');
                          }
                        }}
                        className={`p-1.5 rounded border text-xs transition-colors ${
                          vocabIndex !== -1 
                            ? 'bg-slate-800 text-indigo-400 hover:text-indigo-300 border-slate-700' 
                            : 'bg-slate-800/40 text-slate-600 border-slate-800/20 cursor-not-allowed'
                        }`}
                        title={vocabIndex !== -1 ? "編輯" : "此單字不在目前字庫中，無法編輯"}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (vocabIndex !== -1) {
                            handleDeleteWord(vocabIndex);
                          } else {
                            if (window.confirm(`此單字已不在目前字庫中，確定要單獨將其從「當前錯題集中營」中移除嗎？`)) {
                              setState(prev => {
                                const nextState = { ...prev };
                                nextState.mistakes = { ...prev.mistakes };
                                const targetKey = cleanEn || wordData.en;
                                delete nextState.mistakes[targetKey];
                                return nextState;
                              });
                            }
                          }
                        }}
                        className="p-1.5 bg-slate-800 text-rose-400 hover:text-rose-300 rounded border border-slate-700 text-xs"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};


// --- 4. 歷史殿堂 Modal ---
