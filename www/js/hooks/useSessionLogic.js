// ==========================================
// --- 🎯 Custom Hook: useSessionLogic.js ---
// ==========================================
// 負責所有特訓關卡的核心業務邏輯：
//   - 今日特訓、錯題大會考、歷史抽查的啟動
//   - 閃卡翻頁 (handleScan)、拼字提交 (handleSpellingSubmit)
//   - 懲罰 (punishWord)、進階 (proceedToNext)、暫停 (handleExitSession)
//   - SRS 雙倍消除演算法
//
// 依賴：state, setState (來自 useVocabState)
//        vocabList, wordsPerDay, ghostsPerDay, currentDay (來自 useVocabState)
//        dbName, isStorageLoaded (來自 useVocabState)
//        scanMode (來自 app.js 偏好)
//        speak (來自 useAudioSession)
//        setView (來自 app.js 畫面控制)
//        inputRef (來自 app.js)

window.useSessionLogic = ({
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
}) => {
  const { currentDay, mistakes = {}, historicalMistakes = {} } = state;

  // --- Session State ---
  const [sessionType, setSessionType] = React.useState('daily');
  const [dailyStage, setDailyStage] = React.useState(1);
  const [queue, setQueue] = React.useState([]);
  const [currentWord, setCurrentWord] = React.useState(null);
  const [currentSessionWords, setCurrentSessionWords] = React.useState([]);
  const [userInput, setUserInput] = React.useState('');
  const [typoCount, setTypoCount] = React.useState(0);
  const [mustTypeCorrectly, setMustTypeCorrectly] = React.useState(false);
  const [copyFailCount, setCopyFailCount] = React.useState(0);
  const [isCorrectFeedback, setIsCorrectFeedback] = React.useState(false);
  const correctTimerRef = React.useRef(null);

  // --- Derived ---
  const activeMistakesList = Object.values(mistakes).filter(m => m.mistakesCount > 0);
  const mistakesTotal = activeMistakesList.length;
  const historyTotal = Object.keys(historicalMistakes).length;

  // --- Auto-speak & input focus when currentWord or view changes ---
  // Note: speak + view not available here; managed in app.js useEffect

  // --- Temp session key ---
  const getTempSessionKey = (db, type) => {
    if (type !== 'daily') return null;
    return `vocab_tempSession_${db}_daily`;
  };

  // --- 隨機模式：為每個 word 決定本次是拼寫或 MCQ ---
  // 僅在 isTestingStage (exam/history/daily-stage2) 才套用隨機
  const assignRandomModes = (words) => {
    if (scanMode !== 'random') return words;
    return words.map(w => ({
      ...w,
      _randomIsSpelling: Math.random() < 0.5
    }));
  };

  // --- 根據 scanMode 與第一個 word 決定 setView 目標 ---
  const pickViewForWord = (word, isTestingStage) => {
    if (!isTestingStage) return 'scanning';
    if (scanMode === 'mcq') return 'scanning';
    if (scanMode === 'flashcard') return 'spelling';
    // random 模式：看 word 上的標記
    return (word && word._randomIsSpelling) ? 'spelling' : 'scanning';
  };

  // --- punishWord ---
  const punishWord = (wordObj) => {
    setState(prev => {
      const m = prev.mistakes[wordObj.en] || { mistakesCount: 0, correctCount: 0, data: wordObj };
      const newMistakes = { ...prev.mistakes, [wordObj.en]: { ...m, mistakesCount: m.mistakesCount + 1, correctCount: 0 } };
      const newHistory = { ...prev.historicalMistakes };
      if (wordObj._isGhost || wordObj._isHistoryCheck) delete newHistory[wordObj.en];
      return { ...prev, mistakes: newMistakes, historicalMistakes: newHistory };
    });
  };

  // --- proceedToNext ---
  const proceedToNext = (queueRef, sessionTypeRef, setViewFn) => {
    if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
    const newQueue = (queueRef || queue).slice(1);
    setTypoCount(0);
    setMustTypeCorrectly(false);
    setCopyFailCount(0);
    setUserInput('');
    setIsCorrectFeedback(false);
    const curSessionType = sessionTypeRef || sessionType;
    if (newQueue.length === 0) {
      if (curSessionType === 'daily') {
        const todayStr = new Date().toDateString();
        setState(prev => {
          const last = prev.streak?.lastDate;
          let newCount = prev.streak?.count || 0;
          if (last !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (last === yesterday.toDateString()) newCount += 1;
            else newCount = 1;
          }
          return { ...prev, streak: { count: newCount, lastDate: todayStr } };
        });
      }
      (setViewFn || setView)('summary');
    } else {
      setQueue(newQueue);
      setCurrentWord(newQueue[0]);
      // 隨機模式下，根據下一個 word 的標記切換 view
      const isTestingStage = curSessionType === 'exam' || curSessionType === 'history' || (curSessionType === 'daily' && dailyStage === 2);
      if (scanMode === 'random' && isTestingStage) {
        (setViewFn || setView)(newQueue[0]._randomIsSpelling ? 'spelling' : 'scanning');
      }
    }
  };

  // --- startTodaySession ---
  const startTodaySession = async () => {
    const key = `vocab_tempSession_${dbName}_daily`;
    let tempSession = await window.persistentStorage.getSetting(key, null);
    if (!tempSession) tempSession = await window.persistentStorage.getSetting(`vocab_tempSession_${dbName}`, null);

    if (tempSession && tempSession.queue && tempSession.queue.length > 0 && tempSession.date === new Date().toDateString()) {
      if ((tempSession.dbName && tempSession.dbName !== dbName) || (tempSession.sessionType && tempSession.sessionType !== 'daily')) {
        console.log(`[TempSession] Skip today session resume: mismatch (dbName: ${tempSession.dbName} vs ${dbName}, type: ${tempSession.sessionType})`);
        await window.persistentStorage.setSetting(key, null);
        await window.persistentStorage.setSetting(`vocab_tempSession_${dbName}`, null);
      } else if (window.confirm(`偵測到您有暫停存檔的「今日特訓」進度 (剩餘 ${tempSession.queue.length} 字)，是否繼續從上次暫停的地方開始？\n（選擇「取消」將放棄暫存進度並重新開始）`)) {
        setSessionType('daily');
        setCurrentSessionWords(tempSession.currentSessionWords || []);
        setQueue(tempSession.queue);
        if (tempSession.spellingState) {
          setUserInput(tempSession.spellingState.userInput || '');
          setTypoCount(tempSession.spellingState.typoCount || 0);
          setMustTypeCorrectly(!!tempSession.spellingState.mustTypeCorrectly);
          setCopyFailCount(tempSession.spellingState.copyFailCount || 0);
          if (tempSession.queue[0] && tempSession.spellingState.currentWordHasCountedMistake) {
            tempSession.queue[0]._hasCountedMistake = true;
          }
        }
        setCurrentWord(tempSession.queue[0]);
        setView(tempSession.view || 'scanning');
        return;
      } else {
        await window.persistentStorage.setSetting(key, null);
        await window.persistentStorage.setSetting(`vocab_tempSession_${dbName}`, null);
      }
    }

    const { baseWords, ghostWords } = window.computeDailyWords(vocabList, currentDay, wordsPerDay, ghostsPerDay, historicalMistakes);
    if (baseWords.length === 0) return alert('字典為空，請先匯入字庫！');

    const initializedWords = baseWords.map(w => ({ ...w, _hasCountedMistake: false }));
    const combined = [...initializedWords, ...ghostWords];

    setSessionType('daily');
    setDailyStage(1);
    setCurrentSessionWords(combined);
    setQueue(combined);
    setCurrentWord(combined[0]);
    setView('scanning');
  };

  // --- startExamSession ---
  const startExamSession = async () => {
    const key = `vocab_tempSession_${dbName}_exam`;
    await window.persistentStorage.setSetting(key, null);

    if (mistakesTotal === 0) return alert('錯題庫目前完美清空，無需降溫大會考！🎉');
    const base = [...activeMistakesList].sort(() => 0.5 - Math.random()).slice(0, 50).map(m => ({ ...m.data, _hasCountedMistake: false }));
    const shuffled = assignRandomModes(base);
    setSessionType('exam');
    setCurrentSessionWords(shuffled);
    setQueue(shuffled);
    setCurrentWord(shuffled[0]);
    setTypoCount(0);
    setMustTypeCorrectly(false);
    setCopyFailCount(0);
    if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
    setIsCorrectFeedback(false);
    setUserInput('');
    setView(pickViewForWord(shuffled[0], true));
  };

  // --- startHistoryCheck ---
  const startHistoryCheck = async () => {
    const key = `vocab_tempSession_${dbName}_history`;
    await window.persistentStorage.setSetting(key, null);

    if (historyTotal === 0) return alert('歷史殿堂目前為空，請先完成日常錯題的雙倍消除！');
    const base = Object.values(historicalMistakes).sort(() => 0.5 - Math.random()).slice(0, 50).map(h => ({ ...h.data, _hasCountedMistake: false, _isHistoryCheck: true, _historyData: h }));
    const shuffled = assignRandomModes(base);
    setSessionType('history');
    setCurrentSessionWords(shuffled);
    setQueue(shuffled);
    setCurrentWord(shuffled[0]);
    setTypoCount(0);
    setMustTypeCorrectly(false);
    setCopyFailCount(0);
    if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
    setIsCorrectFeedback(false);
    setUserInput('');
    setView(pickViewForWord(shuffled[0], true));
  };

  // --- handleForceMistake ---
  const handleForceMistake = () => {
    speak(currentWord.en);
    punishWord(currentWord);
    proceedToNext();
  };

  // --- handleSurrender ---
  const handleSurrender = () => {
    speak(currentWord.en);
    setTypoCount(2);
    setMustTypeCorrectly(true);
    setCopyFailCount(0);
    setUserInput('');
    if (!currentWord._hasCountedMistake) {
      currentWord._hasCountedMistake = true;
      punishWord(currentWord);
    }
  };

  // --- handleScan (flashcard / MCQ) ---
  const handleScan = (isKnown) => {
    const current = queue[0];
    const newQueue = queue.slice(1);

    const isTestingStage = sessionType === 'exam' || sessionType === 'history' || (sessionType === 'daily' && dailyStage === 2);

    setState(prev => {
      const nextState = { ...prev };

      if (!nextState.learnedWords.includes(current.en)) {
        nextState.learnedWords = [...nextState.learnedWords, current.en];
      }

      if (isKnown && isTestingStage) {
        // 雙倍消除演算法 (Double Elimination Algorithm)
        if (prev.mistakes[current.en]) {
          const m = prev.mistakes[current.en];
          const newCorrect = (m.correctCount || 0) + 1;
          const target = Math.min(m.mistakesCount * 2, 6);

          if (newCorrect >= target) {
            const newHistory = { ...prev.historicalMistakes };
            newHistory[current.en] = {
              mistakesCount: m.mistakesCount,
              totalFails: (newHistory[current.en]?.totalFails || 0) + m.mistakesCount,
              archivedDate: Date.now(),
              step: 0, interval: 7, immune: false, data: current
            };
            delete nextState.mistakes[current.en];
            nextState.historicalMistakes = newHistory;
          } else {
            nextState.mistakes = { ...prev.mistakes, [current.en]: { ...m, correctCount: newCorrect } };
          }
        }

        // 歷史幽靈 / 隨機抽查 SRS 進階
        if (current._isGhost || current._isHistoryCheck) {
          const intervals = [7, 21, 60, 180];
          const h = current._historyData || prev.historicalMistakes[current.en];
          if (h) {
            const nextStep = (h.step || 0) + 1;
            const newHistory = { ...nextState.historicalMistakes };

            if (nextStep >= 4) {
              newHistory[current.en] = { ...h, immune: true };
            } else {
              newHistory[current.en] = { ...h, step: nextStep, interval: intervals[nextStep], archivedDate: Date.now() };
            }
            nextState.historicalMistakes = newHistory;
          }
        }
      }

      return nextState;
    });

    if (!isKnown) {
      current._hasCountedMistake = true;
      punishWord(current);
    }

    if (newQueue.length === 0) {
      if (sessionType === 'daily' && dailyStage === 1) {
        setDailyStage(2);
        const stage2Words = assignRandomModes(currentSessionWords);
        setQueue(stage2Words);
        setCurrentWord(stage2Words[0]);
        setTypoCount(0);
        setMustTypeCorrectly(false);
        setCopyFailCount(0);
        if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
        setIsCorrectFeedback(false);
        setUserInput('');
        setView(pickViewForWord(stage2Words[0], true));
      } else {
        if (sessionType === 'daily') {
          const todayStr = new Date().toDateString();
          setState(prev => {
            const last = prev.streak?.lastDate;
            let newCount = prev.streak?.count || 0;
            if (last !== todayStr) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              if (last === yesterday.toDateString()) newCount += 1;
              else newCount = 1;
            }
            return { ...prev, streak: { count: newCount, lastDate: todayStr } };
          });
        }
        setView('summary');
      }
    } else {
      setQueue(newQueue);
      setCurrentWord(newQueue[0]);
      // 隨機模式下，根據下一個 word 的標記切換 view
      const isTestingStage = sessionType === 'exam' || sessionType === 'history' || (sessionType === 'daily' && dailyStage === 2);
      if (scanMode === 'random' && isTestingStage) {
        setView(newQueue[0]._randomIsSpelling ? 'spelling' : 'scanning');
      }
    }
  };

  // --- handleSpellingSubmit ---
  const handleSpellingSubmit = (e) => {
    if (e) e.preventDefault();

    if (isCorrectFeedback) {
      if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
      setIsCorrectFeedback(false);
      proceedToNext();
      return;
    }

    const cleanInput = window.cleanApostrophe(userInput);
    const cleanTarget = window.cleanApostrophe(currentWord.en);
    const isCorrect = cleanInput === cleanTarget;

    if (isCorrect) {
      if (mustTypeCorrectly) {
        setCopyFailCount(0);
      } else {
        setState(prev => {
          const nextState = { ...prev };

          if (prev.mistakes[currentWord.en]) {
            const m = prev.mistakes[currentWord.en];
            const newCorrect = (m.correctCount || 0) + 1;
            const target = Math.min(m.mistakesCount * 2, 6);

            if (newCorrect >= target) {
              const newHistory = { ...prev.historicalMistakes };
              newHistory[currentWord.en] = {
                mistakesCount: m.mistakesCount,
                totalFails: (newHistory[currentWord.en]?.totalFails || 0) + m.mistakesCount,
                archivedDate: Date.now(),
                step: 0, interval: 7, immune: false, data: currentWord
              };
              delete nextState.mistakes[currentWord.en];
              nextState.historicalMistakes = newHistory;
            } else {
              nextState.mistakes = { ...prev.mistakes, [currentWord.en]: { ...m, correctCount: newCorrect } };
            }
          }

          // 歷史幽靈 / 隨機抽查 SRS 進階（與 handleScan 邏輯一致）
          if (currentWord._isGhost || currentWord._isHistoryCheck) {
            const intervals = [7, 21, 60, 180];
            const h = currentWord._historyData || prev.historicalMistakes[currentWord.en];
            if (h) {
              const nextStep = (h.step || 0) + 1;
              const newHistory = { ...nextState.historicalMistakes };

              if (nextStep >= 4) {
                newHistory[currentWord.en] = { ...h, immune: true };
              } else {
                newHistory[currentWord.en] = { ...h, step: nextStep, interval: intervals[nextStep], archivedDate: Date.now() };
              }
              nextState.historicalMistakes = newHistory;
            }
          }

          return nextState;
        });
      }

      setIsCorrectFeedback(true);
      if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
      correctTimerRef.current = setTimeout(() => {
        setIsCorrectFeedback(false);
        proceedToNext();
      }, 180);
    } else {
      speak(currentWord.en);
      if (mustTypeCorrectly) {
        const nextCopyFail = copyFailCount + 1;
        if (nextCopyFail >= 3) {
          alert(`已連續輸入錯誤 ${nextCopyFail} 次，系統自動跳過此單字：${currentWord.en}`);
          setCopyFailCount(0);
          proceedToNext();
        } else {
          setCopyFailCount(nextCopyFail);
          setUserInput('');
        }
      } else {
        if (typoCount === 0) {
          setTypoCount(1);
          setUserInput('');
        } else {
          setTypoCount(2);
          setMustTypeCorrectly(true);
          setCopyFailCount(0);
          setUserInput('');
          if (!currentWord._hasCountedMistake) {
            currentWord._hasCountedMistake = true;
            punishWord(currentWord);
          }
        }
      }
    }
  };

  // --- handleExitSession ---
  const handleExitSession = async (view, audioState) => {
    if (window.confirm('確定要暫停離開嗎？')) {
      const key = getTempSessionKey(dbName, sessionType);
      if (key) {
        const sessionData = {
          date: new Date().toDateString(),
          view,
          sessionType,
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
          audioState: audioState || {}
        };
        await window.persistentStorage.setSetting(key, sessionData);
      }
      setView('dashboard');
    }
  };

  // --- goToNextDay ---
  const goToNextDay = () => {
    if (sessionType === 'daily') setState(prev => ({ ...prev, currentDay: prev.currentDay + 1 }));
    setView('dashboard');
  };

  // --- Keyboard listener ---
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const isMcq = scanMode === 'mcq' && (sessionType === 'exam' || sessionType === 'history' || (sessionType === 'daily' && dailyStage === 2));
      // view is not available here — this effect is managed in app.js
    };
    // Keyboard listener is managed from app.js due to view dependency
  }, []);

  return {
    // State
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
    // Derived
    activeMistakesList,
    mistakesTotal,
    historyTotal,
    // Functions
    punishWord,
    proceedToNext,
    startTodaySession,
    startExamSession,
    startHistoryCheck,
    handleForceMistake,
    handleSurrender,
    handleScan,
    handleSpellingSubmit,
    handleExitSession,
    goToNextDay,
  };
};
