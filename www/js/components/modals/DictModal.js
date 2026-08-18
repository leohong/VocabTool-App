// ==========================================
// --- 🪟 DictModal 元件 ---
// ==========================================
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
  currentDay,
  wordsPerDay
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
                        {(() => {
                          const safeWPD = Math.max(1, parseInt(wordsPerDay, 10) || 50);
                          const start = ((currentDay || 1) - 1) * safeWPD + 1;
                          const end = (currentDay || 1) * safeWPD;
                          return `目前學習範圍 (第 ${start}~${end} 字)`;
                        })()}
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
