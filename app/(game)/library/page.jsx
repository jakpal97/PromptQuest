'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const PIXEL = "'Press Start 2P'";

export default function LibraryPage() {
  const router = useRouter();
  const [playerId, setPlayerId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async (id) => {
    const res = await fetch(`/api/library?playerId=${id}`);
    const data = res.ok ? await res.json() : { entries: [] };
    setEntries(data.entries || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = sessionStorage.getItem('playerId');
    if (!id) { router.push('/'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayerId(id);
    load(id);
  }, [router, load]);

  async function copy(entry) {
    try {
      await navigator.clipboard.writeText(entry.prompt);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setCopiedId(null);
    }
  }

  async function remove(entry) {
    if (!confirm('Usunąć ten prompt z biblioteki?')) return;
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    await fetch('/api/library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, id: entry.id }),
    });
  }

  function exportAll() {
    const text = entries.map(e => {
      const head = [e.levels?.code, e.title || e.levels?.title].filter(Boolean).join(' · ');
      return `### ${head || 'Prompt'}\n\n${e.prompt}`;
    }).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moja-biblioteka-promptow.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--panel)', borderBottom: '2px solid var(--border)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontFamily: PIXEL, fontSize: 'clamp(12px, 1.1vw, 14px)', lineHeight: 1.5, color: 'var(--gold)' }}>
          📚 MOJA BIBLIOTEKA PROMPTÓW
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
          {entries.length > 0 && (
            <button
              onClick={exportAll}
              className="pixel-button"
              style={{ fontSize: 11, padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--green)', color: 'var(--green)' }}
            >
              ⬇ POBIERZ WSZYSTKO
            </button>
          )}
          <button
            onClick={() => router.push('/map')}
            className="pixel-button"
            style={{ fontSize: 11, padding: '8px 12px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            ← MAPA
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '54rem', width: '100%', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)', fontWeight: 600, lineHeight: 1.5 }}>
          Twoje najlepsze prompty z ćwiczeń. Skopiuj je i używaj w pracy — podmień tylko placeholdery w nawiasach.
        </div>

        {loading && <div className="loading-dots" style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--muted)' }}>Wczytuję</div>}

        {!loading && entries.length === 0 && (
          <div style={{
            background: 'rgba(10,10,26,0.95)', border: '2px dashed var(--border)', borderRadius: 4, padding: 24,
            fontFamily: "'Rajdhani'", fontSize: 17, color: 'var(--white)', textAlign: 'center', fontWeight: 600,
          }}>
            Biblioteka jest pusta.<br />
            <span style={{ color: 'var(--muted)', fontSize: 16 }}>Po ocenie ćwiczenia kliknij „💾 Zapisz prompt w bibliotece”.</span>
          </div>
        )}

        {entries.map(entry => (
          <div key={entry.id} style={{ background: 'rgba(10,10,26,0.95)', border: '2px solid var(--border)', borderRadius: 4, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, minWidth: 0 }}>
                {entry.levels?.code && (
                  <span style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--bg)', background: 'var(--gold)', padding: '4px 6px' }}>
                    {entry.levels.code}
                  </span>
                )}
                <span style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>
                  {entry.title || entry.levels?.title || 'Prompt'}
                </span>
              </div>
              <span style={{ fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)' }}>
                {new Date(entry.created_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
            <div style={{
              fontFamily: "'Rajdhani'", fontSize: 16, color: '#dfe3ff', whiteSpace: 'pre-wrap', lineHeight: 1.55, fontWeight: 500,
              background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 3, maxHeight: '20rem', overflowY: 'auto',
            }}>
              {entry.prompt}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              <button onClick={() => copy(entry)} className="chip-button" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>
                {copiedId === entry.id ? '✓ Skopiowano' : '📋 Kopiuj'}
              </button>
              <button onClick={() => remove(entry)} className="chip-button" style={{ borderColor: 'var(--accent2)', color: 'var(--accent2)' }}>
                🗑 Usuń
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
