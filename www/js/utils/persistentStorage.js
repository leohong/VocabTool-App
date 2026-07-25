// ==========================================
// --- 💾 持久化儲存管理器 (persistentStorage.js) ---
// ==========================================
// 本模組提供平台自動偵測與 Web Fallback 的異步儲存介面：
// - Native (App) 環境：配置與金鑰用 @capacitor/preferences，大型檔案與進度用 @capacitor/filesystem 寫入 DATA 目錄。
// - Web 瀏覽器環境：降級使用 window.localStorage (透過 Promise 包裝以維持 API 統一)。

(function() {
  const isNative = typeof window !== 'undefined' && 
                    window.Capacitor && 
                    window.Capacitor.isNativePlatform && 
                    window.Capacitor.isNativePlatform();

  let Preferences = null;
  let Filesystem = null;

  if (isNative) {
    Preferences = window.Capacitor.Plugins.Preferences;
    Filesystem = window.Capacitor.Plugins.Filesystem;
  }

  const persistentStorage = {
    isNative: isNative,

    // 初始化儲存環境 (例如確認目錄是否可寫)
    async initStorage() {
      if (isNative) {
        console.log('[Storage] Native platform detected. Using Preferences & Filesystem.');
      } else {
        console.log('[Storage] Web platform detected. Using LocalStorage fallback.');
      }
      return true;
    },

    // 讀取一般偏好設定 (Settings)
    async getSetting(key, defaultValue) {
      try {
        if (isNative && Preferences) {
          const { value } = await Preferences.get({ key: key });
          if (value === null || value === undefined) return defaultValue;
          try {
            return JSON.parse(value);
          } catch (e) {
            return value; // 如果不是 JSON 字串，直接傳回原值
          }
        } else {
          const val = localStorage.getItem(key);
          if (val === null || val === undefined) return defaultValue;
          try {
            return JSON.parse(val);
          } catch (e) {
            return val;
          }
        }
      } catch (err) {
        console.error(`[Storage] getSetting failed for key ${key}:`, err);
        return defaultValue;
      }
    },

    // 寫入一般偏好設定 (Settings)
    async setSetting(key, value) {
      try {
        const stringified = JSON.stringify(value);
        if (isNative && Preferences) {
          await Preferences.set({ key: key, value: stringified });
        } else {
          localStorage.setItem(key, stringified);
        }
        return true;
      } catch (err) {
        console.error(`[Storage] setSetting failed for key ${key}:`, err);
        return false;
      }
    },

    // 讀取特定字庫的單字列表 (Database)
    async loadDatabase(dbName) {
      const fileKey = `vocab_data_${dbName}.json`;
      const localKey = `vocab_customVocab_${dbName}`;
      try {
        if (isNative && Filesystem) {
          try {
            const { data } = await Filesystem.readFile({
              path: fileKey,
              directory: 'DATA',
              encoding: 'utf8'
            });
            return JSON.parse(data);
          } catch (fileErr) {
            // 檔案不存在時 (初次建立) 傳回空陣列
            console.log(`[Storage] Database file ${fileKey} not found, returning empty array.`);
            return [];
          }
        } else {
          const val = localStorage.getItem(localKey);
          return val ? JSON.parse(val) : [];
        }
      } catch (err) {
        console.error(`[Storage] loadDatabase failed for ${dbName}:`, err);
        return [];
      }
    },

    // 寫入特定字庫的單字列表 (Database)
    async saveDatabase(dbName, vocabList) {
      const fileKey = `vocab_data_${dbName}.json`;
      const localKey = `vocab_customVocab_${dbName}`;
      try {
        const stringified = JSON.stringify(vocabList);
        if (isNative && Filesystem) {
          await Filesystem.writeFile({
            path: fileKey,
            data: stringified,
            directory: 'DATA',
            encoding: 'utf8'
          });
        } else {
          localStorage.setItem(localKey, stringified);
        }
        return true;
      } catch (err) {
        console.error(`[Storage] saveDatabase failed for ${dbName}:`, err);
        return false;
      }
    },

    // 讀取特定字庫的學習狀態進度 (DbState)
    async loadDbState(dbName) {
      const fileKey = `vocab_state_${dbName}.json`;
      const localKey = `vocab_state_${dbName}`;
      try {
        if (isNative && Filesystem) {
          try {
            const { data } = await Filesystem.readFile({
              path: fileKey,
              directory: 'DATA',
              encoding: 'utf8'
            });
            return JSON.parse(data);
          } catch (fileErr) {
            // 狀態檔不存在時，傳回 null 讓主程式套用預設初始狀態
            return null;
          }
        } else {
          const val = localStorage.getItem(localKey);
          return val ? JSON.parse(val) : null;
        }
      } catch (err) {
        console.error(`[Storage] loadDbState failed for ${dbName}:`, err);
        return null;
      }
    },

    // 寫入特定字庫的學習狀態進度 (DbState)
    async saveDbState(dbName, state) {
      const fileKey = `vocab_state_${dbName}.json`;
      const localKey = `vocab_state_${dbName}`;
      try {
        const stringified = JSON.stringify(state);
        if (isNative && Filesystem) {
          await Filesystem.writeFile({
            path: fileKey,
            data: stringified,
            directory: 'DATA',
            encoding: 'utf8'
          });
        } else {
          localStorage.setItem(localKey, stringified);
        }
        return true;
      } catch (err) {
        console.error(`[Storage] saveDbState failed for ${dbName}:`, err);
        return false;
      }
    },

    // 獲取所有自訂字庫清單 (DbList)
    async getDbList() {
      return this.getSetting('vocab_dbList', ['vocab_2000', 'vocab_7000']);
    },

    // 儲存自訂字庫清單 (DbList)
    async saveDbList(dbList) {
      return this.setSetting('vocab_dbList', dbList);
    },

    // 刪除字庫相關檔案
    async deleteDatabaseFiles(dbName) {
      const fileDataKey = `vocab_data_${dbName}.json`;
      const fileStateKey = `vocab_state_${dbName}.json`;
      const localDataKey = `vocab_customVocab_${dbName}`;
      const localStateKey = `vocab_state_${dbName}`;

      try {
        if (isNative && Filesystem) {
          try {
            await Filesystem.deleteFile({
              path: fileDataKey,
              directory: 'DATA'
            });
          } catch (e) {}
          try {
            await Filesystem.deleteFile({
              path: fileStateKey,
              directory: 'DATA'
            });
          } catch (e) {}
        } else {
          localStorage.removeItem(localDataKey);
          localStorage.removeItem(localStateKey);
        }
        return true;
      } catch (err) {
        console.error(`[Storage] deleteDatabaseFiles failed for ${dbName}:`, err);
        return false;
      }
    }
  };

  // 掛載至全域視窗物件
  window.persistentStorage = persistentStorage;
})();
