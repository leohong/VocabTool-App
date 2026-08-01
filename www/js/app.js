const { useState, useEffect, useRef } = React;

const rawVocab = window.rawVocab || [
  { en: 'system', zh: '系統 (範例字)', pos: 'n.' },
  { en: 'acknowledgement', zh: '承認/確認 (範例字)', pos: 'n.' }
];
const rawVocab7000 = window.rawVocab7000 || rawVocab;

function App() {
  // ----------------------------------------
  // --- 0. 版本管理常數 (三碼版本號規則) ---
  // ----------------------------------------
  const APP_VERSION = "1.8.1";
  const DISPLAY_VERSION = APP_VERSION.split('.').slice(0, 2).join('.');

  // ----------------------------------------
  // --- 1. 使用 Hooks 進行狀態與資料庫管理 ---
  // ----------------------------------------
  const {
    dbName,
    setDbName,
    dbList,
    setDbList,
    state,
    setState,
    vocabList,
    setVocabList,
    wordsPerDay,
    setWordsPerDay,
    ghostsPerDay,
    setGhostsPerDay,
    defaultState,
    isStorageLoaded,
    initAllData
  } = useVocabState();

  const {
    currentDay,
    learnedWords = [],
    mistakes = {},
    historicalMistakes = {},
    streak = { count: 0, lastDate: null }
  } = state;

  // ----------------------------------------
  // --- 2. 獨立 UI 狀態 ---
  // ----------------------------------------
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.8);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [scanMode, setScanMode] = useState('random');

  const [view, setView] = useState('dashboard');
  const [showMistakeModal, setShowMistakeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAllPreviewModal, setShowAllPreviewModal] = useState(false);
  const [showAudioSetupModal, setShowAudioSetupModal] = useState(false);
  const [showImportOptionsModal, setShowImportOptionsModal] = useState(false);
  const [showLicensesModal, setShowLicensesModal] = useState(false);

  // --- 字典與手動加字狀態 ---
  const [showDictModal, setShowDictModal] = useState(false);
  const [isDictHintMode, setIsDictHintMode] = useState(false);
  const [dictMaskWord, setDictMaskWord] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [dictResults, setDictResults] = useState([]);
  const [localMatches, setLocalMatches] = useState([]);
  const [formEn, setFormEn] = useState('');
  const [formPos, setFormPos] = useState('n.');
  const [formZh, setFormZh] = useState('');
  const [formEg, setFormEg] = useState('');
  const [insertPosition, setInsertPosition] = useState('end');

  // --- 編輯單字與全字庫過濾分頁狀態 ---
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editEn, setEditEn] = useState('');
  const [editPos, setEditPos] = useState('');
  const [editZh, setEditZh] = useState('');
  const [editEg, setEditEg] = useState('');
  const [allSearchQuery, setAllSearchQuery] = useState('');
  const [allPage, setAllPage] = useState(1);
  const itemsPerPage = 50;

  const [appLoaded, setAppLoaded] = useState(false);
  const inputRef = useRef(null);

  // ----------------------------------------
  // --- 3. Hook: OTA 更新 ---
  // ----------------------------------------
  const { otaUpdating, getUpdaterPlugin, triggerOtaCheck } = useOtaUpdate(APP_VERSION);

  // ----------------------------------------
  // --- 4. Hook: 音訊學習引擎 (TTS + 音訊循環) ---
  // ----------------------------------------
  const {
    audioSource, setAudioSource,
    audioRange, setAudioRange,
    audioStartIdx, setAudioStartIdx,
    audioEndIdx, setAudioEndIdx,
    audioQueue, setAudioQueue,
    currentAudioIndex, setCurrentAudioIndex,
    isAudioPlaying, setIsAudioPlaying,
    audioSettings, setAudioSettings,
    voices,
    audioStatusText,
    audioSubStep,
    activeSpellingChar,
    blindMode, setBlindMode,
    abortControllerRef,
    speak,
    unlockSpeechOnIOS,
    releaseWakeLock,
    stopAudio,
    pauseAudio,
    startAudio,
    runAudioLoop,
    buildAudioQueue,
    startAudioSession,
    playNextWord,
    playPrevWord,
  } = useAudioSession({
    speechRate,
    speechEnabled,
    isStorageLoaded,
    dbName,
    mistakes,
    historicalMistakes,
    vocabList,
    wordsPerDay,
    ghostsPerDay,
    currentDay,
    allPage,
    itemsPerPage,
    setView,
  });

  // ----------------------------------------
  // --- 5. Hook: 特訓邏輯 ---
  // ----------------------------------------
  const {
    sessionType, setSessionType,
    dailyStage, setDailyStage,
    queue, setQueue,
    currentWord, setCurrentWord,
    currentSessionWords, setCurrentSessionWords,
    userInput, setUserInput,
    typoCount, setTypoCount,
    mustTypeCorrectly, setMustTypeCorrectly,
    copyFailCount, setCopyFailCount,
    isCorrectFeedback, setIsCorrectFeedback,
    correctTimerRef,
    activeMistakesList,
    mistakesTotal,
    historyTotal,
    punishWord,
    proceedToNext,
    startTodaySession,
    startExamSession,
    startHistoryCheck,
    handleForceMistake,
    handleSurrender,
    handleScan,
    handleSpellingSubmit,
    handleExitSession: handleExitSessionBase,
    goToNextDay,
  } = useSessionLogic({
    state,
    setState,
    vocabList,
    wordsPerDay,
    ghostsPerDay,
    dbName,
    isStorageLoaded,
    scanMode,
    speak,
    setView,
    inputRef,
  });

  // handleExitSession wrapper to pass audio state
  const handleExitSession = async () => {
    await handleExitSessionBase(view, { currentAudioIndex, audioQueue, audioSource, audioRange });
  };

  // ----------------------------------------
  // --- 6. 初始化異步載入所有存檔與偏好設定 ---
  // ----------------------------------------
  useEffect(() => {
    async function loadConfig() {
      const updater = getUpdaterPlugin();
      if (updater) {
        try {
          await updater.notifyAppReady();
          console.log('[Update] notifyAppReady declared.');
        } catch (err) {
          console.error('[Update] notifyAppReady failed:', err);
        }
      }

      await initAllData();

      const savedRate = await window.persistentStorage.getSetting('vocab_speechRate', 0.8);
      setSpeechRate(parseFloat(savedRate) || 0.8);

      const savedEnabled = await window.persistentStorage.getSetting('vocab_speechEnabled', true);
      setSpeechEnabled(savedEnabled);

      const savedScanMode = await window.persistentStorage.getSetting('vocab_scanMode', 'random');
      setScanMode(['mcq', 'flashcard', 'random'].includes(savedScanMode) ? savedScanMode : 'random');

      const savedAudio = await window.persistentStorage.getSetting('vocab_audioSettings', null);
      const defaultSettings = {
        repeats: 1,
        wordPause: 0,
        hideSpelling: false,
        readExample: false,
        volume: 100,
        spellingPause: 0,
        enVoiceName: '',
        zhVoiceName: '',
        spellingRateMultiplier: 1.8
      };
      if (savedAudio) {
        setAudioSettings({
          ...defaultSettings,
          ...savedAudio,
          wordPause: 0,
          spellingPause: 0,
          volume: 100,
          enVoiceName: '',
          zhVoiceName: ''
        });
      } else {
        setAudioSettings(defaultSettings);
      }

      setAppLoaded(true);

      if (updater) {
        setTimeout(() => {
          triggerOtaCheck(updater);
        }, 3000);
      }
    }
    loadConfig();
  }, []);

  useEffect(() => {
    if (isStorageLoaded) window.persistentStorage.setSetting('vocab_speechRate', speechRate);
  }, [speechRate, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) window.persistentStorage.setSetting('vocab_speechEnabled', speechEnabled);
  }, [speechEnabled, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) window.persistentStorage.setSetting('vocab_scanMode', scanMode);
  }, [scanMode, isStorageLoaded]);

  // 自動暫存 (僅「今日特訓」寫入 vocab_tempSession_${dbName}_daily)
  useEffect(() => {
    if (!isStorageLoaded) return;

    const getTempSessionKey = (db, type) => {
      if (type !== 'daily') return null;
      return `vocab_tempSession_${db}_daily`;
    };

    async function handleTempSession() {
      const key = getTempSessionKey(dbName, sessionType);
      if (!key) return;

      if (view !== 'dashboard' && view !== 'summary') {
        const sessionData = {
          date: new Date().toDateString(),
          view,
          sessionType: 'daily',
          dbName,
          queue,
          currentSessionWords,
          spellingState: {
            userInput,
            typoCount,
            mustTypeCorrectly,
            copyFailCount,
            currentWordHasCountedMistake: currentWord?._hasCountedMistake || false
          },
          audioState: {
            currentAudioIndex,
            audioQueue,
            audioSource,
            audioRange
          }
        };
        await window.persistentStorage.setSetting(key, sessionData);
      } else if (view === 'summary') {
        await window.persistentStorage.setSetting(key, null);
      }
    }

    handleTempSession();

    const handleVisibilityChange = () => {
      if (document.hidden && view !== 'dashboard' && view !== 'summary') {
        handleTempSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queue, view, sessionType, dbName, currentSessionWords, userInput, typoCount, mustTypeCorrectly, copyFailCount, currentWord, currentAudioIndex, audioQueue, audioSource, audioRange, isStorageLoaded]);

  // 切換單字/畫面時自動發音 + 聚焦輸入框
  useEffect(() => {
    if ((view === 'scanning' || view === 'spelling') && currentWord) speak(currentWord.en);
    if (view === 'spelling' && inputRef.current) inputRef.current.focus();
  }, [currentWord, view]);

  // 音訊播放器：進入 audio_player 時自動啟動
  useEffect(() => {
    if (view === 'audio_player' && audioQueue.length > 0 && isAudioPlaying === false) {
      setIsAudioPlaying(true);
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      runAudioLoop(currentAudioIndex, audioQueue, audioSettings, abortController.signal);
    }

    return () => {
      if (view !== 'audio_player') {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        releaseWakeLock();
      }
    };
  }, [view, audioQueue]);

  // 鍵盤操作監聽
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMcq = (scanMode === 'mcq' || (scanMode === 'random' && !currentWord?._randomIsSpelling)) && (sessionType === 'exam' || sessionType === 'history' || (sessionType === 'daily' && dailyStage === 2));
      if (view === 'scanning' && currentWord && !isMcq) {
        if (e.key === 'ArrowLeft') handleScan(false);
        if (e.key === 'ArrowRight') handleScan(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [view, currentWord, queue, scanMode, sessionType, dailyStage]);

  // ----------------------------------------
  // --- 7. 核心統計指標 ---
  // ----------------------------------------
  let indicator = { color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/30', icon: '🟢', title: '良好' };
  if (mistakesTotal >= 50) indicator = { color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/30', icon: '🟡', title: '塞車' };
  if (mistakesTotal >= 100) indicator = { color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-950/30', icon: '🔴', title: '過載' };

  // getDailyWords wrapper (for PreviewModal backward compat)
  const getDailyWords = () => window.computeDailyWords(vocabList, currentDay, wordsPerDay, ghostsPerDay, historicalMistakes);

  const handleAudioSetupClick = async () => {
    const key = `vocab_tempSession_${dbName}_audio`;
    await window.persistentStorage.setSetting(key, null);
    setShowAudioSetupModal(true);
  };

  const handleStartAudioSession = () => startAudioSession(setShowAudioSetupModal);

  // ----------------------------------------
  // --- 8. 檔案匯入匯出與重置功能 ---
  // ----------------------------------------
  const downloadFile = async (filename, content, type) => {
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

    if (isNative) {
      let writeSuccess = false;
      try {
        const { Filesystem } = window.Capacitor.Plugins || {};
        const { Share } = window.Capacitor.Plugins || {};

        if (Filesystem && Share) {
          const result = await Filesystem.writeFile({
            path: filename,
            data: content,
            directory: 'CACHE',
            encoding: 'utf8'
          });
          writeSuccess = true;
          await Share.share({ title: filename, url: result.uri });
          return;
        }
      } catch (err) {
        console.error("Native file export/share failed:", err);
        if (writeSuccess) {
          console.log("User cancelled share sheet or share dismissed after successful write.");
          return;
        }
      }

      try {
        await navigator.clipboard.writeText(content);
        alert(`已複製匯出內容至剪貼簿！\n\n由於原生 App 限制，已自動將【${filename}】的內容複製到剪貼簿，您可以直接貼上至記事本儲存。`);
      } catch (clipErr) {
        console.error("Clipboard copy failed:", clipErr);
        alert("無法匯出檔案，請確保 App 權限。");
      }
    } else {
      const element = document.createElement("a");
      const file = new Blob([content], { type });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    }
  };

  const exportJson = async () => {
    const allDatabasesData = {};
    for (const db of dbList) {
      const vocab = await window.persistentStorage.loadDatabase(db);
      const st = await window.persistentStorage.loadDbState(db);
      const wpd = await window.persistentStorage.getSetting(`vocab_wordsPerDay_${db}`, null);
      const gpd = await window.persistentStorage.getSetting(`vocab_ghostsPerDay_${db}`, null);
      allDatabasesData[db] = {
        vocabList: vocab && vocab.length > 0 ? vocab : null,
        state: st,
        wordsPerDay: wpd,
        ghostsPerDay: gpd,
      };
    }

    const backup = window.exportImportUtils.buildNormalizedBackup(allDatabasesData, {
      currentDB: dbName,
      dbList,
      speechRate,
      speechEnabled
    });

    const now = new Date();
    const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    downloadFile(`極限完整備份_${timeStr}.json`, JSON.stringify(backup, null, 2), 'application/json');
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawContent = (event.target.result || '').replace(/^\uFEFF/, '').trim();
        const rawObj = JSON.parse(rawContent);

        let loaded7000 = window.rawVocab7000;
        if (!loaded7000 || loaded7000.length === 0 || loaded7000 === rawVocab) {
          try {
            const resp = await fetch('./7000_單字庫.txt');
            if (resp.ok) {
              const txt = await resp.text();
              const lines = txt.split("\n");
              const parsed7000 = [];
              lines.forEach(line => {
                const match = line.match(/^(?:\d+\.\s*)?\[(.*?)\]\s*(.*?)\s*-->\s*(.*)/);
                if (match) {
                  const [_, pos, en, rest] = match;
                  let zh = rest.trim(), eg = "";
                  if (zh.includes(" || ")) {
                    const parts = zh.split(" || ");
                    zh = parts[0].trim(); eg = parts[1].trim();
                  }
                  const item = { en: en.trim(), pos: pos.trim(), zh };
                  if (eg) item.eg = eg;
                  parsed7000.push(item);
                }
              });
              if (parsed7000.length > 0) {
                window.rawVocab7000 = parsed7000;
                loaded7000 = parsed7000;
              }
            }
          } catch (e7000) {
            console.warn("[Storage] Auto fetch 7000_單字庫.txt warning:", e7000);
          }
        }

        const effective7000 = loaded7000 || rawVocab;
        const rawVocabMap = { vocab_2000: rawVocab, vocab_7000: effective7000 };
        const parsed = window.exportImportUtils.parseUniversalBackup(rawObj, rawVocabMap);

        if (parsed.type === 'word_list') {
          if (window.confirm(`偵測到此檔案為「單字清單格式」（共 ${parsed.vocabList.length} 字）。\n\n是否將其匯入為目前字庫【${dbName}】的完整字庫？\n(這將會覆蓋目前字庫的單字，但保留您的學習紀錄與錯題)`)) {
            setVocabList(parsed.vocabList);
            await window.persistentStorage.saveDatabase(dbName, parsed.vocabList);
            setView('dashboard');
            alert(`單字清單匯入成功！共載入 ${parsed.vocabList.length} 個單字。`);
          }
          return;
        }

        if (parsed.type === 'full_system') {
          const dbCount = Object.keys(parsed.databases || {}).length;
          if (window.confirm(`偵測到此檔案為「系統完整備份檔案」（包含全部 ${dbCount} 個字庫及其學習進度與設定）。\n\n注意：這將會完全覆蓋您目前瀏覽器的所有字庫與學習進度！\n確定要繼續還原嗎？`)) {
            const { dbList: newDbList, currentDB: newCurrentDB, speechRate: newSpeechRate, speechEnabled: newSpeechEnabled } = parsed.globalSettings;

            const oldDbList = await window.persistentStorage.getDbList();
            for (const oldDb of oldDbList) {
              if (!newDbList.includes(oldDb)) {
                await window.persistentStorage.deleteDatabaseFiles(oldDb);
                await window.persistentStorage.removeSetting(`vocab_wordsPerDay_${oldDb}`);
                await window.persistentStorage.removeSetting(`vocab_ghostsPerDay_${oldDb}`);
              }
            }

            await window.persistentStorage.saveDbList(newDbList);
            await window.persistentStorage.setSetting('vocab_currentDB', newCurrentDB);
            await window.persistentStorage.setSetting('vocab_speechRate', newSpeechRate);
            await window.persistentStorage.setSetting('vocab_speechEnabled', newSpeechEnabled);

            for (const [db, dbData] of Object.entries(parsed.databases)) {
              if (dbData.vocabList && dbData.vocabList.length > 0) {
                await window.persistentStorage.saveDatabase(db, dbData.vocabList);
              } else if (db === 'vocab_7000') {
                await window.persistentStorage.saveDatabase(db, effective7000);
              } else if (db === 'vocab_2000') {
                await window.persistentStorage.saveDatabase(db, rawVocab);
              }
              if (dbData.state) await window.persistentStorage.saveDbState(db, dbData.state);
              if (dbData.wordsPerDay !== null && dbData.wordsPerDay !== undefined)
                await window.persistentStorage.setSetting(`vocab_wordsPerDay_${db}`, dbData.wordsPerDay);
              if (dbData.ghostsPerDay !== null && dbData.ghostsPerDay !== undefined)
                await window.persistentStorage.setSetting(`vocab_ghostsPerDay_${db}`, dbData.ghostsPerDay);
            }

            setDbList(newDbList);
            setSpeechRate(newSpeechRate);
            setSpeechEnabled(newSpeechEnabled);
            setDbName(newCurrentDB);

            const activeDbData = parsed.databases[newCurrentDB] || {};
            const savedState = activeDbData.state || defaultState;
            const savedVocab = (activeDbData.vocabList && activeDbData.vocabList.length > 0)
              ? activeDbData.vocabList
              : (newCurrentDB === 'vocab_7000' ? effective7000 : rawVocab);

            setState(savedState);
            setVocabList(savedVocab);
            setWordsPerDay(activeDbData.wordsPerDay || 50);
            setGhostsPerDay(activeDbData.ghostsPerDay || 10);
            setView('dashboard');
            alert(`系統完整還原成功！已成功載入 ${newDbList.length} 個字庫，並切換至：${newCurrentDB}`);
            return;
          }
          return;
        }

        if (parsed.type === 'single_db') {
          const targetDb = parsed.dbName;
          let currentDbList = [...dbList];
          if (!currentDbList.includes(targetDb)) {
            currentDbList.push(targetDb);
            setDbList(currentDbList);
            await window.persistentStorage.saveDbList(currentDbList);
          }

          const targetVocab = (parsed.vocabList && parsed.vocabList.length > 0)
            ? parsed.vocabList
            : (targetDb === 'vocab_7000' ? effective7000 : rawVocab);

          await window.persistentStorage.setSetting('vocab_currentDB', targetDb);
          await window.persistentStorage.saveDbState(targetDb, parsed.state);
          await window.persistentStorage.saveDatabase(targetDb, targetVocab);
          await window.persistentStorage.setSetting(`vocab_wordsPerDay_${targetDb}`, parsed.wordsPerDay);
          await window.persistentStorage.setSetting(`vocab_ghostsPerDay_${targetDb}`, parsed.ghostsPerDay);

          setDbName(targetDb);
          setState(parsed.state);
          setVocabList(targetVocab);
          setWordsPerDay(parsed.wordsPerDay);
          setGhostsPerDay(parsed.ghostsPerDay);
          setView('dashboard');
          alert(`成功覆蓋還原單一字庫！已切換至資料庫：${targetDb}`);
          return;
        }

        alert("JSON 格式不符，請確認是正確的備份檔案。");
      } catch (err) {
        console.error(err);
        alert(err.message || "檔案解析失敗。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const exportDictionaryTXT = () => {
    let content = "=== 特訓完整字庫 ===\n\n";
    vocabList.forEach((w, idx) => {
      content += `${idx + 1}. [${w.pos}] ${w.en} --> ${w.zh}${w.eg ? ` || ${w.eg}` : ''}\n`;
    });
    downloadFile(`字典_${dbName}.txt`, content, 'text/plain');
  };

  const exportHistoryTXT = () => {
    const historyList = Object.values(historicalMistakes || {});
    if (historyList.length === 0) return alert("歷史殿堂目前空空如也，無需匯出。");
    let content = `=== 歷史殿堂單字個人紀錄 ===\n\n`;
    historyList.forEach((m, idx) => {
      const itemData = (m && m.data) || { en: m?.en || '', zh: '[單字已自字典移除]', pos: 'n.', eg: '' };
      const vocabWord = (vocabList || []).find(w => w.en === itemData.en);
      const currentEg = (vocabWord && vocabWord.eg) || itemData.eg || '';
      content += `${idx + 1}. 錯誤次數: ${m.mistakesCount || m.totalFails || 0}次 | [${itemData.pos || 'n.'}] ${itemData.en || ''} --> ${itemData.zh || ''}${currentEg ? ` || ${currentEg}` : ''}\n`;
    });
    downloadFile(`歷史殿堂_${dbName}.txt`, content, 'text/plain');
  };

  const handleImportTXT = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = (event.target.result || '').replace(/^\uFEFF/, '').trim();
      const lines = text.split("\n");
      const importedVocab = [];

      lines.forEach(line => {
        const match = line.match(/^(?:\d+\.\s*)?\[(.*?)\]\s*(.*?)\s*-->\s*(.*)/);
        if (match) {
          const [_, pos, en, rest] = match;
          let zh = rest.trim();
          let eg = "";
          if (zh.includes(" || ")) {
            const parts = zh.split(" || ");
            zh = parts[0].trim();
            eg = parts[1].trim();
          }
          const word = { en: en.trim(), pos: pos.trim(), zh };
          if (eg) word.eg = eg;
          importedVocab.push(word);
        }
      });

      if (importedVocab.length > 0) {
        if (window.confirm(`確定匯入單字庫文字檔（共偵測到 ${importedVocab.length} 字）並覆蓋目前的字庫【${dbName}】嗎？`)) {
          setVocabList(importedVocab);
          await window.persistentStorage.saveDatabase(dbName, importedVocab);
          alert(`成功匯入單字庫！共載入 ${importedVocab.length} 個單字。`);
        }
      } else {
        alert("無法識別檔案內容，請確認格式（例如：1. [n.] challenge --> 挑戰）。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const loadBuiltInVocab = async (vocabType) => {
    const fileName = vocabType === '7000' ? '7000_單字庫.txt' : '2000_單字庫.txt';
    const titleName = vocabType === '7000' ? '7000 單字庫' : '2000 單字庫';
    try {
      const response = await fetch(`./${fileName}`);
      if (!response.ok) throw new Error(`無法載入檔案 ${fileName}`);
      const text = await response.text();
      const lines = text.split("\n");
      const importedVocab = [];

      lines.forEach(line => {
        const match = line.match(/^\d+\.\s*\[(.*?)\]\s*(.*?)\s*-->\s*(.*)/);
        if (match) {
          const [_, pos, en, rest] = match;
          let zh = rest.trim();
          let eg = "";
          if (zh.includes(" || ")) {
            const parts = zh.split(" || ");
            zh = parts[0].trim();
            eg = parts[1].trim();
          }
          const word = { en: en.trim(), pos: pos.trim(), zh };
          if (eg) word.eg = eg;
          importedVocab.push(word);
        }
      });

      if (importedVocab.length > 0) {
        if (window.confirm(`確定要載入內建的【${titleName}】（共 ${importedVocab.length} 字）並覆蓋目前的字庫【${dbName}】嗎？`)) {
          setVocabList(importedVocab);
          await window.persistentStorage.saveDatabase(dbName, importedVocab);
          alert(`成功載入內建【${titleName}】！共載入 ${importedVocab.length} 個單字。`);
        }
      } else {
        alert("載入的內建檔案格式無法識別！");
      }
    } catch (err) {
      console.error(err);
      alert(`載入失敗：${err.message}`);
    }
  };

  const handleImportHistoryTXT = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      if (text.includes("歷史殿堂單字個人紀錄")) {
        const lines = text.split("\n");
        const importedVocab = [];
        const importedHistory = {};

        lines.forEach(line => {
          const match = line.match(/錯誤(?:次數)?[:\s]*(\d+)次\s*\|\s*\[(.*?)\]\s*(.+?)\s*-->\s*(.*)/);
          if (match) {
            const [_, mistakesCount, pos, en, rest] = match;
            const wordKey = en.trim();
            const mCount = parseInt(mistakesCount, 10);
            let zh = rest.trim();
            let eg = '';
            if (zh.includes(' || ')) {
              const parts = zh.split(' || ');
              zh = parts[0].trim();
              eg = parts[1].trim();
            }
            const word = { en: wordKey, pos: pos.trim(), zh };
            if (eg) word.eg = eg;
            importedVocab.push(word);
            importedHistory[wordKey] = {
              mistakesCount: mCount,
              totalFails: mCount,
              archivedDate: Date.now(),
              step: 0,
              interval: 7,
              immune: false,
              data: word
            };
          }
        });

        if (importedVocab.length > 0) {
          if (window.confirm(`確定要匯入歷史殿堂備份嗎？這將會完全覆蓋目前字庫【${dbName}】的歷史殿堂（共載入 ${importedVocab.length} 個封存單字，並將新單字追加至目前字典字庫中）。`)) {
            setState(prev => ({ ...prev, historicalMistakes: importedHistory }));
            const existingEnSet = new Set(vocabList.map(w => w.en.trim().toLowerCase()));
            const toAppend = importedVocab.filter(w => !existingEnSet.has(w.en.trim().toLowerCase()));
            const mergedVocab = [...vocabList, ...toAppend];
            setVocabList(mergedVocab);
            await window.persistentStorage.saveDatabase(dbName, mergedVocab);
            alert(`成功將歷史殿堂單字追加至目前字典字庫！共追加 ${toAppend.length} 字（去重後字庫總計 ${mergedVocab.length} 字）。\n（此操作未重置當前學習天數與進度。）`);
          }
        } else {
          alert("無法識別檔案內容，請確認是正確的歷史殿堂備份 TXT 檔案。");
        }
      } else {
        alert("無法識別檔案格式，請確認是正確的字庫備份或歷史殿堂備份 TXT 檔案。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddDB = async () => {
    const newName = window.prompt("請輸入全新自訂資料庫名稱/代碼 (僅限英文與數字):");
    if (newName && newName.trim()) {
      const cleaned = newName.replace(/[^a-zA-Z0-9_]/g, '');
      if (cleaned) {
        let updated = [...dbList];
        if (!updated.includes(cleaned)) {
          updated.push(cleaned);
          setDbList(updated);
          await window.persistentStorage.saveDbList(updated);
        }
        await window.persistentStorage.saveDatabase(cleaned, []);
        await window.persistentStorage.saveDbState(cleaned, defaultState);
        await window.persistentStorage.setSetting('vocab_currentDB', cleaned);
        setDbName(cleaned);
        setVocabList([]);
        setState(defaultState);
        alert(`已成功建立並切換至全新自訂資料庫【${cleaned}】！\n您可以在字典管理中點擊「+ 新增單字」手動輸入，或點擊「⬆️ 匯入」載入單字。`);
      }
    }
  };

  const resetProgress = () => {
    if (window.confirm(`確定清除【${dbName}】的所有學習紀錄嗎？(包含歷史殿堂，無法復原)`)) setState(defaultState);
  };

  const deleteCurrentDB = async () => {
    if (window.confirm(`警告：確定要徹底刪除【${dbName}】字庫的所有資料與設定嗎？此操作無法復原。`)) {
      await window.persistentStorage.deleteDatabaseFiles(dbName);
      await window.persistentStorage.removeSetting(`vocab_wordsPerDay_${dbName}`);
      await window.persistentStorage.removeSetting(`vocab_ghostsPerDay_${dbName}`);
      await window.persistentStorage.removeSetting(`vocab_tempSession_${dbName}`);

      const updatedList = dbList.filter(name => name !== dbName);
      let nextDb;
      let isFirstLaunchRestored = false;

      if (updatedList.length > 0) {
        nextDb = updatedList[0];
      } else {
        const defaultInitialDbList = ['vocab_2000', 'vocab_7000'];
        updatedList.push(...defaultInitialDbList);
        nextDb = 'vocab_2000';
        isFirstLaunchRestored = true;
      }

      setDbList(updatedList);
      await window.persistentStorage.saveDbList(updatedList);
      await window.persistentStorage.setSetting('vocab_currentDB', nextDb);

      if (isFirstLaunchRestored) {
        alert(`已徹底刪除字庫【${dbName}】。\n目前所有字庫已清空，系統已自動執行第一次啟動初始化，復原預設範例字庫【vocab_2000】與【vocab_7000】！`);
      } else {
        alert(`已徹底刪除字庫【${dbName}】。已自動切換至資料庫：${nextDb}`);
      }
      window.location.reload();
    }
  };

  // ----------------------------------------
  // --- 9. 字典與單字增刪改查邏輯 ---
  // ----------------------------------------
  const handleDeleteWord = (indexInVocab, wordObj) => {
    if (indexInVocab === -1) {
      const fallbackWord = wordObj || currentWord;
      if (!fallbackWord) return;
      if (!window.confirm(`此單字已不在目前字庫中，確定要將其從「學習紀錄/錯題本」中移除嗎？`)) return;

      const wordEn = fallbackWord.en;
      setState(prev => {
        const nextState = { ...prev };
        if (prev.mistakes && prev.mistakes[wordEn]) {
          nextState.mistakes = { ...prev.mistakes };
          delete nextState.mistakes[wordEn];
        }
        if (prev.historicalMistakes && prev.historicalMistakes[wordEn]) {
          nextState.historicalMistakes = { ...prev.historicalMistakes };
          delete nextState.historicalMistakes[wordEn];
        }
        return nextState;
      });

      const newQueue = queue.filter(w => w.en.trim().toLowerCase() !== wordEn.trim().toLowerCase());
      setQueue(newQueue);
      const newSessionWords = currentSessionWords.filter(w => w.en.trim().toLowerCase() !== wordEn.trim().toLowerCase());
      setCurrentSessionWords(newSessionWords);

      if (view === 'scanning' || view === 'spelling') {
        if (newQueue.length === 0) {
          setView('summary');
        } else {
          if (currentWord && currentWord.en.trim().toLowerCase() === wordEn.trim().toLowerCase()) {
            setCurrentWord(newQueue[0]);
            setUserInput('');
            setTypoCount(0);
            setMustTypeCorrectly(false);
            setCopyFailCount(0);
          }
        }
      }
      return;
    }

    const wordToDelete = vocabList[indexInVocab];
    if (!wordToDelete) return;
    if (!window.confirm(`確定要從此字庫中「徹底刪除」單字【${wordToDelete.en}】嗎？\n此動作無法還原。`)) return;

    const updatedList = [...vocabList];
    updatedList.splice(indexInVocab, 1);
    setVocabList(updatedList);
    window.persistentStorage.saveDatabase(dbName, updatedList);

    setState(prev => {
      const nextState = { ...prev };
      if (prev.mistakes && prev.mistakes[wordToDelete.en]) {
        nextState.mistakes = { ...prev.mistakes };
        delete nextState.mistakes[wordToDelete.en];
      }
      if (prev.historicalMistakes && prev.historicalMistakes[wordToDelete.en]) {
        nextState.historicalMistakes = { ...prev.historicalMistakes };
        delete nextState.historicalMistakes[wordToDelete.en];
      }
      return nextState;
    });

    const newQueue = queue.filter(w => w.en.trim().toLowerCase() !== wordToDelete.en.trim().toLowerCase());
    setQueue(newQueue);
    const newSessionWords = currentSessionWords.filter(w => w.en.trim().toLowerCase() !== wordToDelete.en.trim().toLowerCase());
    setCurrentSessionWords(newSessionWords);

    if (view === 'scanning' || view === 'spelling') {
      if (newQueue.length === 0) {
        setView('summary');
      } else {
        if (currentWord && currentWord.en.trim().toLowerCase() === wordToDelete.en.trim().toLowerCase()) {
          setCurrentWord(newQueue[0]);
          setUserInput('');
          setTypoCount(0);
          setMustTypeCorrectly(false);
          setCopyFailCount(0);
        }
      }
    }
  };

  const startEditing = (idx) => {
    if (idx === -1) {
      alert('此單字不在目前字庫中，無法編輯。如需編輯，請先將此單字新增至字庫。');
      return;
    }
    const w = vocabList[idx];
    if (!w) return;
    setEditingIndex(idx);
    setEditEn(w.en);
    setEditPos(w.pos);
    setEditZh(w.zh);
    setEditEg(w.eg || '');
  };

  const handleSaveEdit = (e) => {
    if (e) e.preventDefault();
    if (editingIndex === -1) return;
    if (!editEn.trim() || !editZh.trim()) {
      alert('請填寫英文單字與中文解釋！');
      return;
    }

    const originalWord = vocabList[editingIndex];
    const newEn = editEn.trim();
    const newPos = editPos.trim();
    const newZh = editZh.trim();
    const newEg = editEg.trim();
    const newWordData = { en: newEn, pos: newPos, zh: newZh, eg: newEg };

    const updatedList = [...vocabList];
    updatedList[editingIndex] = newWordData;
    setVocabList(updatedList);
    window.persistentStorage.saveDatabase(dbName, updatedList);

    setState(prev => {
      const nextState = { ...prev };
      if (prev.mistakes && prev.mistakes[originalWord.en]) {
        const m = prev.mistakes[originalWord.en];
        const updatedMistake = { ...m, data: newWordData };
        nextState.mistakes = { ...prev.mistakes };
        if (originalWord.en !== newEn) {
          delete nextState.mistakes[originalWord.en];
          nextState.mistakes[newEn] = updatedMistake;
        } else {
          nextState.mistakes[newEn] = updatedMistake;
        }
      }
      if (prev.historicalMistakes && prev.historicalMistakes[originalWord.en]) {
        const h = prev.historicalMistakes[originalWord.en];
        const updatedHistory = { ...h, data: newWordData };
        nextState.historicalMistakes = { ...prev.historicalMistakes };
        if (originalWord.en !== newEn) {
          delete nextState.historicalMistakes[originalWord.en];
          nextState.historicalMistakes[newEn] = updatedHistory;
        } else {
          nextState.historicalMistakes[newEn] = updatedHistory;
        }
      }
      return nextState;
    });

    if ((view === 'scanning' || view === 'spelling') && currentWord) {
      if (currentWord.en.trim().toLowerCase() === originalWord.en.trim().toLowerCase()) {
        setCurrentWord({ ...currentWord, ...newWordData });
      }
      const updatedQueue = queue.map(qw => {
        if (qw.en.trim().toLowerCase() === originalWord.en.trim().toLowerCase()) {
          return { ...qw, ...newWordData };
        }
        return qw;
      });
      setQueue(updatedQueue);
    }

    setEditingIndex(-1);
  };

  const getFilteredVocab = () => {
    const q = allSearchQuery.trim().toLowerCase();
    if (!q) return vocabList.map((w, originalIdx) => ({ ...w, originalIdx }));
    return vocabList
      .map((w, originalIdx) => ({ ...w, originalIdx }))
      .filter(w => w.en.toLowerCase().includes(q) || w.zh.toLowerCase().includes(q) || w.pos.toLowerCase().includes(q));
  };

  const resetDictState = () => {
    setSearchQuery('');
    setSearchLoading(false);
    setSearchError(null);
    setDictResults([]);
    setLocalMatches([]);
    setFormEn('');
    setFormPos('n.');
    setFormZh('');
    setFormEg('');
    setInsertPosition('end');
  };

  const performSearch = async (queryStr) => {
    const query = queryStr.trim().toLowerCase();
    if (!query) return;

    setSearchLoading(true);
    setSearchError(null);
    setDictResults([]);

    const matches = [];
    for (const db of dbList) {
      const list = await window.persistentStorage.loadDatabase(db);
      if (list && list.length > 0) {
        const foundIdx = list.findIndex(w => w.en.trim().toLowerCase() === query);
        if (foundIdx !== -1) {
          const wPerDay = await window.persistentStorage.getSetting(`vocab_wordsPerDay_${db}`, 50);
          const dayNum = Math.floor(foundIdx / wPerDay) + 1;
          matches.push({ db, word: list[foundIdx], day: dayNum });
        }
      }
    }
    setLocalMatches(matches);

    const currentDbMatch = matches.find(m => m.db === dbName);
    if (currentDbMatch) {
      setFormEn(currentDbMatch.word.en);
      setFormPos(currentDbMatch.word.pos);
      setFormZh(currentDbMatch.word.zh);
      setFormEg(currentDbMatch.word.eg || '');
    } else {
      setFormEn(queryStr.trim());
      setFormPos('n.');
      setFormZh('');
      setFormEg('');
    }

    try {
      const results = await window.fetchDictionaryData(queryStr);
      setDictResults(results);
      setFormEn(results[0].word);
      setFormPos(results[0].pos);
      setFormZh(results[0].zh);
      setFormEg(results[0].eg || results[0].egEn || '');
    } catch (err) {
      console.error(err);
      setSearchError(`查詢失敗（${err.message}）。您仍可以直接在下方手動輸入。`);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    await performSearch(searchQuery);
  };

  const handleAddWord = async (e) => {
    e.preventDefault();
    const enVal = formEn.trim();
    const posVal = formPos.trim();
    const zhVal = formZh.trim();
    const egVal = formEg.trim();

    if (!enVal || !zhVal) {
      alert('請填寫英文單字與中文解釋！');
      return;
    }

    const newWord = { en: enVal, pos: posVal, zh: zhVal };
    if (egVal) newWord.eg = egVal;

    const existingIdx = vocabList.findIndex(w => w.en.trim().toLowerCase() === enVal.toLowerCase());
    let updatedList = [...vocabList];

    if (existingIdx !== -1) {
      if (!window.confirm(`單字【${enVal}】已存在目前字庫中，是否覆寫？`)) return;
      updatedList[existingIdx] = { ...updatedList[existingIdx], ...newWord };
    } else {
      if (insertPosition === 'current') {
        const targetIndex = currentDay * wordsPerDay;
        updatedList.splice(Math.min(targetIndex, updatedList.length), 0, newWord);
      } else {
        updatedList.push(newWord);
      }
    }

    setVocabList(updatedList);
    await window.persistentStorage.saveDatabase(dbName, updatedList);
    alert(`成功將單字【${enVal}】${existingIdx !== -1 ? '修改' : '新增'}至目前字庫中！`);
    setFormEn('');
    setFormPos('n.');
    setFormZh('');
    setFormEg('');
    setDictResults([]);
    setLocalMatches([]);
  };

  // ----------------------------------------
  // --- 10. 畫面渲染 (UI 分派) ---
  // ----------------------------------------
  if (!appLoaded) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-6 animate-[fadeIn_0.3s_ease-in-out]">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h2 className="text-2xl font-black text-indigo-400 tracking-wide">極限單字特訓系統</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">讀取特訓存檔中，請稍候...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">

      {/* Header 元件 */}
      {!(view === 'spelling' && isInputFocused) && (
        <Header
          displayVersion={DISPLAY_VERSION}
          indicator={indicator}
          mistakesTotal={mistakesTotal}
          streak={streak}
          currentDay={currentDay}
          setCurrentDay={(d) => setState(prev => ({ ...prev, currentDay: d }))}
          vocabListLength={vocabList.length}
          wordsPerDay={wordsPerDay}
          view={view}
        />
      )}

      {/* Main View 元件 */}
      <main className="flex-1 flex flex-col justify-center items-center">
        {view === 'dashboard' && (
          <Dashboard
            startTodaySession={startTodaySession}
            startExamSession={startExamSession}
            startHistoryCheck={startHistoryCheck}
            setShowAudioSetupModal={handleAudioSetupClick}
            setShowPreviewModal={setShowPreviewModal}
            setShowMistakeModal={setShowMistakeModal}
            setShowHistoryModal={setShowHistoryModal}
            setShowAllPreviewModal={setShowAllPreviewModal}
            setAllSearchQuery={setAllSearchQuery}
            setAllPage={setAllPage}
            setShowDictModal={setShowDictModal}
            resetDictState={resetDictState}
            vocabList={vocabList}
            activeMistakesList={activeMistakesList}
            learnedWords={learnedWords}
            historyTotal={historyTotal}
            dbName={dbName}
            setDbName={setDbName}
            dbList={dbList}
            handleAddDB={handleAddDB}
            wordsPerDay={wordsPerDay}
            setWordsPerDay={setWordsPerDay}
            ghostsPerDay={ghostsPerDay}
            setGhostsPerDay={setGhostsPerDay}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
            speechEnabled={speechEnabled}
            setSpeechEnabled={setSpeechEnabled}
            scanMode={scanMode}
            setScanMode={setScanMode}
            exportDictionaryTXT={exportDictionaryTXT}
            setShowImportOptionsModal={setShowImportOptionsModal}
            exportHistoryTXT={exportHistoryTXT}
            handleImportHistoryTXT={handleImportHistoryTXT}
            exportJson={exportJson}
            handleImportJson={handleImportJson}
            resetProgress={resetProgress}
            deleteCurrentDB={deleteCurrentDB}
            setShowLicensesModal={setShowLicensesModal}
          />
        )}

        {view === 'scanning' && currentWord && (
          <ScanningSession
            queue={queue}
            currentWord={currentWord}
            sessionType={sessionType}
            dailyStage={dailyStage}
            scanMode={scanMode}
            handleExitSession={handleExitSession}
            setIsDictHintMode={setIsDictHintMode}
            setDictMaskWord={setDictMaskWord}
            setShowDictModal={setShowDictModal}
            setSearchQuery={setSearchQuery}
            performSearch={performSearch}
            speak={speak}
            startEditing={startEditing}
            handleDeleteWord={handleDeleteWord}
            vocabList={vocabList}
            activeMistakesList={activeMistakesList}
            historicalMistakes={historicalMistakes}
            handleScan={handleScan}
          />
        )}

        {view === 'spelling' && currentWord && (
          <SpellingSession
            queue={queue}
            currentWord={currentWord}
            sessionType={sessionType}
            handleExitSession={handleExitSession}
            speak={speak}
            startEditing={startEditing}
            handleDeleteWord={handleDeleteWord}
            vocabList={vocabList}
            typoCount={typoCount}
            mustTypeCorrectly={mustTypeCorrectly}
            copyFailCount={copyFailCount}
            userInput={userInput}
            setUserInput={setUserInput}
            isInputFocused={isInputFocused}
            setIsInputFocused={setIsInputFocused}
            inputRef={inputRef}
            handleSpellingSubmit={handleSpellingSubmit}
            handleSurrender={handleSurrender}
            handleForceMistake={handleForceMistake}
            proceedToNext={proceedToNext}
            isCorrectFeedback={isCorrectFeedback}
          />
        )}

        {view === 'summary' && (
          <SummarySession
            sessionType={sessionType}
            goToNextDay={goToNextDay}
          />
        )}

        {view === 'audio_player' && audioQueue.length > 0 && (
          <AudioPlayer
            audioQueue={audioQueue}
            currentAudioIndex={currentAudioIndex}
            stopAudio={stopAudio}
            audioSource={audioSource}
            blindMode={blindMode}
            setBlindMode={setBlindMode}
            audioSubStep={audioSubStep}
            activeSpellingChar={activeSpellingChar}
            audioStatusText={audioStatusText}
            playPrevWord={playPrevWord}
            isAudioPlaying={isAudioPlaying}
            pauseAudio={pauseAudio}
            startAudio={startAudio}
            playNextWord={playNextWord}
            audioSettings={audioSettings}
          />
        )}
      </main>

      {/* --- Helper Modals --- */}
      <AudioSetupModal
        showAudioSetupModal={showAudioSetupModal}
        setShowAudioSetupModal={setShowAudioSetupModal}
        audioSource={audioSource}
        setAudioSource={setAudioSource}
        audioRange={audioRange}
        setAudioRange={setAudioRange}
        audioStartIdx={audioStartIdx}
        setAudioStartIdx={setAudioStartIdx}
        audioEndIdx={audioEndIdx}
        setAudioEndIdx={setAudioEndIdx}
        vocabList={vocabList}
        activeMistakesList={activeMistakesList}
        historicalMistakes={historicalMistakes}
        itemsPerPage={itemsPerPage}
        allPage={allPage}
        audioSettings={audioSettings}
        setAudioSettings={setAudioSettings}
        voices={voices}
        startAudioSession={handleStartAudioSession}
        speechRate={speechRate}
      />

      <PreviewModal
        showPreviewModal={showPreviewModal}
        setShowPreviewModal={setShowPreviewModal}
        dbName={dbName}
        getDailyWords={getDailyWords}
        speak={speak}
        startEditing={startEditing}
        handleDeleteWord={handleDeleteWord}
        vocabList={vocabList}
      />

      <MistakeModal
        showMistakeModal={showMistakeModal}
        setShowMistakeModal={setShowMistakeModal}
        activeMistakesList={activeMistakesList}
        speak={speak}
        vocabList={vocabList}
        startEditing={startEditing}
        handleDeleteWord={handleDeleteWord}
        setState={setState}
      />

      <HistoryModal
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        historyTotal={historyTotal}
        historicalMistakes={historicalMistakes}
        speak={speak}
      />

      <DictModal
        showDictModal={showDictModal}
        setShowDictModal={setShowDictModal}
        isDictHintMode={isDictHintMode}
        dictMaskWord={dictMaskWord}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        speak={speak}
        handleSearch={handleSearch}
        searchLoading={searchLoading}
        searchError={searchError}
        localMatches={localMatches}
        dbName={dbName}
        dictResults={dictResults}
        setFormEn={setFormEn}
        setFormPos={setFormPos}
        setFormZh={setFormZh}
        setFormEg={setFormEg}
        formEn={formEn}
        formPos={formPos}
        formZh={formZh}
        formEg={formEg}
        insertPosition={insertPosition}
        setInsertPosition={setInsertPosition}
        handleAddWord={handleAddWord}
        currentDay={currentDay}
      />

      <AllPreviewModal
        showAllPreviewModal={showAllPreviewModal}
        setShowAllPreviewModal={setShowAllPreviewModal}
        dbName={dbName}
        vocabList={vocabList}
        allSearchQuery={allSearchQuery}
        setAllSearchQuery={setAllSearchQuery}
        setAllPage={setAllPage}
        allPage={allPage}
        itemsPerPage={itemsPerPage}
        getFilteredVocab={getFilteredVocab}
        speak={speak}
        startEditing={startEditing}
        handleDeleteWord={handleDeleteWord}
      />

      <EditWordModal
        editingIndex={editingIndex}
        setEditingIndex={setEditingIndex}
        editEn={editEn}
        setEditEn={setEditEn}
        editPos={editPos}
        setEditPos={setEditPos}
        editZh={editZh}
        setEditZh={setEditZh}
        editEg={editEg}
        setEditEg={setEditEg}
        speak={speak}
        handleSaveEdit={handleSaveEdit}
      />

      <ImportOptionsModal
        showImportOptionsModal={showImportOptionsModal}
        setShowImportOptionsModal={setShowImportOptionsModal}
        loadBuiltInVocab={loadBuiltInVocab}
        handleImportTXT={handleImportTXT}
      />

      <LicensesModal
        showLicensesModal={showLicensesModal}
        setShowLicensesModal={setShowLicensesModal}
      />

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
