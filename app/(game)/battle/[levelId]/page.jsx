'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPlayerLevel } from '@/lib/auth';
import { detectRedZone } from '@/lib/redZone';
import { lockReasonOf, passMarkOf } from '@/lib/progress';
import Character from '@/components/Character';
import { ExerciseBrief, ZoneResult, ReferencePrompt, RevealAfterPass, RedZoneBanner, zoneBossLine, ZONES } from '@/components/ExercisePanels';

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

  const textareaRef = useRef(null);

  useEffect(() => { loadData(); }, [levelId]);

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

    const playerId = sessionStorage.getItem('playerId');
    if (!playerId) { router.push('/login'); return; }

    const [levelRes, playerRes] = await Promise.all([
      fetch(`/api/levels?id=${levelId}`),
      fetch(`/api/player/me?id=${playerId}`),
    ]);

    if (!levelRes.ok) { router.push('/map'); return; }
    const { level: levelData } = await levelRes.json();
    if (!levelData) { router.push('/map'); return; }

    setLevel(levelData);
    setModule(levelData.modules);

    const allLevelsRes = await fetch(`/api/levels?moduleId=${levelData.module_id}`);
    if (allLevelsRes.ok) {
      const { levels: allLevels } = await allLevelsRes.json();
      setModuleLevels(allLevels || []);
    }

    const scoresRes = await fetch(`/api/battles?playerId=${playerId}&moduleId=${levelData.module_id}`);
    if (scoresRes.ok) {
      const { bestScores: scores, attempts: att, prompts } = await scoresRes.json();
      setBestScores(scores || {});
      setAttempts(att || {});
      setModulePrompts(prompts || {});
    }

    if (playerRes.ok) {
      const { player: playerData } = await playerRes.json();
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

    setBossHp(100);
    setLoading(false);
  }

  async function handleAttack() {
    if (evaluating) return;
    if (level?.type === 'blind_test') { handleBlindSubmit(); return; }
    if (!prompt.trim()) return;

    setEvalStage(0);
    setTipIndex(i => (i + 1) % LOADING_TIPS.length);
    setDisplayScore(0);
    setEvaluating(true);
    setResult(null);
    setSaved(null);
    setShowFullResponse(false);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: prompt,
          levelId: parseInt(levelId),
          playerId: sessionStorage.getItem('playerId'),
          taskDescription: level.task_description,
          goalDescription: level.goal_description,
          brokenPrompt: level.broken_prompt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd oceny');
      setResult(data);
      await animateAndSave(data);
    } catch (err) {
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

  async function animateAndSave(data) {
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

    const playerId = sessionStorage.getItem('playerId');
    const res = await fetch('/api/battle/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId, levelId: parseInt(levelId),
        score: data.score, zone: data.zone || null, bonus: !!data.bonus,
        co_poszlo_dobrze: data.co_poszlo_dobrze,
        co_poprawic: data.co_poprawic, wskazowka: data.wskazowka,
        promptUsed: level.type === 'blind_test' ? `blind:${blindAnswer}` : prompt,
      }),
    });
    const savedData = await res.json();
    setSaved(savedData);

    const id = parseInt(levelId);
    setBestScores(prev => ({ ...prev, [id]: Math.max(prev[id] ?? 0, data.score) }));
    if (savedData.attemptNumber) setAttempts(prev => ({ ...prev, [id]: savedData.attemptNumber }));

    if (savedData.gameOver) {
      setLives(0); setPlayerHp(0);
      setTimeout(() => setOverlay('game-over'), 1200);
      return;
    }
    if (savedData.newLives !== undefined && savedData.newLives < lives) {
      setTimeout(() => { setLives(savedData.newLives); setPlayerHp(Math.round((savedData.newLives / 3) * 100)); }, 900);
    }
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

  function retry(newPrompt) {
    if (result && !result.error) setLastAttempt({ score: result.score, zone: result.zone });
    setResult(null);
    setSaved(null);
    setBlindAnswer(null);
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
    return lockReasonOf(lvl, moduleLevels, bestScores, module?.active_block, player?.role === 'admin');
  }

  function isLevelLocked(lvl) {
    return lockReason(lvl) !== null;
  }

  if (loading) return (
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
  const livesEnabled = module?.lives_enabled !== false;
  const id = parseInt(levelId);
  const bossLine = evaluating
    ? (evalStage === 0 ? 'Hmm, zobaczmy co AI z tym zrobi…' : 'Czytam uważnie… jeszcze chwilka.')
    : result && !result.error ? (zoneMode ? zoneBossLine(result.zone) : bossReaction(result.score)) : level?.boss_dialogue;
  const nextLevel = getNextLevel();
  const nextLocked = isLevelLocked(nextLevel);
  const xpGained = saved?.xpGained;
  const redZoneHits = zoneMode && !result ? detectRedZone(prompt, cfg.red_terms) : [];
  const passMark = zoneMode ? 90 : 40;
  const passedHere = (bestScores[id] ?? 0) >= passMark;
  const referenceUnlocked = zoneMode ? passedHere : (bestScores[id] ?? 0) >= 70 || (attempts[id] ?? 0) >= 2;
  const exerciseLabel = cfg?.label || (level?.code ? `ĆWICZENIE ${level.code}` : 'ZADANIE');
  const relatedLevel = cfg?.related_code ? moduleLevels.find(l => l.code === cfg.related_code) : null;
  const relatedPrompt = relatedLevel ? modulePrompts[relatedLevel.id] : null;
  const chips = [...PROMPT_BLOCKS, ...(cfg?.chips || []).map(c => ({ key: c.label, label: c.label, text: c.text }))];
  const panelWidth = zoneMode ? 'clamp(360px, 44%, 620px)' : 'clamp(330px, 38%, 500px)';

  const levelLock = lockReason(level);
  if (levelLock) {
    const required = moduleLevels[moduleLevels.findIndex(l => l.id === level.id) - 1];
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontFamily: PIXEL, fontSize: 14, color: 'var(--gold)' }}>{exerciseLabel} JESZCZE ZAMKNIĘTE</div>
        <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, color: 'var(--white)', fontWeight: 600, maxWidth: 480 }}>
          {levelLock === 'previous'
            ? <>Najpierw zalicz {required?.label || (required?.code ? `ćwiczenie ${required.code}` : 'poprzednie zadanie')}{passMarkOf(required) === 90 ? ' na zielono' : ''}. To ćwiczenie otworzy się automatycznie.</>
            : <>To ćwiczenie należy do bloku {level.block}. Trener odblokuje je, gdy przejdziemy do tej części szkolenia.</>}
        </div>
        {levelLock === 'previous' && required ? (
          <button onClick={() => router.push(`/battle/${required.id}`)} className="pixel-button btn-primary">▶ PRZEJDŹ DO {(required.label || required.code || `zadania ${required.level_number}`).toUpperCase()}</button>
        ) : (
          <button onClick={() => router.push('/map')} className="pixel-button btn-primary">🗺 WRÓĆ NA MAPĘ</button>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative', background: '#0d0d20' }}>

      {roomBg && (
        <img
          src={roomBg}
          alt="Pokój"
          className="pixel-art"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', zIndex: 0 }}
        />
      )}

      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(5,5,18,0.85) 0%, rgba(5,5,18,0.65) 38%, rgba(5,5,18,0.1) 60%, transparent 75%)',
      }} />

      {flash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 150, pointerEvents: 'none',
          background: flash === 'white' ? 'rgba(255,255,255,0.35)' : 'rgba(247,79,79,0.3)',
          animation: 'flash-fade 0.25s ease-out forwards',
        }} />
      )}

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
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', maxWidth: 460, textAlign: 'center', lineHeight: 1.5, fontWeight: 600 }}>
            💡 Zanim zaczniesz: każdy prompt niech ma <b style={{ color: 'var(--gold)' }}>rolę, kontekst, zadanie i format</b>. To 4 klocki, za które dostajesz punkty.
          </div>
          <button autoFocus onClick={() => { setOverlay(null); router.push('/map'); }} className="pixel-button btn-danger">🔄 SPRÓBUJ PONOWNIE</button>
        </Overlay>
      )}

      {/* ===== GÓRNY PASEK ===== */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(6,5,18,0.98)', borderBottom: '2px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch', height: 48 }}>
          <button
            onClick={() => router.push('/map')}
            className="topbar-back"
            style={{
              background: 'rgba(30,20,60,0.95)', borderRight: '1px solid var(--border)',
              fontFamily: PIXEL, fontSize: 8, padding: '0 14px', cursor: 'pointer', flexShrink: 0,
            }}
          >← MAPA</button>

          <div style={{ flex: 1, padding: '7px 14px 7px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: PIXEL, fontSize: 9, color: 'var(--green)' }}>{player?.display_name || 'TY'}</span>
              {livesEnabled ? (
                <div style={{ display: 'flex', gap: 2 }} title="Życia — tracisz jedno przy wyniku poniżej 40">
                  {[0, 1, 2].map(i => <span key={i} style={{ fontSize: 14, opacity: i < lives ? 1 : 0.15, filter: i < lives ? 'none' : 'grayscale(1)', transition: 'opacity 0.3s' }}>❤️</span>)}
                </div>
              ) : (
                <span style={{ fontFamily: "'Rajdhani'", fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>🛡 Dziś bez utraty życia · {player?.total_xp || 0} XP</span>
              )}
            </div>
            <div className="hp-bar"><div className="hp-fill hp-fill-player" style={{ width: `${playerHp}%` }} /></div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0 }}>
            <span style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--gold)', textShadow: '0 0 10px rgba(247,200,79,0.6)' }}>VS</span>
          </div>

          <div style={{ flex: 1, padding: '7px 12px 7px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ fontFamily: PIXEL, fontSize: 9, color: 'var(--red)' }}>{module?.boss_name}</span>
            </div>
            <div className="hp-bar"><div className="hp-fill hp-fill-boss" style={{ width: `${bossHp}%` }} /></div>
          </div>
        </div>

        {moduleLevels.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: PIXEL, fontSize: 7, color: 'var(--muted)', flexShrink: 0 }}>{module?.title}</span>
            <div style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'center' }}>
              {moduleLevels.map(lvl => {
                const isCurrent = lvl.id === parseInt(levelId);
                const score = bestScores[lvl.id];
                const isDone = score !== undefined && score >= passMark;
                const isPerfect = score !== undefined && score >= (zoneMode ? 90 : 70);
                const lock = lockReason(lvl);
                const locked = lock !== null;
                const prevBlock = moduleLevels[moduleLevels.indexOf(lvl) - 1]?.block;
                let dotBg = 'rgba(255,255,255,0.07)', dotBorder = 'rgba(255,255,255,0.15)', dotColor = 'rgba(255,255,255,0.4)', dotShadow = 'none';
                if (isCurrent) { dotBg = 'var(--accent)'; dotBorder = 'var(--accent)'; dotColor = '#fff'; dotShadow = '0 0 10px rgba(79,142,247,0.8)'; }
                else if (isPerfect) { dotBg = 'var(--green)'; dotBorder = 'var(--green)'; dotColor = '#0a0a1a'; }
                else if (isDone) { dotBg = '#5c4a12'; dotBorder = 'var(--gold)'; dotColor = 'var(--gold)'; }
                const label = lvl.boss ? `👑${lvl.code.replace(/^BOSS\s*/i, '')}` : (lvl.code || lvl.level_number);
                return (
                  <div key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {prevBlock && prevBlock !== lvl.block && <span style={{ width: 1, height: 18, background: 'var(--border)', marginRight: 4 }} />}
                    <button
                      onClick={() => !locked && !isCurrent && router.push(`/battle/${lvl.id}`)}
                      disabled={locked}
                      title={lock === 'block' ? 'Odblokuje trener' : lock === 'previous' ? 'Najpierw zalicz poprzednie ćwiczenie' : `${lvl.label || (lvl.code ? `Ćwiczenie ${lvl.code}` : `Zadanie ${lvl.level_number}`)}${lvl.title ? ` — ${lvl.title}` : ''}`}
                      style={{
                        minWidth: lvl.code ? 34 : 24, height: 24, padding: '0 4px', background: dotBg, border: `1.5px solid ${dotBorder}`, borderRadius: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: dotShadow,
                        fontFamily: PIXEL, fontSize: 8, color: dotColor, cursor: locked ? 'not-allowed' : isCurrent ? 'default' : 'pointer',
                        opacity: locked ? 0.4 : 1,
                      }}
                    >
                      {locked ? '🔒' : isDone && !isCurrent ? `✓${lvl.code ? ` ${label}` : ''}` : label}
                    </button>
                  </div>
                );
              })}
            </div>
            <span style={{ fontFamily: PIXEL, fontSize: 7, color: 'var(--muted)', flexShrink: 0 }}>
              {moduleLevels.filter(l => (bestScores[l.id] ?? 0) >= passMark).length}/{moduleLevels.length}
            </span>
          </div>
        )}
      </div>

      {/* ===== LEWY PANEL ===== */}
      <div style={{
        position: 'absolute', top: moduleLevels.length > 0 ? 86 : 48, left: 0, bottom: 0,
        width: panelWidth, zIndex: 30,
        display: 'flex', flexDirection: 'column', padding: '14px 16px 18px', gap: 12,
        overflowY: 'auto', background: 'rgba(6,4,20,0.82)', backdropFilter: 'blur(8px)',
        borderRight: '1px solid rgba(79,142,247,0.15)',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            fontFamily: PIXEL, fontSize: 8, color: typeColor, background: 'rgba(10,10,26,0.9)',
            border: `1px solid ${typeColor}`, padding: '6px 10px', borderRadius: 2,
          }}>
            {zoneMode
              ? <>{cfg.boss ? '👑 ' : ''}{exerciseLabel} · {'⭐'.repeat(cfg.difficulty || 1)} · {cfg.duration}</>
              : <>ZADANIE {level?.level_number}/{module?.total_levels} · {level?.type === 'solo' ? '⚡ SOLO' : level?.type === 'fix_prompt' ? '🔧 NAPRAW PROMPT' : '👁 ZGADNIJ AI'}</>}
          </div>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>
            {zoneMode
              ? <><span style={{ color: 'var(--gold)' }}>{level.xp_reward} XP</span>{cfg.bonus ? <> + bonus <span style={{ color: 'var(--gold)' }}>{cfg.bonus.xp}</span></> : null}</>
              : personalBest !== undefined
              ? <>Rekord: <span style={{ color: scoreColorOf(personalBest) }}>{personalBest}/100</span></>
              : <>Do zdobycia: <span style={{ color: 'var(--gold)' }}>{level?.xp_reward} XP</span></>}
          </div>
        </div>

        {zoneMode && (
          <div style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--white)', lineHeight: 1.5 }}>{level.title}</div>
        )}

        {/* ---------- ZADANIE + INPUT ---------- */}
        {!result && (
          <>
            {zoneMode ? (
              <>
                <ExerciseBrief level={level} relatedPrompt={relatedPrompt} onInsert={(t) => { setPrompt(t); setTimeout(() => textareaRef.current?.focus(), 0); }} />
                <ReferencePrompt reference={cfg.reference} unlocked={referenceUnlocked} reason="Porównaj ze swoim." />
                <RedZoneBanner />
              </>
            ) : (
            <div style={{ background: 'rgba(15,12,36,0.95)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: 4, padding: '12px 14px', flexShrink: 0 }}>
              <SectionLabel color="var(--accent)">📋 TWOJE ZADANIE</SectionLabel>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--white)', lineHeight: 1.55, fontWeight: 600 }}>
                {level?.task_description}
              </div>
              {level?.type === 'fix_prompt' && level?.broken_prompt && (
                <div style={{ marginTop: 10, background: 'rgba(247,79,79,0.1)', border: '1px solid var(--red)', padding: '8px 12px', borderRadius: 3 }}>
                  <SectionLabel color="var(--red)">❌ ZŁY PROMPT DO POPRAWY</SectionLabel>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 15, color: '#ff9999', fontStyle: 'italic', fontWeight: 600 }}>
                    „{level.broken_prompt}”
                  </div>
                </div>
              )}
              {level?.type !== 'blind_test' && level?.goal_description && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(247,201,79,0.3)' }}>
                  <SectionLabel color="var(--gold)">🎯 SZEF OCENI, CZY:</SectionLabel>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, color: '#f3e3b0', lineHeight: 1.5, fontWeight: 600 }}>
                    {level.goal_description}
                  </div>
                </div>
              )}
            </div>
            )}

            {level?.type === 'blind_test' ? (
              <BlindTestInput options={blindOptions} blindAnswer={blindAnswer} setBlindAnswer={setBlindAnswer} disabled={evaluating} />
            ) : (
              <>
                {!zoneMode && <div>
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
                </div>}

                {lastAttempt && (
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>
                    {lastAttempt.zone
                      ? <>Poprzednia próba: <span style={{ color: ZONES[lastAttempt.zone].color }}>{ZONES[lastAttempt.zone].label.toLowerCase()}</span> — popraw prompt i wejdź wyżej!</>
                      : <>Poprzednia próba: <span style={{ color: scoreColorOf(lastAttempt.score) }}>{lastAttempt.score}/100</span> — popraw prompt i pobij ten wynik!</>}
                  </div>
                )}

                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    readOnly={evaluating}
                    autoFocus
                    placeholder={'Napisz prompt tak, jakbyś zlecał zadanie nowemu asystentowi…\n\nWskazówka: użyj klocków powyżej.'}
                    rows={7}
                    className="prompt-input"
                    style={{ opacity: evaluating ? 0.6 : 1 }}
                    onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleAttack(); } }}
                  />
                  <div style={{
                    position: 'absolute', right: 10, bottom: 8, fontFamily: "'Rajdhani'", fontSize: 13, fontWeight: 700,
                    color: wordCount >= 30 ? 'var(--green)' : wordCount >= 12 ? 'var(--gold)' : 'var(--muted)', pointerEvents: 'none',
                  }}>
                    {wordCount} słów
                  </div>
                </div>
                {redZoneHits.length > 0 && (
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 700, color: '#ff9999', background: 'rgba(247,79,79,0.12)', border: '1px solid var(--red)', borderRadius: 4, padding: '8px 12px', animation: 'pop-in 0.2s ease-out' }}>
                    🚫 Wygląda na dane z czerwonej strefy: {redZoneHits.join(', ')}. Zamień je na placeholder — taki prompt nie zostanie wysłany do AI.
                  </div>
                )}
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
                {level?.type !== 'blind_test' && <span style={{ display: 'block', fontFamily: "'Rajdhani'", fontSize: 12, marginTop: 4, letterSpacing: 0, opacity: 0.75 }}>Ctrl / ⌘ + Enter</span>}
              </button>
            )}
          </>
        )}

        {/* ---------- WYNIKI ---------- */}
        {result && (
          <>
            {zoneMode && !result.error ? (
              <>
                {lastAttempt?.zone && (
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>
                    Poprzednio: <span style={{ color: ZONES[lastAttempt.zone].color }}>{ZONES[lastAttempt.zone].label.toLowerCase()}</span> → teraz: <span style={{ color: ZONES[result.zone].color }}>{ZONES[result.zone].label.toLowerCase()}</span>
                  </div>
                )}
                <ZoneResult result={result} level={level} saved={saved} />
              </>
            ) : (
            <div style={{
              background: 'rgba(10,8,28,0.96)', border: `2px solid ${scoreColor}`, borderRadius: 4, padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
              boxShadow: `0 0 24px ${scoreColor}33`, animation: 'pop-in 0.35s cubic-bezier(.34,1.56,.64,1)',
            }}>
              <div>
                <div style={{ fontFamily: PIXEL, fontSize: 8, color: 'var(--muted)', marginBottom: 6 }}>WYNIK</div>
                <div style={{ fontFamily: PIXEL, fontSize: 28, color: scoreColor }}>{displayScore}<span style={{ fontSize: 12, color: 'var(--muted)' }}>/100</span></div>
                {lastAttempt && !result.error && (
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 700, marginTop: 6, color: result.score > lastAttempt.score ? 'var(--green)' : result.score < lastAttempt.score ? 'var(--red)' : 'var(--muted)' }}>
                    {result.score > lastAttempt.score ? '▲' : result.score < lastAttempt.score ? '▼' : '='} {result.score - lastAttempt.score >= 0 ? '+' : ''}{result.score - lastAttempt.score} vs poprzednia próba
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: PIXEL, fontSize: 11, color: scoreColor }}>
                  {result.error ? '⚠ BŁĄD' : result.score >= 70 ? '⚡ ŚWIETNY!' : result.score >= 40 ? '⚔ ZALICZONE' : '💀 PUDŁO!'}
                </div>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 15, fontWeight: 700, marginTop: 6, color: xpGained > 0 ? 'var(--gold)' : 'var(--muted)' }}>
                  {result.error ? '' : !saved ? 'zapisywanie…'
                    : xpGained > 0 ? `+${xpGained} XP`
                    : saved.practice ? 'trening — pobij rekord, by zdobyć XP'
                    : result.score < 40 ? (livesEnabled ? '−1 ❤️  (min. 40 by zaliczyć)' : 'min. 40 by zaliczyć') : '+0 XP'}
                </div>
              </div>
            </div>
            )}

            {result.kryteria && <CriteriaBars kryteria={result.kryteria} />}

            <FeedbackBox icon="✅" label="CO POSZŁO DOBRZE" text={result.co_poszlo_dobrze} color="var(--green)" />
            <FeedbackBox icon="🛠" label="CO POPRAWIĆ" text={result.co_poprawic} color="var(--red)" />
            <FeedbackBox icon="💡" label="WSKAZÓWKA" text={result.wskazowka} color="var(--gold)" />

            {result.lepszy_prompt && (!zoneMode || result.zone === 'green') && (
              <div style={{ background: 'rgba(79,247,160,0.06)', border: '1px dashed var(--green)', borderRadius: 4, padding: '10px 12px' }}>
                <SectionLabel color="var(--green)">✨ PRZYKŁAD LEPSZEGO PROMPTA</SectionLabel>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 15, color: 'var(--white)', lineHeight: 1.5, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                  {result.lepszy_prompt}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={() => retry(result.lepszy_prompt)} className="chip-button" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>✏️ Użyj jako bazy</button>
                  <button onClick={copyBetterPrompt} className="chip-button">{copied ? '✓ Skopiowano' : '📋 Kopiuj'}</button>
                </div>
              </div>
            )}

            {level?.type !== 'blind_test' && prompt && (
              <details style={{ background: 'rgba(10,10,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '8px 12px' }}>
                <summary style={{ fontFamily: PIXEL, fontSize: 8, color: 'var(--muted)', cursor: 'pointer' }}>TWÓJ PROMPT</summary>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, color: 'var(--white)', lineHeight: 1.5, marginTop: 8, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{prompt}</div>
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
                {libraryState === 'error' && <span style={{ fontFamily: "'Rajdhani'", color: 'var(--red)', fontWeight: 600 }}>Nie udało się zapisać — spróbuj ponownie.</span>}
              </div>
            )}

            {zoneMode && referenceUnlocked && cfg.reveal && <RevealAfterPass reveal={cfg.reveal} />}

            {zoneMode && (
              <ReferencePrompt reference={cfg.reference} unlocked={referenceUnlocked} reason="Porównaj ze swoim." />
            )}

            {zoneMode && cfg.footer && result.zone === 'green' && (
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 600, color: '#cfd3ff', borderLeft: '3px solid var(--accent)', padding: '4px 10px' }}>
                📌 {cfg.footer}
              </div>
            )}

            {result.aiResponse && (
              <div style={{ background: 'rgba(10,10,26,0.95)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: 4, padding: '10px 12px' }}>
                <SectionLabel color="var(--accent)">🤖 {level?.type === 'blind_test' ? 'ODPOWIEDŹ' : zoneMode ? 'PODGLĄD: CO AI ZROBIŁO Z TWOIM PROMPTEM' : 'CO AI ZROBIŁA Z TWOIM PROMPTEM'}</SectionLabel>
                {zoneMode && (
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginTop: -4, marginBottom: 8 }}>
                    Ocena dotyczy Twojego prompta. Placeholdery mogą sprawić, że wynik będzie ogólny — to w porządku.
                  </div>
                )}
                <div style={{
                  fontFamily: "'Rajdhani'", fontSize: 14, color: 'var(--white)', lineHeight: 1.55, fontWeight: 500,
                  whiteSpace: 'pre-wrap', maxHeight: showFullResponse ? 'none' : 160, overflow: 'hidden', position: 'relative',
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

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0, position: 'sticky', bottom: -18, padding: '10px 0 4px', background: 'linear-gradient(transparent, rgba(6,4,20,0.95) 30%)' }}>
              {!overlay && ((zoneMode ? !(result.zone === 'green' && result.bonus) : result.score < 70) || result.error) && (
                <button onClick={() => retry()} className="pixel-button" style={{ flex: 1, fontSize: 9, padding: '12px 8px', background: 'var(--bg2)', border: '1px solid var(--accent2)', color: 'var(--accent2)' }}>
                  {level?.type === 'blind_test' ? '🔄 JESZCZE RAZ' : zoneMode && result.zone === 'green' ? '⭐ POWALCZ O BONUS' : zoneMode ? '✏️ NOWA PRÓBA' : '✏️ POPRAW PROMPT'}
                </button>
              )}
              {nextLevel && !nextLocked && (zoneMode ? result.zone === 'green' : result.score >= 40) && !result.error && (
                <button onClick={() => router.push(`/battle/${nextLevel.id}`)} className="pixel-button btn-primary" style={{ flex: 1, fontSize: 9, padding: '12px 8px' }}>
                  {nextLevel.code ? `DALEJ: ${nextLevel.label || nextLevel.code} ▶` : 'NASTĘPNE ▶'}
                </button>
              )}
              {nextLevel && lockReason(nextLevel) === 'block' && (zoneMode ? result.zone === 'green' : result.score >= 40) && !result.error && (
                <div style={{ flex: 1, fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 700, color: 'var(--muted)', alignSelf: 'center' }}>
                  🔒 {nextLevel.label || nextLevel.code || 'Następne'} odblokuje trener
                </div>
              )}
              <button onClick={() => router.push('/map')} className="pixel-button" style={{ flex: '0 0 auto', fontSize: 9, padding: '12px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                🗺 MAPA
              </button>
            </div>
          </>
        )}
      </div>

      {floatingText && (
        <div style={{
          position: 'absolute', top: '30%', left: '65%', transform: 'translateX(-50%)',
          fontFamily: PIXEL, fontSize: 26, color: attackEffect === 'miss' ? 'var(--red)' : 'var(--gold)',
          textShadow: '3px 3px 0 rgba(0,0,0,0.9)', animation: 'float-up 1s ease-out forwards',
          pointerEvents: 'none', zIndex: 30, whiteSpace: 'nowrap',
        }}>{floatingText}</div>
      )}

      {attackEffect && (
        <div style={{
          position: 'absolute', top: '48%', left: '52%', fontSize: 40,
          animation: attackEffect === 'miss' ? 'projectile-left 0.5s ease-in forwards' : 'projectile-right 0.5s ease-in forwards',
          pointerEvents: 'none', zIndex: 20,
        }}>
          {attackEffect === 'hit' ? '⚡' : attackEffect === 'weak' ? '⚔' : '💀'}
        </div>
      )}

      {/* ===== GRACZ ===== */}
      <div style={{
        position: 'absolute', bottom: '20%', left: zoneMode ? '51%' : '43%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: shakeTarget === 'player' ? 'shake 0.6s ease-out' : 'none', zIndex: 10,
      }}>
        <Character characterId={player?.character_id} size={14} animate />
        <div style={{
          fontFamily: PIXEL, fontSize: 8, color: 'var(--green)', background: 'rgba(8,8,20,0.95)', padding: '5px 14px',
          border: '2px solid var(--green)', whiteSpace: 'nowrap', marginTop: 4, boxShadow: '0 0 8px rgba(79,247,160,0.3)',
        }}>{player?.display_name || 'TY'}</div>
      </div>

      {/* ===== SZEF ===== */}
      <div style={{
        position: 'absolute', bottom: '14%', left: zoneMode ? '76%' : '72%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: shakeTarget === 'boss' ? 'shake 0.6s ease-out' : evaluating ? 'boss-think 1.2s ease-in-out infinite' : 'none', zIndex: 10,
      }}>
        <Character characterId={module?.boss_character_id} size={14} animate flipped />
        <div style={{
          fontFamily: PIXEL, fontSize: 8, color: 'var(--accent2)', background: 'rgba(8,8,20,0.95)', padding: '5px 14px',
          border: '2px solid var(--accent2)', whiteSpace: 'nowrap', marginTop: 4, boxShadow: '0 0 8px rgba(247,79,142,0.3)',
        }}>{module?.boss_name}</div>
      </div>

      {/* ===== DYMEK SZEFA ===== */}
      <div key={bossLine} style={{
        position: 'absolute', bottom: 'calc(14% + 230px)', right: '4%',
        maxWidth: zoneMode ? 'clamp(240px, 30%, 420px)' : 'clamp(260px, 34%, 440px)', background: 'rgba(8,4,24,0.97)',
        border: `2px solid ${result && !result.error ? scoreColor : 'var(--accent2)'}`, borderRadius: 4,
        padding: '14px 18px', zIndex: 25,
        boxShadow: '0 0 24px rgba(247,79,142,0.2), 0 8px 32px rgba(0,0,0,0.95)',
        animation: 'pop-in 0.3s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{
          position: 'absolute', bottom: -11, right: '18%', width: 0, height: 0,
          borderLeft: '11px solid transparent', borderRight: '11px solid transparent',
          borderTop: `11px solid ${result && !result.error ? scoreColor : 'var(--accent2)'}`,
        }} />
        <div style={{ fontFamily: PIXEL, fontSize: 8, color: 'var(--accent2)', marginBottom: 8, letterSpacing: 1 }}>
          {module?.boss_name} · {module?.boss_title}
        </div>
        <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', lineHeight: 1.6, fontWeight: 600 }}>
          „{bossLine}”
        </div>
      </div>
    </div>
  );
}

/* ===== SUB-KOMPONENTY ===== */

function SectionLabel({ color, children }) {
  return (
    <div style={{ fontFamily: PIXEL, fontSize: 8, color, marginBottom: 8, letterSpacing: 0.5, lineHeight: 1.5 }}>
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
            <span style={{ fontFamily: PIXEL, fontSize: 10, color: done ? 'var(--green)' : 'var(--accent)', width: 16 }}>
              {done ? '✓' : active ? <span style={{ animation: 'blink 0.8s steps(2) infinite' }}>▶</span> : '·'}
            </span>
            <span style={{ fontFamily: "'Rajdhani'", fontSize: 16, fontWeight: 700, color: 'var(--white)' }}>
              {label}{active && <span className="loading-dots" />}
            </span>
          </div>
        );
      })}
      <div style={{ marginTop: 6, paddingTop: 10, borderTop: '1px dashed rgba(247,201,79,0.3)', fontFamily: "'Rajdhani'", fontSize: 14, color: '#f3e3b0', fontWeight: 600, lineHeight: 1.5 }}>
        💡 {tip}
      </div>
    </div>
  );
}

function CriteriaBars({ kryteria }) {
  return (
    <div style={{ background: 'rgba(10,10,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '10px 12px' }}>
      <SectionLabel color="var(--muted)">📊 PUNKTY ZA KLOCKI PROMPTA</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
        {CRITERIA.map((c, i) => {
          const v = kryteria[c.key] ?? 0;
          const color = v >= 18 ? 'var(--green)' : v >= 10 ? 'var(--gold)' : 'var(--red)';
          return (
            <div key={c.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 700, marginBottom: 3 }}>
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
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24,
    }}>
      <div style={{
        fontFamily: PIXEL, fontSize: 'clamp(16px,3vw,28px)', color, textShadow: `0 0 24px ${color}`,
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
          <div style={{ fontFamily: PIXEL, fontSize: 8, color: blindAnswer === opt.key ? 'var(--accent2)' : 'var(--muted)', marginBottom: 8 }}>
            {blindAnswer === opt.key ? '▶ ' : ''}ODPOWIEDŹ {opt.label}
          </div>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 15, lineHeight: 1.5, fontWeight: 600 }}>
            {opt.text}
          </div>
        </button>
      ))}
    </div>
  );
}

function FeedbackBox({ icon, label, text, color }) {
  return (
    <div style={{ background: 'rgba(10,10,26,0.95)', borderTop: `1px solid ${color}55`, borderRight: `1px solid ${color}55`, borderBottom: `1px solid ${color}55`, borderLeft: `3px solid ${color}`, borderRadius: 4, padding: '10px 12px' }}>
      <SectionLabel color={color}>{icon} {label}</SectionLabel>
      <div style={{ fontFamily: "'Rajdhani'", fontSize: 15, color: 'var(--white)', lineHeight: 1.5, fontWeight: 600 }}>
        {text || '—'}
      </div>
    </div>
  );
}
