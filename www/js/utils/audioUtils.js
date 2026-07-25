// ==========================================
// --- 🎧 語音引擎與防休眠工具 (audioUtils.js) ---
// ==========================================

// 獲取 Native Capacitor TextToSpeech 外掛
window.getTtsPlugin = () => {
  if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech) {
    return window.Capacitor.Plugins.TextToSpeech;
  }
  return null;
};

// 異步延遲工具
window.delayAsync = (ms, signal) => {
  return new Promise((resolve) => {
    if (signal && signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      resolve();
    }, ms);

    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      });
    }
  });
};

// 基礎單字發音
window.speakText = async (text, speechRate = 1.0, speechEnabled = true, isManual = false) => {
  console.log('TTS speak called. Text:', text, 'isManual:', isManual, 'speechEnabled:', speechEnabled);
  if (!isManual && !speechEnabled) {
    console.log('TTS speak aborted: speechEnabled is false');
    return;
  }

  const tts = window.getTtsPlugin();
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
    // Fallback to Google Translate TTS API via HTML5 Audio
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

// 聽讀特訓異步發音 (支援 AbortSignal 與 Voice 選擇)
window.speakAsync = (text, lang, voiceName, speechRate = 1.0, audioSettings = {}, signal = null) => {
  return new Promise(async (resolve) => {
    if (signal && signal.aborted) {
      resolve();
      return;
    }

    const tts = window.getTtsPlugin();
    const rate = speechRate;

    if (tts) {
      console.log('TTS speakAsync native for:', text);
      try {
        await tts.stop();
        if (signal && signal.aborted) return resolve();

        const onAbort = async () => {
          try { await tts.stop(); } catch (e) {}
          resolve();
        };
        if (signal) signal.addEventListener('abort', onAbort);

        await tts.speak({
          text: text,
          lang: lang || 'en-US',
          rate: rate,
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
      utterance.rate = rate;
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
      // Fallback to Google Translate TTS API via HTML5 Audio
      console.log('TTS speakAsync using Google Translate fallback for:', text);
      try {
        const tl = lang ? lang.split('-')[0].toLowerCase() : 'en';
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text)}`;
        const audio = new Audio(url);
        audio.volume = (audioSettings.volume ?? 80) / 100;

        const onAudioEnd = () => {
          resolve();
        };

        audio.onended = onAudioEnd;
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
