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
    <header className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 bg-slate-800 p-3 sm:p-4 rounded-xl shadow-md border border-slate-700 gap-2.5 sm:gap-4">
      {/* 標題與說明書 (手機直向) */}
      <div className="flex justify-between items-center w-full sm:w-auto gap-2">
        <h1 className="text-base sm:text-lg font-bold text-indigo-400 flex items-center gap-1.5 shrink-0">
          <IconBook /> 極限特訓 <span className="text-[10px] text-slate-500 font-mono font-normal">v{displayVersion}</span>
        </h1>
        {/* 手機直向 (<640px) 顯示在第 1 行右側 */}
        <a
          href="https://github.com/leohong/VocabTool/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="sm:hidden px-2 py-1 text-[10px] font-medium text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-md transition-colors flex items-center gap-1 shrink-0"
        >
          📖 說明書
        </a>
      </div>

      {/* 狀態、打卡、進度選單與說明書 (手機直向 2 行平鋪 / 橫向與電腦 1 行平鋪) */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-1 sm:gap-2.5 flex-nowrap overflow-x-auto no-scrollbar">
        {/* 狀態燈號 */}
        <div className={`border px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center gap-1 transition-colors shadow-sm shrink-0 ${indicator.bg} ${indicator.border}`}>
          <span className="text-[10px]">{indicator.icon}</span>
          <span className={`font-bold text-[11px] sm:text-xs tracking-wide ${indicator.color}`}>{indicator.title}</span>
          <span className={`text-[10px] sm:text-[11px] font-mono ml-0.5 pl-1 border-l opacity-80 ${indicator.border}`}>-{mistakesTotal}</span>
        </div>

        {/* 打卡天數 */}
        {streak && streak.count > 0 && (
          <div className="bg-orange-950/30 border border-orange-500/40 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center gap-1 shadow-sm shrink-0">
            <span className="text-[10px]">🔥</span>
            <span className="font-bold text-orange-400 text-[11px] sm:text-xs tracking-wide">{streak.count} 天</span>
          </div>
        )}

        {/* 進度選單 */}
        {(() => {
          const safeWordsPerDay = Math.max(1, parseInt(wordsPerDay, 10) || 50);
          const safeVocabLength = Math.max(0, parseInt(vocabListLength, 10) || 0);
          const totalDays = Math.max(1, Math.ceil(safeVocabLength / safeWordsPerDay));
          const safeLength = Number.isFinite(totalDays) && totalDays > 0 ? Math.min(10000, totalDays) : 50;
          const isMastered = safeVocabLength > 0 && (currentDay > totalDays || (currentDay - 1) * safeWordsPerDay >= safeVocabLength);

          return (
            <div className="flex items-center text-[11px] sm:text-xs text-slate-400 font-medium shrink-0 whitespace-nowrap">
              {isMastered ? (
                <div className="bg-amber-950/40 border border-amber-500/40 text-amber-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm animate-pulse">
                  <span>🏆</span>
                  <span>特訓結業</span>
                </div>
              ) : (
                <select
                  value={Math.min(currentDay, totalDays)}
                  onChange={(e) => setCurrentDay(parseInt(e.target.value, 10))}
                  disabled={view !== 'dashboard'}
                  className="bg-slate-900 border border-slate-700 text-indigo-300 rounded-md px-1.5 py-0.5 text-[11px] sm:text-xs focus:outline-none focus:border-indigo-500 font-mono"
                >
                  {Array.from({ length: safeLength }, (_, i) => {
                    const d = i + 1;
                    const start = (d - 1) * safeWordsPerDay + 1;
                    const end = safeVocabLength > 0 ? Math.min(d * safeWordsPerDay, safeVocabLength) : d * safeWordsPerDay;
                    return (
                      <option key={d} value={d}>{start} ~ {end} 字</option>
                    );
                  })}
                </select>
              )}
            </div>
          );
        })()}

        {/* 橫向/平板/電腦 (>=640px) 顯示在最右側 */}
        <a
          href="https://github.com/leohong/VocabTool/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex px-2 py-1 text-[11px] sm:text-xs font-medium text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-md transition-colors items-center gap-1 shrink-0"
        >
          📖 說明書
        </a>
      </div>
    </header>
  );
};
