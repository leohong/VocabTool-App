// ==========================================
// --- 🔊 Custom Hook: useAudioSession.js ---
// ==========================================
// 負責所有 TTS 發音引擎 + 音訊學習播放循環
// 依賴：speechRate, speechEnabled (來自 app.js 偏好設定)
//        vocabList, wordsPerDay, ghostsPerDay, currentDay, historicalMistakes, mistakes (來自 useVocabState)
//        allPage, itemsPerPage (來自 app.js 分頁狀態)
//        setView (來自 app.js 畫面控制)

window.useAudioSession = ({
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
}) => {
  const [audioSource, setAudioSource] = React.useState('daily');
  const [audioRange, setAudioRange] = React.useState('all');
  const [audioStartIdx, setAudioStartIdx] = React.useState(1);
  const [audioEndIdx, setAudioEndIdx] = React.useState(50);
  const [audioQueue, setAudioQueue] = React.useState([]);
  const [currentAudioIndex, setCurrentAudioIndex] = React.useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const [audioSettings, setAudioSettings] = React.useState({
    repeats: 1,
    wordPause: 0,
    hideSpelling: false,
    readExample: false,
    volume: 100,
    spellingPause: 0,
    spellingStartDelay: 0.15,
    enVoiceName: '',
    zhVoiceName: '',
    spellingRateMultiplier: 1.8
  });
  const [voices, setVoices] = React.useState([]);
  const [audioStatusText, setAudioStatusText] = React.useState('準備中');
  const [audioSubStep, setAudioSubStep] = React.useState('none');
  const [activeSpellingChar, setActiveSpellingChar] = React.useState(-1);
  const [blindMode, setBlindMode] = React.useState(false);

  const wakeLockRef = React.useRef(null);
  const abortControllerRef = React.useRef(null);

  // --- Voice list loading ---
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        setVoices(allVoices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // --- Audio settings persistence ---
  React.useEffect(() => {
    if (isStorageLoaded) {
      window.persistentStorage.setSetting('vocab_audioSettings', audioSettings);
    }
  }, [audioSettings, isStorageLoaded]);

  // --- Helper: Capacitor TTS plugin ---
  const getTtsPlugin = () => {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech) {
      return window.Capacitor.Plugins.TextToSpeech;
    }
    return null;
  };

  // --- Wake Lock ---
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
      });
    }
  };

  // --- iOS TTS unlock ---
  const unlockSpeechOnIOS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
      if (isIOS) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(' ');
        u.lang = 'en-US';
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    }
  };

  // --- speak (single, respects speechEnabled toggle) ---
  const speak = async (text, isManual = false) => {
    console.log('TTS speak called. Text:', text, 'isManual:', isManual, 'speechEnabled:', speechEnabled);
    if (!isManual && !speechEnabled) {
      console.log('TTS speak aborted: speechEnabled is false');
      return;
    }

    const tts = getTtsPlugin();
    if (tts) {
      console.log('TTS using native Capacitor plugin for:', text);
      try {
        await tts.stop();
        await tts.speak({
          text: text,
          lang: 'en-US',
          rate: speechRate,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient'
        });
        console.log('TTS native speak completed:', text);
      } catch (err) {
        console.error('TTS native speak error:', err);
      }
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      console.log('TTS using Web Speech API');
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = speechRate;
      utterance.onstart = () => console.log('TTS speak started:', text);
      utterance.onend = () => console.log('TTS speak ended:', text);
      utterance.onerror = (e) => {
        console.error('TTS speak error event:', e.error, e);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('TTS using Google Translate fallback for:', text);
      try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(text)}`;
        const audio = new Audio(url);
        audio.play().catch(err => console.error('Google TTS Play Error:', err));
      } catch (e) {
        console.error('Google TTS Fallback failed:', e);
      }
    }
  };

  // --- speakAsync (for audio loop, abortable) ---
  const speakAsync = (text, lang, voiceName, signal, rate) => {
    const effectiveRate = rate !== undefined ? rate : speechRate;
    return new Promise(async (resolve) => {
      console.log('TTS speakAsync called. Text:', text, 'lang:', lang, 'voiceName:', voiceName);
      if (signal && signal.aborted) {
        console.log('TTS speakAsync aborted: signal aborted');
        resolve();
        return;
      }

      const tts = getTtsPlugin();
      if (tts) {
        console.log('TTS speakAsync using native Capacitor plugin');
        try {
          await tts.stop();

          const onAbort = () => {
            tts.stop();
            resolve();
          };
          if (signal) signal.addEventListener('abort', onAbort);

          await tts.speak({
            text: text,
            lang: lang ? lang.replace('_', '-') : 'en-US',
            rate: effectiveRate,
            pitch: 1.0,
            volume: (audioSettings.volume ?? 80) / 100,
            category: 'ambient'
          });

          if (signal) signal.removeEventListener('abort', onAbort);
          console.log('TTS speakAsync native speak completed:', text);
          resolve();
        } catch (err) {
          console.error('TTS speakAsync native speak error:', err);
          resolve();
        }
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = effectiveRate;
        utterance.volume = (audioSettings.volume ?? 80) / 100;

        const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
        if (voiceName && !isIOS) {
          const allVoices = window.speechSynthesis.getVoices();
          const voice = allVoices.find(v => v.name === voiceName);
          if (voice) {
            utterance.voice = voice;
            console.log('TTS speakAsync using voice:', voiceName);
          } else {
            console.warn('TTS speakAsync voice not found:', voiceName);
          }
        }

        utterance.onstart = () => console.log('TTS speakAsync started:', text);
        utterance.onend = () => {
          console.log('TTS speakAsync ended:', text);
          resolve();
        };
        utterance.onerror = (e) => {
          console.error('TTS speakAsync error event:', e.error, e);
          resolve();
        };

        const onAbort = () => {
          window.speechSynthesis.cancel();
          resolve();
        };
        if (signal) signal.addEventListener('abort', onAbort);

        window.speechSynthesis.speak(utterance);
      } else {
        console.log('TTS speakAsync using Google Translate fallback for:', text);
        try {
          const tl = lang ? lang.split('-')[0].toLowerCase() : 'en';
          const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text)}`;
          const audio = new Audio(url);
          audio.volume = (audioSettings.volume ?? 80) / 100;

          audio.onended = () => { resolve(); };
          audio.onerror = (err) => {
            console.error('Google TTS speakAsync Play Error:', err);
            resolve();
          };

          if (signal) {
            signal.addEventListener('abort', () => {
              audio.pause();
              resolve();
            });
          }

          audio.play().catch(err => {
            console.error('Google TTS play failed:', err);
            resolve();
          });
        } catch (e) {
          console.error('Google TTS speakAsync Fallback failed:', e);
          resolve();
        }
      }
    });
  };

  // --- delayAsync ---
  const delayAsync = (ms, signal) => {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        resolve();
      }, ms);

      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  };

  // --- stopAudio ---
  const stopAudio = async () => {
    setIsAudioPlaying(false);
    releaseWakeLock();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const tts = getTtsPlugin();
    if (tts) {
      tts.stop().catch(err => console.error('TTS native stop error:', err));
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAudioStatusText('已停止');
    setAudioSubStep('none');
    setActiveSpellingChar(-1);
    await window.persistentStorage.setSetting(`vocab_tempSession_${dbName}_audio`, null);
    setView('dashboard');
  };

  // --- pauseAudio ---
  const pauseAudio = () => {
    setIsAudioPlaying(false);
    releaseWakeLock();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const tts = getTtsPlugin();
    if (tts) {
      tts.stop().catch(err => console.error('TTS native stop error:', err));
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setAudioStatusText('已暫停');
  };

  // --- runAudioLoop (core) ---
  const runAudioLoop = async (startIndex, queueToPlay, settings, signal) => {
    let idx = startIndex;
    await requestWakeLock();

    while (idx < queueToPlay.length && !signal.aborted) {
      setCurrentAudioIndex(idx);
      const word = queueToPlay[idx];
      if (!word) break;

      for (let rep = 0; rep < settings.repeats; rep++) {
        if (signal.aborted) break;

        // 1. 唸讀英文單字
        setAudioSubStep('word');
        setAudioStatusText(`朗讀單字 (第 ${rep + 1}/${settings.repeats} 次)...`);
        await speakAsync(word.en, 'en-US', settings.enVoiceName, signal);
        if (signal.aborted) break;
        await delayAsync(400, signal);

        // 2. 拼寫字母
        setAudioSubStep('spelling');
        setAudioStatusText(`拼讀字母...`);
        const chars = word.en.toLowerCase().replace(/[^a-z']/g, '').split('');
        const spellingStr = chars.join(', ');
        const spellingRate = speechRate * (settings.spellingRateMultiplier || 1.8);
        await speakAsync(spellingStr, 'en-US', settings.enVoiceName || '', signal, spellingRate);
        if (signal.aborted) break;
        await delayAsync(500, signal);

        // 3. 唸單字與中文釋義
        setAudioSubStep('translation');
        setAudioStatusText(`朗讀釋義...`);
        await speakAsync(word.en, 'en-US', settings.enVoiceName, signal);
        if (signal.aborted) break;
        await delayAsync(300, signal);

        const cleanZh = word.zh.replace(/^[a-z.]+\s*/i, '');
        await speakAsync(cleanZh, 'zh-TW', settings.zhVoiceName, signal);
        if (signal.aborted) break;
        await delayAsync(500, signal);

        // 4. 例句朗讀
        if (settings.readExample && word.eg) {
          setAudioSubStep('example');
          setAudioStatusText(`朗讀例句...`);
          const parts = word.eg.split(/\s*([（(][^）)]+[）)])\s*$/);
          const egEn = parts[0] ? parts[0].trim() : '';

          if (egEn) {
            await speakAsync(egEn, 'en-US', settings.enVoiceName, signal);
            if (signal.aborted) break;
            await delayAsync(300, signal);
          }
        }

        // 5. 停頓
        if (rep === settings.repeats - 1) {
          setAudioSubStep('pause');
          setAudioStatusText(`停頓 ${settings.wordPause} 秒...`);
          await delayAsync(settings.wordPause * 1000, signal);
        } else {
          setAudioSubStep('pause');
          setAudioStatusText(`準備重播單字...`);
          await delayAsync(1200, signal);
        }
      }

      if (signal.aborted) break;

      if (audioRange === 'word') {
        continue;
      } else {
        idx++;
      }
    }

    if (!signal.aborted) {
      setIsAudioPlaying(false);
      setAudioStatusText('播放完畢');
      setAudioSubStep('none');
      releaseWakeLock();
    }
  };

  // --- startAudio ---
  const startAudio = (startIndex) => {
    const idx = startIndex !== undefined ? startIndex : currentAudioIndex;
    if (audioQueue.length === 0) return;
    setIsAudioPlaying(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    unlockSpeechOnIOS();
    runAudioLoop(idx, audioQueue, audioSettings, abortController.signal);
  };

  // --- buildAudioQueue ---
  const buildAudioQueue = () => {
    let baseList = [];
    if (audioSource === 'daily') {
      const { baseWords, ghostWords } = window.computeDailyWords(vocabList, currentDay, wordsPerDay, ghostsPerDay, historicalMistakes);
      baseList = [...baseWords.map(w => ({ ...w })), ...ghostWords.map(w => ({ ...w }))];
    } else if (audioSource === 'mistakes') {
      baseList = Object.values(mistakes).filter(m => m.mistakesCount > 0).map(m => m.data);
    } else if (audioSource === 'history') {
      baseList = Object.values(historicalMistakes).map(h => h.data);
    } else if (audioSource === 'library') {
      baseList = vocabList;
    }

    if (baseList.length === 0) return [];

    let finalQueue = [];
    if (audioRange === 'word') {
      const selectIndex = Math.min(Math.max(0, currentAudioIndex), baseList.length - 1);
      finalQueue = [baseList[selectIndex]];
    } else if (audioRange === 'page') {
      const pageNum = audioSource === 'library' ? allPage : 1;
      const start = (pageNum - 1) * itemsPerPage;
      finalQueue = baseList.slice(start, start + itemsPerPage);
    } else if (audioRange === 'custom') {
      const start = Math.max(0, audioStartIdx - 1);
      const end = Math.min(baseList.length, audioEndIdx);
      finalQueue = baseList.slice(start, end);
    } else {
      finalQueue = baseList;
    }
    return finalQueue;
  };

  // --- startAudioSession ---
  const startAudioSession = (setShowAudioSetupModal) => {
    const queueToPlay = buildAudioQueue();
    if (queueToPlay.length === 0) {
      alert('選取的範圍內沒有任何單字！');
      return;
    }
    unlockSpeechOnIOS();
    setAudioQueue(queueToPlay);
    setCurrentAudioIndex(0);
    if (setShowAudioSetupModal) setShowAudioSetupModal(false);
    setView('audio_player');
  };

  // --- playNextWord ---
  const playNextWord = () => {
    if (currentAudioIndex < audioQueue.length - 1) {
      const nextIdx = currentAudioIndex + 1;
      setCurrentAudioIndex(nextIdx);
      setIsAudioPlaying(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      unlockSpeechOnIOS();
      runAudioLoop(nextIdx, audioQueue, audioSettings, abortController.signal);
    }
  };

  // --- playPrevWord ---
  const playPrevWord = () => {
    if (currentAudioIndex > 0) {
      const prevIdx = currentAudioIndex - 1;
      setCurrentAudioIndex(prevIdx);
      setIsAudioPlaying(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      unlockSpeechOnIOS();
      runAudioLoop(prevIdx, audioQueue, audioSettings, abortController.signal);
    }
  };

  // --- Auto-start audio loop when view changes to audio_player ---
  // Note: This effect must be triggered from app.js by watching [view, audioQueue]
  // and calling startAudio(currentAudioIndex) — since view is not available here.
  // The hook exposes abortControllerRef for cleanup from app.js.

  return {
    // State
    audioSource, setAudioSource,
    audioRange, setAudioRange,
    audioStartIdx, setAudioStartIdx,
    audioEndIdx, setAudioEndIdx,
    audioQueue, setAudioQueue,
    currentAudioIndex, setCurrentAudioIndex,
    isAudioPlaying, setIsAudioPlaying,
    audioSettings, setAudioSettings,
    voices,
    audioStatusText, setAudioStatusText,
    audioSubStep, setAudioSubStep,
    activeSpellingChar, setActiveSpellingChar,
    blindMode, setBlindMode,
    // Refs (for cleanup)
    abortControllerRef,
    wakeLockRef,
    // Functions
    speak,
    speakAsync,
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
  };
};
