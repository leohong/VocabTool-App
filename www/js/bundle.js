
// --- File: www/js/data/vocabData.js ---
// ==========================================
// --- 📚 單字資料庫預設資料與遮罩常數 ---
// ==========================================

window.rawVocab = [
  { en: 'system', zh: '系統 (範例字)', pos: 'n.' },
  { en: 'acknowledgement', zh: '承認/確認 (範例字)', pos: 'n.' }
];

window.mapPos = (pos) => {
  if (!pos) return 'n.';
  const p = pos.toLowerCase().trim();
  if (p.includes('noun')) return 'n.';
  if (p.includes('verb')) return 'v.';
  if (p.includes('adjective')) return 'adj.';
  if (p.includes('adverb')) return 'adv.';
  if (p.includes('preposition')) return 'prep.';
  if (p.includes('conjunction')) return 'conj.';
  if (p.includes('pronoun')) return 'pron.';
  if (p.includes('determiner')) return 'det.';
  if (p.includes('article')) return 'art.';
  if (p.includes('idiom')) return 'idiom';
  if (['n.', 'v.', 'adj.', 'adv.', 'prep.', 'conj.', 'pron.', 'det.', 'art.', 'phrase', 'abbr.'].includes(p)) return p;
  return 'n.';
};

window.sampleSentences = {
  "system": "The solar system contains eight planets. (太陽系包含八顆行星。)",
  "acknowledgement": "She sent a note of acknowledgement for the gift. (她寄了一張感謝信表示收到禮物。)"
};

window.maskText = (text, targetWord) => {
  if (!text || !targetWord) return text;
  const escapedTarget = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedTarget}\\b`, 'gi');
  return text.replace(regex, (match) => '＿'.repeat(match.length));
};

window.maskSentenceText = (eg, word) => {
  if (!eg) return '';
  const parts = eg.split(/\s*(\([^)]+\))\s*$/);
  const enPart = parts[0];
  const zhPart = parts[1] || '';
  
  const maskedEn = window.maskText(enPart, word);
  return zhPart ? `${maskedEn} ${zhPart}` : maskedEn;
};


// --- File: www/js/CloudSyncEngine.js ---
// ==========================================
// --- ☁️ 雲端同步模組 (Cloud Sync Engine) ---
// ==========================================
const CLOUD_SYNC_BASE_URL = 'https://vocabtool-sync-default-rtdb.firebaseio.com/users';

window.CloudSyncEngine = {
  buildPayload: (currentDb, dbList) => {
    const payload = {
      timestamp: Date.now(),
      version: "1.4.0",
      currentDB: currentDb,
      dbList: dbList,
      databases: {},
      settings: {
        speechRate: localStorage.getItem('vocab_speechRate') || '0.8',
        speechEnabled: localStorage.getItem('vocab_speechEnabled') || 'true',
        audioSettings: localStorage.getItem('vocab_audioSettings')
      }
    };

    dbList.forEach(db => {
      payload.databases[db] = {
        state: localStorage.getItem(`vocab_state_${db}`),
        vocab: localStorage.getItem(`vocab_customVocab_${db}`),
        wordsPerDay: localStorage.getItem(`vocab_wordsPerDay_${db}`),
        ghostsPerDay: localStorage.getItem(`vocab_ghostsPerDay_${db}`)
      };
    });

    return payload;
  },

  fetchCloudState: async (syncKey) => {
    if (!syncKey || !syncKey.trim()) return null;
    const cleanKey = encodeURIComponent(syncKey.trim().toLowerCase());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(`${CLOUD_SYNC_BASE_URL}/${cleanKey}.json`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('雲端回應錯誤');
      return await res.json();
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  },

  pushCloudState: async (syncKey, payload) => {
    if (!syncKey || !syncKey.trim()) return null;
    const cleanKey = encodeURIComponent(syncKey.trim().toLowerCase());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${CLOUD_SYNC_BASE_URL}/${cleanKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('雲端推送失敗');
      return await res.json();
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  },

  applyPayloadToLocal: (payload) => {
    if (!payload || !payload.databases) return false;

    if (payload.currentDB) localStorage.setItem('vocab_currentDB', payload.currentDB);
    if (payload.dbList) localStorage.setItem('vocab_dbList', JSON.stringify(payload.dbList));

    if (payload.settings) {
      if (payload.settings.speechRate) localStorage.setItem('vocab_speechRate', payload.settings.speechRate);
      if (payload.settings.speechEnabled) localStorage.setItem('vocab_speechEnabled', payload.settings.speechEnabled);
      if (payload.settings.audioSettings) localStorage.setItem('vocab_audioSettings', payload.settings.audioSettings);
    }

    Object.keys(payload.databases).forEach(db => {
      const dbData = payload.databases[db];
      if (dbData.state) localStorage.setItem(`vocab_state_${db}`, dbData.state);
      if (dbData.vocab) localStorage.setItem(`vocab_customVocab_${db}`, dbData.vocab);
      if (dbData.wordsPerDay) localStorage.setItem(`vocab_wordsPerDay_${db}`, dbData.wordsPerDay);
      if (dbData.ghostsPerDay) localStorage.setItem(`vocab_ghostsPerDay_${db}`, dbData.ghostsPerDay);
    });

    if (payload.timestamp) {
      localStorage.setItem('vocab_lastSyncTime', new Date(payload.timestamp).toLocaleString('zh-TW'));
      localStorage.setItem('vocab_lastSyncTimestamp', payload.timestamp.toString());
    }

    return true;
  }
};


// --- File: www/js/GoogleDriveSyncEngine.js ---
// ==========================================
// --- 🔵 Google Drive AppData 同步引擎 ---
// ==========================================

const GOOGLE_DRIVE_BACKUP_FILENAME = 'vocab_cloud_backup.json';
const GOOGLE_DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

window.GoogleDriveSyncEngine = {
  tokenClient: null,
  accessToken: localStorage.getItem('vocab_gdrive_token') || null,
  userEmail: localStorage.getItem('vocab_gdrive_email') || null,

  // 初始化 Google Identity Client
  init: (clientId, callback) => {
    if (typeof google === 'undefined' || !google.accounts) return;

    window.GoogleDriveSyncEngine.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId || '92837492834-vocabtool.apps.googleusercontent.com',
      scope: GOOGLE_DRIVE_SCOPES,
      callback: async (response) => {
        if (response.error) {
          console.error('Google OAuth error:', response);
          if (callback) callback(null, response.error);
          return;
        }
        const token = response.access_token;
        window.GoogleDriveSyncEngine.accessToken = token;
        localStorage.setItem('vocab_gdrive_token', token);

        // 取得用戶基本資料
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userInfoRes.ok) {
            const userInfo = await userInfoRes.json();
            window.GoogleDriveSyncEngine.userEmail = userInfo.email || userInfo.name;
            localStorage.setItem('vocab_gdrive_email', window.GoogleDriveSyncEngine.userEmail);
          }
        } catch (e) {
          console.warn('Failed to fetch user info:', e);
        }

        if (callback) callback(token);
      }
    });
  },

  // 觸發登入視窗
  login: () => {
    if (window.GoogleDriveSyncEngine.tokenClient) {
      window.GoogleDriveSyncEngine.tokenClient.requestAccessToken();
    } else {
      alert('Google 認證套件載入中，請稍候重試或確認網路連線。');
    }
  },

  // 從 Google Drive AppData 尋找備份檔案 ID
  findBackupFileId: async (token) => {
    const accessToken = token || window.GoogleDriveSyncEngine.accessToken;
    if (!accessToken) return null;

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${GOOGLE_DRIVE_BACKUP_FILENAME}'&fields=files(id,name,modifiedTime)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) throw new Error('無法存取 Google Drive AppData');
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  },

  // 從 Google Drive AppData 下載最新 JSON 備份
  downloadBackup: async (token) => {
    const accessToken = token || window.GoogleDriveSyncEngine.accessToken;
    if (!accessToken) return null;

    const fileId = await window.GoogleDriveSyncEngine.findBackupFileId(accessToken);
    if (!fileId) return null;

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('讀取 Google Drive 備份檔失敗');
    return await res.json();
  },

  // 將最新 JSON 備份寫入/更新至 Google Drive AppData
  uploadBackup: async (payload, token) => {
    const accessToken = token || window.GoogleDriveSyncEngine.accessToken;
    if (!accessToken) return null;

    const fileId = await window.GoogleDriveSyncEngine.findBackupFileId(accessToken);
    const content = JSON.stringify(payload);

    if (fileId) {
      // 檔案已存在 ➔ 使用 PATCH 覆寫
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: content
      });
      if (!res.ok) throw new Error('更新 Google Drive 備份失敗');
      return await res.json();
    } else {
      // 檔案不存在 ➔ 使用 Multipart POST 建立至 appDataFolder
      const metadata = {
        name: GOOGLE_DRIVE_BACKUP_FILENAME,
        parents: ['appDataFolder']
      };
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        close_delim;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        body: multipartRequestBody
      });
      if (!res.ok) throw new Error('建立 Google Drive 備份失敗');
      return await res.json();
    }
  }
};


// --- File: www/js/components/Icons.js ---
// ==========================================
// --- SVG 圖示元件 (SVG Icons) ---
// ==========================================
window.IconBook = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
window.IconPlay = () => <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
window.IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
window.IconX = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
window.IconAlert = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
window.IconVolume = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>;


// --- File: www/js/components/Header.js ---
// ==========================================
// --- 頂部導覽與狀態列 (Header Component) ---
// ==========================================
window.Header = ({
  displayVersion,
  indicator,
  mistakesTotal,
  streak,
  currentDay,
  setCurrentDay,
  vocabListLength,
  wordsPerDay,
  view,
  cloudSyncStatus,
  cloudSyncKey,
  setShowCloudSyncModal,
  setCloudInputKey
}) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-slate-800 p-3 sm:p-4 rounded-xl shadow-md border border-slate-700 gap-3 sm:gap-4">
      {/* 標題 */}
      <h1 className="text-lg font-bold text-indigo-400 flex items-center gap-1.5 shrink-0">
        <IconBook /> 極限特訓 <span className="text-[10px] text-slate-500 font-mono font-normal">v{displayVersion}</span>
        <a href="https://github.com/leohong/VocabTool/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="ml-2 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 rounded-md transition-colors flex items-center gap-1">
          📖 說明書
        </a>
      </h1>

      {/* 狀態、打卡、雲端同步與進度選單 */}
      <div className="flex items-center w-full md:w-auto gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* 狀態燈號 */}
        <div className={`border px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors shadow-sm shrink-0 ${indicator.bg} ${indicator.border}`}>
          <span className="text-[10px]">{indicator.icon}</span>
          <span className={`font-bold text-xs tracking-wide ${indicator.color}`}>{indicator.title}</span>
          <span className={`text-[11px] font-mono ml-1 pl-1.5 border-l opacity-80 ${indicator.border}`}>負債: {mistakesTotal}</span>
        </div>

        {/* 打卡天數 */}
        {streak.count > 0 && (
          <div className="bg-orange-950/30 border border-orange-500/40 px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm shrink-0">
            <span className="text-[10px]">🔥</span>
            <span className="font-bold text-orange-400 text-xs tracking-wide">{streak.count} 天</span>
          </div>
        )}

        {/* ☁️ 雲端同步狀態按鈕 */}
        <button
          type="button"
          onClick={() => {
            setCloudInputKey(cloudSyncKey);
            setShowCloudSyncModal(true);
          }}
          className={`border px-2 py-1 rounded-md flex items-center gap-1.5 transition-all shadow-sm shrink-0 hover:brightness-110 select-none ${
            cloudSyncStatus === 'synced' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' :
            cloudSyncStatus === 'syncing' ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 animate-pulse' :
            cloudSyncStatus === 'offline' ? 'bg-rose-950/40 border-rose-500/40 text-rose-400' :
            'bg-slate-900 border-slate-700 text-slate-400'
          }`}
          title={`雲端同步狀態: ${cloudSyncStatus}。點擊開啟設定。`}
        >
          <span className="text-xs">
            {cloudSyncStatus === 'synced' ? '🟢' : cloudSyncStatus === 'syncing' ? '🔄' : cloudSyncStatus === 'offline' ? '🔴' : '☁️'}
          </span>
          <span className="font-bold text-xs">
            {cloudSyncStatus === 'synced' ? '雲端已同步' : cloudSyncStatus === 'syncing' ? '同步中' : cloudSyncStatus === 'offline' ? '離線' : '同步金鑰'}
          </span>
        </button>

        {/* 進度選單 */}
        <div className="ml-auto flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 font-medium shrink-0">
          進度:
          <select
            value={currentDay}
            onChange={(e) => setCurrentDay(parseInt(e.target.value, 10))}
            disabled={view !== 'dashboard'}
            className="bg-slate-900 border border-slate-700 text-indigo-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          >
            {Array.from({ length: Math.max(50, Math.ceil(vocabListLength / wordsPerDay)) }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>第 {d} 天</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};


// --- File: www/js/components/Dashboard.js ---
// ==========================================
// --- 🏠 主控制台 Dashboard 元件 ---
// ==========================================

window.Dashboard = ({
  currentDay,
  learnedWords,
  vocabList,
  startScanningSession,
  startSpellingSession,
  startDailyGrandExam,
  mistakesTotal,
  showHistoryModal,
  setShowHistoryModal,
  showMistakesModal,
  setShowMistakesModal,
  showAllVocabModal,
  setShowAllVocabModal,
  showDictModal,
  setShowDictModal,
  startListeningTrain,
  wordsPerDay,
  ghostsPerDay,
  handleWordsPerDayChange,
  handleGhostsPerDayChange,
  dbName,
  setDbName,
  dbList,
  setDbList,
  handleExportJSON,
  handleExportTXT,
  handleImportFile
}) => {
  return (
    <div className="w-full max-w-xl bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-700 space-y-6">
      
      {/* 今日練習與開始特訓大按鈕 */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              第 {currentDay} 天
            </span>
            <span className="text-xs text-slate-400">
              進度: {learnedWords.length} / {vocabList.length} 字
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-100 mt-1">
            本日特訓任務
          </h2>
        </div>

        <button
          onClick={startScanningSession}
          className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-95"
        >
          <IconPlay /> 開始本日特訓
        </button>
      </div>

      {/* 三大流水線特訓快捷按鈕 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={startScanningSession}
          className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-2xl flex flex-col items-start transition-all group"
        >
          <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-400 transition-colors">
            流水線 1
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1">
            ⚡ 快速掃描
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            閃卡快速熟悉
          </span>
        </button>

        <button
          onClick={startSpellingSession}
          className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-2xl flex flex-col items-start transition-all group"
        >
          <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-400 transition-colors">
            流水線 2
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1">
            ⌨️ 填空盲測
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            拼寫肌肉記憶
          </span>
        </button>

        <button
          onClick={startDailyGrandExam}
          className="p-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-2xl flex flex-col items-start transition-all group"
        >
          <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
            終極大會考
          </span>
          <span className="text-sm font-bold text-slate-200 mt-1">
            🏆 全範圍盲測
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            驗收學習成果
          </span>
        </button>
      </div>

      {/* 聽音特訓、錯題本、歷史殿堂與字庫預覽 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={startListeningTrain}
          className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-xl text-center transition-colors"
        >
          <div className="text-base">🎧</div>
          <div className="text-xs font-bold text-slate-300 mt-1">聽音特訓</div>
        </button>

        <button
          onClick={() => setShowMistakesModal(true)}
          className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-xl text-center transition-colors relative"
        >
          {mistakesTotal > 0 && (
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-rose-500 text-white font-mono text-[9px] font-bold rounded-full">
              {mistakesTotal}
            </span>
          )}
          <div className="text-base">🚨</div>
          <div className="text-xs font-bold text-slate-300 mt-1">錯題本</div>
        </button>

        <button
          onClick={() => setShowHistoryModal(true)}
          className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-xl text-center transition-colors"
        >
          <div className="text-base">🏛️</div>
          <div className="text-xs font-bold text-slate-300 mt-1">歷史殿堂</div>
        </button>

        <button
          onClick={() => setShowAllVocabModal(true)}
          className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 rounded-xl text-center transition-colors"
        >
          <div className="text-base">📖</div>
          <div className="text-xs font-bold text-slate-300 mt-1">全字庫</div>
        </button>
      </div>

      {/* 查字典與手動加字按鈕 */}
      <button
        onClick={() => setShowDictModal(true)}
        className="w-full py-3 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors"
      >
        🔍 查字典與手動加字
      </button>

      {/* 設定項：每日進度與幽靈字數 */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">每日新字數量：</span>
          <select
            value={wordsPerDay}
            onChange={(e) => handleWordsPerDayChange(parseInt(e.target.value, 10))}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono"
          >
            {[10, 15, 20, 25, 30, 40, 50].map(n => (
              <option key={n} value={n}>{n} 字/天</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">幽靈字抓取量：</span>
          <select
            value={ghostsPerDay}
            onChange={(e) => handleGhostsPerDayChange(parseInt(e.target.value, 10))}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-mono"
          >
            {[0, 2, 3, 5, 8, 10].map(n => (
              <option key={n} value={n}>{n} 字/天</option>
            ))}
          </select>
        </div>
      </div>

      {/* 字庫管理與備份匯入匯出 */}
      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">當前字庫:</span>
          <select
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-indigo-300 rounded-lg px-2 py-1 focus:outline-none font-mono"
          >
            {dbList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold transition-colors"
          >
            💾 匯出 JSON
          </button>
          <label className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold cursor-pointer transition-colors">
            📥 匯入
            <input type="file" accept=".json,.txt" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>

    </div>
  );
};


// --- File: www/js/components/Sessions.js ---
// ==========================================
// --- ⚡ 特訓模組 Sessions 元件 ---
// ==========================================

// --- 流水線 1：快速掃描 (Scanning Session) ---
window.ScanningSession = ({
  scanningQueue,
  scanIndex,
  isFlipped,
  setIsFlipped,
  handleScanNext,
  speakWord,
  speechEnabled,
  setSpeechEnabled
}) => {
  const currentWord = scanningQueue[scanIndex] || {};
  const progressPercent = Math.round(((scanIndex + 1) / scanningQueue.length) * 100);

  return (
    <div className="w-full max-w-md flex flex-col items-center space-y-5 animate-[fadeIn_0.2s_ease-in-out]">
      {/* 進度條 */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
        <div
          className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center w-full text-xs text-slate-400 font-mono">
        <span>快速掃描特訓</span>
        <span>{scanIndex + 1} / {scanningQueue.length}</span>
      </div>

      {/* 閃卡卡片 */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[260px] bg-slate-800 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col justify-center items-center cursor-pointer select-none relative group hover:border-indigo-500/50 transition-all"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            speakWord(currentWord.en);
          }}
          className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-700/60 rounded-full transition-colors"
          title="朗讀發音"
        >
          <IconVolume />
        </button>

        <span className="text-3xl font-black tracking-wide text-slate-100 text-center font-sans">
          {currentWord.en}
        </span>

        {isFlipped ? (
          <div className="mt-4 text-center space-y-1 animate-[fadeIn_0.15s_ease-in-out]">
            <span className="inline-block px-2 py-0.5 text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 rounded-md">
              {currentWord.pos || 'n.'}
            </span>
            <p className="text-lg font-bold text-emerald-400">
              {currentWord.zh}
            </p>
            {currentWord.eg && (
              <p className="text-xs text-slate-400 mt-2 italic max-w-xs">
                {currentWord.eg}
              </p>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-500 mt-4 animate-pulse">
            👆 點擊卡片翻面看中文釋義
          </span>
        )}
      </div>

      {/* 控制按鈕 */}
      <div className="w-full grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => handleScanNext(false)}
          className="py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-1.5"
        >
          <IconX /> 不精確 (重覆)
        </button>
        <button
          onClick={() => handleScanNext(true)}
          className="py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/50"
        >
          <IconCheck /> 完全熟練 (下字)
        </button>
      </div>
    </div>
  );
};

// --- 流水線 2 & 大會考：強制填空盲測 (Spelling Session) ---
window.SpellingSession = ({
  spellingQueue,
  spellingIndex,
  userInput,
  setUserInput,
  handleSpellingSubmit,
  spellingFeedback,
  inputRef,
  speakWord
}) => {
  const currentWord = spellingQueue[spellingIndex] || {};
  const progressPercent = Math.round(((spellingIndex + 1) / spellingQueue.length) * 100);

  return (
    <div className="w-full max-w-md flex flex-col items-center space-y-5 animate-[fadeIn_0.2s_ease-in-out]">
      {/* 進度條 */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center w-full text-xs text-slate-400 font-mono">
        <span>填空盲測特訓</span>
        <span>{spellingIndex + 1} / {spellingQueue.length}</span>
      </div>

      {/* 題目卡片 */}
      <div className="w-full min-h-[220px] bg-slate-800 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl flex flex-col justify-center items-center relative">
        <button
          type="button"
          onClick={() => speakWord(currentWord.en)}
          className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-indigo-400 bg-slate-700/60 rounded-full transition-colors"
        >
          <IconVolume />
        </button>

        <span className="inline-block px-2.5 py-0.5 text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 rounded-md mb-2">
          {currentWord.pos || 'n.'}
        </span>

        <h3 className="text-2xl font-black text-emerald-400 text-center">
          {currentWord.zh}
        </h3>

        {currentWord.eg && (
          <p className="text-xs text-slate-400 mt-3 text-center italic max-w-xs">
            {maskSentenceText(currentWord.eg, currentWord.en)}
          </p>
        )}
      </div>

      {/* 拼寫輸入表單 */}
      <form onSubmit={handleSpellingSubmit} className="w-full space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="請輸入對應的英文單字..."
          autoFocus
          className="w-full bg-slate-900 border-2 border-indigo-500/50 focus:border-indigo-400 text-slate-100 rounded-2xl px-4 py-3.5 text-lg text-center font-mono focus:outline-none transition-all shadow-inner placeholder:text-slate-600 placeholder:text-sm"
        />

        {spellingFeedback && (
          <div className={`p-3 rounded-xl text-xs font-bold text-center animate-[fadeIn_0.15s_ease-in-out] ${
            spellingFeedback.type === 'correct' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60' : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
          }`}>
            {spellingFeedback.text}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-emerald-950/50"
        >
          送出答案 (Enter)
        </button>
      </form>
    </div>
  );
};

// --- 任務完成畫面 (Session Complete) ---
window.SessionComplete = ({ returnToDashboard }) => {
  return (
    <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center text-center space-y-5 animate-[fadeIn_0.3s_ease-in-out]">
      <div className="text-5xl animate-bounce">🏆</div>
      <h2 className="text-2xl font-black text-slate-100">
        特訓任務完成！
      </h2>
      <p className="text-xs text-slate-400 leading-relaxed">
        恭喜您完成本次單字特訓，肌肉記憶已成功建立。持續堅持打卡特訓！
      </p>

      <button
        onClick={returnToDashboard}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-950/50"
      >
        返回主控制台
      </button>
    </div>
  );
};


// --- File: www/js/components/AudioPlayer.js ---
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


// --- File: www/js/components/Modals.js ---
// ==========================================
// --- 🪟 各類彈窗 Modals 元件庫 ---
// ==========================================

// --- 查字典與手動加字 Modal ---
window.DictionaryModal = ({
  showDictModal,
  setShowDictModal,
  dictQuery,
  setDictQuery,
  dictLoading,
  dictResult,
  handleDictSearch,
  handleAddCustomWord
}) => {
  if (!showDictModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🔍 查字典與新增單字
          </h3>
          <button onClick={() => setShowDictModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <form onSubmit={handleDictSearch} className="flex gap-2">
            <input
              type="text"
              value={dictQuery}
              onChange={(e) => setDictQuery(e.target.value)}
              placeholder="輸入英文單字進行查詢..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
            />
            <button
              type="submit"
              disabled={dictLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md disabled:opacity-50"
            >
              {dictLoading ? '查詢中...' : '查詢字典'}
            </button>
          </form>

          {dictResult && (
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-3 animate-[fadeIn_0.15s_ease-in-out]">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xl font-black text-slate-100 font-sans">{dictResult.en}</span>
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold text-indigo-300 bg-indigo-950 border border-indigo-700/50 rounded-md">
                    {dictResult.pos}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddCustomWord(dictResult)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  ➕ 加入單字庫
                </button>
              </div>

              <p className="text-sm font-bold text-emerald-400">{dictResult.zh}</p>

              {dictResult.eg && (
                <p className="text-xs text-slate-400 italic bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                  {dictResult.eg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 當前錯題本 Modal ---
window.MistakesModal = ({
  showMistakesModal,
  setShowMistakesModal,
  mistakes,
  handleRemoveMistake
}) => {
  if (!showMistakesModal) return null;
  const mistakeList = Object.values(mistakes || {});

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[85vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🚨 當前錯題本 (共 {mistakeList.length} 字)
          </h3>
          <button onClick={() => setShowMistakesModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {mistakeList.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8">當前沒有需要複習的錯題！ 🎉</p>
          ) : (
            mistakeList.map((item, idx) => (
              <div key={idx} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/60 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-200 font-sans text-sm">{item.word.en}</span>
                  <span className="ml-2 text-indigo-300">({item.word.pos})</span>
                  <p className="text-slate-400 mt-0.5">{item.word.zh}</p>
                </div>
                <button
                  onClick={() => handleRemoveMistake(item.word.en)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-rose-300 font-bold rounded-lg transition-colors"
                >
                  移除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- 歷史殿堂 Modal ---
window.HistoryModal = ({
  showHistoryModal,
  setShowHistoryModal,
  historicalMistakes
}) => {
  if (!showHistoryModal) return null;
  const historyList = Object.values(historicalMistakes || {});

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[85vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            🏛️ 歷史殿堂 (錯題紀錄)
          </h3>
          <button onClick={() => setShowHistoryModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {historyList.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-8">歷史殿堂無紀錄。</p>
          ) : (
            historyList.map((item, idx) => (
              <div key={idx} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/60 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-200 font-sans text-sm">{item.word.en}</span>
                  <span className="ml-2 text-indigo-300">({item.word.pos})</span>
                  <p className="text-slate-400 mt-0.5">{item.word.zh}</p>
                </div>
                <span className="px-2 py-1 bg-amber-950/60 text-amber-300 border border-amber-700/40 rounded-lg font-mono font-bold">
                  錯誤 {item.count} 次
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- 全字庫預覽 Modal ---
window.AllVocabModal = ({
  showAllVocabModal,
  setShowAllVocabModal,
  vocabList,
  handleDeleteWord,
  setEditingIndex
}) => {
  if (!showAllVocabModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-in-out]">
      <div className="bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl flex flex-col border border-slate-700 max-h-[85vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            📖 全字庫單字總覽 (共 {vocabList.length} 字)
          </h3>
          <button onClick={() => setShowAllVocabModal(false)} className="p-2 text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {vocabList.map((item, idx) => (
            <div key={idx} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/60 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-200 font-sans text-sm">{item.en}</span>
                <span className="ml-2 text-indigo-300">({item.pos})</span>
                <p className="text-slate-400 mt-0.5">{item.zh}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingIndex(idx)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-indigo-300 font-bold rounded-lg transition-colors"
                >
                  編輯
                </button>
                <button
                  onClick={() => handleDeleteWord(idx)}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-rose-400 font-bold rounded-lg transition-colors"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// --- File: www/js/components/CloudSyncModal.js ---
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


// --- File: www/js/app.js ---
// ==========================================
// --- 🚀 主應用程式進入點 (App Core Component) ---
// ==========================================

const { useState, useEffect, useRef } = React;

function App() {
  const APP_VERSION = "1.5.0"; 
  const DISPLAY_VERSION = APP_VERSION.split('.').slice(0, 2).join('.');

  // 雲端同步與狀態
  const [cloudSyncKey, setCloudSyncKey] = useState(() => localStorage.getItem('vocab_cloudSyncKey') || '');
  const [cloudSyncStatus, setCloudSyncStatus] = useState('unconfigured');
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('vocab_lastSyncTime') || '');
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [cloudInputKey, setCloudInputKey] = useState('');
  const [gdriveUser, setGdriveUser] = useState(() => localStorage.getItem('vocab_gdrive_email') || null);

  // 狀態與資料庫管理
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [dbName, setDbName] = useState(() => localStorage.getItem('vocab_currentDB') || 'vocab_2000');
  const [dbList, setDbList] = useState(() => {
    const saved = localStorage.getItem('vocab_dbList');
    return saved ? JSON.parse(saved) : ['vocab_2000', 'vocab_7000'];
  });

  const defaultState = {
    currentDay: 1,
    learnedWords: [],
    mistakes: {},
    historicalMistakes: {},
    streak: { count: 0, lastDate: null }
  };

  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(`vocab_state_${dbName}`);
    return saved ? JSON.parse(saved) : defaultState;
  });

  const [wordsPerDay, setWordsPerDay] = useState(() => {
    const saved = localStorage.getItem(`vocab_wordsPerDay_${dbName}`);
    return saved ? parseInt(saved, 10) : 20;
  });

  const [ghostsPerDay, setGhostsPerDay] = useState(() => {
    const saved = localStorage.getItem(`vocab_ghostsPerDay_${dbName}`);
    return saved ? parseInt(saved, 10) : 3;
  });

  const [vocabList, setVocabList] = useState(() => {
    const saved = localStorage.getItem(`vocab_customVocab_${dbName}`);
    if (saved) return JSON.parse(saved);
    return window.rawVocab || [];
  });

  // UI 導覽 View 狀態
  const [view, setView] = useState('dashboard');
  const [scanningQueue, setScanningQueue] = useState([]);
  const [scanIndex, setScanIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [spellingQueue, setSpellingQueue] = useState([]);
  const [spellingIndex, setSpellingIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [spellingFeedback, setSpellingFeedback] = useState(null);

  // 聽音特訓
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioCurrentIndex, setAudioCurrentIndex] = useState(0);
  const [audioWordsList, setAudioWordsList] = useState([]);
  const [audioSpeed, setAudioSpeed] = useState(() => localStorage.getItem('vocab_speechRate') || '0.8');

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMistakesModal, setShowMistakesModal] = useState(false);
  const [showAllVocabModal, setShowAllVocabModal] = useState(false);
  const [showDictModal, setShowDictModal] = useState(false);
  const [showAudioSettingsModal, setShowAudioSettingsModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);

  // 字典搜尋
  const [dictQuery, setDictQuery] = useState('');
  const [dictLoading, setDictLoading] = useState(false);
  const [dictResult, setDictResult] = useState(null);

  const inputRef = useRef(null);

  // 語音朗讀
  const speakWord = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = parseFloat(audioSpeed);
      window.speechSynthesis.speak(utterance);
    }
  };

  // 雙向雲端同步 Handlers
  useEffect(() => {
    if (typeof window !== 'undefined' && window.GoogleDriveSyncEngine) {
      window.GoogleDriveSyncEngine.init('92837492834-vocabtool.apps.googleusercontent.com', (token) => {
        if (token) {
          setGdriveUser(window.GoogleDriveSyncEngine.userEmail);
          setCloudSyncStatus('synced');
        }
      });
    }
  }, []);

  const handleGoogleLogin = () => {
    if (window.GoogleDriveSyncEngine) {
      window.GoogleDriveSyncEngine.login();
    }
  };

  const handleGoogleSyncUpload = async () => {
    try {
      setCloudSyncStatus('syncing');
      const payload = window.CloudSyncEngine.buildPayload(dbName, dbList);
      await window.GoogleDriveSyncEngine.uploadBackup(payload);
      const formattedTime = new Date().toLocaleString('zh-TW');
      localStorage.setItem('vocab_lastSyncTime', formattedTime);
      setLastSyncTime(formattedTime);
      setCloudSyncStatus('synced');
      alert('已成功備份至 Google Drive AppData 隱藏空間！');
    } catch (err) {
      console.error(err);
      setCloudSyncStatus('offline');
      alert('備份至 Google Drive 失敗：' + err.message);
    }
  };

  const handleGoogleSyncDownload = async () => {
    try {
      setCloudSyncStatus('syncing');
      const cloudPayload = await window.GoogleDriveSyncEngine.downloadBackup();
      if (cloudPayload && cloudPayload.databases) {
        window.CloudSyncEngine.applyPayloadToLocal(cloudPayload);
        const formattedTime = new Date(cloudPayload.timestamp || Date.now()).toLocaleString('zh-TW');
        setLastSyncTime(formattedTime);
        setCloudSyncStatus('synced');
        const reloadedState = localStorage.getItem(`vocab_state_${dbName}`);
        if (reloadedState) setState(JSON.parse(reloadedState));
        const reloadedVocab = localStorage.getItem(`vocab_customVocab_${dbName}`);
        if (reloadedVocab) setVocabList(JSON.parse(reloadedVocab));
        alert('已成功從 Google Drive 下載並還原最新學習進度！');
      } else {
        alert('Google Drive 中尚未找到備份檔案。');
        setCloudSyncStatus('synced');
      }
    } catch (err) {
      console.error(err);
      setCloudSyncStatus('offline');
      alert('從 Google Drive 下載失敗：' + err.message);
    }
  };

  // 特訓開始流程
  const startScanningSession = () => {
    const startIndex = (state.currentDay - 1) * wordsPerDay;
    const todayWords = vocabList.slice(startIndex, startIndex + wordsPerDay);
    if (todayWords.length === 0) {
      alert('今日無新增單字或已超越當前字庫範圍！');
      return;
    }
    setScanningQueue(todayWords);
    setScanIndex(0);
    setIsFlipped(false);
    setView('scanning');
  };

  const handleScanNext = (known) => {
    if (scanIndex + 1 < scanningQueue.length) {
      setScanIndex(scanIndex + 1);
      setIsFlipped(false);
    } else {
      setView('complete');
    }
  };

  const startSpellingSession = () => {
    const startIndex = (state.currentDay - 1) * wordsPerDay;
    const todayWords = vocabList.slice(startIndex, startIndex + wordsPerDay);
    if (todayWords.length === 0) {
      alert('今日無新增單字！');
      return;
    }
    setSpellingQueue(todayWords);
    setSpellingIndex(0);
    setUserInput('');
    setSpellingFeedback(null);
    setView('spelling');
  };

  const handleSpellingSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const currentWord = spellingQueue[spellingIndex];
    if (userInput.trim().toLowerCase() === currentWord.en.toLowerCase()) {
      setSpellingFeedback({ type: 'correct', text: '✅ 正確！' });
      speakWord(currentWord.en);
      setTimeout(() => {
        if (spellingIndex + 1 < spellingQueue.length) {
          setSpellingIndex(spellingIndex + 1);
          setUserInput('');
          setSpellingFeedback(null);
        } else {
          setView('complete');
        }
      }, 700);
    } else {
      setSpellingFeedback({ type: 'wrong', text: `❌ 答案是 ${currentWord.en}` });
    }
  };

  const startDailyGrandExam = () => {
    if (vocabList.length === 0) return;
    setSpellingQueue([...vocabList].sort(() => Math.random() - 0.5));
    setSpellingIndex(0);
    setUserInput('');
    setSpellingFeedback(null);
    setView('spelling');
  };

  const startListeningTrain = () => {
    const startIndex = (state.currentDay - 1) * wordsPerDay;
    const todayWords = vocabList.slice(startIndex, startIndex + wordsPerDay);
    setAudioWordsList(todayWords.length > 0 ? todayWords : vocabList);
    setAudioCurrentIndex(0);
    setAudioPlaying(true);
    setView('audioPlayer');
  };

  // 狀態與指標
  const mistakesTotal = Object.keys(state.mistakes || {}).length;
  const indicator = mistakesTotal === 0 ? { title: '完美', bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', color: 'text-emerald-300', icon: '💎' } :
                    mistakesTotal < 5 ? { title: '良好', bg: 'bg-indigo-950/40', border: 'border-indigo-500/40', color: 'text-indigo-300', icon: '🟢' } :
                    { title: '待加強', bg: 'bg-rose-950/40', border: 'border-rose-500/40', color: 'text-rose-400', icon: '🔴' };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 頁首 Header */}
      {!(view === 'spelling' && isInputFocused) && (
        <Header
          DISPLAY_VERSION={DISPLAY_VERSION}
          indicator={indicator}
          mistakesTotal={mistakesTotal}
          streak={state.streak}
          cloudSyncStatus={cloudSyncStatus}
          setCloudInputKey={setCloudInputKey}
          cloudSyncKey={cloudSyncKey}
          setShowCloudSyncModal={setShowCloudSyncModal}
          currentDay={state.currentDay}
          setState={setState}
          view={view}
          vocabList={vocabList}
          wordsPerDay={wordsPerDay}
        />
      )}

      {/* 主要內容視圖 */}
      <main className="w-full flex flex-col items-center">
        {view === 'dashboard' && (
          <Dashboard
            currentDay={state.currentDay}
            learnedWords={state.learnedWords}
            vocabList={vocabList}
            startScanningSession={startScanningSession}
            startSpellingSession={startSpellingSession}
            startDailyGrandExam={startDailyGrandExam}
            mistakesTotal={mistakesTotal}
            showHistoryModal={showHistoryModal}
            setShowHistoryModal={setShowHistoryModal}
            showMistakesModal={showMistakesModal}
            setShowMistakesModal={setShowMistakesModal}
            showAllVocabModal={showAllVocabModal}
            setShowAllVocabModal={setShowAllVocabModal}
            showDictModal={showDictModal}
            setShowDictModal={setShowDictModal}
            startListeningTrain={startListeningTrain}
            wordsPerDay={wordsPerDay}
            ghostsPerDay={ghostsPerDay}
            handleWordsPerDayChange={(val) => setWordsPerDay(val)}
            handleGhostsPerDayChange={(val) => setGhostsPerDay(val)}
            dbName={dbName}
            setDbName={setDbName}
            dbList={dbList}
            setDbList={setDbList}
          />
        )}

        {view === 'scanning' && (
          <ScanningSession
            scanningQueue={scanningQueue}
            scanIndex={scanIndex}
            isFlipped={isFlipped}
            setIsFlipped={setIsFlipped}
            handleScanNext={handleScanNext}
            speakWord={speakWord}
          />
        )}

        {view === 'spelling' && (
          <SpellingSession
            spellingQueue={spellingQueue}
            spellingIndex={spellingIndex}
            userInput={userInput}
            setUserInput={setUserInput}
            handleSpellingSubmit={handleSpellingSubmit}
            spellingFeedback={spellingFeedback}
            inputRef={inputRef}
            speakWord={speakWord}
          />
        )}

        {view === 'audioPlayer' && (
          <AudioPlayer
            audioPlaying={audioPlaying}
            setAudioPlaying={setAudioPlaying}
            audioCurrentIndex={audioCurrentIndex}
            audioWordsList={audioWordsList}
            audioSpeed={audioSpeed}
            setShowAudioSettingsModal={setShowAudioSettingsModal}
            returnToDashboard={() => setView('dashboard')}
          />
        )}

        {view === 'complete' && (
          <SessionComplete returnToDashboard={() => setView('dashboard')} />
        )}
      </main>

      {/* 彈窗 Modals */}
      <CloudSyncModal
        showCloudSyncModal={showCloudSyncModal}
        setShowCloudSyncModal={setShowCloudSyncModal}
        cloudInputKey={cloudInputKey}
        setCloudInputKey={setCloudInputKey}
        cloudSyncStatus={cloudSyncStatus}
        lastSyncTime={lastSyncTime}
        cloudSyncKey={cloudSyncKey}
        setCloudSyncKey={setCloudSyncKey}
        gdriveUser={gdriveUser}
        handleGoogleLogin={handleGoogleLogin}
        handleGoogleSyncUpload={handleGoogleSyncUpload}
        handleGoogleSyncDownload={handleGoogleSyncDownload}
      />

      <DictionaryModal
        showDictModal={showDictModal}
        setShowDictModal={setShowDictModal}
        dictQuery={dictQuery}
        setDictQuery={setDictQuery}
        dictLoading={dictLoading}
        dictResult={dictResult}
      />

      <MistakesModal
        showMistakesModal={showMistakesModal}
        setShowMistakesModal={setShowMistakesModal}
        mistakes={state.mistakes}
      />

      <HistoryModal
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        historicalMistakes={state.historicalMistakes}
      />

      <AllVocabModal
        showAllVocabModal={showAllVocabModal}
        setShowAllVocabModal={setShowAllVocabModal}
        vocabList={vocabList}
        setEditingIndex={setEditingIndex}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

