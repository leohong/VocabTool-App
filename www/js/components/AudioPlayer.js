// ==========================================
// --- 🎧 聽音特訓播放器 (AudioPlayer Component) ---
// ==========================================
window.AudioPlayer = ({
  audioQueue,
  currentAudioIndex,
  stopAudio,
  audioSource,
  blindMode,
  setBlindMode,
  audioSubStep,
  activeSpellingChar,
  audioStatusText,
  playPrevWord,
  isAudioPlaying,
  pauseAudio,
  startAudio,
  playNextWord,
  audioSettings
}) => {
  if (!audioQueue || audioQueue.length === 0) return null;
  const currentWord = audioQueue[currentAudioIndex];

  return (
    <div className="flex flex-col items-center animate-[fadeIn_0.3s_ease-in-out] w-full max-w-lg mx-auto font-sans">
      {/* 頂部導航資訊 */}
      <div className="w-full flex justify-between items-center mb-5 bg-slate-800/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/50">
        <div className="text-indigo-400 font-medium flex items-center gap-2 text-sm sm:text-base">
          <span>🎧 聽讀特訓 ({currentAudioIndex + 1}/{audioQueue.length})</span>
        </div>
        <button
          onClick={stopAudio}
          className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition-colors shrink-0 whitespace-nowrap"
        >
          🛑 停止並返回
        </button>
      </div>

      {/* 主播放字卡 */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 w-full min-h-[300px] rounded-3xl shadow-2xl border border-slate-700/60 flex flex-col items-center justify-between p-6 sm:p-8 mb-6 text-center relative overflow-hidden">
        
        {/* 背景裝飾微光 */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>

        {/* 頂部狀態列 */}
        <div className="w-full flex justify-between items-center z-10">
          <span className="px-2.5 py-1 bg-slate-900/60 text-slate-400 rounded-full text-[11px] font-mono border border-slate-800">
            來源: {
              audioSource === 'daily' ? '📅 今日進度' :
              audioSource === 'mistakes' ? '🔥 錯題本' :
              audioSource === 'history' ? '🏛️ 歷史殿堂' : '🗄️ 全字庫'
            }
          </span>
          
          {/* 眼睛按鈕 (切換盲聽模式) */}
          <button
            type="button"
            onClick={() => setBlindMode(!blindMode)}
            className={`p-2.5 rounded-full transition-colors z-10 ${
              blindMode
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title={blindMode ? '點擊顯示英文單字' : '點擊隱藏英文單字 (盲聽訓練)'}
          >
            {blindMode ? '🙈 盲聽中' : '👁️ 檢視中'}
          </button>
        </div>

        {/* 中間單字主內容 */}
        <div className="my-auto py-4 z-10 w-full">
          {/* 詞性 */}
          <span className="text-indigo-400 font-mono font-bold text-sm tracking-widest block mb-2 uppercase">
            {currentWord?.pos}
          </span>

          {/* 單字拼寫與高亮展示 */}
          <div className={`min-h-[80px] flex items-center justify-center flex-wrap ${
            (currentWord?.en || '').length <= 10 ? 'gap-1.5' :
            (currentWord?.en || '').length <= 15 ? 'gap-1' : 'gap-0.5'
          } mb-4 select-none`}>
            {(() => {
              const wordEn = currentWord?.en || '';

              return wordEn.split('').map((char, index) => {
                let displayChar = char;
                if (blindMode) {
                  displayChar = char === ' ' ? '\u00A0' : '•';
                } else {
                  if (char === ' ') {
                    displayChar = '\u00A0';
                  }
                }

                // 決定樣式類別
                const len = wordEn.length;
                let baseSizeClass = "text-4xl sm:text-5xl";
                if (len > 8 && len <= 12) baseSizeClass = "text-3xl sm:text-4xl";
                else if (len > 12 && len <= 16) baseSizeClass = "text-2xl sm:text-3xl";
                else if (len > 16 && len <= 20) baseSizeClass = "text-xl sm:text-2xl";
                else if (len > 20) baseSizeClass = "text-lg sm:text-xl";

                let charClass = `${baseSizeClass} font-black font-mono transition-all duration-150 `;
                if (blindMode) {
                  charClass += "text-slate-500 opacity-80";
                } else {
                  charClass += "text-slate-100";
                }

                return (
                  <span
                    key={index}
                    className={charClass}
                    style={{ display: 'inline-block' }}
                  >
                    {displayChar}
                  </span>
                );
              });
            })()}
          </div>

          {/* 中文釋義 */}
          <div className="min-h-[36px] mt-2">
            {blindMode && audioSubStep !== 'translation' && audioSubStep !== 'example' && audioSubStep !== 'pause' ? (
              <span className="text-slate-600 italic text-sm">中文釋義已遮蔽</span>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-indigo-300">
                {currentWord?.zh}
              </p>
            )}
          </div>
        </div>

        {/* 底部狀態與例句 */}
        <div className="w-full z-10">
          {/* 例句區塊 */}
          {currentWord?.eg && (
            <div className="mb-4 text-left p-3.5 bg-slate-900/40 rounded-2xl border border-slate-800/40 max-h-[80px] overflow-y-auto">
              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">例句提示:</span>
              {blindMode && audioSubStep !== 'example' ? (
                <p className="text-xs text-slate-600 italic">例句已遮蔽</p>
              ) : (
                <p className="text-xs text-slate-300 italic font-sans break-words">
                  {currentWord.eg}
                </p>
              )}
            </div>
          )}

          {/* 播音進度與動畫狀態 */}
          <div className="flex items-center justify-between gap-3 text-xs font-mono text-slate-400 bg-slate-900/60 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                audioSubStep === 'word' ? 'bg-indigo-400 animate-pulse' :
                audioSubStep === 'spelling' ? 'bg-purple-400 animate-pulse' :
                audioSubStep === 'translation' ? 'bg-pink-400 animate-pulse' :
                audioSubStep === 'example' ? 'bg-cyan-400 animate-pulse' :
                audioSubStep === 'pause' ? 'bg-amber-400 animate-ping' : 'bg-slate-600'
              }`}></span>
              <span className="font-bold text-slate-200">{audioStatusText}</span>
            </div>
            <span className="text-[10px] text-slate-500">
              進度: {Math.round(((currentAudioIndex + 1) / audioQueue.length) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* 播控按鈕面板 */}
      <div className="w-full bg-slate-800/80 backdrop-blur-md p-5 rounded-3xl border border-slate-700/60 shadow-xl space-y-4">
        {/* 音訊進度滑桿 */}
        <div className="w-full bg-slate-900/50 p-2.5 rounded-2xl border border-slate-800/50">
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
            <span>開始: 0%</span>
            <span>進度: {currentAudioIndex + 1} / {audioQueue.length} 字</span>
            <span>結束: 100%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 transition-all duration-300"
              style={{ width: `${((currentAudioIndex + 1) / audioQueue.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 播控大按鈕 */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-3">
            {/* 上一個 */}
            <button
              type="button"
              onClick={playPrevWord}
              disabled={currentAudioIndex === 0}
              className="w-12 h-12 flex items-center justify-center bg-slate-900/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-900/80 rounded-2xl transition-colors border border-slate-800 shadow-md"
              title="上一個單字"
            >
              ⏮️
            </button>

            {/* 播放 / 暫停 */}
            <button
              type="button"
              onClick={() => {
                if (isAudioPlaying) {
                  pauseAudio();
                } else {
                  startAudio(currentAudioIndex);
                }
              }}
              className={`w-16 h-16 flex items-center justify-center rounded-2xl transition-all shadow-lg ${
                isAudioPlaying
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
              }`}
              title={isAudioPlaying ? '暫停播放' : '繼續播放'}
            >
              {isAudioPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </button>

            {/* 下一個 */}
            <button
              type="button"
              onClick={playNextWord}
              disabled={currentAudioIndex === audioQueue.length - 1}
              className="w-12 h-12 flex items-center justify-center bg-slate-900/80 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-900/80 rounded-2xl transition-colors border border-slate-800 shadow-md"
              title="下一個單字"
            >
              ⏭️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
