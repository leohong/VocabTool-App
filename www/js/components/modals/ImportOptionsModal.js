// ==========================================
// --- 🪟 ImportOptionsModal 元件 ---
// ==========================================
window.ImportOptionsModal = ({
  showImportOptionsModal,
  setShowImportOptionsModal,
  loadBuiltInVocab,
  handleImportTXT
}) => {
  const fileInputRef = React.useRef(null);
  if (!showImportOptionsModal) return null;

  const onLocalFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700/80 w-full max-w-sm rounded-3xl shadow-2xl p-6 relative overflow-hidden animate-[fadeIn_0.2s_ease-in-out]">
        {/* 背景裝飾微光 */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>
        
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2 relative z-10">
          📥 選擇匯入來源
        </h3>
        
        <div className="flex flex-col gap-3 relative z-10">
          <button
            onClick={() => {
              loadBuiltInVocab('2000');
              setShowImportOptionsModal(false);
            }}
            className="w-full py-3 px-4 bg-slate-700/40 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-800 rounded-2xl flex items-center gap-3 transition-all group text-left"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform select-none">🎒</span>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-slate-100">載入內建 2000 單字庫</div>
              <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">系統內建，標準 8 週特訓單字</div>
            </div>
          </button>

          <button
            onClick={() => {
              loadBuiltInVocab('7000');
              setShowImportOptionsModal(false);
            }}
            className="w-full py-3 px-4 bg-slate-700/40 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-800 rounded-2xl flex items-center gap-3 transition-all group text-left"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform select-none">🎓</span>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-slate-100">載入內建 7000 單字庫</div>
              <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">系統內建，進階完整挑戰單字</div>
            </div>
          </button>

          <button
            onClick={onLocalFileClick}
            className="w-full py-3 px-4 bg-slate-700/40 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-800 rounded-2xl flex items-center gap-3 transition-all group text-left"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform select-none">📁</span>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-slate-100">從本機選擇檔案 (.txt)</div>
              <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">選取裝置中的單字庫 TXT 檔案</div>
            </div>
          </button>
        </div>

        {/* 隱藏的實際檔案選擇器 */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".txt" 
          onChange={(e) => {
            handleImportTXT(e);
            setShowImportOptionsModal(false);
          }} 
          className="hidden" 
        />

        <button
          onClick={() => setShowImportOptionsModal(false)}
          className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-slate-400 hover:text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
};

// --- 10. 開源軟體授權宣告 Modal ---
