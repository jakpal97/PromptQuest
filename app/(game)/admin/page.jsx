'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlayerLevel } from '@/lib/auth';
import Character from '@/components/Character';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('players');
  const [players, setPlayers] = useState([]);
  const [modules, setModules] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

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
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: 'var(--accent)' }}>ŁADOWANIE ADMINA...</span>
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
        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 'clamp(8px,2vw,12px)', color: 'var(--accent2)' }}>
          ⚙ PANEL ADMINA
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowResetModal(true)}
            className="pixel-button btn-danger"
            style={{ fontSize: 8 }}
          >
            🔄 RESET KURSU
          </button>
          <button
            onClick={() => router.push('/map')}
            className="pixel-button"
            style={{ fontSize: 8, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            ← MAPA
          </button>
        </div>
      </div>

      {resetMsg && (
        <div style={{
          background: resetMsg.startsWith('✅') ? 'rgba(79,247,160,0.1)' : 'rgba(247,79,79,0.1)',
          border: `1px solid ${resetMsg.startsWith('✅') ? 'var(--green)' : 'var(--red)'}`,
          padding: '10px 16px',
          fontFamily: "'Rajdhani'",
          fontSize: 15,
          color: 'var(--white)',
        }}>
          {resetMsg}
          <button onClick={() => setResetMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '12px 16px 0',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: "'Press Start 2P'",
              fontSize: 7,
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
      <div style={{ flex: 1, padding: '16px', overflowX: 'auto' }}>

        {/* UCZESTNICY */}
        {tab === 'players' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: 'var(--muted)' }}>
                {players.filter(p => p.role === 'player').length} UCZESTNIKÓW
              </span>
              <button
                onClick={exportPlayersCSV}
                className="pixel-button"
                style={{ fontSize: 7, padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--green)', color: 'var(--green)' }}
              >
                ⬇ POBIERZ CSV
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Rajdhani'", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)' }}>
                    {['Postać', 'Username', 'Imię', 'Poziom', 'XP', 'Moduł'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: "'Press Start 2P'", fontSize: 6, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {players.filter(p => p.role === 'player').map(p => {
                    const lvl = getPlayerLevel(p.total_xp);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
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
                            fontSize: 7,
                          }}>
                            M{p.current_module} L{p.current_level_in_module}
                          </span>
                        </td>
                      </tr>
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
                  <div style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: 'var(--white)', marginBottom: 4 }}>
                    MODUŁ {mod.day_number}: {mod.title}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 14, color: 'var(--muted)' }}>
                    {mod.location} • Szef: {mod.boss_name} • {mod.total_levels} leveli
                  </div>
                  <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                    {players.filter(p => p.current_module > mod.day_number && p.role === 'player').length} osób ukończyło
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: "'Press Start 2P'",
                    fontSize: 8,
                    color: mod.unlocked ? 'var(--green)' : 'var(--red)',
                  }}>
                    {mod.unlocked ? '🔓 ODBLOKOWANY' : '🔒 ZABLOKOWANY'}
                  </span>
                  <button
                    onClick={() => toggleModule(mod.id, mod.unlocked)}
                    className="pixel-button"
                    style={{
                      fontSize: 7,
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
            <div style={{ marginBottom: 12, fontFamily: "'Press Start 2P'", fontSize: 8, color: 'var(--muted)' }}>
              STATUS LEVELÓW (na podstawie wyników)
            </div>
            {analytics.length === 0 ? (
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)', padding: 20 }}>
                Brak danych — nikt jeszcze nie walczył.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Rajdhani'", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg2)' }}>
                      {['Level', 'Moduł', 'Typ', 'Avg score', '% <40', '% >80', 'Avg prób', 'Gracze', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: "'Press Start 2P'", fontSize: 6, color: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
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
                        <td style={{ padding: '8px 10px', fontSize: 11 }}>{row.type}</td>
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
                      <div style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: 'var(--white)', marginBottom: 4 }}>
                        {s.session_name}
                      </div>
                      <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--muted)' }}>
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
                      style={{ fontSize: 7, background: 'var(--bg2)', border: '1px solid var(--green)', color: 'var(--green)' }}
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
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            background: 'var(--panel)',
            border: '2px solid var(--red)',
            padding: 28,
            maxWidth: 400,
            width: '100%',
          }}>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: 'var(--red)', marginBottom: 16, textAlign: 'center' }}>
              ⚠ RESET KURSU
            </div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 15, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Wszystkie postępy graczy zostaną zresetowane. Dane zostaną zarchiwizowane.
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>
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
                  padding: '10px 12px',
                  fontFamily: "'Rajdhani'",
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
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
