// ==========================================
// --- 🪟 各類彈窗 Modals 元件庫 ---
// ==========================================

// --- 查字典與手動加字 Modal ---
window.DictionaryModal = ({
  showDictModal,
  setShowDictModal,
  dictQuery,
  setDictQuery,
  dictLoading,
  dictResult,
  handleDictSearch,
  handleAddCustomWord
}) => {
  if (!showDictModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🔍 查字典與新增單字
          </h3>
          <button onClick={() => setShowDictModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <form onSubmit={handleDictSearch} className="flex gap-2">
            <input
              type="text"
              value={dictQuery}
              onChange={(e) => setDictQuery(e.target.value)}
              placeholder="輸入英文單字進行查詢..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
            />
            <button
              type="submit"
              disabled={dictLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md disabled:opacity-50"
            >
              {dictLoading ? '查詢中...' : '查詢字典'}
            </button>
          </form>

          {dictResult && (
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-3 animate-[fadeIn_0.15s_ease-in-out]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xl font-black text-slate-100 font-sans">{dictResult.en}</span>
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold text-indigo-300 bg-indigo-950 border border-indigo-700/50 rounded-md">
                    {dictResult.pos}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddCustomWord(dictResult)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  ➕ 加入單字庫
                </button>
              </div>

              <p className="text-sm font-bold text-emerald-400">{dictResult.zh}</p>

              {dictResult.eg && (
                <p className="text-xs text-slate-400 italic bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  {dictResult.eg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 當前錯題本 Modal ---
window.MistakesModal = ({
  showMistakesModal,
  setShowMistakesModal,
  mistakes,
  handleRemoveMistake
}) => {
  if (!showMistakesModal) return null;
  const mistakeList = Object.values(mistakes || {});

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[85vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🚨 當前錯題本 (共 {mistakeList.length} 字)
          </h3>
          <button onClick={() => setShowMistakesModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {mistakeList.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8">當前沒有需要複習的錯題！ 🎉</p>
          ) : (
            mistakeList.map((item, idx) => (
              <div key={idx} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/60 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-200 font-sans text-sm">{item.word.en}</span>
                  <span className="ml-2 text-indigo-300">({item.word.pos})</span>
                  <p className="text-slate-400 mt-0.5">{item.word.zh}</p>
                </div>
                <button
                  onClick={() => handleRemoveMistake(item.word.en)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-rose-300 font-bold rounded-lg transition-colors"
                >
                  移除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- 歷史殿堂 Modal ---
window.HistoryModal = ({
  showHistoryModal,
  setShowHistoryModal,
  historicalMistakes
}) => {
  if (!showHistoryModal) return null;
  const historyList = Object.values(historicalMistakes || {});

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[85vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🏛️ 歷史殿堂 (錯題紀錄)
          </h3>
          <button onClick={() => setShowHistoryModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {historyList.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8">歷史殿堂無紀錄。</p>
          ) : (
            historyList.map((item, idx) => (
              <div key={idx} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/60 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-200 font-sans text-sm">{item.word.en}</span>
                  <span className="ml-2 text-indigo-300">({item.word.pos})</span>
                  <p className="text-slate-400 mt-0.5">{item.word.zh}</p>
                </div>
                <span className="px-2 py-1 bg-amber-950/60 text-amber-300 border border-amber-700/40 rounded-lg font-mono font-bold">
                  錯誤 {item.count} 次
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- 全字庫預覽 Modal ---
window.AllVocabModal = ({
  showAllVocabModal,
  setShowAllVocabModal,
  vocabList,
  handleDeleteWord,
  setEditingIndex
}) => {
  if (!showAllVocabModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[85vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            📖 全字庫單字總覽 (共 {vocabList.length} 字)
          </h3>
          <button onClick={() => setShowAllVocabModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {vocabList.map((item, idx) => (
            <div key={idx} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/60 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-200 font-sans text-sm">{item.en}</span>
                <span className="ml-2 text-indigo-300">({item.pos})</span>
                <p className="text-slate-400 mt-0.5">{item.zh}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingIndex(idx)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-indigo-300 font-bold rounded-lg transition-colors"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDeleteWord(idx)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-rose-400 font-bold rounded-lg transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
