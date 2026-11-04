// Rozmowa z AI w podglądzie: AI zadaje pytania, uczestnik odpowiada (w 1.2 obowiązkowo, w pozostałych zadaniach Dnia 2 dla chętnych)

export const AI_UNAVAILABLE = 'Nie udało się połączyć z AI, spróbuj jeszcze raz';
export const AI_TIMEOUT_MS = 30000;
export const MAX_FOLLOW_UPS = 2;
export const FOLLOW_UP_MAX_TOKENS = 500;
export function aiUnavailable() {
  return Response.json({ error: AI_UNAVAILABLE, code: 'ai_unavailable' }, { status: 503 });
}

// Pytanie = linia ze znakiem „?”
export function questionCount(text) {
  return (text || '').split('\n').filter(line => line.includes('?')).length;
}

export function hasQuestions(text) {
  return questionCount(text) > 0;
}

export function wordCount(text) {
  const trimmed = (text || '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// Haiku potrafi wtrącić słowo cyrylicą („помогą”); wtedy prosimy o odpowiedź jeszcze raz
const CYRILLIC = /[\u0400-\u04FF]/;
const ATTEMPTS = 3;

export async function completionText(create) {
  let text = '';
  for (let i = 0; i < ATTEMPTS; i++) {
    text = (await create()).content[0]?.text || '';
    if (!CYRILLIC.test(text)) return text;
  }
  return text;
}

export function chatEnabled(config, dayNumber) {
  return !!config?.conversation || (dayNumber === 2 && !!config?.zones);
}

// Ta sama rozmowa, którą widział model przy podglądzie, plus dalsze wymiany
export function chatRequest(config, prompt, history) {
  const turns = history.map(m => ({ role: m.role, content: m.content }));
  if (config.system_test) {
    return { system: prompt, messages: [{ role: 'user', content: config.system_test.message }, ...turns] };
  }
  return {
    ...(config.conversation && { system: config.conversation.system }),
    messages: [{ role: 'user', content: prompt }, ...turns],
  };
}
