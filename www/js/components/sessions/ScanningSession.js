// ==========================================
// --- ⚡ 第一關：快速篩選 (ScanningSession Component) ---
// ==========================================
window.ScanningSession = ({
  queue,
  currentWord,
  sessionType,
  dailyStage = 1,
  scanMode = 'flashcard',
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
  activeMistakesList,
  historicalMistakes,
  handleScan
}) => {
  if (!currentWord) return null;

  const isMcqMode = scanMode === 'mcq' && (sessionType === 'exam' || sessionType === 'history' || (sessionType === 'daily' && dailyStage === 2));

  // --- 四選一模式 狀態與邏輯 ---
  const [mcqChoices, setMcqChoices] = React.useState([]);
  const [selectedIdx, setSelectedIdx] = React.useState(null);
  const [isAnswered, setIsAnswered] = React.useState(false);

  // 剝離例句中的中文翻譯 (例如: "Sentence. (中文翻譯。)" ➔ "Sentence.")
  const getCleanExample = (egText) => {
    if (!egText) return '';
    return egText.replace(/\s*[\(\（].*?[\)\）]\s*/g, '').trim();
  };

  React.useEffect(() => {
    if (!isMcqMode || !currentWord) return;

    setSelectedIdx(null);
    setIsAnswered(false);

    const correctZh = (currentWord.zh || '').trim();

    // 彙整抽樣池：包含特訓字庫、錯題集中營與歷史殿堂的所有單字
    const mistakesPool = (activeMistakesList || []).map(m => m.data || m);
    const historyPool = Object.values(historicalMistakes || {}).map(h => h.data || h);
    const combinedPool = [...(vocabList || []), ...mistakesPool, ...historyPool];

    // 自字庫、錯題與歷史殿堂隨機挑選 3 個不重複的相異中文釋義干擾選項
    const distractors = combinedPool
      .filter(w => w && w.zh && w.zh.trim() && w.zh.trim() !== correctZh)
      .map(w => w.zh.trim());

    // 隨機洗牌干擾選項
    const shuffledDistractors = distractors.sort(() => 0.5 - Math.random());
    const uniqueDistractors = Array.from(new Set(shuffledDistractors)).slice(0, 3);

    // 若字庫數量過少不足 3 個，補充預設輔助選項
    const fallbackOptions = ['特別的', '重要的', '明顯的', '額外的', '基本的'];
    while (uniqueDistractors.length < 3) {
      const fb = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
      if (fb !== correctZh && !uniqueDistractors.includes(fb)) {
        uniqueDistractors.push(fb);
      }
    }

    const options = [
      { text: correctZh, isCorrect: true },
      ...uniqueDistractors.map(txt => ({ text: txt, isCorrect: false }))
    ].sort(() => 0.5 - Math.random());

    setMcqChoices(options);
  }, [currentWord?.en, isMcqMode, vocabList]);

  const handleMcqSelect = (index, option) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedIdx(index);

    if (option.isCorrect) {
      speak(currentWord.en, true);
      setTimeout(() => {
        handleScan(true);
      }, 500);
    } else {
      speak(currentWord.en, true);
      setTimeout(() => {
        handleScan(false);
      }, 1100);
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex flex-col items-center animate-[fadeIn_0.3s_ease-in-out] w-full">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="text-slate-400 font-medium flex items-center gap-2 text-xs sm:text-sm">
          <IconAlert />第一關：{isMcqMode ? '4選1測驗' : '快速篩選'} (剩 {queue.length} 字)
        </div>
        <button
          onClick={handleExitSession}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition-colors shrink-0 whitespace-nowrap"
        >
          {sessionType === 'daily' ? '暫停存檔' : '離開'}
        </button>
      </div>

      <div className="bg-slate-800 w-full min-h-[280px] md:min-h-[320px] rounded-3xl shadow-2xl border border-slate-700 flex flex-col items-center justify-center p-6 pt-14 md:p-8 md:pt-16 mb-6 text-center relative">
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

        {/* 閃卡模式 ➔ 顯示完整中文釋義與翻譯 */}
        {!isMcqMode && (
          <p className="text-2xl text-slate-300 mb-2">{currentWord.zh}</p>
        )}

        {/* 例句顯示 (4選1模式下自動過濾去除中文翻譯) */}
        {currentWord.eg && (
          <p className="text-sm text-slate-400 italic mt-3 max-w-md break-words border-t border-slate-700/50 pt-2">
            {isMcqMode ? getCleanExample(currentWord.eg) : currentWord.eg}
          </p>
        )}
      </div>

      {/* 底部操作區域 */}
      {isMcqMode ? (
        /* 🔘 4選1模式：渲染 4 個大顆選項按鈕 */
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mcqChoices.map((opt, idx) => {
            let btnStyle = "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700";

            if (isAnswered) {
              if (opt.isCorrect) {
                btnStyle = "bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]";
              } else if (idx === selectedIdx && !opt.isCorrect) {
                btnStyle = "bg-rose-950/80 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]";
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleMcqSelect(idx, opt)}
                className={`p-4 rounded-2xl font-bold text-base sm:text-lg flex items-center gap-3 border transition-all text-left ${btnStyle}`}
              >
                <span className="w-7 h-7 rounded-full bg-slate-900/60 border border-slate-700/60 text-xs font-mono flex items-center justify-center text-slate-400 shrink-0">
                  {optionLabels[idx]}
                </span>
                <span className="flex-1 break-words">{opt.text}</span>
              </button>
            );
          })}
        </div>
      ) : (
        /* 🎴 閃卡模式：不熟 / 認識 雙鈕 */
        <div className="w-full grid grid-cols-2 gap-4">
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
      )}
    </div>
  );
};
