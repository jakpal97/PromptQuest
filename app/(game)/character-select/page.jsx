'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getServiceClient } from '@/lib/supabase';

const TOTAL_CHARACTERS = 12;

export default function CharacterSelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [playerId, setPlayerId] = useState('');

  useEffect(() => {
    const id = sessionStorage.getItem('playerId');
    if (!id) { router.push('/login'); return; }
    setPlayerId(id);
    const existingName = sessionStorage.getItem('displayName');
    if (existingName && existingName !== 'null') setDisplayName(existingName);
  }, [router]);

  async function handleConfirm() {
    if (!selected) { setError('Wybierz postać!'); return; }
    if (!displayName.trim()) { setError('Wpisz swoje imię!'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/player/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          character_id: selected,
          display_name: displayName.trim(),
        }),
      });
      if (!res.ok) { setError('Błąd zapisu — spróbuj ponownie'); return; }
      sessionStorage.setItem('characterId', selected);
      sessionStorage.setItem('displayName', displayName.trim());
      router.push('/map');
    } catch {
      setError('Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '30px 16px',
      paddingBottom: 40,
    }}>
      {/* Tytuł */}
      <div style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 'clamp(10px, 2.5vw, 16px)',
        color: 'var(--gold)',
        textShadow: '3px 3px 0 #8B5A00',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        WYBIERZ SWOJĄ POSTAĆ
      </div>
      <div style={{
        fontFamily: "'Rajdhani', sans-serif",
        color: 'var(--muted)',
        fontSize: 14,
        marginBottom: 32,
        textAlign: 'center',
      }}>
        Kto będzie reprezentował Cię w biurze?
      </div>

      {/* Grid postaci */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 32,
        width: '100%',
        maxWidth: 480,
      }}>
        {Array.from({ length: TOTAL_CHARACTERS }, (_, i) => i + 1).map(id => (
          <button
            key={id}
            onClick={() => setSelected(id)}
            style={{
              background: selected === id ? 'rgba(79,142,247,0.2)' : 'var(--panel)',
              border: selected === id ? '2px solid var(--accent)' : '2px solid var(--border)',
              padding: 12,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s',
              transform: selected === id ? 'scale(1.05)' : 'scale(1)',
              boxShadow: selected === id ? '0 0 15px rgba(79,142,247,0.4)' : 'none',
            }}
          >
            <div
              className="pixel-art"
              style={{
                width: 64,
                height: 64,
                backgroundImage: `url('/characters/Office_Character_${id}.png')`,
                backgroundSize: '192px 256px',
                backgroundPosition: '0 0',
                imageRendering: 'pixelated',
                animation: selected === id ? 'walk-down-4x 0.6s steps(3) infinite' : 'none',
              }}
            />
            <span style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7,
              color: selected === id ? 'var(--accent)' : 'var(--muted)',
            }}>
              #{id}
            </span>
          </button>
        ))}
      </div>

      {/* Formularz imienia */}
      {selected && (
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--panel)',
          border: '2px solid var(--border)',
          padding: 24,
          animation: 'level-up-appear 0.3s ease-out',
        }}>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            color: 'var(--white)',
            marginBottom: 16,
            textAlign: 'center',
          }}>
            POSTAĆ #{selected} WYBRANA!
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 7,
              color: 'var(--muted)',
              display: 'block',
              marginBottom: 8,
            }}>TWOJE IMIĘ / NICK</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="np. Kasia z HR"
              maxLength={30}
              style={{
                width: '100%',
                background: 'var(--bg2)',
                border: '2px solid var(--border)',
                color: 'var(--white)',
                padding: '10px 12px',
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 16,
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            />
          </div>
          {error && (
            <div style={{
              color: 'var(--red)',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 13,
              marginBottom: 12,
            }}>
              ❌ {error}
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="pixel-button btn-gold"
            style={{ width: '100%', marginTop: 12, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'ZAPISUJĘ...' : '🚀 ZACZNIJ PRZYGODĘ'}
          </button>
        </div>
      )}
    </div>
  );
}
