// ==========================================
// --- ⚡ 特訓模組 Sessions 元件 ---
// ==========================================

// --- 流水線 1：快速掃描 (Scanning Session) ---
window.ScanningSession = ({
  scanningQueue,
  scanIndex,
  isFlipped,
  setIsFlipped,
  handleScanNext,
  speakWord,
  speechEnabled,
  setSpeechEnabled
}) => {
  const currentWord = scanningQueue[scanIndex] || {};
  const progressPercent = Math.round(((scanIndex + 1) / scanningQueue.length) * 100);

  return (
    <div className="w-full max-w-md flex flex-col items-center space-y-5 animate-[fadeIn_0.2s_ease-in-out]">
      {/* 進度條 */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
        <div
          className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center w-full text-xs text-slate-400 font-mono">
        <span>快速掃描特訓</span>
        <span>{scanIndex + 1} / {scanningQueue.length}</span>
      </div>

      {/* 閃卡卡片 */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[260px] bg-slate-800 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col justify-center items-center cursor-pointer select-none relative group hover:border-indigo-500/50 transition-all"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            speakWord(currentWord.en);
          }}
          className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-700/60 rounded-full transition-colors"
          title="朗讀發音"
        >
          <IconVolume />
        </button>

        <span className="text-3xl font-black tracking-wide text-slate-100 text-center font-sans">
          {currentWord.en}
        </span>

        {isFlipped ? (
          <div className="mt-4 text-center space-y-1 animate-[fadeIn_0.15s_ease-in-out]">
            <span className="inline-block px-2 py-0.5 text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 rounded-md">
              {currentWord.pos || 'n.'}
            </span>
            <p className="text-lg font-bold text-emerald-400">
              {currentWord.zh}
            </p>
            {currentWord.eg && (
              <p className="text-xs text-slate-400 mt-2 italic max-w-xs">
                {currentWord.eg}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-500 mt-4 animate-pulse">
            👆 點擊卡片翻面看中文釋義
          </span>
        )}
      </div>

      {/* 控制按鈕 */}
      <div className="w-full grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => handleScanNext(false)}
          className="py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-1.5"
        >
          <IconX /> 不精確 (重覆)
        </button>
        <button
          onClick={() => handleScanNext(true)}
          className="py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/50"
        >
          <IconCheck /> 完全熟練 (下字)
        </button>
      </div>
    </div>
  );
};

// --- 流水線 2 & 大會考：強制填空盲測 (Spelling Session) ---
window.SpellingSession = ({
  spellingQueue,
  spellingIndex,
  userInput,
  setUserInput,
  handleSpellingSubmit,
  spellingFeedback,
  inputRef,
  speakWord
}) => {
  const currentWord = spellingQueue[spellingIndex] || {};
  const progressPercent = Math.round(((spellingIndex + 1) / spellingQueue.length) * 100);

  return (
    <div className="w-full max-w-md flex flex-col items-center space-y-5 animate-[fadeIn_0.2s_ease-in-out]">
      {/* 進度條 */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center w-full text-xs text-slate-400 font-mono">
        <span>填空盲測特訓</span>
        <span>{spellingIndex + 1} / {spellingQueue.length}</span>
      </div>

      {/* 題目卡片 */}
      <div className="w-full min-h-[220px] bg-slate-800 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col justify-center items-center relative">
        <button
          type="button"
          onClick={() => speakWord(currentWord.en)}
          className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-700/60 rounded-full transition-colors"
        >
          <IconVolume />
        </button>

        <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 rounded-md mb-2">
          {currentWord.pos || 'n.'}
        </span>

        <h3 className="text-2xl font-black text-emerald-400 text-center">
          {currentWord.zh}
        </h3>

        {currentWord.eg && (
          <p className="text-xs text-slate-400 mt-3 text-center italic max-w-xs">
            {maskSentenceText(currentWord.eg, currentWord.en)}
          </p>
        )}
      </div>

      {/* 拼寫輸入表單 */}
      <form onSubmit={handleSpellingSubmit} className="w-full space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="請輸入對應的英文單字..."
          autoFocus
          className="w-full bg-slate-900 border-2 border-indigo-500/50 focus:border-indigo-400 text-slate-100 rounded-2xl px-4 py-3.5 text-lg text-center font-mono focus:outline-none transition-all shadow-inner placeholder:text-slate-600 placeholder:text-sm"
        />

        {spellingFeedback && (
          <div className={`p-3 rounded-xl text-xs font-bold text-center animate-[fadeIn_0.15s_ease-in-out] ${
            spellingFeedback.type === 'correct' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60' : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
          }`}>
            {spellingFeedback.text}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-950/50"
        >
          送出答案 (Enter)
        </button>
      </form>
    </div>
  );
};

// --- 任務完成畫面 (Session Complete) ---
window.SessionComplete = ({ returnToDashboard }) => {
  return (
    <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center text-center space-y-5 animate-[fadeIn_0.3s_ease-in-out]">
      <div className="text-5xl animate-bounce">🏆</div>
      <h2 className="text-2xl font-black text-slate-100">
        特訓任務完成！
      </h2>
      <p className="text-xs text-slate-400 leading-relaxed">
        恭喜您完成本次單字特訓，肌肉記憶已成功建立。持續堅持打卡特訓！
      </p>

      <button
        onClick={returnToDashboard}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-950/50"
      >
        返回主控制台
      </button>
    </div>
  );
};
