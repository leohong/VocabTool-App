// ==========================================
// --- 🎧 聽音特訓播放器 AudioPlayer 元件 ---
// ==========================================

window.AudioPlayer = ({
  audioPlaying,
  setAudioPlaying,
  audioCurrentIndex,
  audioWordsList,
  audioMode,
  audioRepeatCount,
  audioSpeed,
  setShowAudioSettingsModal,
  returnToDashboard
}) => {
  const currentWord = audioWordsList[audioCurrentIndex] || {};

  return (
    <div className="w-full max-w-md bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center space-y-5 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="flex justify-between items-center w-full text-xs text-slate-400 font-mono border-b border-slate-700 pb-3">
        <span className="flex items-center gap-1.5 font-bold text-indigo-400">
          🎧 聽音特訓播放中
        </span>
        <button
          onClick={() => setShowAudioSettingsModal(true)}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-700/60 px-2.5 py-1 rounded-lg transition-colors"
        >
          ⚙️ 播放設定
        </button>
      </div>

      {/* 當前播放單字卡 */}
      <div className="w-full min-h-[180px] bg-slate-900/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
        <span className="text-2xl font-black text-slate-100 font-sans tracking-wide">
          {currentWord.en}
        </span>
        <span className="inline-block px-2 py-0.5 text-[11px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 rounded-md mt-2">
          {currentWord.pos || 'n.'}
        </span>
        <p className="text-base font-bold text-emerald-400 mt-2">
          {currentWord.zh}
        </p>
      </div>

      {/* 播放控制介面 */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={() => setAudioPlaying(!audioPlaying)}
          className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white shadow-lg transition-transform active:scale-95 ${
            audioPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          {audioPlaying ? '⏸' : '▶'}
        </button>
      </div>

      <button
        onClick={returnToDashboard}
        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-2xl text-xs transition-colors"
      >
        退出聽音模式
      </button>
    </div>
  );
};
