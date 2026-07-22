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
