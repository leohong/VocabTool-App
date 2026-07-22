// ==========================================
// --- 🏠 主控制台 Dashboard 元件 ---
// ==========================================

window.Dashboard = ({
  currentDay,
  learnedWords,
  vocabList,
  startScanningSession,
  startSpellingSession,
  startDailyGrandExam,
  mistakesTotal,
  showHistoryModal,
  setShowHistoryModal,
  showMistakesModal,
  setShowMistakesModal,
  showAllVocabModal,
  setShowAllVocabModal,
  showDictModal,
  setShowDictModal,
  startListeningTrain,
  wordsPerDay,
  ghostsPerDay,
  handleWordsPerDayChange,
  handleGhostsPerDayChange,
  dbName,
  setDbName,
  dbList,
  setDbList,
  handleExportJSON,
  handleExportTXT,
  handleImportFile
}) => {
  return (
    <div className="w-full max-w-xl bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-700 space-y-6">
      
      {/* 今日練習與開始特訓大按鈕 */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              第 {currentDay} 天
            </span>
            <span className="text-xs text-slate-400">
              進度: {learnedWords.length} / {vocabList.length} 字
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-100 mt-1">
            本日特訓任務
          </h2>
        </div>

        <button
          onClick={startScanningSession}
          className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-95"
        >
          <IconPlay /> 開始本日特訓
        </button>
      </div>

      {/* 三大流水線特訓快捷按鈕 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={startScanningSession}
          className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-2xl flex flex-col items-start transition-all group"
        >
          <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-400 transition-colors">
            流水線 1
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1">
            ⚡ 快速掃描
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            閃卡快速熟悉
          </span>
        </button>

        <button
          onClick={startSpellingSession}
          className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-2xl flex flex-col items-start transition-all group"
        >
          <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-400 transition-colors">
            流水線 2
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1">
            ⌨️ 填空盲測
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            拼寫肌肉記憶
          </span>
        </button>

        <button
          onClick={startDailyGrandExam}
          className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-2xl flex flex-col items-start transition-all group"
        >
          <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
            終極大會考
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1">
            🏆 全範圍盲測
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            驗收學習成果
          </span>
        </button>
      </div>

      {/* 聽音特訓、錯題本、歷史殿堂與字庫預覽 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={startListeningTrain}
          className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-xl text-center transition-colors"
        >
          <div className="text-base">🎧</div>
          <div className="text-xs font-bold text-slate-300 mt-1">聽音特訓</div>
        </button>

        <button
          onClick={() => setShowMistakesModal(true)}
          className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-xl text-center transition-colors relative"
        >
          {mistakesTotal > 0 && (
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-full">
              {mistakesTotal}
            </span>
          )}
          <div className="text-base">🚨</div>
          <div className="text-xs font-bold text-slate-300 mt-1">錯題本</div>
        </button>

        <button
          onClick={() => setShowHistoryModal(true)}
          className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-xl text-center transition-colors"
        >
          <div className="text-base">🏛️</div>
          <div className="text-xs font-bold text-slate-300 mt-1">歷史殿堂</div>
        </button>

        <button
          onClick={() => setShowAllVocabModal(true)}
          className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-xl text-center transition-colors"
        >
          <div className="text-base">📖</div>
          <div className="text-xs font-bold text-slate-300 mt-1">全字庫</div>
        </button>
      </div>

      {/* 查字典與手動加字按鈕 */}
      <button
        onClick={() => setShowDictModal(true)}
        className="w-full py-3 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors"
      >
        🔍 查字典與手動加字
      </button>

      {/* 設定項：每日進度與幽靈字數 */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">每日新字數量：</span>
          <select
            value={wordsPerDay}
            onChange={(e) => handleWordsPerDayChange(parseInt(e.target.value, 10))}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono"
          >
            {[10, 15, 20, 25, 30, 40, 50].map(n => (
              <option key={n} value={n}>{n} 字/天</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">幽靈字抓取量：</span>
          <select
            value={ghostsPerDay}
            onChange={(e) => handleGhostsPerDayChange(parseInt(e.target.value, 10))}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono"
          >
            {[0, 2, 3, 5, 8, 10].map(n => (
              <option key={n} value={n}>{n} 字/天</option>
            ))}
          </select>
        </div>
      </div>

      {/* 字庫管理與備份匯入匯出 */}
      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">當前字庫:</span>
          <select
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1 focus:outline-none font-mono"
          >
            {dbList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold transition-colors"
          >
            💾 匯出 JSON
          </button>
          <label className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold cursor-pointer transition-colors">
            📥 匯入
            <input type="file" accept=".json,.txt" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

    </div>
  );
};
