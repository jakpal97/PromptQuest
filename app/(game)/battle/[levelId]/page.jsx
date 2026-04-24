'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPlayerLevel } from '@/lib/auth';
import Character from '@/components/Character';

export default function BattlePage() {
  const router = useRouter();
  const { levelId } = useParams();

  const [level, setLevel] = useState(null);
  const [module, setModule] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  const [playerHp, setPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(100);
  const [lives, setLives] = useState(3);

  const [shakeTarget, setShakeTarget] = useState(null);
  const [floatingText, setFloatingText] = useState(null);
  const [attackEffect, setAttackEffect] = useState(null);

  const [overlay, setOverlay] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [blindAnswer, setBlindAnswer] = useState(null);
  const [moduleLevels, setModuleLevels] = useState([]);
  const [bestScores, setBestScores] = useState({});

  const textareaRef = useRef(null);

  useEffect(() => { loadData(); }, [levelId]);

  async function loadData() {
    setLoading(true);
    setResult(null);
    setPrompt('');
    setBlindAnswer(null);
    setAttackEffect(null);

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

    // Załaduj wyniki gracza dla tego modułu
    const scoresRes = await fetch(`/api/battles?playerId=${playerId}&moduleId=${levelData.module_id}`);
    if (scoresRes.ok) {
      const { bestScores: scores } = await scoresRes.json();
      setBestScores(scores || {});
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
    if (level?.type === 'blind_test') { handleBlindSubmit(); return; }
    if (!prompt.trim()) return;

    setEvaluating(true);
    setResult(null);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: prompt,
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
      setResult({ score: 0, co_poszlo_dobrze: 'Błąd połączenia', co_poprawic: err.message, wskazowka: 'Spróbuj ponownie' });
    } finally {
      setEvaluating(false);
    }
  }

  function handleBlindSubmit() {
    if (!blindAnswer) return;
    const correct = level.blind_correct === blindAnswer;
    const score = correct ? 80 : 20;
    const data = {
      score,
      co_poszlo_dobrze: correct ? 'Świetnie! Poprawnie rozpoznałeś odpowiedź AI.' : 'Odpowiedź ludzka — AI pisze bardziej formalnie.',
      co_poprawic: correct ? 'Ćwicz dalej rozpoznawanie stylu AI.' : 'Zwróć uwagę na strukturę i formalny język AI.',
      wskazowka: 'AI używa numerowanych list i formalnego języka.',
      aiResponse: correct ? `✓ Odpowiedź ${blindAnswer.toUpperCase()} to AI.` : `✗ Odpowiedź ${blindAnswer.toUpperCase()} to człowiek.`,
    };
    setResult(data);
    animateAndSave(data);
  }

  async function animateAndSave(data) {
    const score = data.score;
    if (score >= 70) {
      setAttackEffect('hit');
      setFloatingText(`⚡ +${score}`);
      setTimeout(() => setShakeTarget('boss'), 300);
      setTimeout(() => { setShakeTarget(null); setBossHp(p => Math.max(0, p - score)); setFloatingText(null); }, 900);
    } else if (score >= 40) {
      setAttackEffect('weak');
      setFloatingText(`⚔ ${score}`);
      setTimeout(() => { setBossHp(p => Math.max(0, p - Math.round(score / 2))); setFloatingText(null); }, 800);
    } else {
      setAttackEffect('miss');
      setFloatingText('💀 -1 ❤️');
      setTimeout(() => setShakeTarget('player'), 300);
      setTimeout(() => { setShakeTarget(null); setLives(p => Math.max(0, p - 1)); setPlayerHp(p => Math.max(0, p - 34)); setFloatingText(null); }, 900);
    }
    setTimeout(() => setAttackEffect(null), 1000);

    const playerId = sessionStorage.getItem('playerId');
    const res = await fetch('/api/battle/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId, levelId: parseInt(levelId), moduleId: level.module_id,
        score: data.score, co_poszlo_dobrze: data.co_poszlo_dobrze,
        co_poprawic: data.co_poprawic, wskazowka: data.wskazowka,
        promptUsed: prompt, levelNumber: level.level_number,
        totalLevels: module?.total_levels || 6, xpReward: level.xp_reward,
      }),
    });
    const saved = await res.json();
    if (saved.gameOver) { setTimeout(() => setOverlay('game-over'), 1200); setLives(0); setPlayerHp(0); return; }
    if (saved.moduleComplete) {
      const oldLvl = getPlayerLevel(player?.total_xp || 0);
      const newLvl = getPlayerLevel(saved.newTotalXp);
      setTimeout(() => {
        setShowConfetti(true);
        setOverlay(newLvl.level > oldLvl.level ? 'level-up' : 'module-complete');
        if (saved.newTotalXp) { setPlayer(p => ({ ...p, total_xp: saved.newTotalXp })); sessionStorage.setItem('totalXp', saved.newTotalXp); }
      }, 1200);
      return;
    }
    if (saved.newTotalXp !== undefined) {
      setPlayer(p => ({ ...p, total_xp: saved.newTotalXp, current_lives: saved.newLives }));
      sessionStorage.setItem('totalXp', saved.newTotalXp);
      setLives(saved.newLives);
      setPlayerHp(Math.round((saved.newLives / 3) * 100));
    }
  }

  function getNextLevel() {
    if (!moduleLevels.length) return null;
    const idx = moduleLevels.findIndex(l => l.id === parseInt(levelId));
    if (idx === -1 || idx >= moduleLevels.length - 1) return null;
    return moduleLevels[idx + 1];
  }

  const scoreColor = result
    ? result.score >= 70 ? 'var(--green)' : result.score >= 40 ? 'var(--gold)' : 'var(--red)'
    : 'var(--white)';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: 'var(--accent)' }}>WCHODZISZ DO ARENY...</span>
    </div>
  );

  const roomBg = module?.room_key ? `/rooms/room-${module.room_key}.png` : null;

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative', background: '#0d0d20' }}>

      {/* TŁO POKOJU */}
      {roomBg && (
        <img
          src={roomBg}
          alt="Pokój"
          className="pixel-art"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            imageRendering: 'pixelated',
            zIndex: 0,
          }}
        />
      )}

      {/* Delikatne przyciemnienie po lewej dla czytelności panelu */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to right, rgba(5,5,18,0.82) 0%, rgba(5,5,18,0.65) 32%, rgba(5,5,18,0.1) 55%, transparent 70%)',
      }} />

      {/* CONFETTI */}
      {showConfetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200, overflow: 'hidden' }}>
          {Array.from({ length: 40 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${Math.random() * 100}%`, top: '-10px',
              width: 10, height: 10,
              background: ['var(--gold)', 'var(--accent)', 'var(--green)', 'var(--accent2)'][i % 4],
              animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.5}s forwards`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
            }} />
          ))}
        </div>
      )}

      {/* OVERLAYE */}
      {overlay === 'module-complete' && (
        <Overlay color="var(--gold)" title="🏆 MODUŁ UKOŃCZONY!" subtitle={module?.title}>
          <Character characterId={player?.character_id} size={6} animate />
          <button onClick={() => { setOverlay(null); setShowConfetti(false); router.push('/map'); }} className="pixel-button btn-gold">🗺 WRÓĆ NA MAPĘ</button>
        </Overlay>
      )}
      {overlay === 'level-up' && (
        <Overlay color="var(--accent)" title="⚡ LEVEL UP!" subtitle={getPlayerLevel(player?.total_xp || 0).name}>
          <button onClick={() => { setOverlay(null); setShowConfetti(true); setTimeout(() => setOverlay('module-complete'), 400); }} className="pixel-button btn-primary">DALEJ ▶</button>
        </Overlay>
      )}
      {overlay === 'game-over' && (
        <Overlay color="var(--red)" title="💀 KONIEC ŻYĆ!" subtitle="Zaczynasz moduł od nowa...">
          <button onClick={() => { setOverlay(null); router.push('/map'); }} className="pixel-button btn-danger">🔄 SPRÓBUJ PONOWNIE</button>
        </Overlay>
      )}

      {/* ===== GÓRNY PASEK ===== */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(6,5,18,0.98)',
        borderBottom: '2px solid var(--border)',
        backdropFilter: 'blur(6px)',
      }}>
        {/* WIERSZ 1 — przycisk mapy + HP + VS + HP */}
        <div style={{ display: 'flex', alignItems: 'stretch', height: 44 }}>

          {/* ← MAPA */}
          <button
            onClick={() => router.push('/map')}
            style={{
              background: 'rgba(30,20,60,0.95)', borderRight: '1px solid var(--border)',
              color: 'var(--muted)', fontFamily: "'Press Start 2P'", fontSize: 6,
              padding: '0 12px', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--white)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >← MAPA</button>

          {/* HP gracza */}
          <div style={{ flex: 1, padding: '7px 14px 7px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: 'var(--green)' }}>{player?.display_name || 'TY'}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0,1,2].map(i => <span key={i} style={{ fontSize: 12, opacity: i < lives ? 1 : 0.15, filter: i < lives ? 'none' : 'grayscale(1)' }}>❤️</span>)}
              </div>
            </div>
            <div className="hp-bar"><div className="hp-fill hp-fill-player" style={{ width: `${playerHp}%` }} /></div>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0 }}>
            <span style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: 'var(--gold)', textShadow: '0 0 10px rgba(247,200,79,0.6)' }}>VS</span>
          </div>

          {/* HP szefa */}
          <div style={{ flex: 1, padding: '7px 10px 7px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0,1,2].map(i => <span key={i} style={{ fontSize: 12 }}>❤️</span>)}
              </div>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: 'var(--red)' }}>{module?.boss_name}</span>
            </div>
            <div className="hp-bar"><div className="hp-fill hp-fill-boss" style={{ width: `${bossHp}%` }} /></div>
          </div>
        </div>

        {/* WIERSZ 2 — postęp zadań (kółka) */}
        {moduleLevels.length > 0 && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '5px 14px 6px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontFamily: "'Press Start 2P'", fontSize: 5, color: 'var(--muted)', flexShrink: 0 }}>
              {module?.title}
            </span>

            <div style={{ display: 'flex', gap: 5, flex: 1, justifyContent: 'center' }}>
              {moduleLevels.map((lvl, idx) => {
                const isCurrent = lvl.id === parseInt(levelId);
                const score = bestScores[lvl.id];
                const isDone = score !== undefined && score >= 40;
                const isPerfect = score !== undefined && score >= 70;

                let dotBg = 'rgba(255,255,255,0.07)';
                let dotBorder = 'rgba(255,255,255,0.12)';
                let dotColor = 'rgba(255,255,255,0.3)';
                let dotShadow = 'none';
                if (isCurrent) { dotBg = 'var(--accent)'; dotBorder = 'var(--accent)'; dotColor = '#fff'; dotShadow = '0 0 10px rgba(79,142,247,0.8)'; }
                else if (isPerfect) { dotBg = 'var(--green)'; dotBorder = 'var(--green)'; dotColor = '#fff'; }
                else if (isDone) { dotBg = '#2a5c30'; dotBorder = 'var(--green)'; dotColor = 'var(--green)'; }

                return (
                  <div key={lvl.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: 22, height: 22,
                      background: dotBg,
                      border: `1.5px solid ${dotBorder}`,
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: dotShadow,
                      fontFamily: "'Press Start 2P'", fontSize: 6, color: dotColor,
                    }}>
                      {isDone && !isCurrent ? '✓' : lvl.level_number}
                    </div>
                    {isCurrent && (
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 4px var(--accent)' }} />
                    )}
                  </div>
                );
              })}
            </div>

            <span style={{ fontFamily: "'Press Start 2P'", fontSize: 5, color: 'var(--muted)', flexShrink: 0 }}>
              {Object.values(bestScores).filter(s => s >= 40).length}/{moduleLevels.length}
            </span>
          </div>
        )}
      </div>

      {/* ===== LEWY PANEL ===== */}
      <div style={{
        position: 'absolute', top: moduleLevels.length > 0 ? 92 : 44, left: 0, bottom: 0,
        width: 'clamp(280px, 32%, 400px)',
        zIndex: 30,
        display: 'flex', flexDirection: 'column',
        padding: '12px 14px 16px',
        gap: 10,
        overflowY: 'auto',
        background: 'rgba(6,4,20,0.78)',
        backdropFilter: 'blur(8px)',
        borderRight: '1px solid rgba(79,142,247,0.15)',
      }}>

        {/* Badge level */}
        <div style={{
          alignSelf: 'flex-start',
          fontFamily: "'Press Start 2P'", fontSize: 7,
          color: level?.type === 'fix_prompt' ? 'var(--gold)' : level?.type === 'blind_test' ? 'var(--accent2)' : 'var(--accent)',
          background: 'rgba(10,10,26,0.9)',
          border: `1px solid ${level?.type === 'fix_prompt' ? 'var(--gold)' : level?.type === 'blind_test' ? 'var(--accent2)' : 'var(--accent)'}`,
          padding: '5px 10px',
          borderRadius: 2,
        }}>
          L{level?.level_number}/{module?.total_levels} · {level?.type === 'solo' ? '⚡ SOLO' : level?.type === 'fix_prompt' ? '🔧 NAPRAW' : '👁 BLIND'}
        </div>

        {/* Zadanie — WYRAŹNY boks */}
        {!result && (
          <div style={{
            background: 'rgba(15,12,36,0.95)',
            border: '1px solid rgba(79,142,247,0.3)',
            borderRadius: 4,
            padding: '12px 14px',
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: "'Press Start 2P'", fontSize: 6,
              color: 'var(--accent)', marginBottom: 8,
              letterSpacing: 1,
            }}>
              📋 TWOJE ZADANIE:
            </div>
            <div style={{
              fontFamily: "'Rajdhani'", fontSize: 15,
              color: 'var(--white)', lineHeight: 1.6,
              fontWeight: 600,
            }}>
              {level?.task_description}
            </div>
            {level?.type === 'fix_prompt' && level?.broken_prompt && (
              <div style={{
                marginTop: 10,
                background: 'rgba(247,79,79,0.1)',
                border: '1px solid var(--red)',
                padding: '8px 12px',
                borderRadius: 3,
              }}>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 5, color: 'var(--red)', marginBottom: 5 }}>❌ ZŁY PROMPT:</div>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, color: '#ff9999', fontStyle: 'italic', fontWeight: 600 }}>
                  "{level.broken_prompt}"
                </div>
              </div>
            )}
          </div>
        )}

        {/* INPUT */}
        {!result && (
          <>
            {level?.type === 'blind_test' ? (
              <BlindTestInput level={level} blindAnswer={blindAnswer} setBlindAnswer={setBlindAnswer} />
            ) : (
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Wpisz swój prompt tutaj... (Ctrl+Enter = ATAKUJ)"
                rows={5}
                style={{
                  width: '100%',
                  background: 'rgba(12,10,32,0.95)',
                  border: '2px solid rgba(79,142,247,0.4)',
                  borderRadius: 4,
                  color: 'var(--white)',
                  padding: '10px 14px',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  minHeight: 100,
                  flexShrink: 0,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'rgba(79,142,247,0.4)'}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleAttack(); }}
              />
            )}
            <button
              onClick={handleAttack}
              disabled={evaluating || (!prompt.trim() && level?.type !== 'blind_test') || (level?.type === 'blind_test' && !blindAnswer)}
              className="pixel-button btn-primary"
              style={{
                width: '100%',
                fontSize: 11,
                opacity: evaluating ? 0.7 : 1,
                flexShrink: 0,
                padding: '13px 14px',
                letterSpacing: 2,
              }}
            >
              {evaluating ? '⏳ AI OCENIA TWÓJ PROMPT...' : '⚔  Testuj!'}
            </button>
          </>
        )}

        {/* WYNIKI */}
        {result && (
          <>
            <div style={{
              background: 'rgba(10,8,28,0.96)',
              border: `2px solid ${scoreColor}`,
              borderRadius: 4,
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: 'var(--muted)', marginBottom: 4 }}>WYNIK</div>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 24, color: scoreColor }}>{result.score}/100</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: scoreColor }}>
                  {result.score >= 70 ? '⚡ ŚWIETNY!' : result.score >= 40 ? '⚔ NIEZŁY' : '💀 CHYBIŁ!'}
                </div>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  +{Math.max(5, Math.round(result.score / 100 * level?.xp_reward))} XP
                </div>
              </div>
            </div>

            <FeedbackBox icon="✅" label="CO POSZŁO DOBRZE" text={result.co_poszlo_dobrze} color="var(--green)" />
            <FeedbackBox icon="❌" label="CO POPRAWIĆ" text={result.co_poprawic} color="var(--red)" />
            <FeedbackBox icon="💡" label="WSKAZÓWKA" text={result.wskazowka} color="var(--gold)" />

            {result.aiResponse && (
              <div style={{
                background: 'rgba(10,10,26,0.95)',
                border: '1px solid rgba(79,142,247,0.25)',
                borderRadius: 4,
                padding: '10px 12px',
              }}>
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 5, color: 'var(--muted)', marginBottom: 5 }}>ODPOWIEDŹ AI NA TWÓJ PROMPT:</div>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--white)', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto' }}>
                  {result.aiResponse}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
              {getNextLevel() && result.score >= 40 && (
                <button
                  onClick={() => router.push(`/battle/${getNextLevel().id}`)}
                  className="pixel-button btn-primary"
                  style={{ flex: 1, fontSize: 9, padding: '10px 8px' }}
                >
                  NASTĘPNY ▶
                </button>
              )}
              <button
                onClick={() => router.push('/map')}
                className="pixel-button"
                style={{ flex: 1, fontSize: 9, padding: '10px 8px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
              >
                🗺 MAPA
              </button>
              {result.score < 70 && !overlay && (
                <button
                  onClick={() => { setResult(null); setPrompt(''); setBlindAnswer(null); }}
                  className="pixel-button"
                  style={{ flex: 1, fontSize: 9, padding: '10px 8px', background: 'var(--bg2)', border: '1px solid var(--accent2)', color: 'var(--accent2)' }}
                >
                  🔄 PONÓW
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* ===== FLOATING SCORE ===== */}
      {floatingText && (
        <div style={{
          position: 'absolute', top: '30%', left: '60%', transform: 'translateX(-50%)',
          fontFamily: "'Press Start 2P'", fontSize: 20,
          color: attackEffect === 'miss' ? 'var(--red)' : 'var(--gold)',
          textShadow: '2px 2px 0 rgba(0,0,0,0.9)',
          animation: 'float-up 1s ease-out forwards',
          pointerEvents: 'none', zIndex: 30, whiteSpace: 'nowrap',
        }}>{floatingText}</div>
      )}

      {/* EFEKT ATAKU */}
      {attackEffect && (
        <div style={{
          position: 'absolute', top: '48%', left: '52%', fontSize: 36,
          animation: attackEffect === 'miss' ? 'projectile-left 0.5s ease-in forwards' : 'projectile-right 0.5s ease-in forwards',
          pointerEvents: 'none', zIndex: 20,
        }}>
          {attackEffect === 'hit' ? '⚡' : attackEffect === 'weak' ? '⚔' : '💀'}
        </div>
      )}

      {/* ===== GRACZ — większy sprite ===== */}
      <div style={{
        position: 'absolute', bottom: '20%', left: '34%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: shakeTarget === 'player' ? 'shake 0.6s ease-out' : 'none',
        zIndex: 10,
      }}>
        <Character characterId={player?.character_id} size={14} animate />
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 7, color: 'var(--green)',
          background: 'rgba(8,8,20,0.95)', padding: '5px 14px',
          border: '2px solid var(--green)', whiteSpace: 'nowrap', marginTop: 4,
          boxShadow: '0 0 8px rgba(79,247,160,0.3)',
        }}>{player?.display_name || 'TY'}</div>
      </div>

      {/* ===== SZEF — większy sprite, po prawej ===== */}
      <div style={{
        position: 'absolute', bottom: '14%', left: '61%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        animation: shakeTarget === 'boss' ? 'shake 0.6s ease-out' : 'none',
        zIndex: 10,
      }}>
        <Character characterId={module?.boss_character_id} size={14} animate flipped />
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 7, color: 'var(--accent2)',
          background: 'rgba(8,8,20,0.95)', padding: '5px 14px',
          border: '2px solid var(--accent2)', whiteSpace: 'nowrap', marginTop: 4,
          boxShadow: '0 0 8px rgba(247,79,142,0.3)',
        }}>{module?.boss_name}</div>
      </div>

      {/* ===== DYMEK SZEFA — wyraźny, nad głową ===== */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(14% + 230px)',
        left: '44%',
        maxWidth: 'clamp(260px, 30%, 400px)',
        background: 'rgba(8,4,24,0.97)',
        border: '2px solid var(--accent2)',
        borderRadius: 4,
        padding: '14px 18px',
        zIndex: 25,
        boxShadow: '0 0 24px rgba(247,79,142,0.2), 0 8px 32px rgba(0,0,0,0.95)',
      }}>
        {/* Ogon dymku */}
        <div style={{
          position: 'absolute', bottom: -11, right: 50,
          width: 0, height: 0,
          borderLeft: '11px solid transparent',
          borderRight: '11px solid transparent',
          borderTop: '11px solid var(--accent2)',
        }} />
        <div style={{
          fontFamily: "'Press Start 2P'", fontSize: 7,
          color: 'var(--accent2)', marginBottom: 8,
          letterSpacing: 1,
        }}>
          {module?.boss_name} · {module?.boss_title}
        </div>
        <div style={{
          fontFamily: "'Rajdhani'", fontSize: 16,
          color: 'var(--white)', lineHeight: 1.65,
          fontWeight: 600,
        }}>
          "{level?.boss_dialogue}"
        </div>
      </div>

    </div>
  );
}

/* ===== SUB-KOMPONENTY ===== */

function Overlay({ color, title, subtitle, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(10,10,26,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{
        fontFamily: "'Press Start 2P'", fontSize: 'clamp(14px,3vw,24px)',
        color, textShadow: `0 0 24px ${color}`,
        textAlign: 'center', animation: 'level-up-appear 0.4s ease-out',
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontFamily: "'Rajdhani'", fontSize: 20, color: 'var(--white)', textAlign: 'center', fontWeight: 600 }}>
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
}

function BlindTestInput({ level, blindAnswer, setBlindAnswer }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: 'var(--accent)', marginBottom: 4 }}>
        👁 KTÓRA ODPOWIEDŹ POCHODZI OD AI?
      </div>
      {[{ key: 'a', text: level.blind_option_a }, { key: 'b', text: level.blind_option_b }].map(opt => (
        <button
          key={opt.key}
          onClick={() => setBlindAnswer(opt.key)}
          style={{
            background: blindAnswer === opt.key ? 'rgba(79,142,247,0.2)' : 'rgba(15,12,36,0.9)',
            border: `2px solid ${blindAnswer === opt.key ? 'var(--accent)' : 'rgba(79,142,247,0.25)'}`,
            borderRadius: 4,
            color: 'var(--white)', padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: 'var(--muted)', marginBottom: 6 }}>
            ODPOWIEDŹ {opt.key.toUpperCase()}
          </div>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, lineHeight: 1.5, fontWeight: 600 }}>
            {opt.text}
          </div>
        </button>
      ))}
    </div>
  );
}

function FeedbackBox({ icon, label, text, color }) {
  return (
    <div style={{
      background: 'rgba(10,10,26,0.95)',
      border: `1px solid ${color}`,
      borderRadius: 4,
      padding: '10px 12px',
    }}>
      <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color, marginBottom: 5 }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--white)', lineHeight: 1.5, fontWeight: 600 }}>
        {text || '—'}
      </div>
    </div>
  );
}