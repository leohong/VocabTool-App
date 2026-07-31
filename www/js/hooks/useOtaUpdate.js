// ==========================================
// --- 🔄 Custom Hook: useOtaUpdate.js ---
// ==========================================
// 負責 Capacitor OTA 版本更新邏輯（版本比較、下載、應用）
// 與 App 主邏輯完全解耦，零狀態共享依賴。

window.useOtaUpdate = (appVersion) => {
  const [otaUpdating, setOtaUpdating] = React.useState(false);

  const getUpdaterPlugin = () => {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorUpdater) {
      return window.Capacitor.Plugins.CapacitorUpdater;
    }
    return null;
  };

  const triggerOtaCheck = async (updater) => {
    try {
      const UPDATE_CONFIG_URL = 'https://raw.githubusercontent.com/leohong/VocabTool-App/main/update.json';
      const response = await fetch(UPDATE_CONFIG_URL, { cache: 'no-store' });
      if (!response.ok) return;
      const remoteConfig = await response.json();

      if (remoteConfig.version && remoteConfig.url) {
        const isNewer = (remoteVer, localVer) => {
          const parse = (v) => v.split('.').map(n => parseInt(n, 10) || 0);
          const [rMajor, rMinor, rPatch] = parse(remoteVer);
          const [lMajor, lMinor, lPatch] = parse(localVer);
          if (rMajor !== lMajor) return rMajor > lMajor;
          if (rMinor !== lMinor) return rMinor > lMinor;
          return rPatch > lPatch;
        };

        if (isNewer(remoteConfig.version, appVersion)) {
          if (window.confirm(`發現新版特訓模組 (v${remoteConfig.version})，是否立即下載更新？\n（更新將重啟 App 生效）`)) {
            setOtaUpdating(true);
            try {
              console.log('[Update] Downloading package:', remoteConfig.url);
              const downloadResult = await updater.download({
                url: remoteConfig.url,
                version: remoteConfig.version
              });
              console.log('[Update] Download complete, applying update...');
              await updater.set(downloadResult);
            } catch (err) {
              console.error('[Update] OTA failed:', err);
              alert(`更新下載失敗：${err.message || err}`);
              setOtaUpdating(false);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Update] Update check skipped (offline or network error):', err.message || err);
    }
  };

  return { otaUpdating, setOtaUpdating, getUpdaterPlugin, triggerOtaCheck };
};
