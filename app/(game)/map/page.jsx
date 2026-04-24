'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPlayerLevel } from '@/lib/auth';
import Character from '@/components/Character';

const MODULE_NODES = [
  { id: 1, label: 'Recepcja',           sublabel: 'Pani Zofia',      x: 14, y: 22 },
  { id: 2, label: 'Open Space',          sublabel: 'Kierownik Marek', x: 50, y: 35 },
  { id: 3, label: 'Sala konferencyjna',  sublabel: 'Dyrektor Anna',   x: 82, y: 65 },
  { id: 4, label: 'Gabinet Dyrektora',   sublabel: 'Prezes Tomasz',   x: 82, y: 22 },
];

export default function MapPage() {
  const router = useRouter();
  const [player, setPlayer] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const playerId = sessionStorage.getItem('playerId');
    if (!playerId) { router.push('/login'); return; }

    // Najpierw pokaż dane z sessionStorage — mapa natychmiastowa
    const cachedPlayer = {
      id: playerId,
      display_name: sessionStorage.getItem('displayName') || '',
      character_id: parseInt(sessionStorage.getItem('characterId')) || null,
      role: sessionStorage.getItem('role') || 'player',
      total_xp: parseInt(sessionStorage.getItem('totalXp') || '0'),
      current_module: parseInt(sessionStorage.getItem('currentModule') || '1'),
      current_lives: parseInt(sessionStorage.getItem('currentLives') || '3'),
      current_level_in_module: parseInt(sessionStorage.getItem('currentLevelInModule') || '1'),
    };
    setPlayer(cachedPlayer);
    setLoading(false);

    // Potem odśwież z serwera (przez API używające service key)
    try {
      const [playerRes, modulesRes] = await Promise.all([
        fetch(`/api/player/me?id=${playerId}`),
        fetch('/api/modules'),
      ]);

      if (playerRes.ok) {
        const { player: freshPlayer } = await playerRes.json();
        setPlayer(freshPlayer);
        sessionStorage.setItem('totalXp', freshPlayer.total_xp);
        sessionStorage.setItem('currentModule', freshPlayer.current_module);
        sessionStorage.setItem('currentLives', freshPlayer.current_lives);
        sessionStorage.setItem('currentLevelInModule', freshPlayer.current_level_in_module);
      }

      if (modulesRes.ok) {
        const { modules: freshModules } = await modulesRes.json();
        setModules(freshModules || []);
      }
    } catch (err) {
      console.error('Map refresh error:', err);
    }
  }

  function getModuleState(moduleId) {
    if (!player) return 'locked';
    if (moduleId < player.current_module) return 'completed';
    if (moduleId === player.current_module) return 'active';
    // moduł jest za aktywnym — sprawdź czy admin go odblokował
    const mod = modules.find(m => m.day_number === moduleId);
    if (mod?.unlocked) return 'unlocked';
    return 'locked';
  }

  async function handleNodeClick(moduleNode) {
    if (!moduleNode) return;
    const state = getModuleState(moduleNode.id);
    if (state === 'locked') return;

    const res = await fetch(`/api/levels?moduleId=${moduleNode.id}`);
    const { levels } = res.ok ? await res.json() : { levels: [] };
    if (!levels || levels.length === 0) return;

    if (state === 'completed' || state === 'unlocked') {
      // ukończony lub odblokowany przez admina — wejdź od pierwszego levelu
      router.push(`/battle/${levels[0].id}`);
      return;
    }

    // Aktywny moduł — wejdź do aktualnego levelu gracza
    const currentLevelInModule = player?.current_level_in_module || 1;
    const targetLevel = levels.find(l => l.level_number === currentLevelInModule) || levels[0];
    router.push(`/battle/${targetLevel.id}`);
  }

  function getNodeStyle(state) {
    const base = {
      position: 'absolute',
      width: 48,
      height: 48,
      borderRadius: '50%',
      border: '3px solid',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: state === 'locked' ? 'not-allowed' : 'pointer',
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.2s',
      zIndex: 10,
    };

    switch (state) {
      case 'active':
        return {
          ...base,
          background: 'rgba(79,142,247,0.3)',
          borderColor: 'var(--accent)',
          boxShadow: '0 0 20px rgba(79,142,247,0.8)',
          animation: 'pulse-node 1.5s ease-in-out infinite',
        };
      case 'completed':
        return {
          ...base,
          background: 'rgba(79,247,160,0.2)',
          borderColor: 'var(--green)',
          boxShadow: '0 0 15px rgba(79,247,160,0.4)',
        };
      case 'unlocked':
        return {
          ...base,
          background: 'rgba(247,200,79,0.2)',
          borderColor: 'var(--gold)',
          boxShadow: '0 0 15px rgba(247,200,79,0.5)',
          animation: 'pulse-node 2s ease-in-out infinite',
        };
      default:
        return {
          ...base,
          background: 'rgba(26,26,58,0.8)',
          borderColor: 'var(--muted)',
          opacity: 0.6,
        };
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: "'Press Start 2P'", fontSize: 10, color: 'var(--accent)' }}>
          WCZYTYWANIE MAPY...
        </span>
      </div>
    );
  }

  const playerLevel = getPlayerLevel(player?.total_xp || 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Górny pasek */}
      <div style={{
        background: 'var(--panel)',
        borderBottom: '2px solid var(--border)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Character characterId={player?.character_id} size={3} animate />
          <div>
            <div style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: 'var(--gold)' }}>
              {player?.display_name || player?.username}
            </div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              {playerLevel.emoji} {playerLevel.name} • {player?.total_xp || 0} XP
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Życia */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} style={{ fontSize: 16, opacity: i < (player?.current_lives || 3) ? 1 : 0.2 }}>❤️</span>
            ))}
          </div>

          <button
            onClick={() => router.push('/leaderboard')}
            className="pixel-button"
            style={{ fontSize: 8, padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--gold)' }}
          >
            🏆 RANKING
          </button>

          {sessionStorage.getItem('role') === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="pixel-button"
              style={{ fontSize: 8, padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--accent2)', color: 'var(--accent2)' }}
            >
              ⚙ ADMIN
            </button>
          )}

          <button
            onClick={() => { sessionStorage.clear(); router.push('/login'); }}
            className="pixel-button"
            style={{ fontSize: 8, padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            WYJDŹ
          </button>
        </div>
      </div>

      {/* Mapa — zajmuje cały pozostały ekran */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 12px 12px', gap: 10, minHeight: 0 }}>

        <div style={{
          fontFamily: "'Press Start 2P'",
          fontSize: 'clamp(8px, 2vw, 11px)',
          color: 'var(--white)',
          textAlign: 'center',
        }}>
          MAPA BIURA — WYBIERZ MODUŁ
        </div>

        {/* Kontener mapy — rozciąga się na dostępną wysokość */}
        <div style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: 340,
          border: '2px solid var(--border)',
          overflow: 'hidden',
        }}>
          {/* Obrazek mapy — wypełnia kontener */}
          <img
            src="/map/office-map.png"
            alt="Mapa biura"
            className="pixel-art"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />

          {/* Węzły modułów — pozycjonowane % względem kontenera */}
          {MODULE_NODES.map(node => {
            const state = getModuleState(node.id);

            return (
              <div
                key={node.id}
                style={{
                  ...getNodeStyle(state),
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                }}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setTooltip(node.id)}
                onMouseLeave={() => setTooltip(null)}
              >
                {state === 'completed' && <span style={{ fontSize: 20 }}>✓</span>}
                {state === 'locked'    && <span style={{ fontSize: 16 }}>🔒</span>}
                {state === 'unlocked'  && <span style={{ fontSize: 18 }}>⭐</span>}
                {state === 'active'    && (
                  <span style={{
                    fontFamily: "'Press Start 2P'",
                    fontSize: 14,
                    color: 'var(--accent)',
                    fontWeight: 'bold',
                  }}>{node.id}</span>
                )}

                {/* Label pod węzłem */}
                <div style={{
                  position: 'absolute',
                  top: '110%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Press Start 2P'",
                  fontSize: 6,
                  color: state === 'active' ? 'var(--accent)' : state === 'completed' ? 'var(--green)' : state === 'unlocked' ? 'var(--gold)' : 'var(--muted)',
                  textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                  pointerEvents: 'none',
                  background: 'rgba(10,10,26,0.75)',
                  padding: '2px 4px',
                  display: state === 'locked' ? 'none' : 'block',
                }}>
                  {node.label}
                </div>

                {/* Tooltip na hover */}
                {tooltip === node.id && (
                  <div style={{
                    position: 'absolute',
                    bottom: '130%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--panel)',
                    border: `1px solid ${state === 'active' ? 'var(--accent)' : state === 'completed' ? 'var(--green)' : 'var(--border)'}`,
                    padding: '8px 14px',
                    whiteSpace: 'nowrap',
                    zIndex: 100,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
                    pointerEvents: 'none',
                  }}>
                    <div style={{ fontFamily: "'Press Start 2P'", fontSize: 8, color: 'var(--white)', marginBottom: 4 }}>
                      {node.label}
                    </div>
                    <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--muted)' }}>
                      {node.sublabel}
                    </div>
                    <div style={{
                      fontFamily: "'Rajdhani'", fontSize: 12, marginTop: 4,
                      color: state === 'locked' ? 'var(--red)' : state === 'completed' ? 'var(--green)' : 'var(--accent)',
                    }}>
                      {state === 'locked' ? '🔒 ZABLOKOWANE' : state === 'completed' ? '✓ UKOŃCZONE' : state === 'unlocked' ? '⭐ ODBLOKOWANE — WEJDŹ' : '▶ KLIKNIJ ABY WEJŚĆ'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Sprite gracza przy aktywnym węźle */}
          {player?.character_id && (() => {
            const activeNode = MODULE_NODES.find(n => n.id === player.current_module);
            if (!activeNode) return null;
            return (
              <div style={{
                position: 'absolute',
                left: `${activeNode.x + 4}%`,
                top: `${activeNode.y + 6}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 15,
                filter: 'drop-shadow(0 0 8px rgba(79,142,247,0.9))',
              }}>
                <Character characterId={player.character_id} size={5} animate />
              </div>
            );
          })()}
        </div>

        {/* Legenda modułów — pasek pod mapą */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          width: '100%',
        }}>
          {modules.map(mod => {
            const state = getModuleState(mod.day_number);
            return (
              <div
                key={mod.id}
                onClick={() => handleNodeClick(MODULE_NODES.find(n => n.id === mod.day_number))}
                style={{
                  background: state === 'active' ? 'rgba(79,142,247,0.12)' : 'var(--panel)',
                  border: `1px solid ${state === 'active' ? 'var(--accent)' : state === 'completed' ? 'var(--green)' : 'var(--border)'}`,
                  padding: '8px 10px',
                  cursor: state !== 'locked' ? 'pointer' : 'default',
                  opacity: state === 'locked' ? 0.45 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: 'var(--muted)', marginBottom: 3 }}>
                  MOD {mod.day_number}
                </div>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, color: 'var(--white)', fontWeight: 600, lineHeight: 1.2 }}>
                  {mod.title}
                </div>
                {state === 'active' && (
                  <div style={{ fontFamily: "'Press Start 2P'", fontSize: 5, color: 'var(--accent)', marginTop: 4 }}>
                    ▶ L{player?.current_level_in_module || 1}/{mod.total_levels}
                  </div>
                )}
                {state === 'completed' && (
                  <div style={{ fontFamily: "'Press Start 2P'", fontSize: 5, color: 'var(--green)', marginTop: 4 }}>
                    ✓ UKOŃCZONO
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
