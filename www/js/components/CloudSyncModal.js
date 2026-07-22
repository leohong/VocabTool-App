// ==========================================
// --- ☁️ 雲端同步設定 Modal (含 Google Drive 同步) ---
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
  performCloudPush,
  gdriveUser,
  handleGoogleLogin,
  handleGoogleSyncUpload,
  handleGoogleSyncDownload
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
              支援 Google 帳號授權同步 (Google Drive AppData) 或自訂同步金鑰。
            </p>
          </div>
          <button onClick={() => setShowCloudSyncModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* --- 🔵 方案一：Google 帳號一鍵同步 --- */}
          <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 p-4 rounded-2xl border border-blue-800/40 space-y-3">
            <span className="text-xs font-bold text-blue-300 block">
              🔵 方案一：Google 帳號授權同步 (推薦)
            </span>
            
            {gdriveUser ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-blue-900/40 p-2.5 rounded-xl border border-blue-700/50">
                  <span className="text-slate-300">已連線 Google 帳號：</span>
                  <span className="font-bold text-blue-300 font-mono truncate max-w-[180px]">{gdriveUser}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSyncDownload}
                    className="py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    ⬇️ 從 Google Drive 下載
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleSyncUpload}
                    className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    ⬆️ 備份至 Google Drive
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  使用 Google 帳號登入並同步
                </button>
                <p className="text-[10px] text-blue-300/70 mt-1.5 text-center">
                  🔒 備份檔將儲存於個人 Google Drive 專屬 AppData 隱藏區，保護隱私不佔用主目錄空間。
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-700/50 my-1"></div>

          {/* --- 🔑 方案二：自訂同步金鑰 --- */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              🔑 方案二：個人自訂同步金鑰 (Sync Key)：
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
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>當前連線狀態：</span>
              <span className={`font-bold ${
                cloudSyncStatus === 'synced' ? 'text-emerald-400' :
                cloudSyncStatus === 'syncing' ? 'text-indigo-400 animate-pulse' :
                cloudSyncStatus === 'offline' ? 'text-rose-400' : 'text-slate-500'
              }`}>
                {cloudSyncStatus === 'synced' ? '🟢 雲端已同步' :
                 cloudSyncStatus === 'syncing' ? '🔄 傳輸中...' :
                 cloudSyncStatus === 'offline' ? '🔴 離線 / 網路問題' : '⚪ 未設定同步'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>上次成功同步時間：</span>
              <span className="font-mono text-slate-300">{lastSyncTime || '尚未同步'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
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
              💾 儲存金鑰並雙向同步
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
              ⬇️ 從金鑰雲端下載
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
              ⬆️ 推送至金鑰雲端
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
