// ==========================================
// --- 🎉 第三階段：任務完成 (SummarySession Component) ---
// ==========================================
window.SummarySession = ({
  sessionType,
  goToNextDay
}) => {
  return (
    <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center animate-[fadeIn_0.5s_ease-in-out] space-y-6 w-full">
      <div className="w-20 h-20 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-800">
        <IconCheck />
      </div>
      <h2 className="text-3xl font-black text-slate-100">特訓完美結束！</h2>
      <p className="text-slate-400 text-base">高壓輸出完成，記憶鏈結已加深。</p>
      <div className="pt-4">
        <button
          onClick={goToNextDay}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          {sessionType === 'daily' ? '打卡存檔，前往下一批單字' : '回到指揮中心'}
        </button>
      </div>
    </div>
  );
};
