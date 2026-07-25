// ==========================================
// --- 🏠 主控制台 Dashboard 元件 ---
// ==========================================
window.Dashboard = ({
  startTodaySession,
  startExamSession,
  startHistoryCheck,
  setShowAudioSetupModal,
  setShowPreviewModal,
  setShowMistakeModal,
  setShowAllPreviewModal,
  setAllSearchQuery,
  setAllPage,
  setShowDictModal,
  resetDictState,
  vocabList,
  activeMistakesList,
  learnedWords,
  historyTotal,
  dbName,
  setDbName,
  dbList,
  handleAddDB,
  wordsPerDay,
  setWordsPerDay,
  ghostsPerDay,
  setGhostsPerDay,
  speechRate,
  setSpeechRate,
  speechEnabled,
  setSpeechEnabled,
  exportDictionaryTXT,
  setShowImportOptionsModal,
  exportHistoryTXT,
  handleImportHistoryTXT,
  exportJson,
  handleImportJson,
  resetProgress,
  deleteCurrentDB,
  setShowLicensesModal
}) => {
  const dailyWordsCount = vocabList && vocabList.slice ? vocabList.length : 0;

  return (
    <div className="w-full flex flex-col gap-5 animate-[fadeIn_0.4s_ease-in-out]">

      <button
        onClick={startTodaySession}
        className="w-full min-h-[160px] bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-900/30 flex flex-col items-center justify-center gap-3 transition-transform active:scale-[0.98] border border-indigo-500/30 group"
      >
        <div className="group-hover:scale-110 transition-transform duration-300">
          <IconPlay />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-wide">發動今日特訓</h2>
          <p className="text-sm text-indigo-200 mt-1.5 font-medium bg-indigo-950/40 px-3 py-1 rounded-full inline-block border border-indigo-500/20">
            包含冷卻幽靈突襲 👻
          </p>
        </div>
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={startExamSession}
          className="py-4 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1.5 transition-colors"
        >
          <span className="text-xl">🔥</span>
          <span>降溫：錯題大會考</span>
        </button>
        <button
          onClick={startHistoryCheck}
          className="py-4 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1.5 transition-colors"
        >
          <span className="text-xl">🏛️</span>
          <span>深度：歷史隨機抽查</span>
        </button>
        <button
          onClick={() => setShowAudioSetupModal(true)}
          className="py-4 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/50 text-indigo-300 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1.5 transition-colors"
        >
          <span className="text-xl">🎧</span>
          <span>聽讀：聽音背單字</span>
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-3 text-xs font-medium">
        <button
          onClick={() => setShowPreviewModal(true)}
          className="text-indigo-400 hover:text-indigo-300 underline py-1 transition-colors"
        >
          🔍 預覽單字 ({(vocabList && vocabList.length) ? Math.min(wordsPerDay, vocabList.length) : 0} 字)
        </button>
        <button
          onClick={() => setShowMistakeModal(true)}
          className="text-indigo-400 hover:text-indigo-300 underline py-1 transition-colors"
        >
          ⚠️ 預覽錯題 ({(activeMistakesList && activeMistakesList.length) || 0} 字)
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={() => {
            setShowAllPreviewModal(true);
            setAllSearchQuery('');
            setAllPage(1);
          }}
          className="text-indigo-400 hover:text-indigo-300 underline py-1 transition-colors"
        >
          🗂️ 預覽字庫 ({dailyWordsCount} 字)
        </button>
        <span className="text-slate-600">|</span>
        <button
          onClick={() => {
            setShowDictModal(true);
            resetDictState();
          }}
          className="text-indigo-400 hover:text-indigo-300 underline py-1 transition-colors flex items-center gap-1"
        >
          📖 新增單字
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-1">
        <div className="bg-slate-800 p-4 rounded-xl shadow-md border border-slate-700 text-center flex flex-col justify-center">
          <span className="text-xs text-slate-400 font-medium block mb-1">總進度覆蓋</span>
          <span className="text-2xl font-bold text-indigo-400 tracking-wide">
            {learnedWords ? learnedWords.length : 0}
            <span className="text-xs text-slate-500 font-normal ml-0.5">/{dailyWordsCount}</span>
          </span>
        </div>
        <div
          onClick={() => setShowHistoryModal(true)}
          className="bg-slate-800 p-4 rounded-xl shadow-md border border-slate-700 text-center cursor-pointer hover:bg-slate-700 transition-colors flex flex-col justify-center group"
        >
          <span className="text-xs text-slate-400 font-medium block mb-1 group-hover:text-slate-300">
            🏛️ 歷史殿堂
          </span>
          <span className="text-2xl font-bold text-amber-400 tracking-wide">
            {historyTotal}
            <span className="text-[10px] text-slate-400 ml-1 font-normal">字封存</span>
          </span>
        </div>
      </div>

      <div className="w-full h-px bg-slate-700/50 my-2 rounded-full"></div>

      <div className="bg-slate-800 p-4 rounded-xl shadow-md border border-slate-700 space-y-3">
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-bold text-slate-400 flex-shrink-0">🗄️ 字庫:</span>
          <select
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-indigo-400 rounded-md py-1 px-2 text-xs font-mono flex-1 focus:outline-none focus:border-indigo-500 min-w-0"
          >
            {dbList && dbList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button
            onClick={handleAddDB}
            className="text-[11px] py-1 px-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors font-medium flex-shrink-0"
          >
            + 新增
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex justify-between items-center gap-1">
            <span className="text-xs font-bold text-slate-400 flex-shrink-0">🎯 每日新字:</span>
            <input
              type="number"
              min="1"
              max="500"
              value={wordsPerDay}
              onChange={(e) => setWordsPerDay(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-12 bg-slate-900 border border-slate-700 rounded-md py-1 px-1 text-xs text-center focus:outline-none focus:border-indigo-500 font-mono flex-shrink-0"
            />
          </div>
          <div className="flex justify-between items-center gap-1 border-l border-slate-700 pl-2">
            <span className="text-xs font-bold text-slate-400 flex-shrink-0">👻 每日幽靈:</span>
            <input
              type="number"
              min="0"
              max="100"
              value={ghostsPerDay}
              onChange={(e) => setGhostsPerDay(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-12 bg-slate-900 border border-slate-700 rounded-md py-1 px-1 text-xs text-center focus:outline-none focus:border-indigo-500 font-mono text-amber-300 flex-shrink-0"
            />
          </div>
        </div>
        <div className="h-px bg-slate-700/50 my-1"></div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            🔊 語音速度 (0.2 ~ 1.2):
          </span>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setSpeechRate(r => Math.max(0.2, Math.round((r - 0.1) * 10) / 10))}
              disabled={speechRate <= 0.2}
              className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-md text-slate-300 font-bold transition-colors select-none"
            >
              -
            </button>
            <span className="w-8 text-center font-bold text-indigo-400">{speechRate.toFixed(1)}</span>
            <button
              type="button"
              onClick={() => setSpeechRate(r => Math.min(1.2, Math.round((r + 0.1) * 10) / 10))}
              disabled={speechRate >= 1.2}
              className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 rounded-md text-slate-300 font-bold transition-colors select-none"
            >
              +
            </button>
          </div>
        </div>
        <div className="h-px bg-slate-700/50 my-1"></div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            📢 自動發音:
          </span>
          <button
            type="button"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 select-none ${
              speechEnabled
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-400'
            }`}
          >
            {speechEnabled ? '已開啟 ON' : '已關閉 OFF'}
          </button>
        </div>
      </div>

      <div className="bg-slate-800 p-3 rounded-xl shadow-md border border-slate-700 mt-auto">
        <span className="text-[11px] text-slate-500 font-medium block mb-2.5 text-center">
          檔案管理與備份
        </span>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex gap-1">
            <button
              onClick={exportDictionaryTXT}
              className="flex-1 py-1.5 bg-slate-700 rounded text-xs text-slate-300 hover:bg-slate-600 transition-colors"
              title="匯出字典"
            >
              ⬇️ 字
            </button>
            <button
              onClick={() => setShowImportOptionsModal(true)}
              className="flex-1 py-1.5 bg-slate-700 rounded text-xs text-slate-300 hover:bg-slate-600 transition-colors text-center"
              title="匯入字典"
            >
              ⬆️ 字
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={exportHistoryTXT}
              className="flex-1 py-1.5 bg-slate-700 rounded text-xs text-slate-300 hover:bg-slate-600 transition-colors"
              title="匯出歷史殿堂"
            >
              ⬇️ 殿
            </button>
            <label
              className="flex-1 py-1.5 bg-slate-700 rounded text-xs text-slate-300 hover:bg-slate-600 transition-colors cursor-pointer text-center"
              title="匯入歷史殿堂/新字庫"
            >
              ⬆️ 殿
              <input type="file" accept=".txt" onChange={handleImportHistoryTXT} className="hidden" />
            </label>
          </div>
          <div className="flex gap-1">
            <button
              onClick={exportJson}
              className="flex-1 py-1.5 bg-indigo-900/50 rounded text-xs text-indigo-300 hover:bg-indigo-800 transition-colors"
              title="JSON全匯出"
            >
              ⬇️ J
            </button>
            <label
              className="flex-1 py-1.5 bg-indigo-900/50 rounded text-xs text-indigo-300 hover:bg-indigo-800 transition-colors cursor-pointer text-center"
              title="JSON全匯入"
            >
              ⬆️ J
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </div>
        <div className="flex justify-between mt-3.5 px-1 border-t border-slate-700/50 pt-2.5">
          <button
            onClick={resetProgress}
            className="text-[10px] text-slate-500 hover:text-red-400 underline transition-colors"
          >
            重設此區進度
          </button>
          <button
            onClick={() => setShowLicensesModal(true)}
            className="text-[10px] text-slate-500 hover:text-indigo-400 underline transition-colors font-medium"
          >
            開源授權宣告
          </button>
          <button
            onClick={deleteCurrentDB}
            className="text-[10px] text-slate-500 hover:text-red-400 underline transition-colors"
          >
            徹底刪除目前字庫
          </button>
        </div>
      </div>

    </div>
  );
};
