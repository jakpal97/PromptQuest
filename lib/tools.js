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

// battles.prompt_used w zadaniach z narzędziem: JSON { tool, tool_tries, prompt?, checks_tries?, best? }
// — ostatnia próba plus best: najlepiej ocenione polecenie { tool, prompt, zone } do „Moich poleceń”
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
  const { best: previousBest = null } = parseToolAttempt(previousPromptUsed) || {};
  const rank = BEST_RANK[zone] || 0;
  const best = attempt.prompt && rank && rank >= (BEST_RANK[previousBest?.zone] || 0)
    ? { tool: attempt.tool, prompt: attempt.prompt, zone }
    : previousBest;
  const next = { ...attempt };
  delete next.best;
  if (best) next.best = best;
  return JSON.stringify(next);
}
