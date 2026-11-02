// Ćwiczenia strefowe zalicza tylko zielona (90+), pozostałe zadania wynik 40+
export function passMarkOf(level) {
  return level?.zones || level?.config?.zones ? 90 : 40;
}

export function isPassed(level, bestScores) {
  return (bestScores[level.id] ?? 0) >= passMarkOf(level);
}

// null = otwarte, 'block' = trener nie odblokował bloku, 'previous' = najpierw zalicz poprzednie ćwiczenie
export function lockReasonOf(level, levels, bestScores, activeBlock, isAdmin) {
  if (!level || isAdmin) return null;
  if ((level.block || 1) > (activeBlock || 1)) return 'block';
  const idx = levels.findIndex(l => l.id === level.id);
  const previous = idx > 0 ? levels[idx - 1] : null;
  if (previous && !isPassed(previous, bestScores)) return 'previous';
  return null;
}

// Pierwsze niezaliczone ćwiczenie modułu, do którego gracz ma dostęp
export function nextPlayableLevel(levels, bestScores, activeBlock, isAdmin) {
  const open = levels.filter(l => !lockReasonOf(l, levels, bestScores, activeBlock, isAdmin));
  return open.find(l => !isPassed(l, bestScores)) || open[open.length - 1] || null;
}
