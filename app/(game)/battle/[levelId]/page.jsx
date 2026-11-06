'use client';

import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPlayerLevel } from '@/lib/auth';
import { detectRedZone } from '@/lib/redZone';
import { isPassed, lockReasonOf, lockMessageOf, nextPlayableLevel, levelName, bypassesLocks } from '@/lib/progress';
import Character from '@/components/Character';
import { ExerciseBrief, ExerciseHelp, ZoneResult, ReferencePrompt, RevealAfterPass, RedZoneBanner, OtherExample, SkipOffer, ConversationChat, QuizPanel, zoneBossLine, ZONES } from '@/components/ExercisePanels';
import { AI_UNAVAILABLE, MAX_FOLLOW_UPS, chatEnabled, hasQuestions, previewTurns } from '@/lib/conversation';

function apiHeaders() {
  return { 'Content-Type': 'application/json', 'X-Player-Id': sessionStorage.getItem('playerId') || '' };
}

const EMPTY_CHAT = { history: [], reply: '' };

// Pytania AI z kroku 1 zadania-rozmowy przeżywają odświeżenie strony
const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000;

function conversationKey(levelId) {
  return `pq_conv_${sessionStorage.getItem('playerId')}_${levelId}`;
}

function readConversation(levelId) {
  try {
    const saved = JSON.parse(localStorage.getItem(conversationKey(levelId)) || 'null');
    return saved && Date.now() - saved.at < CONVERSATION_TTL_MS ? saved : null;
  } catch {
    return null;
  }
}

function rememberConversation(levelId, prompt, result) {
  try {
    localStorage.setItem(conversationKey(levelId), JSON.stringify({ prompt, result, at: Date.now() }));
  } catch {}
}

function forgetConversation(levelId) {
  try { localStorage.removeItem(conversationKey(levelId)); } catch {}
}

const EXAMPLE_AFTER = 3;
const SKIP_AFTER = 5;

const PIXEL = "'Press Start 2P'";

const PROMPT_BLOCKS = [
  { key: 'rola',     label: '🎭 Rola',     text: 'Jesteś doświadczonym [kim? np. specjalistą ds. obsługi klienta].' },
  { key: 'kontekst', label: '📍 Kontekst', text: 'Kontekst: [sytuacja, dla kogo, ważne fakty i liczby].' },
  { key: 'zadanie',  label: '🎯 Zadanie',  text: 'Twoje zadanie: [co dokładnie ma powstać].' },
  { key: 'format',   label: '📐 Format',   text: 'Format: [długość, struktura, ton — np. max 5 punktów, uprzejmy ton].' },
];

const CRITERIA = [
  { key: 'rola',     label: 'ROLA',     icon: '🎭' },
  { key: 'kontekst', label: 'KONTEKST', icon: '📍' },
  { key: 'zadanie',  label: 'ZADANIE',  icon: '🎯' },
  { key: 'format',   label: 'FORMAT',   icon: '📐' },
];

const LOADING_TIPS = [
  'Nadaj AI rolę — „Jesteś doświadczonym…” od razu podnosi jakość.',
  'Im więcej kontekstu, tym mniej ogólników w odpowiedzi.',
  'Powiedz AI, w jakim formacie chcesz wynik: lista, tabela, max 5 zdań.',
  'Określ ton: formalny, ciepły, zwięzły, z humorem?',
  'Podaj przykład tego, czego oczekujesz — AI świetnie naśladuje wzorce.',
  'Pierwsza odpowiedź to szkic. Dopytuj i poprawiaj — to normalne.',
];

const CONFETTI = Array.from({ length: 60 }, () => ({
  left: Math.random() * 100,
  duration: 1.5 + Math.random() * 2,
  delay: Math.random() * 0.8,
  round: Math.random() > 0.5,
}));

function scoreColorOf(score) {
  if (score == null) return 'var(--white)';
  return score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--gold)' : 'var(--red)';
}

function bossReaction(score) {
  if (score >= 85) return 'Wow! Dokładnie o to mi chodziło. Biorę to od razu!';
  if (score >= 70) return 'Świetna robota! To mi naprawdę pomoże.';
  if (score >= 40) return 'Hmm, może być… ale czuję, że stać cię na więcej.';
  return 'To nie do końca to, czego potrzebuję. Spróbujmy jeszcze raz?';
}

export default function BattlePage() {
  const router = useRouter();
  const { levelId } = useParams();

  const [level, setLevel] = useState(null);
  const [module, setModule] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalStage, setEvalStage] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(null);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const [copied, setCopied] = useState(false);

  const [playerHp, setPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(100);
  const [lives, setLives] = useState(3);

  const [shakeTarget, setShakeTarget] = useState(null);
  const [floatingText, setFloatingText] = useState(null);
  const [attackEffect, setAttackEffect] = useState(null);
  const [flash, setFlash] = useState(null);

  const [overlay, setOverlay] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [blindAnswer, setBlindAnswer] = useState(null);
  const [moduleLevels, setModuleLevels] = useState([]);
  const [bestScores, setBestScores] = useState({});
  const [attempts, setAttempts] = useState({});
  const [modulePrompts, setModulePrompts] = useState({});
  const [libraryState, setLibraryState] = useState(null);
  const [lockNotice, setLockNotice] = useState(null);
  const [savedFeedback, setSavedFeedback] = useState({});
  const [savedZones, setSavedZones] = useState({});
  const [showLevelList, setShowLevelList] = useState(false);
  const [completedVia, setCompletedVia] = useState({});
  const [skipState, setSkipState] = useState(null);
  const [copyNotice, setCopyNotice] = useState(null);
  const [aiNotice, setAiNotice] = useState(null);
  const [conv, setConv] = useState(null);
  const [quizNonce, setQuizNonce] = useState(0);

  const textareaRef = useRef(null);
  const sideScrollRef = useRef(null);
  const resultRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => { loadData(); }, [levelId]);

  // Wynik stoi na górze prawej kolumny; w układzie jednokolumnowym (przewija się cała strona) trzeba do niego zjechać
  useEffect(() => {
    if (!result) return;
    if (sideScrollRef.current) sideScrollRef.current.scrollTop = 0;
    const root = resultRef.current?.closest('.battle-root');
    const singleColumn = root && getComputedStyle(root).overflowY === 'auto';
    if (chatRef.current) chatRef.current.scrollIntoView({ block: 'end' });
    else if (singleColumn) resultRef.current?.scrollIntoView({ block: 'start' });
  }, [result]);

  useEffect(() => {
    if (conv?.history?.length || conv?.done) chatRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [conv?.history?.length, conv?.done]);

  // Pole rośnie z tekstem; granice (ok. 5–12 linii) wyznacza CSS przez min-/max-height
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const fit = () => {
      const top = el.scrollTop;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
      el.scrollTop = top;
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [prompt, result, loading]);

  useEffect(() => {
    if (!evaluating) return;
    const stageTimer = setTimeout(() => setEvalStage(1), 4500);
    const tipTimer = setInterval(() => setTipIndex(i => (i + 1) % LOADING_TIPS.length), 4000);
    return () => { clearTimeout(stageTimer); clearInterval(tipTimer); };
  }, [evaluating]);

  useEffect(() => {
    if (!result) return;
    const target = result.score;
    const start = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 900);
      setDisplayScore(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [result]);

  async function loadData() {
    setLoading(true);
    setResult(null);
    setSaved(null);
    setLastAttempt(null);
    setPrompt('');
    setBlindAnswer(null);
    setAttackEffect(null);
    setShowFullResponse(false);
    setLibraryState(null);
    setShowLevelList(false);
    setSkipState(null);
    setCopyNotice(null);
    setAiNotice(null);
    setConv(null);

    const playerId = sessionStorage.getItem('playerId');
    if (!playerId) { router.push('/login'); return; }

    const [levelRes, playerRes] = await Promise.all([
      fetch(`/api/levels?id=${levelId}`),
      fetch(`/api/player/me?id=${playerId}`),
    ]);

    if (!levelRes.ok) { router.push('/map'); return; }
    const { level: levelData } = await levelRes.json();
    if (!levelData) { router.push('/map'); return; }

    const [allLevelsRes, scoresRes] = await Promise.all([
      fetch(`/api/levels?moduleId=${levelData.module_id}`),
      fetch(`/api/battles?playerId=${playerId}&moduleId=${levelData.module_id}`),
    ]);
    const allLevels = (allLevelsRes.ok && (await allLevelsRes.json()).levels) || [];
    const scoresData = scoresRes.ok ? await scoresRes.json() : {};
    const freshPlayer = playerRes.ok ? (await playerRes.json()).player : null;

    const isAdmin = bypassesLocks(freshPlayer?.role || sessionStorage.getItem('role'));
    const mod = levelData.modules;
    if (!isAdmin && mod?.day_number > 1 && !mod.unlocked) { router.replace('/map'); return; }
    const lock = lockReasonOf(levelData, allLevels, scoresData.bestScores || {}, mod?.active_block, isAdmin, scoresData.completedVia || {});
    if (lock) {
      const target = nextPlayableLevel(allLevels, scoresData.bestScores || {}, mod?.active_block, isAdmin, scoresData.completedVia || {});
      if (!target || target.id === levelData.id) { router.replace('/map'); return; }
      sessionStorage.setItem('lockNotice', JSON.stringify({ levelId: target.id, text: lockMessageOf(lock, levelData, allLevels) }));
      router.replace(`/battle/${target.id}`);
      return;
    }
    const notice = JSON.parse(sessionStorage.getItem('lockNotice') || 'null');
    if (notice?.levelId === levelData.id) setLockNotice(notice.text);
    else { setLockNotice(null); sessionStorage.removeItem('lockNotice'); }

    setLevel(levelData);
    setModule(mod);
    setModuleLevels(allLevels);
    setBestScores(scoresData.bestScores || {});
    setAttempts(scoresData.attempts || {});
    setModulePrompts(scoresData.prompts || {});
    setSavedFeedback(scoresData.feedback || {});
    setSavedZones(scoresData.zones || {});
    setCompletedVia(scoresData.completedVia || {});

    if (freshPlayer) {
      const playerData = freshPlayer;
      setPlayer(playerData);
      setLives(playerData.current_lives);
      setPlayerHp(Math.round((playerData.current_lives / 3) * 100));
    } else {
      const l = parseInt(sessionStorage.getItem('currentLives') || '3');
      setPlayer({
        id: playerId,
        display_name: sessionStorage.getItem('displayName') || '',
        character_id: parseInt(sessionStorage.getItem('characterId')) || 1,
        total_xp: parseInt(sessionStorage.getItem('totalXp') || '0'),
        current_lives: l,
        current_module: parseInt(sessionStorage.getItem('currentModule') || '1'),
      });
      setLives(l);
      setPlayerHp(Math.round((l / 3) * 100));
    }

    const pendingConversation = levelData.config?.conversation ? readConversation(levelData.id) : null;
    if (pendingConversation) {
      setPrompt(pendingConversation.prompt);
      setResult(pendingConversation.result);
      setConv(EMPTY_CHAT);
    }

    setBossHp(100);
    setLoading(false);
  }

  async function handleAttack() {
    if (evaluating) return;
    if (level?.type === 'blind_test') { handleBlindSubmit(); return; }
    if (level?.config?.quiz) return;
    if (!prompt.trim()) return;

    setEvalStage(0);
    setTipIndex(i => (i + 1) % LOADING_TIPS.length);
    setDisplayScore(0);
    setEvaluating(true);
    setResult(null);
    setSaved(null);
    setShowFullResponse(false);
    setCopyNotice(null);
    setAiNotice(null);
    setConv(null);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ userPrompt: prompt, levelId: parseInt(levelId) }),
      });
      const data = await res.json().catch(() => ({ code: 'ai_unavailable' }));
      if (res.status === 401 || data.code === 'session_mismatch') { expireSession(data.error); return; }
      if (data.code === 'too_similar') { setCopyNotice(data); return; }
      if (data.code === 'ai_unavailable') { setAiNotice(data.error || AI_UNAVAILABLE); return; }
      if (!res.ok) throw new Error(data.error || 'Błąd oceny');
      setResult(data);
      // Zielona w kroku 1 rozmowy: zaliczenie i próba zapisują się dopiero po odpowiedzi AI w kroku 2
      if (data.conversation?.awaitingReply) {
        rememberConversation(levelId, prompt, data);
        setConv(EMPTY_CHAT);
        animateAndSave(data, false);
        return;
      }
      await animateAndSave(data);
    } catch (err) {
      if (level?.config?.conversation) { setAiNotice(AI_UNAVAILABLE); return; }
      setResult({ score: 0, error: true, co_poszlo_dobrze: '—', co_poprawic: err.message, wskazowka: 'Sprawdź połączenie i spróbuj ponownie — ta próba nie została zapisana.' });
    } finally {
      setEvaluating(false);
    }
  }

  function handleBlindSubmit() {
    if (!blindAnswer) return;
    const correct = level.blind_correct === blindAnswer;
    const label = blindOptions.find(o => o.key === blindAnswer)?.label;
    const score = correct ? 80 : 20;
    setDisplayScore(0);
    const data = {
      score,
      co_poszlo_dobrze: correct
        ? 'Świetnie! Poprawnie rozpoznałeś tekst napisany przez AI.'
        : 'Dobra próba — to częsta pomyłka, bo AI potrafi brzmieć bardzo naturalnie.',
      co_poprawic: correct
        ? 'Zastanów się, co zdradziło AI: struktura, brak emocji, „idealne” sformułowania?'
        : 'Szukaj perfekcyjnej struktury, list, ogólników i braku osobistych historii czy wahania.',
      wskazowka: 'Człowiek pisze z emocjami, skrótami i osobistymi szczegółami. AI — uporządkowanie i poprawnie.',
      aiResponse: correct ? `✓ Tak! Odpowiedź ${label} napisała AI.` : `✗ Odpowiedź ${label} napisał człowiek.`,
    };
    setResult(data);
    animateAndSave(data);
  }

  async function animateAndSave(data, save = true, promptUsed) {
    if (data.error) return;
    const score = data.score;
    const zoneMode = data.mode === 'zones';
    if (score >= 70) {
      setAttackEffect('hit');
      setFloatingText(zoneMode ? '✅' : `⚡ ${score}`);
      setTimeout(() => { setShakeTarget('boss'); setFlash('white'); }, 300);
      setTimeout(() => setFlash(null), 450);
      setTimeout(() => { setShakeTarget(null); setBossHp(p => Math.max(0, p - score)); setFloatingText(null); }, 900);
    } else if (score >= 40) {
      setAttackEffect('weak');
      setFloatingText(zoneMode ? '⚠' : `⚔ ${score}`);
      setTimeout(() => { setBossHp(p => Math.max(0, p - Math.round(score / 2))); setFloatingText(null); }, 800);
    } else {
      setAttackEffect('miss');
      setFloatingText(zoneMode ? '❌' : `💀 ${score}`);
      setTimeout(() => { setShakeTarget('player'); setFlash('red'); }, 300);
      setTimeout(() => setFlash(null), 500);
      setTimeout(() => { setShakeTarget(null); setFloatingText(null); }, 900);
    }
    setTimeout(() => setAttackEffect(null), 1000);
    if (!save) return;

    const error = await saveBattle(data, promptUsed);
    if (error) setResult(r => ({ ...r, error: true, co_poprawic: error }));
  }

  async function finishQuiz(answers) {
    if (evaluating) return;
    setEvaluating(true);
    const questions = level?.config?.quiz?.questions || [];
    const key = questions.map(q => q.correct);
    const correct = answers.filter((a, i) => a === key[i]).length;
    const promptUsed = JSON.stringify({ quiz: true, answers, key });
    setPrompt(promptUsed);
    const data = {
      mode: 'quiz',
      score: correct * 10,
      zone: null,
      bonus: false,
      co_poszlo_dobrze: `Poprawnych odpowiedzi: ${correct} z ${questions.length}.`,
      co_poprawic: correct === questions.length ? null : 'Możesz wrócić do pytań, które poszły słabiej.',
      wskazowka: 'Po każdym pytaniu widać, która odpowiedź była poprawna.',
    };
    setResult(data);
    try {
      await animateAndSave(data, true, promptUsed);
    } finally {
      setEvaluating(false);
    }
  }

  // Zwraca komunikat błędu albo null, gdy próba została zapisana
  async function saveBattle(data, promptUsed) {
    const res = await fetch('/api/battle/complete', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        levelId: parseInt(levelId),
        score: data.score, zone: data.zone || null, bonus: !!data.bonus,
        co_poszlo_dobrze: data.co_poszlo_dobrze,
        co_poprawic: data.co_poprawic, wskazowka: data.wskazowka,
        promptUsed: promptUsed ?? (level.type === 'blind_test' ? `blind:${blindAnswer}` : prompt),
      }),
    });
    const savedData = await res.json();
    if (res.status === 401 || savedData.code === 'session_mismatch') { expireSession(savedData.error); return null; }
    if (!res.ok) return savedData.error || 'Nie udało się zapisać próby.';
    setSaved(savedData);

    const id = parseInt(levelId);
    if (savedData.previousBest == null || data.score >= savedData.previousBest) {
      setSavedZones(prev => ({ ...prev, [id]: data.zone || null }));
      setSavedFeedback(prev => ({ ...prev, [id]: { co_poszlo_dobrze: data.co_poszlo_dobrze, co_poprawic: data.co_poprawic, wskazowka: data.wskazowka } }));
      if (level.type !== 'blind_test') setModulePrompts(prev => ({ ...prev, [id]: prompt }));
    }
    setBestScores(prev => ({ ...prev, [id]: Math.max(prev[id] ?? 0, data.score) }));
    if (savedData.attemptNumber) setAttempts(prev => ({ ...prev, [id]: savedData.attemptNumber }));

    if (savedData.gameOver) {
      setLives(0); setPlayerHp(0);
      setTimeout(() => setOverlay('game-over'), 1200);
      return null;
    }
    if (savedData.newLives !== undefined && savedData.newLives < lives) {
      setTimeout(() => { setLives(savedData.newLives); setPlayerHp(Math.round((savedData.newLives / 3) * 100)); }, 900);
    }
    showProgress(savedData);
    return null;
  }

  function updateChat(patch) {
    setConv(c => ({ ...EMPTY_CHAT, ...c, ...patch }));
  }

  // Odpowiedź uczestnika w podglądzie: w 1.2 pierwsza odpowiedź zalicza zadanie, w pozostałych nie zmienia oceny
  async function sendReply() {
    const chat = conv || EMPTY_CHAT;
    if (chat.sending || chat.saving || !result) return;
    const reply = chat.reply.trim();
    if (!reply) return;
    const minWords = cfg.conversation?.reply_min_words || 1;
    if (reply.split(/\s+/).length < minWords) {
      updateChat({ error: `Napisz co najmniej ${minWords} słowa.` });
      return;
    }
    if (detectRedZone(reply, cfg.red_terms).length) {
      updateChat({ error: 'Zamień dane z czerwonej strefy na placeholder i wyślij jeszcze raz.' });
      return;
    }
    updateChat({ sending: true, error: null });
    const history = [{ role: 'assistant', content: result.aiResponse }, ...chat.history, { role: 'user', content: reply }];
    try {
      const res = await fetch('/api/battle/converse', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ levelId: id, prompt, history }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data.code === 'session_mismatch') { expireSession(data.error); return; }
      if (!res.ok) { updateChat({ sending: false, error: data.error || AI_UNAVAILABLE }); return; }
      updateChat({ sending: false, reply: '', history: [...chat.history, { role: 'user', content: reply }, { role: 'assistant', content: data.aiReply }] });
      if (cfg.conversation && !chat.done) await finishConversation();
    } catch {
      updateChat({ sending: false, error: AI_UNAVAILABLE });
    }
  }

  async function finishConversation() {
    updateChat({ saving: true, saveFailed: false, error: null });
    const error = await saveBattle(result).catch(() => 'Nie udało się zapisać zaliczenia.');
    if (error) { updateChat({ saving: false, saveFailed: true, error: `${error} Kliknij „Zapisz zaliczenie”.` }); return; }
    forgetConversation(id);
    updateChat({ saving: false, done: true });
  }

  function showProgress(savedData) {
    if (savedData.moduleComplete) {
      const oldLvl = getPlayerLevel(player?.total_xp || 0);
      const newLvl = getPlayerLevel(savedData.newTotalXp);
      setTimeout(() => {
        setShowConfetti(true);
        setOverlay(newLvl.level > oldLvl.level ? 'level-up' : 'module-complete');
        if (savedData.newTotalXp) { setPlayer(p => ({ ...p, total_xp: savedData.newTotalXp })); sessionStorage.setItem('totalXp', savedData.newTotalXp); }
      }, 1600);
      return;
    }
    if (savedData.newTotalXp !== undefined) {
      setPlayer(p => ({ ...p, total_xp: savedData.newTotalXp, current_lives: savedData.newLives }));
      sessionStorage.setItem('totalXp', savedData.newTotalXp);
    }
  }

  async function skipWithReference() {
    const id = parseInt(levelId);
    setSkipState({ saving: true });
    try {
      const res = await fetch('/api/battle/skip', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ levelId: id }),
      });
      const data = await res.json();
      if (res.status === 401 || data.code === 'session_mismatch') { expireSession(data.error); return; }
      if (!res.ok) throw new Error(data.error || 'Nie udało się zapisać.');
      setCompletedVia(prev => ({ ...prev, [id]: 'reference' }));
      setSkipState({ done: true, xpGained: data.xpGained });
      showProgress(data);
    } catch (err) {
      setSkipState({ error: err.message });
    }
  }

  function expireSession(notice) {
    sessionStorage.clear();
    if (notice) sessionStorage.setItem('loginNotice', notice);
    router.push('/login');
  }

  function retry(newPrompt) {
    if (result && !result.error) setLastAttempt({ score: result.score, zone: result.zone });
    if (conv) forgetConversation(id);
    setConv(null);
    setResult(null);
    setSaved(null);
    setBlindAnswer(null);
    setQuizNonce(n => n + 1);
    setLibraryState(null);
    if (newPrompt !== undefined) setPrompt(newPrompt);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function insertBlock(text) {
    setPrompt(p => (p.trim() ? `${p.trimEnd()}\n${text}` : text));
    setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      el.scrollTop = el.scrollHeight;
    }, 0);
  }

  async function copyBetterPrompt() {
    try {
      await navigator.clipboard.writeText(result.lepszy_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function saveToLibrary() {
    setLibraryState('saving');
    const res = await fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: sessionStorage.getItem('playerId'),
        levelId: parseInt(levelId),
        title: level.code ? `${level.code} · ${level.title}` : `Zadanie ${level.level_number}`,
        prompt,
      }),
    });
    setLibraryState(res.ok ? 'saved' : 'error');
  }

  function getNextLevel() {
    if (!moduleLevels.length) return null;
    const idx = moduleLevels.findIndex(l => l.id === parseInt(levelId));
    if (idx === -1 || idx >= moduleLevels.length - 1) return null;
    return moduleLevels[idx + 1];
  }

  function lockReason(lvl) {
    return lockReasonOf(lvl, moduleLevels, bestScores, module?.active_block, bypassesLocks(player?.role), completedVia);
  }

  function isLevelLocked(lvl) {
    return lockReason(lvl) !== null;
  }

  if (loading || lockReason(level)) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: PIXEL, fontSize: 12, color: 'var(--accent)', animation: 'blink 1s steps(2) infinite' }}>WCHODZISZ DO ARENY...</span>
    </div>
  );

  // Kolejność A/B zależy od levelu, żeby poprawna odpowiedź nie była zawsze pierwsza
  const blindOptions = (() => {
    if (level?.type !== 'blind_test') return [];
    const opts = [{ key: 'a', text: level.blind_option_a }, { key: 'b', text: level.blind_option_b }];
    if (level.id % 2 === 0) opts.reverse();
    return opts.map((o, i) => ({ ...o, label: i === 0 ? 'A' : 'B' }));
  })();

  const roomBg = module?.room_key ? `/rooms/room-${module.room_key}.webp` : null;
  const scoreColor = scoreColorOf(result?.score);
  const typeColor = level?.type === 'fix_prompt' ? 'var(--gold)' : level?.type === 'blind_test' ? 'var(--accent2)' : 'var(--accent)';
  const personalBest = bestScores[parseInt(levelId)];
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const cfg = level?.config;
  const zoneMode = !!cfg?.zones;
  const quizMode = !!cfg?.quiz;
  const livesEnabled = module?.lives_enabled !== false;
  const id = parseInt(levelId);
  const chatMode = zoneMode && chatEnabled(cfg, module?.day_number) && !!result?.aiResponse && !result.error && !result.redZoneDetected?.length;
  const replyRequired = chatMode && !!cfg.conversation;
  const awaitingReply = replyRequired && !!result.conversation?.awaitingReply && !conv?.done;
  const chatHistory = conv?.history || [];
  const repliesSent = chatHistory.filter(m => m.role === 'user').length;
  const lastAiText = chatHistory.length ? chatHistory.at(-1).content : result?.aiResponse;
  const repliesLeft = MAX_FOLLOW_UPS - repliesSent;
  const canReply = chatMode && repliesLeft > 0 && !conv?.saveFailed
    && (replyRequired ? awaitingReply || (!!conv?.done && hasQuestions(lastAiText)) : hasQuestions(lastAiText));
  const bossLine = evaluating
    ? (evalStage === 0 ? 'Hmm, zobaczmy co AI z tym zrobi…' : 'Czytam uważnie… jeszcze chwilka.')
    : awaitingReply ? 'Dobrze! AI zadało Ci pytania. Odpowiedz mu krótko, kilkoma słowami.'
    : result && !result.error ? (zoneMode ? zoneBossLine(result.zone) : bossReaction(result.score)) : level?.boss_dialogue;
  const nextLevel = getNextLevel();
  const nextLocked = isLevelLocked(nextLevel);
  const xpGained = saved?.xpGained;
  const redZoneHits = zoneMode && !result ? detectRedZone(prompt, cfg.red_terms) : [];
  const passMark = quizMode ? 0 : zoneMode ? 90 : 40;
  const passedHere = level ? isPassed(level, bestScores, completedVia) : false;
  const failedAttempts = passedHere ? 0 : (attempts[id] ?? 0);
  const showExample = zoneMode && !passedHere && failedAttempts >= EXAMPLE_AFTER && !!cfg.other_example;
  const canSkip = zoneMode && !!cfg.reference && (skipState?.done || (!passedHere && failedAttempts >= SKIP_AFTER));
  const referenceUnlocked = zoneMode ? passedHere : (bestScores[id] ?? 0) >= 70 || (attempts[id] ?? 0) >= 2;
  const skipNext = !result && skipState?.done && nextLevel && !nextLocked
    ? { label: `DALEJ: ${nextLevel.label || nextLevel.code || 'następne'} ▶`, onClick: () => router.push(`/battle/${nextLevel.id}`) }
    : null;
  const exerciseLabel = cfg?.label || (level?.code ? `ĆWICZENIE ${level.code}` : 'ZADANIE');
  const relatedLevel = cfg?.related_code ? moduleLevels.find(l => l.code === cfg.related_code) : null;
  const relatedPrompt = relatedLevel ? modulePrompts[relatedLevel.id] : null;
  // Dzień 2 dzieli się na nazwane moduły — licznik pokazuje postęp w module bieżącego zadania
  const counterLevels = (cfg?.block_name ? moduleLevels.filter(l => (l.block || 1) === (level.block || 1)) : moduleLevels)
    .filter(l => !l.extra && !l.config?.extra);
  const chips = [...PROMPT_BLOCKS, ...(cfg?.chips || []).map(c => ({ key: c.label, label: c.label, text: c.text }))];

  return (
    <div className={`battle-root${zoneMode ? ' is-zone' : ''}${result ? ' has-result' : ''}`} style={{ background: '#0d0d20' }}>

      {roomBg && (
        <img
          src={roomBg}
          alt=""
          className="pixel-art battle-bg"
          onError={e => { e.currentTarget.style.display = 'none'; }}
          style={{ width: '100%', height: '100%', maxWidth: 'none', objectFit: 'cover', objectPosition: 'center top', zIndex: 0 }}
        />
      )}

      <div className="battle-shade" style={{ zIndex: 1, pointerEvents: 'none', background: 'rgba(5,5,18,0.82)' }} />

      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 400, overflow: 'hidden' }}>
          {CONFETTI.map((c, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${c.left}%`, top: '-10px',
              width: 10, height: 10,
              background: ['var(--gold)', 'var(--accent)', 'var(--green)', 'var(--accent2)'][i % 4],
              animation: `confetti-fall ${c.duration}s ease-in ${c.delay}s forwards`,
              borderRadius: c.round ? '50%' : '0',
            }} />
          ))}
        </div>
      )}

      {overlay === 'module-complete' && (
        <Overlay color="var(--gold)" title="🏆 MODUŁ UKOŃCZONY!" subtitle={module?.title}>
          <Character characterId={player?.character_id} size={6} animate />
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, color: 'var(--muted)', fontWeight: 600 }}>
            Razem masz {player?.total_xp || 0} XP · {getPlayerLevel(player?.total_xp || 0).emoji} {getPlayerLevel(player?.total_xp || 0).name}
          </div>
          <button autoFocus onClick={() => { setOverlay(null); setShowConfetti(false); router.push('/map'); }} className="pixel-button btn-gold">🗺 WRÓĆ NA MAPĘ</button>
        </Overlay>
      )}
      {overlay === 'level-up' && (
        <Overlay color="var(--accent)" title="⚡ LEVEL UP!" subtitle={`${getPlayerLevel(player?.total_xp || 0).emoji} ${getPlayerLevel(player?.total_xp || 0).name}`}>
          <button autoFocus onClick={() => { setOverlay(null); setShowConfetti(true); setTimeout(() => setOverlay('module-complete'), 400); }} className="pixel-button btn-primary">DALEJ ▶</button>
        </Overlay>
      )}
      {overlay === 'game-over' && (
        <Overlay color="var(--red)" title="💀 KONIEC ŻYĆ!" subtitle="Moduł zaczynasz od nowa — ale z nową wiedzą!">
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', maxWidth: '29rem', textAlign: 'center', lineHeight: 1.5, fontWeight: 600 }}>
            💡 Zanim zaczniesz: każdy prompt niech ma <b style={{ color: 'var(--gold)' }}>rolę, kontekst, zadanie i format</b>. To 4 klocki, za które dostajesz punkty.
          </div>
          <button autoFocus onClick={() => { setOverlay(null); router.push('/map'); }} className="pixel-button btn-danger">🔄 SPRÓBUJ PONOWNIE</button>
        </Overlay>
      )}

      {/* ===== GÓRNY PASEK ===== */}
      <div className="battle-topbar" style={{
        background: 'rgba(6,5,18,0.98)', borderBottom: '2px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 52 }}>
          <button
            onClick={() => router.push('/map')}
            className="topbar-back"
            style={{
              background: 'rgba(30,20,60,0.95)', borderRight: '1px solid var(--border)',
              fontFamily: PIXEL, fontSize: 11, padding: '0 14px', minHeight: 44, cursor: 'pointer', flexShrink: 0,
            }}
          >← MAPA</button>

          <div style={{ flex: 1, minWidth: 0, padding: '7px 14px 7px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2px 10px' }}>
              <span style={{ fontFamily: PIXEL, fontSize: 11, lineHeight: 1.5, color: 'var(--green)' }}>{player?.display_name || 'TY'}</span>
              {livesEnabled ? (
                <div style={{ display: 'flex', gap: 2 }} title="Życia — tracisz jedno przy wyniku poniżej 40">
                  {[0, 1, 2].map(i => <span key={i} style={{ fontSize: 16, opacity: i < lives ? 1 : 0.15, filter: i < lives ? 'none' : 'grayscale(1)', transition: 'opacity 0.3s' }}>❤️</span>)}
                </div>
              ) : (
                <span style={{ fontFamily: "'Rajdhani'", fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>🛡 Dziś bez utraty życia · {player?.total_xp || 0} XP</span>
              )}
            </div>
            <div className="hp-bar"><div className="hp-fill hp-fill-player" style={{ width: `${playerHp}%` }} /></div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0 }}>
            <span style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--gold)', textShadow: '0 0 10px rgba(247,200,79,0.6)' }}>VS</span>
          </div>

          <div style={{ flex: 1, minWidth: 0, padding: '7px 12px 7px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ fontFamily: PIXEL, fontSize: 11, lineHeight: 1.5, color: 'var(--red)', textAlign: 'right' }}>{module?.boss_name}</span>
            </div>
            <div className="hp-bar"><div className="hp-fill hp-fill-boss" style={{ width: `${bossHp}%` }} /></div>
          </div>
        </div>

        {moduleLevels.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 12px' }}>
            <span style={{ fontFamily: PIXEL, fontSize: 11, lineHeight: 1.5, color: 'var(--muted)', flex: '0 1 auto' }}>{module?.title}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: '1 1 auto', justifyContent: 'center' }}>
              {moduleLevels.map(lvl => {
                const isCurrent = lvl.id === parseInt(levelId);
                const score = bestScores[lvl.id];
                const isDone = isPassed(lvl, bestScores, completedVia);
                const isPerfect = score !== undefined && score >= (zoneMode ? 90 : 70);
                const lock = lockReason(lvl);
                const locked = lock !== null;
                const prevBlock = moduleLevels[moduleLevels.indexOf(lvl) - 1]?.block;
                let dotBg = 'rgba(255,255,255,0.07)', dotBorder = 'rgba(255,255,255,0.15)', dotColor = 'rgba(255,255,255,0.4)', dotShadow = 'none';
                if (isCurrent) { dotBg = 'var(--accent)'; dotBorder = 'var(--accent)'; dotColor = '#fff'; dotShadow = '0 0 10px rgba(79,142,247,0.8)'; }
                else if (isPerfect) { dotBg = 'var(--green)'; dotBorder = 'var(--green)'; dotColor = '#0a0a1a'; }
                else if (isDone) { dotBg = '#5c4a12'; dotBorder = 'var(--gold)'; dotColor = 'var(--gold)'; }
                const label = lvl.extra || lvl.boss ? `★${lvl.code || 'BOSS'}` : (lvl.code || lvl.level_number);
                return (
                  <div key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {prevBlock && prevBlock !== lvl.block && <span style={{ width: 1, height: 18, background: 'var(--border)', marginRight: 4 }} />}
                    <button
                      onClick={() => !locked && !isCurrent && router.push(`/battle/${lvl.id}`)}
                      disabled={locked}
                      title={locked ? lockMessageOf(lock, lvl, moduleLevels) : levelName(lvl)}
                      aria-label={locked ? `${levelName(lvl)} — zablokowane. ${lockMessageOf(lock, lvl, moduleLevels)}` : levelName(lvl)}
                      style={{
                        minWidth: 44, height: 44, padding: '0 8px', background: dotBg, border: `1.5px solid ${dotBorder}`, borderRadius: 22,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: dotShadow, whiteSpace: 'nowrap',
                        fontFamily: PIXEL, fontSize: 11, color: dotColor, cursor: locked ? 'not-allowed' : isCurrent ? 'default' : 'pointer',
                        opacity: locked ? 0.4 : 1,
                      }}
                    >
                      {locked ? `🔒${lvl.code ? ` ${label}` : ''}` : isDone && !isCurrent ? `✓${lvl.code ? ` ${label}` : ''}` : label}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setShowLevelList(s => !s)}
              aria-expanded={showLevelList}
              className="chip-button"
              style={{ fontFamily: PIXEL, fontSize: 11, flexShrink: 0 }}
            >
              📋 {counterLevels.filter(l => isPassed(l, bestScores, completedVia)).length}/{counterLevels.length} {showLevelList ? '▲' : '▼'}
            </button>
          </div>
        )}
        {showLevelList && (
          <LevelList
            levels={moduleLevels}
            currentId={id}
            bestScores={bestScores}
            completedVia={completedVia}
            lockReason={lockReason}
            onOpen={(lvl) => { setShowLevelList(false); if (lvl.id !== id) router.push(`/battle/${lvl.id}`); }}
          />
        )}
      </div>

      <div className="battle-stage">
      {/* ===== LEWA KOLUMNA: ZADANIE I PISANIE ===== */}
      <section className="battle-main" aria-label="Zadanie">
        <header className="battle-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px 12px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: PIXEL, fontSize: 11, lineHeight: 1.5, color: typeColor, background: 'rgba(10,10,26,0.9)',
              border: `1px solid ${typeColor}`, padding: '5px 9px', borderRadius: 2, flexShrink: 0,
            }}>
              {zoneMode || quizMode
                ? <>{cfg.extra ? '★ DLA CHĘTNYCH · ' : cfg.boss ? '👑 ' : ''}{exerciseLabel.toUpperCase()}</>
                : <>ZADANIE {level?.level_number}/{module?.total_levels} · {level?.type === 'solo' ? '⚡ SOLO' : level?.type === 'fix_prompt' ? '🔧 NAPRAW PROMPT' : '👁 ZGADNIJ AI'}</>}
            </span>
            <span style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: 'var(--muted)', lineHeight: 1.4 }}>
              {zoneMode || quizMode ? (
                <>
                  {cfg.difficulty ? <>{'⭐'.repeat(cfg.difficulty)} · </> : null}
                  {cfg.duration ? <>⏱ {cfg.duration} · </> : null}
                  <span style={{ color: 'var(--gold)' }}>{level.xp_reward} XP</span>
                  {cfg.bonus ? <> + bonus <span style={{ color: 'var(--gold)' }}>{cfg.bonus.xp}</span></> : null}
                </>
              ) : personalBest !== undefined
                ? <>Rekord: <span style={{ color: scoreColorOf(personalBest) }}>{personalBest}/100</span></>
                : <>Do zdobycia: <span style={{ color: 'var(--gold)' }}>{level?.xp_reward} XP</span></>}
            </span>
          </div>
          {(zoneMode || quizMode) && (
            <h1 className="battle-title">
              {cfg.department ? `${cfg.department} · ` : ''}{level.title}
            </h1>
          )}
        </header>

        <div className="battle-main-scroll">
          {lockNotice && (
            <div role="alert" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(247,200,79,0.1)', border: '1px solid var(--gold)', borderRadius: 4, padding: '10px 12px', fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: '#f3e3b0', lineHeight: 1.45 }}>
              <span style={{ flex: 1 }}>🔒 {lockNotice}</span>
              <button onClick={() => { setLockNotice(null); sessionStorage.removeItem('lockNotice'); }} className="chip-button" aria-label="Zamknij komunikat" style={{ flexShrink: 0 }}>✕</button>
            </div>
          )}

          {!result && passedHere && (
            <PassedAttempt
              zone={savedZones[id]}
              score={bestScores[id]}
              prompt={level.type === 'blind_test' || quizMode ? null : modulePrompts[id]}
              feedback={savedFeedback[id]}
              via={completedVia[id]}
            />
          )}

          {zoneMode || quizMode ? (
            <ExerciseBrief level={level} relatedPrompt={relatedPrompt} onInsert={(t) => { setPrompt(t); setTimeout(() => textareaRef.current?.focus(), 0); }} />
          ) : (
            <div className="battle-steps" style={{ background: 'rgba(15,12,36,0.97)', border: '2px solid rgba(79,142,247,0.5)', borderRadius: 4, padding: '12px 14px', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>🎯 Co masz zrobić</div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, color: 'var(--white)', lineHeight: 1.5, fontWeight: 600 }}>
                {level?.task_description}
              </div>
              {level?.type === 'fix_prompt' && level?.broken_prompt && (
                <div style={{ marginTop: 10, background: 'rgba(247,79,79,0.1)', border: '1px solid var(--red)', padding: '8px 12px', borderRadius: 3 }}>
                  <SectionLabel color="#ff8a8a">❌ ZŁY PROMPT DO POPRAWY</SectionLabel>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: '#ffb0b0', fontStyle: 'italic', fontWeight: 600, lineHeight: 1.5 }}>
                    „{level.broken_prompt}”
                  </div>
                </div>
              )}
              {level?.type !== 'blind_test' && level?.goal_description && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(247,201,79,0.3)' }}>
                  <SectionLabel color="var(--gold)">🎯 SZEF OCENI, CZY:</SectionLabel>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: '#f3e3b0', lineHeight: 1.5, fontWeight: 600 }}>
                    {level.goal_description}
                  </div>
                </div>
              )}
            </div>
          )}

          {!result && level?.type === 'blind_test' && (
            <BlindTestInput options={blindOptions} blindAnswer={blindAnswer} setBlindAnswer={setBlindAnswer} disabled={evaluating} />
          )}

          {quizMode && (
            <QuizPanel
              key={`${id}-${quizNonce}`}
              questions={cfg.quiz.questions}
              onFinish={finishQuiz}
              saving={evaluating}
            />
          )}

          {!result && !zoneMode && !quizMode && level?.type !== 'blind_test' && (
            <div>
              <SectionLabel color="var(--muted)">🧱 KLOCKI DOBREGO PROMPTA — KLIKNIJ, ABY WSTAWIĆ</SectionLabel>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {chips.map(b => (
                  <button key={b.key} onClick={() => insertBlock(b.text)} disabled={evaluating} className="chip-button">{b.label}</button>
                ))}
                {level?.type === 'fix_prompt' && level?.broken_prompt && (
                  <button onClick={() => insertBlock(level.broken_prompt)} disabled={evaluating} className="chip-button" style={{ borderColor: 'rgba(247,79,79,0.5)', color: '#ff9999' }}>
                    ↳ Wstaw zły prompt
                  </button>
                )}
              </div>
            </div>
          )}

          {zoneMode && <RedZoneBanner />}

          {result && chatMode && (
            <div ref={chatRef} className="battle-chat">
              <ConversationChat
                title={cfg.system_test ? 'TEST: ODPOWIEDŹ TWOJEGO ASYSTENTA' : 'PODGLĄD: CO AI ZROBIŁO Z TWOIM PROMPTEM'}
                description="Tak AI odpowiedziało na Twój prompt. Jeśli zadało pytania, możesz na nie odpowiedzieć."
                messages={[
                  ...previewTurns(cfg).map(m => ({
                    from: m.role === 'assistant' ? 'ai' : 'me',
                    label: m.label ? (m.role === 'assistant' ? `🤖 ${m.label}` : `👤 ${m.label}`) : undefined,
                    text: m.content,
                  })),
                  cfg.system_test
                    ? { from: 'me', label: '👤 Klient napisał', text: cfg.system_test.message }
                    : { from: 'me', text: prompt },
                  { from: 'ai', label: cfg.system_test ? '🤖 Twój asystent' : undefined, text: result.aiResponse },
                  ...chatHistory.map(m => m.role === 'user'
                    ? { from: 'me', label: cfg.system_test ? 'Ty (jako klient)' : undefined, text: m.content }
                    : { from: 'ai', label: cfg.system_test ? '🤖 Twój asystent' : undefined, text: m.content }),
                ]}
                canReply={canReply}
                replyLabel={awaitingReply ? cfg.conversation.reply_label : 'Odpowiedz AI'}
                replyNote={replyRequired ? null : 'Nieobowiązkowe — ocena i XP dotyczą tylko pierwszego promptu.'}
                reply={conv?.reply || ''}
                onReplyChange={(text) => updateChat({ reply: text, error: null })}
                onSend={sendReply}
                sending={!!(conv?.sending || conv?.saving)}
                error={conv?.error}
                replyRedZone={conv?.reply ? detectRedZone(conv.reply, cfg.red_terms) : []}
                endNote={repliesLeft <= 0 ? 'To koniec rozmowy w tym zadaniu.' : null}
                saveFailed={!!conv?.saveFailed}
                onSave={finishConversation}
                done={replyRequired && !!conv?.done}
                doneText="✅ Zadanie zaliczone."
                finishLabel={nextLevel && !nextLocked ? `DALEJ: ${nextLevel.label || nextLevel.code || 'następne'} ▶` : '🗺 Wróć na mapę'}
                onFinish={() => router.push(nextLevel && !nextLocked ? `/battle/${nextLevel.id}` : '/map')}
              />
            </div>
          )}
        </div>

        {/* ---------- POLE PROMPTU (przyklejone na dole) ---------- */}
        {!result && !quizMode && (
          <div className="battle-composer">
            {lastAttempt && level?.type !== 'blind_test' && (
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 600, color: 'var(--muted)', lineHeight: 1.4 }}>
                {lastAttempt.zone
                  ? <>Poprzednia próba: <span style={{ color: ZONES[lastAttempt.zone].color }}>{ZONES[lastAttempt.zone].label.toLowerCase()}</span> — popraw prompt i wejdź wyżej!</>
                  : <>Poprzednia próba: <span style={{ color: scoreColorOf(lastAttempt.score) }}>{lastAttempt.score}/100</span> — popraw prompt i pobij ten wynik!</>}
              </div>
            )}
            {level?.type !== 'blind_test' && (
              <>
                {copyNotice && (
                  <div role="alert" style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: '#f3e3b0', background: 'rgba(247,201,79,0.12)', border: '1px solid var(--gold)', borderRadius: 4, padding: '8px 12px', animation: 'pop-in 0.2s ease-out' }}>
                    ✋ {copyNotice.error}
                    <div style={{ fontWeight: 600, color: 'var(--muted)', marginTop: 4 }}>Podobieństwo: {copyNotice.similarity}% · ta próba nie została policzona.</div>
                  </div>
                )}
                {aiNotice && (
                  <div role="alert" style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: '#f3e3b0', background: 'rgba(247,201,79,0.12)', border: '1px solid var(--gold)', borderRadius: 4, padding: '8px 12px', animation: 'pop-in 0.2s ease-out' }}>
                    📡 {aiNotice}
                    <div style={{ fontWeight: 600, color: 'var(--muted)', marginTop: 4 }}>Ta próba się nie liczy. Twój prompt jest zachowany.</div>
                  </div>
                )}
                {redZoneHits.length > 0 && (
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: '#ffb0b0', background: 'rgba(247,79,79,0.12)', border: '1px solid var(--red)', borderRadius: 4, padding: '8px 12px', animation: 'pop-in 0.2s ease-out' }}>
                    🚫 Wygląda na dane z czerwonej strefy: {redZoneHits.join(', ')}. Zamień je na placeholder — taki prompt nie zostanie wysłany do AI.
                  </div>
                )}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    readOnly={evaluating}
                    autoFocus
                    aria-label="Twój prompt"
                    placeholder="Wpisz tutaj swój prompt…"
                    rows={3}
                    className="prompt-input"
                    style={{ opacity: evaluating ? 0.6 : 1 }}
                    onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleAttack(); } }}
                  />
                  <div style={{
                    position: 'absolute', right: 14, bottom: 6, fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700,
                    color: wordCount >= 30 ? 'var(--green)' : wordCount >= 12 ? 'var(--gold)' : 'var(--muted)', pointerEvents: 'none',
                  }}>
                    {wordCount} słów
                  </div>
                </div>
              </>
            )}

            {evaluating ? (
              <EvaluatingPanel stage={evalStage} bossName={module?.boss_name} tip={LOADING_TIPS[tipIndex]} isBlind={level?.type === 'blind_test'} />
            ) : (
              <button
                onClick={handleAttack}
                disabled={(!prompt.trim() && level?.type !== 'blind_test') || (level?.type === 'blind_test' && !blindAnswer)}
                className="pixel-button btn-primary attack-button"
              >
                {level?.type === 'blind_test' ? '👁  SPRAWDŹ' : '⚔  ATAKUJ PROMPTEM'}
                {level?.type !== 'blind_test' && <span className="attack-hint">Ctrl / ⌘ + Enter</span>}
              </button>
            )}
          </div>
        )}

        {result && (
          <div className="battle-actions">
            {!overlay && !awaitingReply && ((zoneMode ? !(result.zone === 'green' && result.bonus) : quizMode ? false : result.score < 70) || result.error) && (
              <button onClick={() => retry()} className="pixel-button" style={{ fontSize: 11, padding: '12px 8px', background: 'var(--bg2)', border: '1px solid var(--accent2)', color: 'var(--accent2)' }}>
                {level?.type === 'blind_test' ? '🔄 JESZCZE RAZ' : zoneMode && result.zone === 'green' ? '⭐ POWALCZ O BONUS' : zoneMode ? '✏️ NOWA PRÓBA' : '✏️ POPRAW PROMPT'}
              </button>
            )}
            {nextLevel && !nextLocked && !replyRequired && (zoneMode ? result.zone === 'green' || skipState?.done : quizMode || result.score >= 40) && !result.error && (
              <button onClick={() => router.push(`/battle/${nextLevel.id}`)} className="pixel-button btn-primary" style={{ fontSize: 11, padding: '12px 8px' }}>
                {nextLevel.code ? `DALEJ: ${nextLevel.label || nextLevel.code} ▶` : 'NASTĘPNE ▶'}
              </button>
            )}
            {nextLevel && !awaitingReply && lockReason(nextLevel) === 'block' && (zoneMode ? result.zone === 'green' || skipState?.done : quizMode || result.score >= 40) && !result.error && (
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: 'var(--muted)', alignSelf: 'center' }}>
                🔒 {nextLevel.label || nextLevel.code || 'Następne'} odblokuje trener
              </div>
            )}
            <button onClick={() => router.push('/map')} className="pixel-button battle-actions-map" style={{ fontSize: 11, padding: '12px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              🗺 MAPA
            </button>
          </div>
        )}
      </section>

      {/* ===== PRAWA KOLUMNA: SCENA, WYNIK, POMOC ===== */}
      <aside className="battle-side" aria-label="Pomoc">
        <div className="battle-scene">
          {roomBg && <img src={roomBg} alt="" className="pixel-art battle-scene-bg" onError={e => { e.currentTarget.style.display = 'none'; }} />}

          {flash && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none',
              background: flash === 'white' ? 'rgba(255,255,255,0.35)' : 'rgba(247,79,79,0.3)',
              animation: 'flash-fade 0.25s ease-out forwards',
            }} />
          )}

          {floatingText && (
            <div style={{
              position: 'absolute', top: 8, right: '4%',
              fontFamily: PIXEL, fontSize: 22, color: attackEffect === 'miss' ? 'var(--red)' : 'var(--gold)',
              textShadow: '3px 3px 0 rgba(0,0,0,0.9)', animation: 'float-up 1s ease-out forwards',
              pointerEvents: 'none', zIndex: 30, whiteSpace: 'nowrap',
            }}>{floatingText}</div>
          )}

          {attackEffect && (
            <div style={{
              position: 'absolute', bottom: '30%', left: '50%', fontSize: 34,
              animation: attackEffect === 'miss' ? 'projectile-left 0.5s ease-in forwards' : 'projectile-right 0.5s ease-in forwards',
              pointerEvents: 'none', zIndex: 20,
            }}>
              {attackEffect === 'hit' ? '⚡' : attackEffect === 'weak' ? '⚔' : '💀'}
            </div>
          )}

          <div className="battle-fighter battle-fighter--player" style={{ animation: shakeTarget === 'player' ? 'shake 0.6s ease-out' : 'none' }}>
            <div className="battle-sprite"><Character characterId={player?.character_id} size={6} animate /></div>
            <div className="battle-fighter-name" style={{ color: 'var(--green)', borderColor: 'var(--green)' }}>{player?.display_name || 'TY'}</div>
          </div>

          <div key={bossLine} className="battle-bubble" style={{
            border: `2px solid ${result && !result.error ? scoreColor : 'var(--accent2)'}`,
            animation: 'pop-in 0.3s cubic-bezier(.34,1.56,.64,1)',
          }}>
            <div className="battle-bubble-tail" style={{ borderLeftColor: result && !result.error ? scoreColor : 'var(--accent2)' }} />
            <div className="battle-bubble-who">
              {module?.boss_name}{module?.boss_title ? ` · ${module.boss_title}` : ''}
            </div>
            <div className="battle-bubble-body">„{bossLine}”</div>
          </div>

          <div className="battle-fighter battle-fighter--boss" style={{
            animation: shakeTarget === 'boss' ? 'shake 0.6s ease-out' : evaluating ? 'boss-think 1.2s ease-in-out infinite' : 'none',
          }}>
            <div className="battle-sprite"><Character characterId={module?.boss_character_id} size={6} animate flipped /></div>
            <div className="battle-fighter-name" style={{ color: 'var(--accent2)', borderColor: 'var(--accent2)' }}>{module?.boss_name}</div>
          </div>
        </div>

        <div ref={sideScrollRef} className="battle-side-scroll">
          {/* ---------- WYNIK ---------- */}
          {result && (
            <div ref={resultRef} className="battle-result">
              {zoneMode && !result.error ? (
                <>
                  {lastAttempt?.zone && (
                    <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: 'var(--muted)' }}>
                      Poprzednio: <span style={{ color: ZONES[lastAttempt.zone].color }}>{ZONES[lastAttempt.zone].label.toLowerCase()}</span> → teraz: <span style={{ color: ZONES[result.zone].color }}>{ZONES[result.zone].label.toLowerCase()}</span>
                    </div>
                  )}
                  <ZoneResult result={result} level={level} saved={saved} pending={awaitingReply}>
                    {result.co_poprawic && result.zone !== 'yellow' && (
                      <FeedbackBox icon="🛠" label="CO POPRAWIĆ" text={result.co_poprawic} color="var(--red)" />
                    )}
                    <FeedbackBox icon="💡" label="WSKAZÓWKA" text={result.wskazowka} color="var(--gold)" />
                    <FeedbackBox icon="✅" label="CO POSZŁO DOBRZE" text={result.co_poszlo_dobrze} color="var(--green)" />
                  </ZoneResult>
                </>
              ) : (
                <>
                  <div style={{
                    background: 'rgba(10,8,28,0.96)', border: `2px solid ${scoreColor}`, borderRadius: 4, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, flexShrink: 0,
                    boxShadow: `0 0 24px ${scoreColor}33`, animation: 'pop-in 0.35s cubic-bezier(.34,1.56,.64,1)',
                  }}>
                    <div>
                      <div style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>WYNIK</div>
                      <div style={{ fontFamily: PIXEL, fontSize: 28, color: scoreColor }}>{displayScore}<span style={{ fontSize: 12, color: 'var(--muted)' }}>/100</span></div>
                      {lastAttempt && !result.error && (
                        <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, marginTop: 6, color: result.score > lastAttempt.score ? 'var(--green)' : result.score < lastAttempt.score ? 'var(--red)' : 'var(--muted)' }}>
                          {result.score > lastAttempt.score ? '▲' : result.score < lastAttempt.score ? '▼' : '='} {result.score - lastAttempt.score >= 0 ? '+' : ''}{result.score - lastAttempt.score} vs poprzednia próba
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: PIXEL, fontSize: 11, lineHeight: 1.5, color: scoreColor }}>
                        {result.error ? '⚠ BŁĄD' : result.score >= 70 ? '⚡ ŚWIETNY!' : result.score >= 40 ? '⚔ ZALICZONE' : '💀 PUDŁO!'}
                      </div>
                      <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, marginTop: 6, color: xpGained > 0 ? 'var(--gold)' : 'var(--muted)' }}>
                        {result.error ? '' : !saved ? 'zapisywanie…'
                          : xpGained > 0 ? `+${xpGained} XP`
                          : saved.practice ? 'trening — pobij rekord, by zdobyć XP'
                          : result.score < 40 ? (livesEnabled ? '−1 ❤️  (min. 40 by zaliczyć)' : 'min. 40 by zaliczyć') : '+0 XP'}
                      </div>
                    </div>
                  </div>
                  <FeedbackBox icon="✅" label="CO POSZŁO DOBRZE" text={result.co_poszlo_dobrze} color="var(--green)" />
                  <FeedbackBox icon="🛠" label="CO POPRAWIĆ" text={result.co_poprawic} color="var(--red)" />
                  <FeedbackBox icon="💡" label="WSKAZÓWKA" text={result.wskazowka} color="var(--gold)" />
                  {result.kryteria && <CriteriaBars kryteria={result.kryteria} />}
                </>
              )}

              {result.lepszy_prompt && (!zoneMode || result.zone === 'green') && (
                <div style={{ background: 'rgba(79,247,160,0.06)', border: '1px dashed var(--green)', borderRadius: 4, padding: '10px 12px' }}>
                  <SectionLabel color="var(--green)">✨ PRZYKŁAD LEPSZEGO PROMPTA</SectionLabel>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', lineHeight: 1.5, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                    {result.lepszy_prompt}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    <button onClick={() => retry(result.lepszy_prompt)} className="chip-button" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>✏️ Użyj jako bazy</button>
                    <button onClick={copyBetterPrompt} className="chip-button">{copied ? '✓ Skopiowano' : '📋 Kopiuj'}</button>
                  </div>
                </div>
              )}

              {result.aiResponse && !chatMode && (
                <div style={{ background: 'rgba(10,10,26,0.95)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: 4, padding: '10px 12px' }}>
                  <SectionLabel color="var(--accent)">🤖 {level?.type === 'blind_test' ? 'ODPOWIEDŹ' : cfg?.system_test ? 'TEST: ODPOWIEDŹ TWOJEGO ASYSTENTA' : zoneMode ? 'PODGLĄD: CO AI ZROBIŁO Z TWOIM PROMPTEM' : 'CO AI ZROBIŁA Z TWOIM PROMPTEM'}</SectionLabel>
                  {cfg?.system_test && (
                    <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: '#f3e3b0', fontWeight: 700, marginTop: -4, marginBottom: 8 }}>
                      Klient napisał: „{cfg.system_test.message}”
                    </div>
                  )}
                  {zoneMode && !cfg?.system_test && (
                    <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--muted)', fontWeight: 600, marginTop: -4, marginBottom: 8 }}>
                      Ocena dotyczy Twojego prompta. Placeholdery mogą sprawić, że wynik będzie ogólny — to w porządku.
                    </div>
                  )}
                  <div style={{
                    fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', lineHeight: 1.55, fontWeight: 500,
                    whiteSpace: 'pre-wrap', maxHeight: showFullResponse ? 'none' : '11rem', overflow: 'hidden', position: 'relative',
                  }}>
                    {result.aiResponse}
                    {!showFullResponse && result.aiResponse.length > 400 && (
                      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 50, background: 'linear-gradient(transparent, rgba(10,10,26,1))' }} />
                    )}
                  </div>
                  {result.aiResponse.length > 400 && (
                    <button onClick={() => setShowFullResponse(s => !s)} className="chip-button" style={{ marginTop: 8 }}>
                      {showFullResponse ? '▲ Zwiń' : '▼ Pokaż całą odpowiedź'}
                    </button>
                  )}
                </div>
              )}

              {level?.type !== 'blind_test' && prompt && !chatMode && !quizMode && (
                <details style={{ background: 'rgba(10,10,26,0.95)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 4, padding: '0 12px' }}>
                  <summary className="fold-summary" style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, lineHeight: 1.4, color: 'var(--muted)', cursor: 'pointer' }}>Twój prompt</summary>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', lineHeight: 1.5, marginBottom: 10, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{prompt}</div>
                </details>
              )}

              {zoneMode && !result.error && !result.redZoneDetected?.length && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={saveToLibrary}
                    disabled={libraryState === 'saving' || libraryState === 'saved'}
                    className="chip-button"
                    style={{ borderColor: 'var(--gold)', color: 'var(--gold)', padding: '8px 12px' }}
                  >
                    {libraryState === 'saved' ? '✓ Zapisano w bibliotece' : libraryState === 'saving' ? 'Zapisuję…' : '💾 Zapisz prompt w bibliotece'}
                  </button>
                  {libraryState === 'error' && <span style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--red)', fontWeight: 600 }}>Nie udało się zapisać — spróbuj ponownie.</span>}
                </div>
              )}

              {zoneMode && referenceUnlocked && cfg.reveal && <RevealAfterPass reveal={cfg.reveal} />}

              {zoneMode && cfg.footer && result.zone === 'green' && (
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 600, color: '#cfd3ff', borderLeft: '3px solid var(--accent)', padding: '4px 10px' }}>
                  📌 {cfg.footer}
                </div>
              )}
            </div>
          )}

          {/* ---------- POMOC ---------- */}
          <div className="battle-help">
            {zoneMode && <ExerciseHelp level={level} />}
            {canSkip && !result?.error && (
              <SkipOffer attempts={failedAttempts} xpReward={level.xp_reward} state={skipState} onSkip={skipWithReference} next={result ? null : skipNext} />
            )}
            {zoneMode && (
              <ReferencePrompt
                key={skipState?.done || conv?.done ? 'ref-open' : 'ref'}
                reference={cfg.reference}
                unlocked={referenceUnlocked}
                defaultOpen={!!(skipState?.done || conv?.done)}
                reason="Porównaj ze swoim."
              />
            )}
            {showExample && !(result && (result.error || result.zone === 'green')) && <OtherExample example={cfg.other_example} folded />}
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}

/* ===== SUB-KOMPONENTY ===== */

function SectionLabel({ color, children }) {
  return (
    <div style={{ fontFamily: PIXEL, fontSize: 11, color, marginBottom: 8, letterSpacing: 0.5, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function EvaluatingPanel({ stage, bossName, tip, isBlind }) {
  const steps = isBlind
    ? ['Sprawdzam odpowiedź']
    : ['AI wykonuje twój prompt', `${bossName || 'Szef'} ocenia wynik`];
  return (
    <div style={{ background: 'rgba(15,12,36,0.95)', border: '2px solid var(--accent)', borderRadius: 4, padding: '14px 16px', animation: 'pop-in 0.25s ease-out' }}>
      {steps.map((label, i) => {
        const done = i < stage;
        const active = i === stage;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, opacity: done || active ? 1 : 0.4 }}>
            <span style={{ fontFamily: PIXEL, fontSize: 11, color: done ? 'var(--green)' : 'var(--accent)', width: 16, flexShrink: 0 }}>
              {done ? '✓' : active ? <span style={{ animation: 'blink 0.8s steps(2) infinite' }}>▶</span> : '·'}
            </span>
            <span style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: 'var(--white)' }}>
              {label}{active && <span className="loading-dots" />}
            </span>
          </div>
        );
      })}
      <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px dashed rgba(247,201,79,0.3)', fontFamily: "'Rajdhani'", fontSize: 17, color: '#f3e3b0', fontWeight: 600, lineHeight: 1.5 }}>
        💡 {tip}
      </div>
    </div>
  );
}

function CriteriaBars({ kryteria }) {
  return (
    <div style={{ background: 'rgba(10,10,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '10px 12px' }}>
      <SectionLabel color="var(--muted)">📊 PUNKTY ZA KLOCKI PROMPTA</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(11rem, 100%), 1fr))', gap: '8px 14px' }}>
        {CRITERIA.map((c, i) => {
          const v = kryteria[c.key] ?? 0;
          const color = v >= 18 ? 'var(--green)' : v >= 10 ? 'var(--gold)' : 'var(--red)';
          return (
            <div key={c.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0 8px', fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, marginBottom: 3 }}>
                <span style={{ color: 'var(--white)' }}>{c.icon} {c.label}</span>
                <span style={{ color }}>{v}/25</span>
              </div>
              <div style={{ height: 8, background: 'var(--panel)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(v / 25) * 100}%`, background: color, animation: `bar-grow 0.7s ease-out ${0.1 * i}s both` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Overlay({ color, title, subtitle, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(10,10,26,0.95)',
      display: 'flex', overflowY: 'auto', padding: 24,
    }}>
      <div style={{ margin: 'auto', maxWidth: '40rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{
          fontFamily: PIXEL, fontSize: 'clamp(16px,3vw,28px)', lineHeight: 1.5, color, textShadow: `0 0 24px ${color}`,
          textAlign: 'center', animation: 'level-up-appear 0.4s ease-out',
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 22, color: 'var(--white)', textAlign: 'center', fontWeight: 600 }}>
            {subtitle}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function BlindTestInput({ options, blindAnswer, setBlindAnswer, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel color="var(--accent2)">👁 KTÓRĄ ODPOWIEDŹ NAPISAŁA AI?</SectionLabel>
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => setBlindAnswer(opt.key)}
          disabled={disabled}
          style={{
            background: blindAnswer === opt.key ? 'rgba(247,79,142,0.15)' : 'rgba(15,12,36,0.9)',
            border: `2px solid ${blindAnswer === opt.key ? 'var(--accent2)' : 'rgba(247,79,142,0.25)'}`,
            borderRadius: 4, color: 'var(--white)', padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s', transform: blindAnswer === opt.key ? 'scale(1.01)' : 'none',
          }}
        >
          <div style={{ fontFamily: PIXEL, fontSize: 11, color: blindAnswer === opt.key ? 'var(--accent2)' : 'var(--muted)', marginBottom: 8 }}>
            {blindAnswer === opt.key ? '▶ ' : ''}ODPOWIEDŹ {opt.label}
          </div>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, lineHeight: 1.5, fontWeight: 600 }}>
            {opt.text}
          </div>
        </button>
      ))}
    </div>
  );
}

function LevelList({ levels, currentId, bestScores, completedVia, lockReason, onOpen }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: '6px 14px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 4, maxHeight: '50vh', overflowY: 'auto' }}>
      {levels.map(lvl => {
        const lock = lockReason(lvl);
        const done = isPassed(lvl, bestScores, completedVia);
        const current = lvl.id === currentId;
        const color = lock ? 'var(--muted)' : current ? 'var(--accent)' : done ? 'var(--green)' : 'var(--white)';
        return (
          <li key={lvl.id}>
            <button
              onClick={() => !lock && onOpen(lvl)}
              disabled={!!lock}
              aria-current={current ? 'true' : undefined}
              style={{
                width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                background: current ? 'rgba(79,142,247,0.12)' : 'rgba(15,12,36,0.9)', border: `1px solid ${current ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 4, padding: '6px 10px', cursor: lock ? 'not-allowed' : 'pointer', opacity: lock ? 0.75 : 1,
              }}
            >
              <span style={{ width: 22, flexShrink: 0, textAlign: 'center' }}>{lock ? '🔒' : done ? '✅' : current ? '▶' : '•'}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: "'Rajdhani'", fontSize: 16, fontWeight: 700, color }}>{levelName(lvl)}</span>
                {lock && (
                  <span style={{ display: 'block', fontFamily: "'Rajdhani'", fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>
                    {lockMessageOf(lock, lvl, levels)}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PassedAttempt({ zone, score, prompt, feedback, via }) {
  const z = ZONES[zone];
  const title = via === 'reference' ? '📘 ZALICZONE ZE WZORCEM — TWOJE NAJLEPSZE PODEJŚCIE'
    : via === 'trainer' ? '🎓 ZALICZONE PRZEZ TRENERA — TWOJE NAJLEPSZE PODEJŚCIE'
    : '✅ ZALICZONE — TWOJE NAJLEPSZE PODEJŚCIE';
  return (
    <details style={{ background: 'rgba(79,247,160,0.06)', border: '1px solid var(--green)', borderRadius: 4, padding: '0 12px' }}>
      <summary className="fold-summary" style={{ fontFamily: PIXEL, fontSize: 11, lineHeight: 1.6, color: 'var(--green)', cursor: 'pointer' }}>
        {title} {z ? `· ${z.label}` : score ? `· ${score}/100` : ''}
      </summary>
      <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
        {prompt && (
          <div>
            <SectionLabel color="var(--muted)">TWÓJ PROMPT</SectionLabel>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{prompt}</div>
          </div>
        )}
        <FeedbackBox icon="✅" label="CO POSZŁO DOBRZE" text={feedback?.co_poszlo_dobrze} color="var(--green)" />
        <FeedbackBox icon="🛠" label="CO POPRAWIĆ" text={feedback?.co_poprawic} color="var(--red)" />
        <FeedbackBox icon="💡" label="WSKAZÓWKA" text={feedback?.wskazowka} color="var(--gold)" />
      </div>
    </details>
  );
}

function FeedbackBox({ icon, label, text, color }) {
  return (
    <div className="feedback-box" style={{ background: 'rgba(10,10,26,0.95)', borderTop: `1px solid ${color}55`, borderRight: `1px solid ${color}55`, borderBottom: `1px solid ${color}55`, borderLeft: `3px solid ${color}`, borderRadius: 4, padding: '10px 12px' }}>
      <SectionLabel color={color}>{icon} {label}</SectionLabel>
      <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', lineHeight: 1.5, fontWeight: 600 }}>
        {text || '—'}
      </div>
    </div>
  );
}
