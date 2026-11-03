// Blokada kopiowania „Przykładu z innej sytuacji” — liczona deterministycznie, przed oceną AI
export const SIMILARITY_LIMIT = 0.5;
// Krótkie prompty („Napisz maila.”) zawsze dzielą słowa z przykładem — nie sprawdzamy ich
export const SIMILARITY_MIN_WORDS = 12;

export const TOO_SIMILAR_MESSAGE = 'Ten prompt jest za bardzo podobny do przykładu. Wzoruj się na nim, ale napisz swój prompt własnymi słowami, dla pytania z listy albo dla swojego zadania.';

const LABELS = new Set(['rola', 'kontekst', 'zadanie', 'format', 'zabezpieczenie']);

export function normalizeWords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w && !LABELS.has(w));
}

function wordShare(words, sourceWords) {
  const source = new Set(sourceWords);
  const counted = words.filter(w => w.length > 2);
  if (!counted.length) return 0;
  return counted.filter(w => source.has(w)).length / counted.length;
}

function trigrams(words) {
  const out = [];
  for (let i = 0; i + 2 < words.length; i++) out.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  return out;
}

function trigramShare(words, sourceWords) {
  const mine = trigrams(words);
  if (!mine.length) return 0;
  const source = new Set(trigrams(sourceWords));
  return mine.filter(t => source.has(t)).length / mine.length;
}

export function similarity(prompt, source) {
  const words = normalizeWords(prompt);
  const sourceWords = normalizeWords(source);
  if (!sourceWords.length) return 0;
  return Math.max(wordShare(words, sourceWords), trigramShare(words, sourceWords));
}

export function exampleText(cfg) {
  return (cfg?.other_example?.lines || []).map(l => l.text).join('\n');
}

// Tylko przykład z innej sytuacji: wzorzec uczestnik widzi dopiero po ukończeniu ćwiczenia,
// a dobry samodzielny prompt bywa do niego bardzo podobny
export function copySimilarity(prompt, cfg) {
  const text = exampleText(cfg);
  return { value: text ? similarity(prompt, text) : 0, kind: 'przykład' };
}

// Dotyczy ćwiczeń strefowych Dnia 1; null = prompt może iść do oceny
export function copyBlock(prompt, level) {
  if (!level?.config?.zones || level.modules?.day_number !== 1) return null;
  if (normalizeWords(prompt).length < SIMILARITY_MIN_WORDS) return null;
  const best = copySimilarity(prompt, level.config);
  if (best.value <= SIMILARITY_LIMIT) return null;
  return { code: 'too_similar', error: TOO_SIMILAR_MESSAGE, similarity: Math.round(best.value * 100), similarTo: best.kind };
}
