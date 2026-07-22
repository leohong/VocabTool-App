// ==========================================
// --- ⚓ Custom Hook: useCloudSync.js ---
// ==========================================

window.useCloudSync = (dbName, dbList, setState, setVocabList) => {
  const [cloudSyncKey, setCloudSyncKey] = React.useState(() => localStorage.getItem('vocab_cloudSyncKey') || '');
  const [cloudSyncStatus, setCloudSyncStatus] = React.useState('unconfigured');
  const [lastSyncTime, setLastSyncTime] = React.useState(() => localStorage.getItem('vocab_lastSyncTime') || '');
  const [showCloudSyncModal, setShowCloudSyncModal] = React.useState(false);
  const [cloudInputKey, setCloudInputKey] = React.useState('');
  const [gdriveUser, setGdriveUser] = React.useState(() => localStorage.getItem('vocab_gdrive_email') || null);

  React.useEffect(() => {
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
        if (reloadedState && setState) setState(JSON.parse(reloadedState));
        const reloadedVocab = localStorage.getItem(`vocab_customVocab_${dbName}`);
        if (reloadedVocab && setVocabList) setVocabList(JSON.parse(reloadedVocab));
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

  const performCloudPull = async (overrideKey) => {
    const keyToUse = overrideKey || cloudSyncKey;
    if (!keyToUse) return false;
    try {
      setCloudSyncStatus('syncing');
      const cloudData = await window.CloudSyncEngine.fetchCloudState(keyToUse);
      if (cloudData) {
        window.CloudSyncEngine.applyPayloadToLocal(cloudData);
        const formattedTime = new Date(cloudData.timestamp || Date.now()).toLocaleString('zh-TW');
        setLastSyncTime(formattedTime);
        setCloudSyncStatus('synced');
        const reloadedState = localStorage.getItem(`vocab_state_${dbName}`);
        if (reloadedState && setState) setState(JSON.parse(reloadedState));
        const reloadedVocab = localStorage.getItem(`vocab_customVocab_${dbName}`);
        if (reloadedVocab && setVocabList) setVocabList(JSON.parse(reloadedVocab));
        return true;
      }
      setCloudSyncStatus('synced');
      return false;
    } catch (e) {
      console.error('Cloud pull failed:', e);
      setCloudSyncStatus('offline');
      return false;
    }
  };

  const performCloudPush = async (overrideKey) => {
    const keyToUse = overrideKey || cloudSyncKey;
    if (!keyToUse) return false;
    try {
      setCloudSyncStatus('syncing');
      const payload = window.CloudSyncEngine.buildPayload(dbName, dbList);
      await window.CloudSyncEngine.pushCloudState(keyToUse, payload);
      const formattedTime = new Date().toLocaleString('zh-TW');
      localStorage.setItem('vocab_lastSyncTime', formattedTime);
      setLastSyncTime(formattedTime);
      setCloudSyncStatus('synced');
      return true;
    } catch (e) {
      console.error('Cloud push failed:', e);
      setCloudSyncStatus('offline');
      return false;
    }
  };

  return {
    cloudSyncKey,
    setCloudSyncKey,
    cloudSyncStatus,
    setCloudSyncStatus,
    lastSyncTime,
    setLastSyncTime,
    showCloudSyncModal,
    setShowCloudSyncModal,
    cloudInputKey,
    setCloudInputKey,
    gdriveUser,
    handleGoogleLogin,
    handleGoogleSyncUpload,
    handleGoogleSyncDownload,
    performCloudPull,
    performCloudPush
  };
};
