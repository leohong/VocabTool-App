// ==========================================
// --- 🪟 EditWordModal 元件 ---
// ==========================================
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

// --- 9. 選擇匯入來源 Modal (ImportOptionsModal) ---
