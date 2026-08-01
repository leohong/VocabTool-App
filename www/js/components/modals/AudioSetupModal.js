// ==========================================
// --- 🪟 AudioSetupModal 元件 ---
// ==========================================
window.AudioSetupModal = ({
  showAudioSetupModal,
  setShowAudioSetupModal,
  audioSource,
  setAudioSource,
  audioRange,
  setAudioRange,
  audioStartIdx,
  setAudioStartIdx,
  audioEndIdx,
  setAudioEndIdx,
  vocabList,
  activeMistakesList,
  historicalMistakes,
  itemsPerPage,
  allPage,
  audioSettings,
  setAudioSettings,
  voices,
  startAudioSession,
  speechRate
}) => {
  if (!showAudioSetupModal) return null;

  const totalLibraryCount = vocabList ? vocabList.length : 0;
  const totalMistakesCount = activeMistakesList ? activeMistakesList.length : 0;
  const totalHistoryCount = historicalMistakes ? Object.keys(historicalMistakes).length : 0;

  // 取得目前來源總字數
  let totalSourceWords = 0;
  if (audioSource === 'daily') {
    // 每日進度包含今日新字與幽靈
    totalSourceWords = 50; 
  } else if (audioSource === 'mistakes') {
    totalSourceWords = totalMistakesCount;
  } else if (audioSource === 'history') {
    totalSourceWords = totalHistoryCount;
  } else if (audioSource === 'library') {
    totalSourceWords = totalLibraryCount;
  }

  // 取得當前頁數範圍字數 (全字庫)
  const getPageRangeText = () => {
    if (audioSource === 'library') {
      const start = (allPage - 1) * itemsPerPage + 1;
      const end = Math.min(allPage * itemsPerPage, totalLibraryCount);
      return `目前頁面 (#${start} ~ #${end})`;
    }
    return '目前分頁 (前 50 字)';
  };

  const updateSetting = (key, value) => {
    setAudioSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out] font-sans">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              🎧 聽寫背單字特訓設定
            </h3>
            <p className="text-xs text-slate-400 mt-1">規劃您的語音播放特訓排程。</p>
          </div>
          <button onClick={() => setShowAudioSetupModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* 1. 音訊來源 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. 選擇播放音訊來源：</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setAudioSource('daily'); setAudioRange('all'); }}
                className={`py-3 px-4 rounded-xl border font-bold text-center transition-all ${
                  audioSource === 'daily' 
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-850'
                }`}
              >
                📅 今日學習進度
              </button>
              <button
                type="button"
                onClick={() => { setAudioSource('mistakes'); setAudioRange('all'); }}
                className={`py-3 px-4 rounded-xl border font-bold text-center transition-all ${
                  audioSource === 'mistakes' 
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-850'
                }`}
              >
                🔥 錯題集中營 ({totalMistakesCount})
              </button>
              <button
                type="button"
                onClick={() => { setAudioSource('history'); setAudioRange('all'); }}
                className={`py-3 px-4 rounded-xl border font-bold text-center transition-all ${
                  audioSource === 'history' 
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-850'
                }`}
              >
                🏛️ 歷史殿堂 ({totalHistoryCount})
              </button>
              <button
                type="button"
                onClick={() => { setAudioSource('library'); setAudioRange('all'); }}
                className={`py-3 px-4 rounded-xl border font-bold text-center transition-all ${
                  audioSource === 'library' 
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-850'
                }`}
              >
                🗄️ 系統完整字庫 ({totalLibraryCount})
              </button>
            </div>
          </div>

          {/* 2. 播放範圍 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">2. 播放範圍選取：</label>
            <div className="space-y-2 bg-slate-900/50 p-3 rounded-2xl border border-slate-700/50">
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
                  <input
                    type="radio"
                    name="audioRange"
                    value="all"
                    checked={audioRange === 'all'}
                    onChange={() => setAudioRange('all')}
                    className="accent-indigo-500"
                  />
                  全部單字
                </label>
                {audioSource !== 'daily' && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
                    <input
                      type="radio"
                      name="audioRange"
                      value="page"
                      checked={audioRange === 'page'}
                      onChange={() => setAudioRange('page')}
                      className="accent-indigo-500"
                    />
                    {getPageRangeText()}
                  </label>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
                  <input
                    type="radio"
                    name="audioRange"
                    value="custom"
                    checked={audioRange === 'custom'}
                    onChange={() => setAudioRange('custom')}
                    className="accent-indigo-500"
                  />
                  自訂編號範圍
                </label>
              </div>

              {audioRange === 'custom' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 animate-[fadeIn_0.15s_ease-in-out]">
                  <span className="text-slate-400">範圍自:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalSourceWords}
                    value={audioStartIdx}
                    onChange={(e) => setAudioStartIdx(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    onBlur={(e) => setAudioStartIdx(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-indigo-300"
                  />
                  <span className="text-slate-400">到:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalSourceWords}
                    value={audioEndIdx}
                    onChange={(e) => setAudioEndIdx(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    onBlur={(e) => setAudioEndIdx(Math.min(totalSourceWords, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-indigo-300"
                  />
                  <span className="text-slate-500 text-xs">/ 共 {totalSourceWords} 字</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. 唸讀細節設定 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">3. 語音唸讀細節配置：</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">單字朗讀次數：</span>
                <select
                  value={audioSettings.repeats || 1}
                  onChange={(e) => updateSetting('repeats', parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1 focus:outline-none font-mono"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 次</option>)}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">字母拼讀速度：</span>
                <select
                  value={audioSettings.spellingRateMultiplier ?? 1.8}
                  onChange={(e) => updateSetting('spellingRateMultiplier', parseFloat(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1 focus:outline-none font-mono"
                >
                  <option value={1.0}>1.0 倍</option>
                  <option value={1.5}>1.5 倍</option>
                  <option value={1.8}>1.8 倍 (預設)</option>
                  <option value={2.0}>2.0 倍</option>
                </select>
              </div>

              <div className="flex items-center justify-between col-span-1 sm:col-span-2 border-t border-slate-800/80 pt-2.5">
                <span className="text-slate-300">例句朗讀語音：</span>
                <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audioSettings.readExample || false}
                    onChange={(e) => updateSetting('readExample', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                  />
                  開啟 (例句中文發音將跳過)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-700 grid grid-cols-2 gap-3 bg-slate-800/50 rounded-b-3xl">
          <button
            type="button"
            onClick={() => setShowAudioSetupModal(false)}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-colors text-center"
          >
            取消
          </button>
          <button
            type="button"
            onClick={startAudioSession}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md transition-colors text-center"
          >
            🚀 開始
          </button>
        </div>

      </div>
    </div>
  );
};


// --- 2. 本日單字預覽 Modal ---
