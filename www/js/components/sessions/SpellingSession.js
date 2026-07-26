// ==========================================
// --- ✍️ 第二關 & 大會考：強制填空盲測 (SpellingSession Component) ---
// ==========================================
window.SpellingSession = ({
  queue,
  currentWord,
  handleExitSession,
  speak,
  startEditing,
  handleDeleteWord,
  vocabList,
  typoCount,
  mustTypeCorrectly,
  copyFailCount,
  userInput,
  setUserInput,
  isInputFocused,
  setIsInputFocused,
  inputRef,
  handleSpellingSubmit,
  handleSurrender,
  handleForceMistake,
  proceedToNext,
  isCorrectFeedback
}) => {
  if (!currentWord) return null;

  return (
    <div className="flex flex-col items-center animate-[fadeIn_0.3s_ease-in-out] w-full">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="text-indigo-400 font-medium flex items-center gap-2 text-xs sm:text-sm">
          <span>✍️ 盲測輸出中 (剩 {queue.length} 字)</span>
        </div>
        <button
          onClick={handleExitSession}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition-colors shrink-0 whitespace-nowrap"
        >
          暫停存檔
        </button>
      </div>

      <div className={`bg-slate-800 w-full rounded-3xl shadow-2xl border text-center transition-all duration-300 relative ${
        typoCount === 1 ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]' :
        typoCount >= 2 ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
        'border-slate-700'
      } ${isInputFocused ? 'p-5 pt-12 md:p-6 md:pt-14 mb-4' : 'p-6 pt-12 md:p-8 md:pt-14 mb-6'}`}>
        
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            type="button"
            onClick={() => speak(currentWord.en, true)}
            className="p-2 bg-slate-700 hover:bg-indigo-900 text-slate-400 rounded-full transition-colors"
            title="播放發音"
          >
            <IconVolume />
          </button>
        </div>

        {/* 編輯與刪除按鈕 */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <button
            onClick={() => startEditing(vocabList.findIndex(w => w.en.trim().toLowerCase() === currentWord.en.trim().toLowerCase()))}
            className="p-1.5 bg-slate-700 hover:bg-indigo-900 text-indigo-300 rounded-full transition-colors text-xs"
            title="編輯此單字"
          >
            ✏️
          </button>
          <button
            onClick={() => handleDeleteWord(vocabList.findIndex(w => w.en.trim().toLowerCase() === currentWord.en.trim().toLowerCase()), currentWord)}
            className="p-1.5 bg-slate-700 hover:bg-rose-900 text-rose-300 rounded-full transition-colors text-xs"
            title="徹底刪除此單字"
          >
            🗑️
          </button>
        </div>

        <span className="text-indigo-400 font-mono font-medium mb-2 block flex items-center gap-1.5 justify-center">
          {currentWord._isGhost && <span className="animate-bounce" title="歷史幽靈突襲">👻</span>}
          {currentWord._isHistoryCheck && <span title="歷史抽查">🏛️</span>}
          {currentWord.pos}
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-100 tracking-tight mb-2">
          {currentWord.zh}
        </h2>
        <div className={`${
          currentWord.en.length <= 10 ? 'text-sm' :
          currentWord.en.length <= 15 ? 'text-xs' : 'text-[10px]'
        } font-mono tracking-widest text-slate-500 mt-2 mb-4`}>
          {currentWord.en.length} 字母 ( {Array(currentWord.en.length).fill('_').join(' ')} )
        </div>
        {currentWord.eg && (
          <div className="text-xs text-slate-400 italic max-w-md mx-auto break-words border-t border-slate-700/50 pt-2.5 mt-2.5 mb-6">
            <span className="text-slate-500 font-bold not-italic">Hint:</span> {maskExample(currentWord.eg, currentWord.en)}
          </div>
        )}

        <form onSubmit={handleSpellingSubmit} className="space-y-4 max-w-md mx-auto">
          <div className="flex justify-between items-center min-h-[24px]">
            <label className="text-xs text-slate-400 font-medium">拼寫單字：</label>
            {isCorrectFeedback ? (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60 animate-bounce">
                🎉 正確！
              </span>
            ) : typoCount === 1 && !mustTypeCorrectly ? (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/60 animate-pulse">
                ⚠️ 手滑警告!
              </span>
            ) : mustTypeCorrectly ? (
              <span className="text-[10px] font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/60 animate-pulse">
                ❌ 請重抄 (剩餘嘗試: {3 - copyFailCount} 次)
              </span>
            ) : null}
          </div>

          {mustTypeCorrectly && (
            <div className="bg-slate-900 p-4 rounded-xl border border-emerald-900/50 mb-2">
              <span className="text-xs text-slate-500 block mb-1">請輸入一次：</span>
              <span className={`${
                currentWord.en.length <= 8 ? 'text-3xl' :
                currentWord.en.length <= 12 ? 'text-2xl' :
                currentWord.en.length <= 16 ? 'text-xl' : 'text-lg break-all'
              } font-black font-mono text-emerald-400 tracking-widest select-none`}>
                {currentWord.en}
              </span>
            </div>
          )}

          <input
            type="text"
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="在此輸入..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
            className={`w-full py-4 px-6 bg-slate-900 border-2 rounded-xl ${
              currentWord.en.length <= 8 ? 'text-xl' :
              currentWord.en.length <= 12 ? 'text-lg' :
              currentWord.en.length <= 16 ? 'text-base' : 'text-sm'
            } font-bold font-mono text-center transition-all duration-150 tracking-widest focus:outline-none ${
              isCorrectFeedback
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.01]'
                : typoCount === 1
                ? 'border-amber-500/50 text-amber-300'
                : mustTypeCorrectly
                ? 'border-emerald-500 text-emerald-300'
                : 'border-slate-700 text-indigo-300 focus:border-indigo-500'
            }`}
          />

          <button
            type="submit"
            className={`w-full py-3 font-bold rounded-xl transition-all duration-150 shadow-md text-white ${
              isCorrectFeedback
                ? 'bg-emerald-600 shadow-emerald-900/50 scale-[1.01]'
                : mustTypeCorrectly
                ? 'bg-emerald-700 hover:bg-emerald-600'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isCorrectFeedback ? "🎉 正確！" : (mustTypeCorrectly ? "已確實手寫記下 (Enter)" : "送出檢查 (Enter)")}
          </button>

          {/* 誠實與放棄按鈕 */}
          {!mustTypeCorrectly && (
            <div className="flex justify-between items-center mt-3 px-1">
              <button
                type="button"
                onClick={handleSurrender}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>😶</span> 放棄
              </button>
              <button
                type="button"
                onClick={handleForceMistake}
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>🤔</span> 加入錯題
              </button>
            </div>
          )}
          {mustTypeCorrectly && (
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("確定要跳過這個單字的手寫複製嗎？")) {
                    proceedToNext();
                  }
                }}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <span>⏭️</span> 跳過親手輸入
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
