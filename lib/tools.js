// Dzień 4 · zadania „Narzędzie + polecenie”: krok 1 wybór narzędzia, krok 2 polecenie (albo lista kontrolna w 4.2)

// Kolejność przycisków jest stała we wszystkich zadaniach
export const TOOLS = [
  { id: 'outlook', label: 'Copilot w Outlooku' },
  { id: 'copilot_chat', label: 'Copilot Chat' },
  { id: 'perplexity', label: 'Perplexity', free: true },
  { id: 'notebooklm', label: 'NotebookLM', free: true },
  { id: 'nano_banana', label: 'Nano Banana', free: true },
  { id: 'elevenlabs', label: 'ElevenLabs', free: true },
];

export const FREE_ACCOUNT_NOTE = 'Darmowe konto: tylko rzeczy publiczne. Żadnych danych klientów i firmy.';

// Dane z zadań 4.6–4.8, które nie mogą trafić do darmowego narzędzia
export const FREE_TOOL_RED_TERMS = [
  { label: 'nazwisko klienta', terms: ['Weber', 'Markus'] },
  { label: 'numer zamówienia', terms: ['2026/1187'] },
];

export const STEP2_XP = { green: 70, yellow: 50, red: 0 };
export const MIN_PROMPT_WORDS = 3;

export function toolLabel(id) {
  return TOOLS.find(t => t.id === id)?.label || id;
}

export function isFreeTool(id) {
  return !!TOOLS.find(t => t.id === id)?.free;
}

export function isAcceptedTool(cfg, id) {
  return !!cfg?.tool?.accepted?.includes(id);
}

// Krok 1: 30 / 20 / 10 XP za pierwszą, drugą i kolejną próbę
export function toolXpForTries(tries) {
  if (tries <= 1) return 30;
  if (tries === 2) return 20;
  return 10;
}

export function checksXp(checks, tries) {
  return tries <= 1 ? checks.xp_first : checks.xp_later;
}

// 4.7: krok 2 to rozmowa w turach (config.tool.turns); bez tur cały krok 2 opisuje config.tool
export function turnConfig(cfg, turn = 1) {
  const turns = cfg?.tool?.turns;
  return turns ? turns[Math.min(Math.max(turn, 1), turns.length) - 1] : cfg?.tool;
}

export function turnPassed(zone) {
  return zone === 'green' || zone === 'yellow';
}

export function turnXp(cfg, turn, zone) {
  return (turnConfig(cfg, turn)?.xp || STEP2_XP)[zone] ?? 0;
}

// Tura 1 dolicza się dopiero z zaliczoną Turą 2 — inaczej samo streszczenie zaliczałoby zadanie (próg 40)
export function turnsScore(cfg, step1, t1Zone, t2Zone) {
  if (!turnPassed(t2Zone)) return step1;
  return step1 + turnXp(cfg, 1, t1Zone) + turnXp(cfg, 2, t2Zone);
}

// battles.prompt_used w zadaniach z narzędziem: JSON { tool, tool_tries, prompt?, checks_tries?, best? }
// — ostatnia próba plus best: najlepiej ocenione polecenie { tool, prompt, zone } do „Moich poleceń”
// 4.7 dodatkowo: turn (1|2), t1 { prompt, zone, preview } — zaliczona Tura 1 — oraz best2 dla Tury 2
export function parseToolAttempt(promptUsed) {
  try {
    const parsed = JSON.parse(promptUsed || '');
    return parsed && typeof parsed.tool === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

const BEST_RANK = { yellow: 1, green: 2 };

// Zielona przed żółtą, przy remisie nowsza; czerwone nigdy nie trafiają do ściągi
export function withBestPrompt(promptUsed, zone, previousPromptUsed) {
  const attempt = parseToolAttempt(promptUsed);
  if (!attempt) return promptUsed;
  const previous = parseToolAttempt(previousPromptUsed) || {};
  const key = attempt.turn === 2 ? 'best2' : 'best';
  const attemptZone = attempt.turn === 1 ? attempt.t1?.zone : zone;
  const rank = BEST_RANK[attemptZone] || 0;
  const next = { ...attempt };
  delete next.best;
  delete next.best2;
  // Tura 2 opiera się na Turze 1 zapisanej na serwerze, nie na tym, co przysłał klient
  if (attempt.turn === 2) {
    if (turnPassed(previous.t1?.zone)) next.t1 = previous.t1;
    else delete next.t1;
  }
  for (const k of ['best', 'best2']) if (previous[k]) next[k] = previous[k];
  if (attempt.prompt && rank && rank >= (BEST_RANK[previous[key]?.zone] || 0)) {
    next[key] = { tool: attempt.tool, prompt: attempt.prompt, zone: attemptZone };
  }
  return JSON.stringify(next);
}

// „Moje polecenia”: najlepsze polecenie z każdej tury (bez tur — jedno)
export function bestPrompts(attempt) {
  return [attempt?.best && { turn: attempt.best2 || attempt.turn ? 1 : null, ...attempt.best }, attempt?.best2 && { turn: 2, ...attempt.best2 }]
    .filter(b => b?.prompt);
}
