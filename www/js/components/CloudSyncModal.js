// ==========================================
// --- ☁️ 雲端同步設定 Modal ---
// ==========================================
window.CloudSyncModal = ({
  showCloudSyncModal,
  setShowCloudSyncModal,
  cloudInputKey,
  setCloudInputKey,
  cloudSyncStatus,
  lastSyncTime,
  cloudSyncKey,
  setCloudSyncKey,
  performCloudPull,
  performCloudPush
}) => {
  if (!showCloudSyncModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl flex flex-col border border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              ☁️ 跨裝置雲端同步設定
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              設定個人同步金鑰後，您的手機與電腦將自動雙向即時同步學習進度。
            </p>
          </div>
          <button onClick={() => setShowCloudSyncModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              🔑 個人雲端同步金鑰 (Sync Key)：
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cloudInputKey}
                onChange={(e) => setCloudInputKey(e.target.value)}
                placeholder="例如: leohong-vocab-2026"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  const randomKey = 'user_' + Math.random().toString(36).substring(2, 10);
                  setCloudInputKey(randomKey);
                }}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                🎲 隨機金鑰
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              💡 只要在其他手機/電腦的 App 中填入完全相同的金鑰，即可同步同一個單字庫與學習數據。
            </p>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>當前連線狀態：</span>
              <span className={`font-bold ${
                cloudSyncStatus === 'synced' ? 'text-emerald-400' :
                cloudSyncStatus === 'syncing' ? 'text-indigo-400 animate-pulse' :
                cloudSyncStatus === 'offline' ? 'text-rose-400' : 'text-slate-500'
              }`}>
                {cloudSyncStatus === 'synced' ? '🟢 雲端已連線 (已同步)' :
                 cloudSyncStatus === 'syncing' ? '🔄 雲端傳輸中...' :
                 cloudSyncStatus === 'offline' ? '🔴 離線 / 網路不穩定' : '⚪ 未設定同步金鑰'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>上次成功同步時間：</span>
              <span className="font-mono text-slate-300">{lastSyncTime || '尚未同步'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (!cloudInputKey.trim()) {
                  alert('請輸入金鑰！');
                  return;
                }
                localStorage.setItem('vocab_cloudSyncKey', cloudInputKey.trim());
                setCloudSyncKey(cloudInputKey.trim());
                const success = await performCloudPull(cloudInputKey.trim());
                if (success) {
                  alert('已成功從雲端下載並同步最新進度！');
                } else {
                  await performCloudPush(cloudInputKey.trim());
                  alert('已設定同步金鑰並將本地進度推送至雲端！');
                }
                setShowCloudSyncModal(false);
              }}
              className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md col-span-2"
            >
              💾 儲存金鑰並立刻雙向同步
            </button>
            <button
              type="button"
              onClick={async () => {
                await performCloudPull();
                alert('已強制從雲端重新載入進度！');
              }}
              disabled={!cloudSyncKey}
              className="py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-indigo-300 rounded-xl text-xs font-bold transition-colors"
            >
              ⬇️ 強制從雲端下載
            </button>
            <button
              type="button"
              onClick={async () => {
                await performCloudPush();
                alert('已強制將本地進度推送到雲端！');
              }}
              disabled={!cloudSyncKey}
              className="py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-emerald-300 rounded-xl text-xs font-bold transition-colors"
            >
              ⬆️ 強制推送至雲端
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
