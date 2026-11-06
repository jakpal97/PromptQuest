'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlayerLevel } from '@/lib/auth';
import Character from '@/components/Character';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('players');
  const [players, setPlayers] = useState([]);
  const [modules, setModules] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [quizErrors, setQuizErrors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [openPlayerId, setOpenPlayerId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    const role = sessionStorage.getItem('role');
    if (role !== 'admin') { router.push('/map'); return; }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadPlayers(), loadModules(), loadAnalytics(), loadSessions()]);
    setLoading(false);
  }

  async function loadPlayers() {
    const playerId = sessionStorage.getItem('playerId');
    const res = await fetch(`/api/admin/players?requesterId=${playerId}`);
    if (res.ok) {
      const { players: data } = await res.json();
      setPlayers(data || []);
    }
  }

  async function loadProgress(targetId) {
    const res = await fetch(`/api/admin/progress?playerId=${targetId}&day=1`);
    const data = await res.json();
    setProgress(res.ok ? { exercises: data.exercises } : { error: data.error || 'Nie udało się pobrać postępu.' });
  }

  async function toggleProgress(targetId) {
    if (openPlayerId === targetId) { setOpenPlayerId(null); return; }
    setOpenPlayerId(targetId);
    setProgress(null);
    await loadProgress(targetId);
  }

  async function markPassed(targetId, exercise) {
    const name = exercise.label || exercise.code || `ćwiczenie ${exercise.id}`;
    if (!confirm(`Oznaczyć „${name}” jako zaliczone? Uczestnik dostanie pełne XP za ćwiczenie (bez bonusu) i odblokuje następne.`)) return;
    setMarking(exercise.id);
    const res = await fetch('/api/admin/mark-passed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPlayerId: targetId, levelId: exercise.id }),
    });
    const data = await res.json();
    setMarking(null);
    if (!res.ok) { alert(data.error || 'Nie udało się oznaczyć.'); return; }
    await Promise.all([loadProgress(targetId), loadPlayers()]);
  }

  async function loadModules() {
    const res = await fetch('/api/modules');
    if (res.ok) {
      const { modules: data } = await res.json();
      setModules(data || []);
    }
  }

  async function loadAnalytics() {
    const playerId = sessionStorage.getItem('playerId');
    const res = await fetch(`/api/admin/analytics?requesterId=${playerId}`);
    if (!res.ok) return;
    const { battles } = await res.json();

    if (!battles) return;

    const grouped = {};
    const quizByQ = {};
    battles.forEach(b => {
      const key = b.level_id;
      if (!grouped[key]) {
        grouped[key] = {
          level_id: key,
          level_number: b.levels?.level_number,
          type: b.levels?.type,
          module_day: b.levels?.modules?.day_number,
          module_title: b.levels?.modules?.title,
          scores: [],
          attempts: [],
          feedback: [],
        };
      }
      grouped[key].scores.push(b.score);
      grouped[key].attempts.push(b.attempt_number || 1);
      if (b.co_poprawic) grouped[key].feedback.push(b.co_poprawic);
      try {
        const parsed = JSON.parse(b.prompt_used || '');
        if (!parsed?.quiz || !Array.isArray(parsed.answers) || !Array.isArray(parsed.key)) return;
        parsed.answers.forEach((a, i) => {
          const n = i + 1;
          if (!quizByQ[n]) quizByQ[n] = { n, wrong: 0, total: 0 };
          quizByQ[n].total += 1;
          if (a !== parsed.key[i]) quizByQ[n].wrong += 1;
        });
      } catch { /* nie quiz */ }
    });

    const rows = Object.values(grouped).map(g => {
      const avg = Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length);
      const hard = g.scores.filter(s => s < 40).length;
      const easy = g.scores.filter(s => s > 80).length;
      const avgAttempt = (g.attempts.reduce((a, b) => a + b, 0) / g.attempts.length).toFixed(1);
      return {
        ...g,
        avg,
        pctHard: Math.round((hard / g.scores.length) * 100),
        pctEasy: Math.round((easy / g.scores.length) * 100),
        avgAttempt,
        count: g.scores.length,
        status: avg < 40 ? '🔴' : avg > 80 ? '🟡' : '🟢',
        statusLabel: avg < 40 ? 'Za trudne' : avg > 80 ? 'Za łatwe' : 'Optymalny',
      };
    }).sort((a, b) => (a.module_day - b.module_day) || (a.level_number - b.level_number));

    setAnalytics(rows);
    setQuizErrors(Object.values(quizByQ).sort((a, b) => (b.wrong / b.total) - (a.wrong / a.total) || a.n - b.n));
  }

  async function loadSessions() {
    const playerId = sessionStorage.getItem('playerId');
    const res = await fetch(`/api/admin/sessions?requesterId=${playerId}`);
    if (res.ok) {
      const { sessions: data } = await res.json();
      setSessions(data || []);
    }
  }

  async function toggleModule(moduleId, currentUnlocked) {
    const playerId = sessionStorage.getItem('playerId');
    await fetch('/api/admin/toggle-module', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, unlocked: !currentUnlocked, playerId }),
    });
    loadModules();
  }

  async function setBlock(moduleId, activeBlock) {
    await fetch('/api/admin/set-block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId, activeBlock, playerId: sessionStorage.getItem('playerId') }),
    });
    loadModules();
  }

  async function handleReset() {
    if (!sessionName.trim()) { alert('Podaj nazwę sesji!'); return; }
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName: sessionName.trim(), playerId: sessionStorage.getItem('playerId') }),
      });
      const data = await res.json();
      if (data.success) {
        setResetMsg(`✅ Zarchiwizowano ${data.archived} walk. Kurs zresetowany!`);
        setShowResetModal(false);
        setSessionName('');
        loadAll();
      } else {
        setResetMsg('❌ Błąd resetu: ' + (data.error || 'nieznany'));
      }
    } catch {
      setResetMsg('❌ Błąd połączenia');
    } finally {
      setResetting(false);
    }
  }

  function exportCSV(data, filename) {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  async function exportPlayersCSV() {
    exportCSV(players.map(p => ({
      username: p.username,
      imie: p.display_name || '',
      xp: p.total_xp,
      modul: p.current_module,
      data: p.created_at?.split('T')[0] || '',
    })), 'uczestnicy.csv');
  }

  const TABS = [
    { id: 'players', label: '👥 UCZESTNICY' },
    { id: 'modules', label: '📚 MODUŁY' },
    { id: 'analytics', label: '📊 ANALYTICS' },
    { id: 'sessions', label: '🗂 HISTORIA' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 12, color: 'var(--accent)' }}>ŁADOWANIE ADMINA...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'var(--panel)',
        borderBottom: '2px solid var(--border)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 'clamp(12px, 1.1vw, 14px)', lineHeight: 1.5, color: 'var(--accent2)' }}>
          ⚙ PANEL ADMINA
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            onClick={() => setShowResetModal(true)}
            className="pixel-button btn-danger"
            style={{ fontSize: 11 }}
          >
            🔄 RESET KURSU
          </button>
          <button
            onClick={() => router.push('/map')}
            className="pixel-button"
            style={{ fontSize: 11, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            ← MAPA
          </button>
        </div>
      </div>

      {resetMsg && (
        <div style={{
          background: resetMsg.startsWith('✅') ? 'rgba(79,247,160,0.1)' : 'rgba(247,79,79,0.1)',
          border: `1px solid ${resetMsg.startsWith('✅') ? 'var(--green)' : 'var(--red)'}`,
          padding: '0 0 0 16px',
          fontFamily: "'Rajdhani'",
          fontSize: 16,
          color: 'var(--white)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ flex: 1, minWidth: 0, padding: '10px 0' }}>{resetMsg}</span>
          <button onClick={() => setResetMsg('')} style={{ minWidth: 44, minHeight: 44, background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
        padding: '12px 16px 0',
        borderBottom: '1px solid var(--border)',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: "'Press Start 2P'",
              fontSize: 11,
              minHeight: 44,
              padding: '8px 12px',
              background: tab === t.id ? 'var(--panel)' : 'transparent',
              border: '1px solid',
              borderColor: tab === t.id ? 'var(--accent)' : 'var(--border)',
              borderBottom: tab === t.id ? '1px solid var(--panel)' : '1px solid var(--border)',
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px', minWidth: 0 }}>

        {/* UCZESTNICY */}
        {tab === 'players' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 11, color: 'var(--muted)' }}>
                {players.filter(p => p.role === 'player').length} UCZESTNIKÓW
              </span>
              <button
                onClick={exportPlayersCSV}
                className="pixel-button"
                style={{ fontSize: 11, padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--green)', color: 'var(--green)' }}
              >
                ⬇ POBIERZ CSV
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Rajdhani'", fontSize: 16 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)' }}>
                    {['Postać', 'Username', 'Imię', 'Poziom', 'XP', 'Moduł', 'Dzień 1'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: "'Press Start 2P'", fontSize: 11, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.filter(p => p.role === 'player').map(p => {
                    const lvl = getPlayerLevel(p.total_xp);
                    const open = openPlayerId === p.id;
                    return (
                      <Fragment key={p.id}>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          {p.character_id ? (
                            <div className="pixel-art" style={{
                              width: 32, height: 32,
                              backgroundImage: `url('/characters/Office_Character_${p.character_id}.png')`,
                              backgroundSize: '96px 128px',
                              backgroundPosition: '0 0',
                              imageRendering: 'pixelated',
                            }} />
                          ) : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>{p.username}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{p.display_name || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{lvl.emoji} {lvl.name}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--gold)', fontWeight: 700 }}>{p.total_xp}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            background: 'var(--bg2)',
                            border: '1px solid var(--border)',
                            padding: '2px 8px',
                            fontFamily: "'Press Start 2P'",
                            fontSize: 11,
                          }}>
                            M{p.current_module} L{p.current_level_in_module}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            onClick={() => toggleProgress(p.id)}
                            aria-expanded={open}
                            className="pixel-button"
                            style={{ fontSize: 11, padding: '6px 10px', background: 'var(--bg2)', border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`, color: open ? 'var(--accent)' : 'var(--muted)' }}
                          >
                            📋 ĆWICZENIA {open ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(15,12,36,0.6)' }}>
                          <td colSpan={7} style={{ padding: '10px 12px' }}>
                            {!progress ? (
                              <span style={{ color: 'var(--muted)' }}>Ładowanie…</span>
                            ) : progress.error ? (
                              <span style={{ color: 'var(--red)' }}>{progress.error}</span>
                            ) : (
                              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                                {progress.exercises.map(ex => (
                                  <li key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <span style={{ width: 22, textAlign: 'center' }}>{ex.passed ? '✅' : '•'}</span>
                                    <span style={{ flex: '1 1 16rem', fontWeight: 600 }}>
                                      {ex.label || ex.code}{ex.title ? ` — ${ex.title}` : ''}
                                    </span>
                                    <span style={{ color: 'var(--muted)', minWidth: '14rem' }}>
                                      {ex.passed
                                        ? ex.completedVia === 'reference' ? 'zaliczone ze wzorcem' : ex.completedVia === 'trainer' ? 'zaliczone przez trenera' : 'zaliczone'
                                        : ex.attempts ? `${ex.attempts} ${ex.attempts === 1 ? 'próba' : ex.attempts < 5 ? 'próby' : 'prób'}${ex.zone ? ` · ostatnio ${ex.zone === 'yellow' ? 'żółta' : ex.zone === 'red' ? 'czerwona' : 'zielona'}` : ''}` : 'jeszcze nie próbował(a)'}
                                    </span>
                                    {!ex.passed && (
                                      <button
                                        onClick={() => markPassed(p.id, ex)}
                                        disabled={marking === ex.id}
                                        className="pixel-button"
                                        style={{ fontSize: 11, padding: '6px 10px', background: 'rgba(79,247,160,0.1)', border: '1px solid var(--green)', color: 'var(--green)' }}
                                      >
                                        {marking === ex.id ? 'ZAPISUJĘ…' : '✓ OZNACZ JAKO ZALICZONE'}
                                      </button>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODUŁY */}
        {tab === 'modules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {modules.map(mod => (
              <div key={mod.id} style={{
                background: 'var(--panel)',
                border: `1px solid ${mod.unlocked ? 'var(--green)' : 'var(--border)'}`,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <div style={{ fontFamily: "'Press Start 2P'", fontSize: 12, lineHeight: 1.5, color: 'var(--white)', marginBottom: 4 }}>
                    MODUŁ {mod.day_number}: {mod.title}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)' }}>
                    {mod.location} • Szef: {mod.boss_name} • {mod.total_levels} leveli
                  </div>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)', marginTop: 4 }}>
                    {players.filter(p => p.current_module > mod.day_number && p.role === 'player').length} osób ukończyło
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {mod.max_block > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingRight: 12, borderRight: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: "'Press Start 2P'", fontSize: 11, color: 'var(--gold)' }}>BLOK ĆWICZEŃ:</span>
                      {Array.from({ length: mod.max_block }, (_, i) => i + 1).map(b => (
                        <button
                          key={b}
                          onClick={() => setBlock(mod.id, b)}
                          className="pixel-button"
                          title={b === 1 ? 'Tylko blok 1' : `Odblokuj bloki 1–${b}`}
                          style={{
                            fontSize: 11, padding: '6px 10px',
                            background: (mod.active_block || 1) >= b ? 'rgba(247,201,79,0.15)' : 'transparent',
                            border: `1px solid ${(mod.active_block || 1) === b ? 'var(--gold)' : 'var(--border)'}`,
                            color: (mod.active_block || 1) >= b ? 'var(--gold)' : 'var(--muted)',
                          }}
                        >
                          {(mod.active_block || 1) >= b ? '🔓' : '🔒'} {b}{mod.block_labels?.[b] ? ` · ${String(mod.block_labels[b]).split('·')[0].trim()}` : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  <span style={{
                    fontFamily: "'Press Start 2P'",
                    fontSize: 11,
                    color: mod.unlocked ? 'var(--green)' : 'var(--red)',
                  }}>
                    {mod.unlocked ? '🔓 ODBLOKOWANY' : '🔒 ZABLOKOWANY'}
                  </span>
                  <button
                    onClick={() => toggleModule(mod.id, mod.unlocked)}
                    className="pixel-button"
                    style={{
                      fontSize: 11,
                      background: mod.unlocked ? 'rgba(247,79,79,0.1)' : 'rgba(79,247,160,0.1)',
                      border: `1px solid ${mod.unlocked ? 'var(--red)' : 'var(--green)'}`,
                      color: mod.unlocked ? 'var(--red)' : 'var(--green)',
                    }}
                  >
                    {mod.unlocked ? 'ZABLOKUJ' : 'ODBLOKUJ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div>
            <div style={{ marginBottom: 12, fontFamily: "'Press Start 2P'", fontSize: 11, color: 'var(--muted)' }}>
              STATUS LEVELÓW (na podstawie wyników)
            </div>
            {quizErrors.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 12, fontFamily: "'Press Start 2P'", fontSize: 11, color: 'var(--muted)' }}>
                  QUIZ · PIERWSZA ODPOWIEDŹ UCZESTNIKA (które pytania sprawiają kłopot)
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Rajdhani'", fontSize: 16, marginBottom: 8 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg2)' }}>
                      {['Pytanie', 'Błędów', 'Odpowiedzi', '% błędów'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'Press Start 2P'", fontSize: 11, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quizErrors.map(row => (
                      <tr key={row.n} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px' }}>Pytanie {row.n}</td>
                        <td style={{ padding: '8px 10px', color: row.wrong / row.total > 0.4 ? 'var(--red)' : 'var(--white)' }}>{row.wrong}</td>
                        <td style={{ padding: '8px 10px' }}>{row.total}</td>
                        <td style={{ padding: '8px 10px' }}>{Math.round((row.wrong / row.total) * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {analytics.length === 0 ? (
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)', padding: 20 }}>
                Brak danych — nikt jeszcze nie walczył.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Rajdhani'", fontSize: 16 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg2)' }}>
                      {['Level', 'Moduł', 'Typ', 'Avg score', '% <40', '% >80', 'Avg prób', 'Gracze', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'Press Start 2P'", fontSize: 11, lineHeight: 1.5, color: 'var(--muted)', borderBottom: '1px solid var(--border)', verticalAlign: 'bottom' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px' }}>L{row.level_number}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--muted)' }}>M{row.module_day}</td>
                        <td style={{ padding: '8px 10px' }}>{row.type}</td>
                        <td style={{ padding: '8px 10px', color: row.avg < 40 ? 'var(--red)' : row.avg > 80 ? 'var(--gold)' : 'var(--green)', fontWeight: 700 }}>
                          {row.avg}
                        </td>
                        <td style={{ padding: '8px 10px', color: row.pctHard > 50 ? 'var(--red)' : 'var(--muted)' }}>{row.pctHard}%</td>
                        <td style={{ padding: '8px 10px', color: row.pctEasy > 70 ? 'var(--gold)' : 'var(--muted)' }}>{row.pctEasy}%</td>
                        <td style={{ padding: '8px 10px' }}>{row.avgAttempt}</td>
                        <td style={{ padding: '8px 10px' }}>{row.count}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                          {row.status} {row.statusLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* HISTORIA SESJI */}
        {tab === 'sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.length === 0 ? (
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)', padding: 20 }}>
                Brak poprzednich sesji szkoleniowych.
              </div>
            ) : sessions.map(s => {
              const summary = s.players_summary ? JSON.parse(typeof s.players_summary === 'string' ? s.players_summary : JSON.stringify(s.players_summary)) : [];
              const battles = s.battles_data ? (typeof s.battles_data === 'string' ? JSON.parse(s.battles_data) : s.battles_data) : [];
              const avgXp = summary.length ? Math.round(summary.reduce((a, b) => a + (b.total_xp || 0), 0) / summary.length) : 0;
              const best = summary.reduce((a, b) => (b.total_xp > (a?.total_xp || 0)) ? b : a, null);

              return (
                <div key={s.id} style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--border)',
                  padding: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontFamily: "'Press Start 2P'", fontSize: 12, lineHeight: 1.5, color: 'var(--white)', marginBottom: 4 }}>
                        {s.session_name}
                      </div>
                      <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)' }}>
                        {new Date(s.session_date).toLocaleDateString('pl-PL')} •{' '}
                        {summary.length} uczestników • {battles.length} walk •{' '}
                        Avg XP: {avgXp}
                        {best ? ` • Najlepszy: ${best.display_name || best.username} (${best.total_xp} XP)` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => exportCSV(summary.map(p => ({
                        username: p.username, imie: p.display_name || '', xp: p.total_xp,
                      })), `${s.session_name.replace(/\s/g, '_')}.csv`)}
                      className="pixel-button"
                      style={{ fontSize: 11, background: 'var(--bg2)', border: '1px solid var(--green)', color: 'var(--green)' }}
                    >
                      ⬇ CSV
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal reset */}
      {showResetModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(10,10,26,0.92)',
          display: 'flex', overflowY: 'auto',
          padding: 16,
        }}>
          <div style={{
            margin: 'auto',
            background: 'var(--panel)',
            border: '2px solid var(--red)',
            padding: 28,
            maxWidth: '26rem',
            width: '100%',
          }}>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 12, color: 'var(--red)', marginBottom: 16, textAlign: 'center' }}>
              ⚠ RESET KURSU
            </div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Wszystkie postępy graczy zostaną zresetowane. Dane zostaną zarchiwizowane.
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'Press Start 2P'", fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
                NAZWA SESJI (do archiwum)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                placeholder="np. Firma ABC — kwiecień 2026"
                style={{
                  width: '100%',
                  background: 'var(--bg2)',
                  border: '2px solid var(--border)',
                  color: 'var(--white)',
                  minHeight: 48,
                  padding: '10px 12px',
                  fontFamily: "'Rajdhani'",
                  fontSize: 16,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="pixel-button btn-danger"
                style={{ flex: 1, opacity: resetting ? 0.7 : 1 }}
              >
                {resetting ? 'RESETUJĘ...' : '🔄 RESETUJ'}
              </button>
              <button
                onClick={() => { setShowResetModal(false); setSessionName(''); }}
                className="pixel-button"
                style={{ flex: 1, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
              >
                ANULUJ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
