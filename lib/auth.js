export function getSession() {
  if (typeof window === 'undefined') return null;
  const playerId = sessionStorage.getItem('playerId');
  if (!playerId) return null;
  return {
    playerId,
    displayName: sessionStorage.getItem('displayName'),
    characterId: sessionStorage.getItem('characterId'),
    role: sessionStorage.getItem('role'),
    totalXp: parseInt(sessionStorage.getItem('totalXp') || '0'),
    currentModule: parseInt(sessionStorage.getItem('currentModule') || '1'),
    currentLives: parseInt(sessionStorage.getItem('currentLives') || '3'),
    currentLevelInModule: parseInt(sessionStorage.getItem('currentLevelInModule') || '1'),
  };
}

export function saveSession(player) {
  sessionStorage.setItem('playerId', player.id);
  sessionStorage.setItem('displayName', player.display_name || '');
  sessionStorage.setItem('characterId', player.character_id || '');
  sessionStorage.setItem('role', player.role || 'player');
  sessionStorage.setItem('totalXp', player.total_xp || '0');
  sessionStorage.setItem('currentModule', player.current_module || '1');
  sessionStorage.setItem('currentLives', player.current_lives || '3');
  sessionStorage.setItem('currentLevelInModule', player.current_level_in_module || '1');
}

export function clearSession() {
  sessionStorage.clear();
}

export function updateSessionField(key, value) {
  sessionStorage.setItem(key, value);
}

const PLAYER_LEVELS = [
  { level: 1, name: 'AI Newcomer',       emoji: '🌱', minXp: 0    },
  { level: 2, name: 'Prompt Apprentice', emoji: '⚡', minXp: 150  },
  { level: 3, name: 'Prompt Builder',    emoji: '🔨', minXp: 350  },
  { level: 4, name: 'AI Explorer',       emoji: '🔭', minXp: 600  },
  { level: 5, name: 'Prompt Engineer',   emoji: '⚙️', minXp: 900  },
  { level: 6, name: 'AI Specialist',     emoji: '🧠', minXp: 1200 },
  { level: 7, name: 'AI Champion',       emoji: '🏆', minXp: 1500 },
];

export function getPlayerLevel(xp) {
  return [...PLAYER_LEVELS].reverse().find(l => xp >= l.minXp) || PLAYER_LEVELS[0];
}

export { PLAYER_LEVELS };
