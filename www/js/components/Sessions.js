// ==========================================
// --- ⚡ 特訓模組 Sessions 元件 ---
// ==========================================

// --- 第一關：快速篩選 (Scanning Session) ---
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

      <div className="bg-slate-800 w-full min-h-[320px] rounded-3xl shadow-2xl border border-slate-700 flex flex-col items-center justify-center p-6 pt-14 md:p-8 md:pt-16 mb-8 text-center relative touch-none select-none">
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
        {/* UI左右對調：左滑不熟，右滑認識 */}
        <button
          onClick={() => handleScan(false)}
          className="py-5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-2xl font-bold text-xl flex flex-col items-center gap-2 border border-rose-800/60"
        >
          <IconX />不熟 (左滑)
        </button>
        <button
          onClick={() => handleScan(true)}
          className="py-5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 rounded-2xl font-bold text-xl flex flex-col items-center gap-2 border border-emerald-800/60"
        >
          <IconCheck />認識 (右滑)
        </button>
      </div>
    </div>
  );
};


// --- 第二關 & 大會考：強制填空盲測 (Spelling Session) ---
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
  proceedToNext
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
            <label className="text-xs text-slate-400 font-medium">請拼寫完整單字：</label>
            {typoCount === 1 && !mustTypeCorrectly && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/60 animate-pulse">
                ⚠️ 手滑警告！再錯將強迫重抄
              </span>
            )}
            {mustTypeCorrectly && (
              <span className="text-[10px] font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/60 animate-pulse">
                ❌ 失憶判定！請重抄 (剩餘嘗試: {3 - copyFailCount} 次)
              </span>
            )}
          </div>

          {mustTypeCorrectly && (
            <div className="bg-slate-900 p-4 rounded-xl border border-emerald-900/50 mb-2">
              <span className="text-xs text-slate-500 block mb-1">神經鏈結斷裂，請看著答案親手輸入一次：</span>
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
            } font-bold font-mono text-center transition-colors tracking-widest focus:outline-none ${
              typoCount === 1
                ? 'border-amber-500/50 text-amber-300'
                : mustTypeCorrectly
                ? 'border-emerald-500 text-emerald-300'
                : 'border-slate-700 text-indigo-300 focus:border-indigo-500'
            }`}
          />

          <button
            type="submit"
            className={`w-full py-3 font-bold rounded-xl transition-colors shadow-md text-white ${
              mustTypeCorrectly ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {mustTypeCorrectly ? "已確實手寫記下 (Enter)" : "送出檢查 (Enter)"}
          </button>

          {/* 誠實與放棄按鈕 */}
          {!mustTypeCorrectly && (
            <div className="flex justify-between items-center mt-3 px-1">
              <button
                type="button"
                onClick={handleSurrender}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <span>😶</span> 腦袋空白 (放棄)
              </button>
              <button
                type="button"
                onClick={handleForceMistake}
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <span>🤔</span> 剛才是矇對的？加入錯題
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


// --- 第三階段：任務完成 (Summary Session) ---
window.SummarySession = ({
  sessionType,
  goToNextDay
}) => {
  return (
    <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center animate-[fadeIn_0.5s_ease-in-out] space-y-6 w-full">
      <div className="w-20 h-20 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-800">
        <IconCheck />
      </div>
      <h2 className="text-3xl font-black text-slate-100">特訓完美結束！</h2>
      <p className="text-slate-400 text-base">高壓輸出完成，記憶鏈結已加深。</p>
      <div className="pt-4">
        <button
          onClick={goToNextDay}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          {sessionType === 'daily' ? '打卡存檔，前往明日排程' : '回到指揮中心'}
        </button>
      </div>
    </div>
  );
};
