'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const playerId = sessionStorage.getItem('playerId');
    if (playerId) router.push('/map');
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Błąd logowania');
        return;
      }
      saveSession(data.player);
      if (!data.player.character_id) {
        router.push('/character-select');
      } else {
        router.push('/map');
      }
    } catch {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Tło pixel art starfield */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 'clamp(14px, 4vw, 26px)',
          color: 'var(--gold)',
          textShadow: '0 0 20px rgba(247,201,79,0.6), 4px 4px 0 #8B5A00',
          letterSpacing: '2px',
          lineHeight: 1.5,
          marginBottom: 12,
        }}>
          PROMPT
        </div>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 'clamp(14px, 4vw, 26px)',
          color: 'var(--accent)',
          textShadow: '0 0 20px rgba(79,142,247,0.6), 4px 4px 0 #0a2456',
          letterSpacing: '2px',
          lineHeight: 1.5,
          marginBottom: 20,
        }}>
          QUEST
        </div>
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 14,
          color: 'var(--muted)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}>
          AI Training RPG
        </div>
      </div>

      {/* Pixel sprite dekoracyjne */}
      <div style={{
        display: 'flex',
        gap: 24,
        marginBottom: 36,
        opacity: 0.7,
      }}>
        {[1, 2, 3].map(id => (
          <div
            key={id}
            className="pixel-art"
            style={{
              width: 64, height: 64,
              backgroundImage: `url('/characters/Office_Character_${id}.png')`,
              backgroundSize: '192px 256px',
              backgroundPosition: '0 0',
              imageRendering: 'pixelated',
              animation: `walk-down-4x 0.6s steps(3) infinite`,
              animationDelay: `${id * 0.15}s`,
            }}
          />
        ))}
      </div>

      {/* Panel logowania */}
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--panel)',
        border: '2px solid var(--border)',
        padding: 32,
      }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 10,
          color: 'var(--white)',
          marginBottom: 24,
          textAlign: 'center',
          letterSpacing: '1px',
        }}>
          WEJDŹ DO GRY
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              color: 'var(--muted)',
              display: 'block',
              marginBottom: 8,
            }}>KOD DOSTĘPU</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="uczestnik1"
              required
              autoComplete="username"
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
            />
          </div>

          <div>
            <label style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              color: 'var(--muted)',
              display: 'block',
              marginBottom: 8,
            }}>HASŁO</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
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
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(247,79,79,0.15)',
              border: '1px solid var(--red)',
              color: 'var(--red)',
              padding: '10px 12px',
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 14,
            }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pixel-button btn-primary"
            style={{ marginTop: 8, width: '100%', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'ŁADOWANIE...' : '⚔ WEJDŹ DO GRY'}
          </button>
        </form>
      </div>

      <div style={{
        marginTop: 24,
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 7,
        color: 'var(--muted)',
        textAlign: 'center',
        lineHeight: 2,
      }}>
        Szkolenie AI • Prompt Quest v1.0
      </div>
    </div>
  );
}
