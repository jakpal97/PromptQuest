'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getPlayerLevel } from '@/lib/auth';
import Character from '@/components/Character';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const currentPlayerId = typeof window !== 'undefined' ? sessionStorage.getItem('playerId') : null;

  useEffect(() => {
    fetchLeaderboard();

    // Supabase Realtime — nasłuchuje zmian przez anon client
    const channel = supabase
      .channel('leaderboard-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battles' }, fetchLeaderboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchLeaderboard)
      .subscribe();

    // Fallback auto-refresh co 10s
    const interval = setInterval(fetchLeaderboard, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function fetchLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const { players: data } = await res.json();
        setPlayers(data || []);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Nagłówek */}
      <div style={{
        background: 'var(--panel)',
        borderBottom: '2px solid var(--border)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 'clamp(8px, 2vw, 12px)', color: 'var(--gold)' }}>
          🏆 RANKING LIVE
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {lastUpdate && (
            <span style={{ fontFamily: "'Rajdhani'", fontSize: 12, color: 'var(--muted)' }}>
              Aktualizacja: {lastUpdate.toLocaleTimeString('pl-PL')}
            </span>
          )}
          <button
            onClick={() => router.push('/map')}
            className="pixel-button"
            style={{ fontSize: 8, padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            ← MAPA
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 16px', maxWidth: 700, margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <span style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: 'var(--accent)' }}>
              ŁADOWANIE RANKINGU...
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((player, idx) => {
              const lvl = getPlayerLevel(player.total_xp);
              const isMe = player.id === currentPlayerId;
              return (
                <div
                  key={player.id}
                  style={{
                    background: isMe ? 'rgba(79,142,247,0.15)' : 'var(--panel)',
                    border: `2px solid ${isMe ? 'var(--accent)' : idx < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][idx] : 'var(--border)'}`,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.2s',
                    boxShadow: isMe ? '0 0 15px rgba(79,142,247,0.3)' : 'none',
                  }}
                >
                  {/* Miejsce */}
                  <div style={{
                    fontFamily: "'Press Start 2P'",
                    fontSize: idx < 3 ? 18 : 12,
                    minWidth: 32,
                    textAlign: 'center',
                  }}>
                    {idx < 3 ? MEDALS[idx] : `${idx + 1}`}
                  </div>

                  {/* Sprite */}
                  {player.character_id ? (
                    <div
                      className="pixel-art"
                      style={{
                        width: 32, height: 32,
                        backgroundImage: `url('/characters/Office_Character_${player.character_id}.png')`,
                        backgroundSize: '96px 128px',
                        backgroundPosition: '0 0',
                        imageRendering: 'pixelated',
                        animation: 'walk-down-2x 0.6s steps(3) infinite',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{ width: 32, height: 32, background: 'var(--bg2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>?</div>
                  )}

                  {/* Info gracza */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Rajdhani'",
                      fontSize: 16,
                      fontWeight: 700,
                      color: isMe ? 'var(--accent)' : 'var(--white)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      {player.display_name || player.username}
                      {isMe && <span style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: 'var(--accent)' }}>TY</span>}
                    </div>
                    <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--muted)' }}>
                      {lvl.emoji} {lvl.name} • {player.battles_won} walk wygranych
                    </div>
                  </div>

                  {/* XP */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Press Start 2P'", fontSize: 11, color: 'var(--gold)' }}>
                      {player.total_xp}
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: 'var(--muted)' }}>XP</div>
                  </div>
                </div>
              );
            })}

            {players.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Rajdhani'", fontSize: 16, color: 'var(--muted)' }}>
                Brak graczy w rankingu
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
