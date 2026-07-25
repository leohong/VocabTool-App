// ==========================================
// --- 🪟 HistoryModal 元件 ---
// ==========================================
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
