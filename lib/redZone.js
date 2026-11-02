const RED_ZONE_PATTERNS = [
  { label: 'PESEL', regex: /\b\d{11}\b|\b\d{6,7}x{4,5}\b/i },
  { label: 'adres e-mail', regex: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { label: 'numer telefonu', regex: /(?:\+48[\s-]?)\d{3}[\s-]?\d{3}[\s-]?\d{3}\b|\b\d{3}-\d{3}-\d{3}\b|\b\d{3} \d{3} \d{3}\b(?!\s*(?:zł|pln|eur|usd|€|\$))|\b\d{9}\b/i },
  { label: 'numer konta', regex: /\b(?:PL)?\d{2}(?:[\s]?\d{4}){6}\b/ },
  { label: 'data urodzenia', regex: /\b(?:0?[1-9]|[12]\d|3[01])\.(?:0?[1-9]|1[0-2])\.(?:19[3-9]\d|200\d)\b/ },
];

// Wykrywa oczywiste dane osobowe. Nazwiska i nazwy klientów ocenia model,
// chyba że ćwiczenie poda własną listę fraz (config.red_terms: [{ label, terms }]).
export function detectRedZone(text, extraTerms = []) {
  if (!text) return [];
  const hits = RED_ZONE_PATTERNS.filter(p => p.regex.test(text)).map(p => p.label);
  const lower = text.toLowerCase();
  for (const { label, terms } of extraTerms || []) {
    if (terms.some(t => lower.includes(t.toLowerCase())) && !hits.includes(label)) hits.push(label);
  }
  return hits;
}
