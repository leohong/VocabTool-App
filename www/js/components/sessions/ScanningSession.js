// ==========================================
// --- ⚡ 第一關：快速篩選 (ScanningSession Component) ---
// ==========================================
window.ScanningSession = ({
  queue,
  currentWord,
  handleExitSession,
  setIsDictHintMode,
  setDictMaskWord,
  setShowDictModal,
  setSearchQuery,
  performSearch,
  speak,
  startEditing,
  handleDeleteWord,
  vocabList,
  handleScan
}) => {
  if (!currentWord) return null;

  return (
    <div className="flex flex-col items-center animate-[fadeIn_0.3s_ease-in-out] w-full">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="text-slate-400 font-medium flex items-center gap-2 text-xs sm:text-sm">
          <IconAlert />第一關：快速篩選 (剩 {queue.length} 字)
        </div>
        <button
          onClick={handleExitSession}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition-colors shrink-0 whitespace-nowrap"
        >
          暫停存檔
        </button>
      </div>

      <div className="bg-slate-800 w-full min-h-[320px] rounded-3xl shadow-2xl border border-slate-700 flex flex-col items-center justify-center p-6 pt-14 md:p-8 md:pt-16 mb-8 text-center relative">
        <div className="absolute top-6 right-6 flex gap-2 z-10">
          <button
            type="button"
            onClick={() => {
              setIsDictHintMode(false);
              setDictMaskWord('');
              setShowDictModal(true);
              setSearchQuery(currentWord.en);
              performSearch(currentWord.en);
            }}
            className="p-3 bg-slate-700 hover:bg-indigo-900 text-indigo-300 rounded-full transition-colors"
            title="查詢此單字字典"
          >
            <IconBook />
          </button>
          <button
            type="button"
            onClick={() => speak(currentWord.en, true)}
            className="p-3 bg-slate-700 hover:bg-indigo-900 text-slate-300 rounded-full transition-colors"
            title="播放發音"
          >
            <IconVolume />
          </button>
        </div>

        {/* 編輯與刪除按鈕 */}
        <div className="absolute top-6 left-6 flex gap-2 z-10">
          <button
            onClick={() => startEditing(vocabList.findIndex(w => w.en.trim().toLowerCase() === currentWord.en.trim().toLowerCase()))}
            className="p-2 bg-slate-700 hover:bg-indigo-900 text-indigo-300 rounded-full transition-colors text-xs"
            title="編輯此單字"
          >
            ✏️
          </button>
          <button
            onClick={() => handleDeleteWord(vocabList.findIndex(w => w.en.trim().toLowerCase() === currentWord.en.trim().toLowerCase()), currentWord)}
            className="p-2 bg-slate-700 hover:bg-rose-900 text-rose-300 rounded-full transition-colors text-xs"
            title="徹底刪除此單字"
          >
            🗑️
          </button>
        </div>

        <span className="text-indigo-400 font-mono font-medium mb-3 flex items-center gap-1.5 justify-center">
          {currentWord._isGhost && <span className="animate-bounce" title="歷史幽靈突襲">👻</span>}
          {currentWord.pos}
        </span>
        <h2 className={`${
          currentWord.en.length <= 8 ? 'text-5xl md:text-6xl' :
          currentWord.en.length <= 12 ? 'text-4xl md:text-5xl' :
          currentWord.en.length <= 16 ? 'text-3xl md:text-4xl' :
          currentWord.en.length <= 20 ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl break-all'
        } font-black text-slate-100 tracking-tight mb-4`}>
          {currentWord.en}
        </h2>
        <p className="text-2xl text-slate-300 mb-2">{currentWord.zh}</p>
        {currentWord.eg && (
          <p className="text-sm text-slate-400 italic mt-3 max-w-md break-words border-t border-slate-700/50 pt-2">
            {currentWord.eg}
          </p>
        )}
      </div>

      <div className="w-full grid grid-cols-2 gap-4">
        {/* 操作按鈕：不熟與認識 */}
        <button
          onClick={() => handleScan(false)}
          className="py-5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-2xl font-bold text-xl flex flex-col items-center gap-2 border border-rose-800/60"
        >
          <IconX />不熟
        </button>
        <button
          onClick={() => handleScan(true)}
          className="py-5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 rounded-2xl font-bold text-xl flex flex-col items-center gap-2 border border-emerald-800/60"
        >
          <IconCheck />認識
        </button>
      </div>
    </div>
  );
};
