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
