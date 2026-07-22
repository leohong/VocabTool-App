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
