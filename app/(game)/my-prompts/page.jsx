'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { copyText } from '@/components/ExercisePanels';

const PIXEL = "'Press Start 2P'";
const TEXT = "'Rajdhani'";

function MyPrompts() {
  const router = useRouter();
  const moduleId = useSearchParams().get('moduleId');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (!sessionStorage.getItem('playerId')) { router.push('/'); return; }
    if (!moduleId) { router.push('/map'); return; }
    let cancelled = false;
    fetch(`/api/my-prompts?moduleId=${moduleId}`)
      .then(async res => {
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 401) { router.push('/'); return; }
        if (!res.ok) { setError(body.error || 'Nie udało się wczytać poleceń.'); return; }
        setData(body);
      })
      .catch(() => { if (!cancelled) setError('Nie udało się wczytać poleceń.'); });
    return () => { cancelled = true; };
  }, [moduleId, router]);

  async function copy(key, text) {
    const ok = await copyText(text);
    setCopied(ok ? key : 'error');
    setTimeout(() => setCopied(null), 1800);
  }

  const items = data?.items || [];
  const allText = items.map(i => `${i.code} · ${i.title} (${i.tool})\n${i.prompt}`).join('\n\n');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--panel)', borderBottom: '2px solid var(--border)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontFamily: PIXEL, fontSize: 'clamp(12px, 1.1vw, 14px)', lineHeight: 1.5, color: 'var(--gold)' }}>
          📝 MOJE POLECENIA{data?.moduleTitle ? ` · ${data.moduleTitle.toUpperCase()}` : ''}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 }}>
          {items.length > 0 && (
            <button onClick={() => copy('all', allText)} className="pixel-button btn-primary" style={{ fontSize: 11, padding: '10px 14px' }}>
              {copied === 'all' ? '✓ SKOPIOWANO WSZYSTKIE' : '📋 KOPIUJ WSZYSTKIE'}
            </button>
          )}
          <button
            onClick={() => router.push('/map')}
            className="pixel-button"
            style={{ fontSize: 11, padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            ← MAPA
          </button>
        </div>
      </div>

      <main style={{ maxWidth: '54rem', width: '100%', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h1 style={{ margin: 0, fontFamily: TEXT, fontSize: 26, fontWeight: 700, lineHeight: 1.3, color: 'var(--white)' }}>
          Twoja ściąga. Te polecenia możesz używać od jutra.
        </h1>

        {copied === 'error' && (
          <div role="alert" style={{ fontFamily: TEXT, fontSize: 17, fontWeight: 700, color: 'var(--red)' }}>
            Nie udało się skopiować — zaznacz tekst i skopiuj ręcznie (Ctrl+C).
          </div>
        )}

        {!data && !error && <div className="loading-dots" style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--muted)' }}>Wczytuję</div>}
        {error && <div role="alert" style={{ fontFamily: TEXT, fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>{error}</div>}

        {data && !data.unlocked && (
          <div style={{
            background: 'rgba(10,10,26,0.95)', border: '2px dashed var(--border)', borderRadius: 4, padding: 24,
            fontFamily: TEXT, fontSize: 18, color: 'var(--white)', textAlign: 'center', fontWeight: 600, lineHeight: 1.5,
          }}>
            🔒 Ściąga otworzy się po pierwszym zaliczonym zadaniu.
          </div>
        )}

        {data?.unlocked && items.length === 0 && (
          <div style={{ fontFamily: TEXT, fontSize: 18, color: 'var(--muted)', fontWeight: 600 }}>Nie ma jeszcze poleceń na zielono ani na żółto.</div>
        )}

        {items.map(item => (
          <section key={item.levelId} style={{ background: 'rgba(10,10,26,0.95)', border: '2px solid var(--border)', borderRadius: 4, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--bg)', background: 'var(--gold)', padding: '4px 6px' }}>{item.code}</span>
                <h2 style={{ margin: 0, fontFamily: TEXT, fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>{item.title}</h2>
                <span style={{ fontFamily: TEXT, fontSize: 17, fontWeight: 700, color: 'var(--accent)' }}>· {item.tool}</span>
              </div>
              <button onClick={() => copy(item.levelId, item.prompt)} className="chip-button" style={{ borderColor: 'var(--green)', color: 'var(--green)', fontSize: 16 }}>
                {copied === item.levelId ? '✓ Skopiowano' : '📋 Kopiuj'}
              </button>
            </div>
            <div style={{
              fontFamily: TEXT, fontSize: 18, color: '#dfe3ff', whiteSpace: 'pre-wrap', lineHeight: 1.55, fontWeight: 500,
              background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 3, overflowWrap: 'anywhere',
            }}>
              {item.prompt}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

export default function MyPromptsPage() {
  return (
    <Suspense fallback={null}>
      <MyPrompts />
    </Suspense>
  );
}
