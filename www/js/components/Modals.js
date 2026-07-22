// ==========================================
// --- 🪟 各類彈窗 Modals 元件庫 ---
// ==========================================

// --- 1. 聽音特訓設定 Modal ---
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
                    onChange={(e) => setAudioStartIdx(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-indigo-300"
                  />
                  <span className="text-slate-400">到:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalSourceWords}
                    value={audioEndIdx}
                    onChange={(e) => setAudioEndIdx(Math.min(totalSourceWords, Math.max(1, parseInt(e.target.value, 10) || 1)))}
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
                  value={audioSettings.repeats || 2}
                  onChange={(e) => updateSetting('repeats', parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1 focus:outline-none font-mono"
                >
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 次</option>)}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">字間停頓時間：</span>
                <select
                  value={audioSettings.wordPause || 1.5}
                  onChange={(e) => updateSetting('wordPause', parseFloat(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1 focus:outline-none font-mono"
                >
                  {[0, 0.5, 1, 1.5, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 秒</option>)}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">字母拼讀停頓：</span>
                <select
                  value={audioSettings.spellingPause || 0}
                  onChange={(e) => updateSetting('spellingPause', parseFloat(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1 focus:outline-none font-mono"
                >
                  {[0, 0.1, 0.2, 0.3, 0.5, 0.8, 1].map(n => <option key={n} value={n}>{n} 秒</option>)}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-300">播放音量 (0~100)：</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={audioSettings.volume ?? 80}
                  onChange={(e) => updateSetting('volume', parseInt(e.target.value, 10))}
                  className="w-24 accent-indigo-500 bg-slate-950"
                />
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

          {/* 4. 語音引擎配對 (Web Speech Only) */}
          {voices.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                4. 瀏覽器發音引擎 (TTS Engine)：
              </label>
              <div className="space-y-2.5 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">英文朗讀 (English Voice)：</label>
                  <select
                    value={audioSettings.enVoiceName || ''}
                    onChange={(e) => updateSetting('enVoiceName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="">預設系統英文語音</option>
                    {voices.filter(v => v.lang.startsWith('en')).map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">中文釋義 (Chinese Voice)：</label>
                  <select
                    value={audioSettings.zhVoiceName || ''}
                    onChange={(e) => updateSetting('zhVoiceName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="">預設系統中文語音</option>
                    {voices.filter(v => v.lang.startsWith('zh') || v.lang.startsWith('cmn')).map(v => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-5 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-3xl">
          <button
            type="button"
            onClick={() => setShowAudioSetupModal(false)}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={startAudioSession}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md transition-colors"
          >
            🚀 開始聽讀特訓
          </button>
        </div>

      </div>
    </div>
  );
};


// --- 2. 本日單字預覽 Modal ---
window.PreviewModal = ({
  showPreviewModal,
  setShowPreviewModal,
  dbName,
  getDailyWords,
  speak,
  startEditing,
  handleDeleteWord,
  vocabList
}) => {
  if (!showPreviewModal) return null;
  const { baseWords = [] } = getDailyWords();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[80vh] border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100">本日學習單字預覽</h3>
            <p className="text-xs text-slate-400 mt-0.5">資料庫：{dbName} • 共有 {baseWords.length} 個新字</p>
          </div>
          <button onClick={() => setShowPreviewModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {baseWords.length === 0 ? (
            <div className="text-center py-12 text-slate-500">此天數目前沒有單字。</div>
          ) : (
            baseWords.map((word, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/60 gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => speak(word.en, true)}
                    className="p-2 bg-slate-800 text-indigo-400 rounded-lg border border-slate-700 flex-shrink-0"
                  >
                    <IconVolume />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold font-mono text-base text-slate-200 truncate">{word.en}</span>
                      <span className="text-xs text-indigo-400 font-mono">({word.pos})</span>
                    </div>
                    <span className="text-sm text-slate-400 break-words">{word.zh}</span>
                    {word.eg && <div className="text-xs text-slate-500 italic mt-1 font-sans break-words">{word.eg}</div>}
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(vocabList.findIndex(w => w.en.trim().toLowerCase() === word.en.trim().toLowerCase()))}
                    className="p-1.5 bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded border border-slate-700 text-xs"
                    title="編輯"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteWord(vocabList.findIndex(w => w.en.trim().toLowerCase() === word.en.trim().toLowerCase()), word)}
                    className="p-1.5 bg-slate-800 text-rose-400 hover:text-rose-300 rounded border border-slate-700 text-xs"
                    title="刪除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};


// --- 3. 當前錯題集中營 Modal ---
window.MistakeModal = ({
  showMistakeModal,
  setShowMistakeModal,
  activeMistakesList,
  speak,
  vocabList,
  startEditing,
  handleDeleteWord,
  setState
}) => {
  if (!showMistakeModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100">當前錯題集中營</h3>
            <p className="text-xs text-slate-400 mt-0.5">需連續答對 (錯誤數 × 2) 次方可晉升歷史殿堂。</p>
          </div>
          <button onClick={() => setShowMistakeModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {activeMistakesList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">目前沒有弱點負債，大腦狀態極佳！🎉</div>
          ) : (
            activeMistakesList.sort((a, b) => b.mistakesCount - a.mistakesCount).map((item) => {
              const target = Math.min(item.mistakesCount * 2, 6);
              const current = item.correctCount || 0;
              const progress = Math.min((current / target) * 100, 100);
              const vocabIndex = vocabList.findIndex(w => w.en.trim().toLowerCase() === item.data.en.trim().toLowerCase());
              return (
                <div key={item.data.en} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/60 gap-4 group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => speak(item.data.en, true)}
                      className="p-2 bg-slate-800 text-indigo-400 rounded-lg border border-slate-700 flex-shrink-0"
                    >
                      <IconVolume />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold font-mono text-lg text-slate-200 truncate">{item.data.en}</span>
                        <span className="text-xs text-indigo-400 font-mono">({item.data.pos})</span>
                      </div>
                      <span className="text-sm text-slate-400 break-words">{item.data.zh}</span>
                      {item.data.eg && <div className="text-xs text-slate-500 italic mt-1 font-sans break-words">{item.data.eg}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex flex-col gap-1 w-32 sm:w-36 flex-shrink-0">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-red-400">總失誤: {item.mistakesCount}</span>
                        <span className="text-emerald-400">連對: {current} / {target}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                        <div className="bg-emerald-500 h-2 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (vocabIndex !== -1) {
                            startEditing(vocabIndex);
                          } else {
                            alert('此單字不在目前字庫中，無法編輯。如需編輯，請先將此單字新增至字庫。');
                          }
                        }}
                        className={`p-1.5 rounded border text-xs transition-colors ${
                          vocabIndex !== -1 
                            ? 'bg-slate-800 text-indigo-400 hover:text-indigo-300 border-slate-700' 
                            : 'bg-slate-800/40 text-slate-600 border-slate-800/20 cursor-not-allowed'
                        }`}
                        title={vocabIndex !== -1 ? "編輯" : "此單字不在目前字庫中，無法編輯"}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (vocabIndex !== -1) {
                            handleDeleteWord(vocabIndex);
                          } else {
                            if (window.confirm(`此單字已不在目前字庫中，確定要單獨將其從「當前錯題集中營」中移除嗎？`)) {
                              setState(prev => {
                                const nextState = { ...prev };
                                nextState.mistakes = { ...prev.mistakes };
                                delete nextState.mistakes[item.data.en];
                                return nextState;
                              });
                            }
                          }
                        }}
                        className="p-1.5 bg-slate-800 text-rose-400 hover:text-rose-300 rounded border border-slate-700 text-xs"
                        title="刪除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};


// --- 4. 歷史殿堂 Modal ---
window.HistoryModal = ({
  showHistoryModal,
  setShowHistoryModal,
  historyTotal,
  historicalMistakes,
  speak
}) => {
  if (!showHistoryModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-amber-400">歷史殿堂</h3>
            <p className="text-xs text-slate-400 mt-0.5">系統將依照冷卻時間 (7/21/60/180天) 發動突襲抽查。</p>
          </div>
          <button onClick={() => setShowHistoryModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {historyTotal === 0 ? (
            <div className="text-center py-12 text-slate-500">歷史殿堂尚無單字。</div>
          ) : (
            Object.values(historicalMistakes).sort((a, b) => b.totalFails - a.totalFails).map((item) => {
              const nextDate = new Date(item.archivedDate + item.interval * 24 * 60 * 60 * 1000);
              return (
                <div key={item.data.en} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/60 gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => speak(item.data.en, true)}
                      className="p-2 bg-slate-800 text-indigo-400 rounded-lg border border-slate-700"
                    >
                      <IconVolume />
                    </button>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold font-mono text-lg text-amber-100">{item.data.en}</span>
                        <span className="text-xs text-indigo-400 font-mono">({item.data.pos})</span>
                      </div>
                      <span className="text-sm text-slate-400">{item.data.zh}</span>
                      {item.data.eg && <div className="text-xs text-slate-500 italic mt-1 font-sans">{item.data.eg}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 w-full sm:w-48 flex-shrink-0 text-right">
                    <span className="text-xs font-mono text-slate-500">魔王等級 (失誤): {item.totalFails} 次</span>
                    {item.immune ? (
                      <span className="text-xs font-bold text-emerald-400">🛡️ 永久免疫</span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        下次突襲: <span className="text-amber-400">{nextDate.toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};


// --- 5. 查字典與手動加字 Modal ---
window.DictModal = ({
  showDictModal,
  setShowDictModal,
  isDictHintMode,
  dictMaskWord,
  searchQuery,
  setSearchQuery,
  speak,
  handleSearch,
  searchLoading,
  searchError,
  localMatches,
  dbName,
  dictResults,
  setFormEn,
  setFormPos,
  setFormZh,
  setFormEg,
  formEn,
  formPos,
  formZh,
  formEg,
  insertPosition,
  setInsertPosition,
  handleAddWord,
  currentDay
}) => {
  if (!showDictModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              {isDictHintMode ? '💡 查字典提示 (單字拼寫已隱藏)' : '📖 查字典與手動加字'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDictHintMode ? '檢視英文定義與例句提示，助您拼寫記憶！' : `查詢線上字典並新增單字至目前字庫：${dbName}`}
            </p>
          </div>
          <button onClick={() => setShowDictModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Search bar */}
          {!isDictHintMode && (
            <form onSubmit={handleSearch} className="flex gap-2 w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="請輸入英文單字進行查詢..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-indigo-300"
                />
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => speak(searchQuery.trim(), true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors text-sm"
                    title="直接發音"
                  >
                    🔊
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors shrink-0"
              >
                {searchLoading ? '查詢中...' : '查詢'}
              </button>
            </form>
          )}

          {/* Loading / Error / Local Matches */}
          {searchLoading && (
            <div className="text-center py-8 text-indigo-400 flex flex-col items-center gap-2">
              <svg className="animate-spin h-8 w-8 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">正在取得線上釋義與翻譯...</span>
            </div>
          )}

          {searchError && (
            <div className="bg-slate-900/50 border border-slate-700/60 p-4 rounded-xl text-center space-y-2">
              <p className="text-sm text-slate-400">{searchError}</p>
              <a
                href={`https://dictionary.cambridge.org/dictionary/english-chinese-traditional/${encodeURIComponent(searchQuery || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-slate-700 hover:bg-slate-600 text-xs text-indigo-300 hover:text-indigo-200 rounded-lg transition-colors font-medium"
              >
                🌐 開啟劍橋辭典網頁版查詢
              </a>
            </div>
          )}

          {localMatches && localMatches.length > 0 && !isDictHintMode && (
            <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl space-y-1">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">⚠️ 本地已存在檢查警告：</span>
              {localMatches.map((m, i) => (
                <div key={i} className="text-xs text-slate-400 font-mono pl-5">
                  單字 <span className="text-amber-200 font-bold">{m.word.en}</span> 已存在於字庫 <span className="text-indigo-400 font-bold">[{m.db}]</span> 中（第 {m.day} 天，詞性: {m.word.pos}，中文: {m.word.zh}）。
                </div>
              ))}
            </div>
          )}

          {/* Results List */}
          {dictResults && dictResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {isDictHintMode ? '線上字典定義與例句提示' : `線上字典與翻譯查詢結果 (${dictResults.length})`}
              </h4>
              <div className="grid grid-cols-1 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {dictResults.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/40 border border-slate-700/50 p-4 rounded-xl flex justify-between items-start gap-4 hover:border-indigo-500/40 transition-colors">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-base text-slate-200">
                          {isDictHintMode ? '______' : item.word}
                        </span>
                        {!isDictHintMode && (
                          <button
                            type="button"
                            onClick={() => speak(item.word, true)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors text-xs flex items-center gap-1 shrink-0"
                            title="發音"
                          >
                            🔊
                          </button>
                        )}
                        <span className="text-xs text-indigo-400 font-mono">({item.pos})</span>
                      </div>
                      {item.enDef && (
                        <p className="text-xs text-slate-400 italic break-words">
                          Definition: {isDictHintMode ? maskText(item.enDef, dictMaskWord) : item.enDef}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-indigo-300 break-words">中文預填: {item.zh}</p>
                      {item.eg && (
                        <p className="text-xs text-slate-500 italic break-words border-l-2 border-slate-700 pl-2 mt-1">
                          {isDictHintMode ? maskText(item.eg, dictMaskWord) : item.eg}
                        </p>
                      )}
                    </div>
                    {!isDictHintMode && (
                      <button
                        onClick={() => {
                          setFormEn(item.word);
                          setFormPos(item.pos);
                          setFormZh(item.zh);
                          setFormEg(item.eg);
                        }}
                        className="py-1.5 px-3 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-xs font-bold text-indigo-300 rounded-lg hover:text-indigo-200 transition-colors flex-shrink-0"
                      >
                        帶入此定義
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isDictHintMode && (
            <>
              <div className="h-px bg-slate-700/50"></div>

              {/* Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">手動填寫/修改單字表單</h4>
                <form onSubmit={handleAddWord} className="space-y-4 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-400 font-medium">英文單字 <span className="text-rose-500">*</span></label>
                        {formEn && (
                          <button
                            type="button"
                            onClick={() => speak(formEn, true)}
                            className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold flex items-center gap-0.5"
                            title="發音"
                          >
                            🔊 聽發音
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        value={formEn}
                        onChange={(e) => setFormEn(e.target.value.trim())}
                        placeholder="例如: challenge"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium">詞性 (pos) <span className="text-rose-500">*</span></label>
                      <div className="flex gap-1.5">
                        <select
                          value={['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'art.', 'idiom'].includes(formPos) ? formPos : 'custom'}
                          onChange={(e) => {
                            if (e.target.value !== 'custom') setFormPos(e.target.value);
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                        >
                          <option value="n.">n. 名詞</option>
                          <option value="v.">v. 動詞</option>
                          <option value="adj.">adj. 形容詞</option>
                          <option value="adv.">adv. 副詞</option>
                          <option value="prep.">prep. 介係詞</option>
                          <option value="conj.">conj. 連接詞</option>
                          <option value="pron.">pron. 代名詞</option>
                          <option value="art.">art. 冠詞</option>
                          <option value="idiom">idiom 片語</option>
                          <option value="custom">自訂...</option>
                        </select>
                        <input
                          type="text"
                          required
                          value={formPos}
                          onChange={(e) => setFormPos(e.target.value)}
                          placeholder="詞性"
                          className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-200 text-center"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400 font-medium">中文解釋 <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formZh}
                        onChange={(e) => setFormZh(e.target.value)}
                        placeholder="例如: 挑戰，難題"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">最常使用的例句 (選填，格式：English (中文翻譯))</label>
                    <textarea
                      rows="2"
                      value={formEg}
                      onChange={(e) => setFormEg(e.target.value)}
                      placeholder="例如: It is a big challenge. (這是一個巨大的挑戰。)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-sans text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-400">新增位置：</span>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="insertPosition"
                          value="current"
                          checked={insertPosition === 'current'}
                          onChange={() => setInsertPosition('current')}
                          className="accent-indigo-500"
                        />
                        目前天數 (第 {currentDay} 天)
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="insertPosition"
                          value="end"
                          checked={insertPosition === 'end'}
                          onChange={() => setInsertPosition('end')}
                          className="accent-indigo-500"
                        />
                        字庫最末端
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto py-2.5 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                    >
                      新增單字
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


// --- 6. 全字庫單字預覽 Modal ---
window.AllPreviewModal = ({
  showAllPreviewModal,
  setShowAllPreviewModal,
  dbName,
  vocabList,
  allSearchQuery,
  setAllSearchQuery,
  setAllPage,
  allPage,
  itemsPerPage,
  getFilteredVocab,
  speak,
  startEditing,
  handleDeleteWord
}) => {
  if (!showAllPreviewModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100">🗂️ 全字庫單字預覽</h3>
            <p className="text-xs text-slate-400 mt-0.5">目前字庫：{dbName} • 總共 {vocabList.length} 個單字</p>
          </div>
          <button onClick={() => setShowAllPreviewModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        {/* Filter and Search */}
        <div className="p-4 border-b border-slate-700/50 flex gap-2">
          <input
            type="text"
            value={allSearchQuery}
            onChange={(e) => { setAllSearchQuery(e.target.value); setAllPage(1); }}
            placeholder="輸入關鍵字篩選單字、詞性或釋義..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono text-indigo-300"
          />
        </div>

        {/* List Container */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2 font-sans">
          {(() => {
            const filtered = getFilteredVocab();
            if (filtered.length === 0) {
              return <div className="text-center py-12 text-slate-500">無符合篩選條件的單字。</div>;
            }
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            const currentPage = Math.min(allPage, totalPages);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

            return (
              <>
                <div className="space-y-2">
                  {paginated.map((word) => (
                    <div key={word.originalIdx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/60 gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => speak(word.en, true)}
                          className="p-2 bg-slate-800 text-indigo-400 rounded-lg border border-slate-700 flex-shrink-0"
                        >
                          <IconVolume />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold font-mono text-base text-slate-200 truncate">{word.en}</span>
                            <span className="text-xs text-indigo-400 font-mono">({word.pos})</span>
                            <span className="text-[10px] text-slate-500">#{word.originalIdx + 1}</span>
                          </div>
                          <span className="text-sm text-slate-400 break-words">{word.zh}</span>
                          {word.eg && <div className="text-xs text-slate-500 italic mt-1 font-sans break-words">{word.eg}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(word.originalIdx)}
                          className="p-1.5 bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded border border-slate-700 text-xs"
                          title="編輯"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteWord(word.originalIdx)}
                          className="p-1.5 bg-slate-800 text-rose-400 hover:text-rose-300 rounded border border-slate-700 text-xs"
                          title="刪除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Navigation */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center pt-4 text-xs font-mono">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setAllPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded"
                    >
                      ◀ 上一頁
                    </button>
                    <span className="text-slate-400 font-sans">第 {currentPage} / {totalPages} 頁 (共 {filtered.length} 字)</span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setAllPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded"
                    >
                      下一頁 ▶
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};


// --- 7. 編輯單字 Modal ---
window.EditWordModal = ({
  editingIndex,
  setEditingIndex,
  editEn,
  setEditEn,
  editPos,
  setEditPos,
  editZh,
  setEditZh,
  editEg,
  setEditEg,
  speak,
  handleSaveEdit
}) => {
  if (editingIndex === -1) return null;

  return (
    <div style={{ zIndex: 100 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-indigo-400">✏️ 編輯單字資訊</h3>
          <button onClick={() => setEditingIndex(-1)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>
        <form onSubmit={handleSaveEdit} className="p-6 space-y-4 font-sans">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">英文單字 *</label>
              {editEn && (
                <button
                  type="button"
                  onClick={() => speak(editEn, true)}
                  className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold flex items-center gap-0.5"
                  title="發音"
                >
                  🔊 聽發音
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={editEn}
              onChange={(e) => setEditEn(e.target.value.trim())}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">詞性 (pos) *</label>
            <div className="flex gap-1.5">
              <select
                value={['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'art.', 'idiom'].includes(editPos) ? editPos : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') setEditPos(e.target.value);
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
              >
                <option value="n.">n. 名詞</option>
                <option value="v.">v. 動詞</option>
                <option value="adj.">adj. 形容詞</option>
                <option value="adv.">adv. 副詞</option>
                <option value="prep.">prep. 介係詞</option>
                <option value="conj.">conj. 連接詞</option>
                <option value="pron.">pron. 代名詞</option>
                <option value="art.">art. 冠詞</option>
                <option value="idiom">idiom 片語</option>
                <option value="custom">自訂...</option>
              </select>
              <input
                type="text"
                required
                value={editPos}
                onChange={(e) => setEditPos(e.target.value)}
                className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-200 text-center"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">中文解釋 *</label>
            <input
              type="text"
              required
              value={editZh}
              onChange={(e) => setEditZh(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">例句 (格式：English (中文翻譯))</label>
            <textarea
              rows="2"
              value={editEg}
              onChange={(e) => setEditEg(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-sans text-slate-200"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingIndex(-1)}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-bold transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors shadow-md"
            >
              儲存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
