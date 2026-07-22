# 🧠 極限單字特訓系統 Mobile App (VocabTool)

> 一款基於「主動回想」、「動態錯題懲罰」、「間隔重複」與 Capacitor 跨平台技術的極限單字記憶 App。

📦 **最新 Android APK 下載**：[VocabTool-v1.0.apk](./VocabTool-v1.0.apk)  
🔗 **GitHub 儲存庫網址**：[https://github.com/leohong/VocabTool-App](https://github.com/leohong/VocabTool-App)  
📚 **內建字庫檔案**：[國中 2000 單字庫](./www/2000_單字庫.txt) | [高中 7000 單字庫](./www/7000_單字庫.txt)

---

## 📱 專案簡介 (Overview)

**極限單字特訓系統 Mobile App** 專為高強度的長期單字記憶計畫（如征服國中 2,000 單字、高中 7,000 單字）而設計。

本專案結合 **Capacitor 跨平台原生框架** 與 **React 18 高效能純前端架構**，具備以下優勢：
* ⚡ **雙階段流水線訓練**：第一關快速閃卡篩選 ➔ 第二關強制盲測全拼寫。
* 📱 **原生行動端優化**：支援左右滑動手勢卡片篩選、防螢幕休眠鎖定 (Wake Lock)。
* 🔥 **動態錯題懲罰**：雙倍消除演算法（拼錯越多次需要連續拼對越多次才能畢業）。
* 🏛️ **間隔重複與幽靈突襲**：4 階段間隔複習（7天 ➔ 21天 ➔ 60天 ➔ 180天 ➔ 永久免疫）。
* 🎧 **盲聽特訓播放器**：預設美式發音與台灣國語，支援自訂語速、字母拼讀停頓、聽寫高亮動畫與遮蔽模式。
* ☁️ **雙軌雲端同步 (v1.5.0)**：支援 Google 帳號授權同步 (Google Drive AppData) 與 Firebase 自訂金鑰備份還原。
* 📦 **模組化程式碼結構**：全新重構的代碼，將核心拆分為模組與 Hooks，使開發架構更易讀好維護。
* 💾 **100% 離線可用與自動存檔**：所有資料儲存於本地 `localStorage`，不依賴後端伺服器。

---

## 🚀 如何開始與 APK 打包 (Getting Started & Build)

### 📲 方式一：直接安裝 APK (最快)
1. 下載專案根目錄下的 **[VocabTool-v1.0.apk](./VocabTool-v1.0.apk)**。
2. 傳送至 Android 手機並允許「安裝未知來源應用程式」即可開啟使用。

### 💻 方式二：使用 Node.js / Capacitor 在本機開發或打包
1. **複製專案並安裝依賴**：
   ```bash
   git clone https://github.com/leohong/VocabTool-App.git
   cd VocabTool-App
   npm install
   ```

2. **開發與預編譯模組**：
   專案代碼採模組化拆分，置於 `www/js/` 目錄中。在同步至原生 App 或開啟 index.html 之前，必須進行編譯打包：
   ```bash
   # 預編譯打包 JavaScript 模組合併至 www/index.html
   npm run build
   ```

3. **同步前端程式至 Android 原生專案**：
   ```bash
   npx cap sync android
   ```

4. **開啟 Android Studio 編譯並執行**：
   ```bash
   npx cap open android
   ```
   * 在 Android Studio 中點選 **Run 'app'** 即可於模擬器或實體手機上執行與測試。
   * 或點選 **Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)** 即可產出全新 APK。

---

## 🎮 主介面與操作指南

### 1. 指揮中心按鈕
* **⚡ 發動今日特訓**：開始當天設定的新單字特訓。特訓中會自動安插今日到期的歷史「幽靈單字 👻」進行突襲。
* **🔥 降溫：錯題大會考**：從當前錯題集中隨機抽取最多 50 個字進行純拼寫盲測，幫助快速消除錯題債務。
* **🏛️ 深度：歷史隨機抽查**：隨機抽取最多 50 個已封存於歷史殿堂的單字進行純拼寫抽驗，主動檢測長期記憶。
* **🎧 聽讀：聽音背單字**：進入聽音背單字播放器。支援自訂單字範圍、字母拼讀、中文釋義與例句朗讀。
* **🔍 預覽今日特訓新單字**：特訓前預覽今日的單字清單與發音。
* **🗂️ 預覽全字庫單字**：關鍵字即時模糊篩選、分頁瀏覽、即時編輯與刪除單字。
* **📖 查字典與新增單字**：整合線上英語字典與翻譯 API，查詢後可手動新增至字庫。

### 2. 檔案管理與備份
* **`⬇️ 字` / `⬆️ 字`**：匯出與匯入純單字庫 TXT 檔。
* **`⬇️ 殿` / `⬆️ 殿`**：匯出與匯入歷史殿堂 TXT 檔。
* **`⬇️ J` / `⬆️ J`**：全系統 JSON 完整備份與還原。

---

## ⌨️ 操作快捷鍵與觸控手勢

| 操作環境 | 功能 / 關卡 | 快捷鍵 / 手勢 | 效果 |
| :--- | :--- | :--- | :--- |
| **行動裝置** | 第一關：快速篩選 | 👈 **向左滑動 (Swipe Left)** | 歸類為「不熟 / 不認識」（進入錯題集） |
| | 第一關：快速篩選 | 👉 **向右滑動 (Swipe Right)** | 歸類為「認識 / 記住了」 |
| **電腦桌面** | 第一關：快速篩選 | ⬅️ **`←` 方向鍵** | 歸類為「不熟 / 不認識」 |
| | 第一關：快速篩選 | ➡️ **`→` 方向鍵** | 歸類為「認識 / 記住了」 |
| **通用** | 第二關：強制盲測 | ↵ **`Enter` 鍵** | 送出檢查 / 確認強迫重抄後進入下一字 |

---

## 📚 資料匯入格式 (Data Formats)

### 📝 字典 TXT 格式範例：
必須包含 `=== 特訓完整字庫 ===` 開頭，單字格式為 `編號. [詞性] 英文 --> 中文`，可用 `||` 追加例句：

```text
=== 特訓完整字庫 ===

1. [n.] system --> 系統 || A computer system is complex. (電腦系統很複雜。)
2. [v.] acknowledge --> 承認/確認 || I acknowledge my mistake. (我承認我的錯誤。)
3. [adj.] extreme --> 極端的
```

---

## 🛠 技術棧 (Tech Stack)

* **跨平台框架**：Capacitor 7 (`@capacitor/core`, `@capacitor/android`)
* **前端框架**：React 18 (via CDN / Standalone)
* **CSS 樣式**：Tailwind CSS (Glassmorphism 暗黑科技風格)
* **語音引擎**：Web Speech API (原生 TTS，美式英語語音，速率 0.8)
* **本地存儲**：HTML5 `localStorage` (資料 100% 留存於用戶手機/瀏覽器本地)

---

## 💡 常見問題與語音障礙排除 (FAQ & TTS Troubleshooting)

### 🔊 為什麼安裝 APK 後點擊播放英文，卻沒有聲音或發音很生硬？
因為本 App 依賴 Android 系統內建的語音引擎 (TTS)。如果您的手機是精簡版系統（如陸版 ROM），可能會缺少 Google 語音引擎。
**解決方法**：
1. 前往手機的「設定」➔「語言與輸入設定」➔「文字轉語音 (TTS) 輸出」。
2. 確認首選引擎已設定為 **「Google 語音服務 (Speech Services by Google)」**（若無此選項，請至 Google Play 商店搜尋並安裝）。
3. 下載並安裝「英文 (美國)」的語音資料包，即可享受最自然的美式朗讀。

---

## 📄 授權條款 (License)

This project is open source and available under the [MIT License](LICENSE).
