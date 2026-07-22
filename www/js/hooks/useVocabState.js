// ==========================================
// --- ⚓ Custom Hook: useVocabState.js ---
// ==========================================

window.useVocabState = () => {
  const defaultState = {
    currentDay: 1,
    learnedWords: [],
    mistakes: {},
    historicalMistakes: {},
    streak: { count: 0, lastDate: null }
  };

  const [dbName, setDbName] = React.useState(() => localStorage.getItem('vocab_currentDB') || 'vocab_2000');
  const [dbList, setDbList] = React.useState(() => {
    const saved = localStorage.getItem('vocab_dbList');
    return saved ? JSON.parse(saved) : ['vocab_2000', 'vocab_7000'];
  });

  const [state, setState] = React.useState(defaultState);
  const [vocabList, setVocabList] = React.useState(() => window.rawVocab || []);
  const [wordsPerDay, setWordsPerDay] = React.useState(50);
  const [ghostsPerDay, setGhostsPerDay] = React.useState(10);

  // 切換資料庫時同步加載
  React.useEffect(() => {
    localStorage.setItem('vocab_currentDB', dbName);
    const savedState = localStorage.getItem(`vocab_state_${dbName}`);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setState({ ...defaultState, ...parsed });
    } else {
      setState(defaultState);
    }

    const savedVocab = localStorage.getItem(`vocab_customVocab_${dbName}`);
    setVocabList(savedVocab ? JSON.parse(savedVocab) : window.rawVocab || []);

    const savedWords = localStorage.getItem(`vocab_wordsPerDay_${dbName}`);
    setWordsPerDay(savedWords ? parseInt(savedWords, 10) : 50);

    const savedGhosts = localStorage.getItem(`vocab_ghostsPerDay_${dbName}`);
    setGhostsPerDay(savedGhosts ? parseInt(savedGhosts, 10) : 10);
  }, [dbName]);

  // 自動持久化
  React.useEffect(() => {
    if (dbName) localStorage.setItem(`vocab_state_${dbName}`, JSON.stringify(state));
  }, [state, dbName]);

  React.useEffect(() => {
    if (dbName) localStorage.setItem(`vocab_wordsPerDay_${dbName}`, wordsPerDay);
  }, [wordsPerDay, dbName]);

  React.useEffect(() => {
    if (dbName) localStorage.setItem(`vocab_ghostsPerDay_${dbName}`, ghostsPerDay);
  }, [ghostsPerDay, dbName]);

  return {
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
    defaultState
  };
};
