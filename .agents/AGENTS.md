# 🤖 VocabTool-App AI Agent Workspace Instructions & Knowledge

本文件記錄 `VocabTool-App` 專案的核心開發規範、架構決策與運作流程。在任何電腦開開啟本專案時，AI Agent 均會自動載入本規範以維持無縫工作接續。

---

## 1. 專案架構規範 (Clean Modular Architecture)

*   **開發源碼目錄 (`www/js/`)**：
    *   `utils/`：純演算法與 API 工具（`textUtils.js`, `dictionaryApi.js`）。
    *   `hooks/`：React 業務邏輯與狀態（`useVocabState.js`）。
    *   `components/`：1:1 原裝 UI 視覺元件 (`Header.js`, `Dashboard.js`, `Sessions.js`, `AudioPlayer.js`, `Modals.js`)。
    *   `app.js`：核心生命週期進入點。
*   **發布與編譯檔 (`www/index.html`)**：
    *   由建置腳本 `scripts/build.js` 自動生成。
    *   **原因**：Android WebView (`file://`) 嚴格禁止 AJAX 跨檔讀取外部 JSX。預編譯打包可確保離線免 CORS 錯誤。

---

## 2. 開發與打包指令 (Commands)

```bash
# 預編譯打包 JavaScript 模組至 www/index.html
npm run build

# 同步 web 資源至 Android 原生工程
npx cap sync android

# 編譯 Debug APK (位於 android/ 目錄)
.\gradlew.bat assembleDebug
```

---

## 3. 重要開發鐵律 (Strict Guidelines)

1. **🔒 Git Server 上傳限制**：所有程式碼開發、模組編譯與版本 tag 動作一律先在 Local 本機端完成。未經使用者明確口頭同意，絕不自動執行 `git push`、推送 tag 或任何將變更上傳至 Git Server 的動作！
2. **🎨 UI 0 變化原則**：進行重構時，務必確保原本的 Tailwind CSS 樣式、動畫、按鈕顏色與排版 100% 零偏離。
3. **🏷️ 語意化版本控制 (SemVer)**：每次改版必須嚴格遵守 SemVer 規範。主變更 (MAJOR)、功能增刪 (MINOR)、Bug 修復 (PATCH) 與 Android `versionCode` (單調遞增) 必須同步修改於 `app.js`、`build.gradle`、`SPECIFICATION.md` 與 `package.json`，並與 Git Tag 保持 100% 一致。

---

## 4. 完整技術手冊 (Full Documentation)

關於更詳細的聽讀特訓機制（盲聽、逐字拼讀高亮）、手滑強制重寫邏輯、CORS WebView 建置原因及各模組詳細依賴關係，請參閱根目錄的：
*   **技術手冊**：[DEVELOPMENT_GUIDE.md](file:///d:/MyProjects/VocabTool-App/DEVELOPMENT_GUIDE.md)

