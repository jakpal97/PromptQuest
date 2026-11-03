// Ćwiczenia strefowe zalicza tylko zielona (90+), pozostałe zadania wynik 40+
export function passMarkOf(level) {
  return level?.zones || level?.config?.zones ? 90 : 40;
}

// completedVia: { [levelId]: 'reference' | 'trainer' } — zaliczenie wzorcem po 5 próbach albo przez trenera
export function isPassed(level, bestScores, completedVia = {}) {
  return !!completedVia[level.id] || (bestScores[level.id] ?? 0) >= passMarkOf(level);
}

// Ćwiczenie, które trzeba zaliczyć przed tym: poprzednie w tym samym bloku (lustro funkcji SQL level_lock)
export function requiredLevelOf(level, levels) {
  if (!level) return null;
  const idx = levels.findIndex(l => l.id === level.id);
  const previous = idx > 0 ? levels[idx - 1] : null;
  return previous && (previous.block || 1) === (level.block || 1) ? previous : null;
}

// null = otwarte, 'block' = trener nie odblokował bloku, 'previous' = najpierw zalicz poprzednie ćwiczenie
export function lockReasonOf(level, levels, bestScores, activeBlock, isAdmin, completedVia = {}) {
  if (!level || isAdmin) return null;
  if ((level.block || 1) > (activeBlock || 1)) return 'block';
  const previous = requiredLevelOf(level, levels);
  if (previous && !isPassed(previous, bestScores, completedVia)) return 'previous';
  return null;
}

export function levelName(level) {
  if (!level) return '';
  const code = level.label || (level.code ? `Ćwiczenie ${level.code}` : `Zadanie ${level.level_number}`);
  return level.title ? `${code} — ${level.title}` : code;
}

export function lockMessageOf(reason, level, levels) {
  if (reason === 'previous') return `Najpierw zalicz: ${levelName(requiredLevelOf(level, levels))}`;
  if (reason === 'block') return `Blok ${level.block} odblokuje trener`;
  return null;
}

// Pierwsze niezaliczone ćwiczenie modułu, do którego gracz ma dostęp
export function nextPlayableLevel(levels, bestScores, activeBlock, isAdmin, completedVia = {}) {
  const open = levels.filter(l => !lockReasonOf(l, levels, bestScores, activeBlock, isAdmin, completedVia));
  return open.find(l => !isPassed(l, bestScores, completedVia)) || open[open.length - 1] || null;
}
