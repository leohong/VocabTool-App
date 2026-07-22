// ==========================================
// --- 頂部導覽與狀態列 (Header Component) ---
// ==========================================
window.Header = ({
  displayVersion,
  indicator,
  mistakesTotal,
  streak,
  currentDay,
  setCurrentDay,
  vocabListLength,
  wordsPerDay,
  view
}) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-slate-800 p-3 sm:p-4 rounded-xl shadow-md border border-slate-700 gap-3 sm:gap-4">
      {/* 標題 */}
      <h1 className="text-lg font-bold text-indigo-400 flex items-center gap-1.5 shrink-0">
        <IconBook /> 極限特訓 <span className="text-[10px] text-slate-500 font-mono font-normal">v{displayVersion}</span>
        <a href="https://github.com/leohong/VocabTool/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="ml-2 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-md transition-colors flex items-center gap-1">
          📖 說明書
        </a>
      </h1>

      {/* 狀態、打卡、雲端同步與進度選單 */}
      <div className="flex items-center w-full md:w-auto gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* 狀態燈號 */}
        <div className={`border px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors shadow-sm shrink-0 ${indicator.bg} ${indicator.border}`}>
          <span className="text-[10px]">{indicator.icon}</span>
          <span className={`font-bold text-xs tracking-wide ${indicator.color}`}>{indicator.title}</span>
          <span className={`text-[11px] font-mono ml-1 pl-1.5 border-l opacity-80 ${indicator.border}`}>負債: {mistakesTotal}</span>
        </div>

        {/* 打卡天數 */}
        {streak && streak.count > 0 && (
          <div className="bg-orange-950/30 border border-orange-500/40 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm shrink-0">
            <span className="text-[10px]">🔥</span>
            <span className="font-bold text-orange-400 text-xs tracking-wide">{streak.count} 天</span>
          </div>
        )}

        {/* 進度選單 */}
        <div className="ml-auto flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 font-medium shrink-0">
          進度:
          <select
            value={currentDay}
            onChange={(e) => setCurrentDay(parseInt(e.target.value, 10))}
            disabled={view !== 'dashboard'}
            className="bg-slate-900 border border-slate-700 text-indigo-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          >
            {Array.from({ length: Math.max(50, Math.ceil(vocabListLength / wordsPerDay)) }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>第 {d} 天</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
