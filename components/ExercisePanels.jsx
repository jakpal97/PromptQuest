'use client';

import { useState } from 'react';

const PIXEL = "'Press Start 2P'";
const TEXT = "'Rajdhani'";

export const ZONES = {
  green:  { color: 'var(--green)', icon: '✅', label: 'STREFA ZIELONA', sub: 'zaliczone' },
  yellow: { color: 'var(--gold)',  icon: '⚠',  label: 'STREFA ŻÓŁTA',   sub: 'do poprawy' },
  red:    { color: 'var(--red)',   icon: '❌', label: 'STREFA CZERWONA', sub: 'niezaliczone' },
};

export function zoneBossLine(zone) {
  if (zone === 'green') return 'Świetnie! Tak to się robi — strefa zielona. Zapisz ten prompt w bibliotece!';
  if (zone === 'yellow') return 'Blisko! Jeszcze jedna poprawka i będzie zielono.';
  return 'Stop — w takiej wersji to nie przejdzie. Zobacz, co poprawić, i spróbuj jeszcze raz.';
}

export function Label({ color = 'var(--muted)', children, style }) {
  return (
    <div style={{ fontFamily: PIXEL, fontSize: 8, color, marginBottom: 8, letterSpacing: 0.5, lineHeight: 1.5, ...style }}>
      {children}
    </div>
  );
}

function Card({ color = 'rgba(79,142,247,0.3)', background = 'rgba(15,12,36,0.95)', children, style }) {
  return (
    <div style={{ background, border: `1px solid ${color}`, borderRadius: 4, padding: '12px 14px', flexShrink: 0, ...style }}>
      {children}
    </div>
  );
}

function Fold({ title, color = 'var(--muted)', defaultOpen = false, children }) {
  return (
    <details open={defaultOpen} style={{ background: 'rgba(10,10,26,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '9px 12px' }}>
      <summary style={{ fontFamily: PIXEL, fontSize: 8, color, cursor: 'pointer', lineHeight: 1.6 }}>{title}</summary>
      <div style={{ marginTop: 10 }}>{children}</div>
    </details>
  );
}

const body = { fontFamily: TEXT, fontSize: 15, color: 'var(--white)', lineHeight: 1.5, fontWeight: 600 };

function Bullets({ items, color = 'var(--white)', marker = '•' }) {
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map((it, i) => (
        <li key={i} style={{ ...body, fontSize: 14, color, display: 'flex', gap: 8 }}>
          <span style={{ flexShrink: 0, opacity: 0.8 }}>{marker}</span><span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function RedZoneBanner() {
  return (
    <div style={{ background: 'rgba(247,79,79,0.08)', border: '1px dashed rgba(247,79,79,0.6)', borderRadius: 4, padding: '8px 12px', ...body, fontSize: 13, color: '#ffb3b3' }}>
      🚫 <b>Czerwona strefa:</b> nie wklejaj nazwisk, danych kontaktowych, PESEL-i, kwot z umów ani nazw klientów. Pisz [KLIENT], [KWOTA], Firma X.
    </div>
  );
}

export function ExerciseBrief({ level, relatedPrompt, onInsert }) {
  const cfg = level.config;
  return (
    <>
      <Card>
        <Label color="var(--accent)">📋 SYTUACJA</Label>
        <div style={body}>{cfg.situation}</div>
        {cfg.examples?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ ...body, fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{cfg.examples_title || 'Przykłady:'}</div>
            <Bullets items={cfg.examples} color="#cfd3ff" />
          </div>
        )}
      </Card>

      {cfg.materials?.map((m, i) => (
        <Card key={i} color={m.danger ? 'var(--red)' : 'rgba(247,201,79,0.4)'} background={m.danger ? 'rgba(247,79,79,0.07)' : 'rgba(15,12,36,0.95)'}>
          <Label color={m.danger ? 'var(--red)' : 'var(--gold)'}>{m.danger ? '⚠ ' : '📝 '}{m.title.toUpperCase()}</Label>
          <div style={{ ...body, fontSize: 14, color: m.danger ? '#ffc4c4' : '#ff9999', fontStyle: 'italic', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
            „{m.prompt}”
          </div>
          {m.facts && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...body, fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Co autor wiedział, ale nie napisał:</div>
              <Bullets items={m.facts} color="#d8f5e6" marker="✓" />
            </div>
          )}
        </Card>
      ))}

      <Card color="rgba(79,142,247,0.3)">
        <Label color="var(--accent)">🎯 TWOJE ZADANIE</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(cfg.steps || []).map((s, i) => (
            <div key={i} style={{ ...body, opacity: s.offline ? 0.75 : 1 }}>
              {s.offline && (
                <span style={{ fontFamily: PIXEL, fontSize: 7, color: 'var(--accent2)', border: '1px solid var(--accent2)', padding: '2px 6px', marginRight: 6, verticalAlign: 'middle' }}>
                  📝 POZA APLIKACJĄ
                </span>
              )}
              {s.text}
            </div>
          ))}
        </div>
      </Card>

      {relatedPrompt && (
        <Card color="rgba(79,247,160,0.4)" background="rgba(79,247,160,0.05)">
          <Label color="var(--green)">↩ TWÓJ PROMPT Z {cfg.related_code}</Label>
          <div style={{ ...body, fontSize: 14, whiteSpace: 'pre-wrap', fontWeight: 500, maxHeight: 140, overflowY: 'auto' }}>{relatedPrompt}</div>
          <button onClick={() => onInsert(relatedPrompt)} className="chip-button" style={{ marginTop: 8, borderColor: 'var(--green)', color: 'var(--green)' }}>
            ✏️ Wstaw jako punkt wyjścia
          </button>
        </Card>
      )}

      {cfg.hints?.length > 0 && (
        <Fold title="💡 ŚCIĄGA">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cfg.hints.map(h => (
              <div key={h.label} style={{ ...body, fontSize: 14 }}>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{h.label}:</span> {h.text}
              </div>
            ))}
          </div>
        </Fold>
      )}

      <Fold title="✅ ZA CO JEST STREFA ZIELONA" color="var(--green)">
        <Bullets items={cfg.zones.green} marker="✓" />
        <div style={{ marginTop: 12 }}>
          <div style={{ ...body, fontSize: 13, color: 'var(--gold)', marginBottom: 4 }}>⚠ Żółta, gdy:</div>
          <Bullets items={cfg.zones.yellow} color="#f3e3b0" />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ ...body, fontSize: 13, color: 'var(--red)', marginBottom: 4 }}>❌ Czerwona, gdy:</div>
          <Bullets items={cfg.zones.red} color="#ffc4c4" />
        </div>
      </Fold>

      {cfg.bonus && (
        <Fold title={`⭐ BONUS +${cfg.bonus.xp} XP`} color="var(--gold)">
          {cfg.bonus.hidden ? (
            <div style={{ ...body, fontSize: 13, color: 'var(--muted)' }}>{cfg.bonus.hidden}</div>
          ) : (
            <>
              <div style={{ ...body, fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{cfg.bonus.rule}</div>
              <Bullets items={cfg.bonus.items} color="#f3e3b0" marker="★" />
            </>
          )}
        </Fold>
      )}
    </>
  );
}

export function ZoneResult({ result, level, saved }) {
  const z = ZONES[result.zone] || ZONES.yellow;
  const green = level.config.zones.green;
  const bonusXp = level.config.bonus?.xp || 0;
  const xpGained = saved?.xpGained;

  return (
    <>
      <div style={{
        background: 'rgba(10,8,28,0.96)', border: `2px solid ${z.color}`, borderRadius: 4, padding: '14px 16px',
        boxShadow: `0 0 24px ${z.color}33`, animation: 'pop-in 0.35s cubic-bezier(.34,1.56,.64,1)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: PIXEL, fontSize: 14, color: z.color, lineHeight: 1.4 }}>{z.icon} {z.label}</div>
            <div style={{ ...body, color: 'var(--muted)', marginTop: 4 }}>{z.sub}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: PIXEL, fontSize: 12, color: xpGained > 0 ? 'var(--gold)' : 'var(--muted)' }}>
              {!saved ? '…' : xpGained > 0 ? `+${xpGained} XP` : '+0 XP'}
            </div>
            <div style={{ ...body, fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              {saved?.practice && !xpGained ? 'masz już lepszy wynik' : result.zone === 'green' ? '' : 'XP dopiero za zieloną — wyślij nowy prompt'}
            </div>
          </div>
        </div>
        {result.zone === 'green' && bonusXp > 0 && (
          <div style={{ marginTop: 10, ...body, fontSize: 14, color: result.bonus ? 'var(--gold)' : 'var(--muted)' }}>
            {result.bonus ? `⭐ BONUS +${bonusXp} XP` : '☆ Bonus nie tym razem'}{result.bonus_powod ? ` — ${result.bonus_powod}` : ''}
          </div>
        )}
        {result.zone !== 'green' && (
          <div style={{ marginTop: 10, ...body, fontSize: 14, color: '#cfd3ff' }}>
            Ćwiczenie trwa, dopóki nie zdobędziesz zielonej. Przeczytaj wskazówki i wyślij nowy, kompletny prompt — każda próba jest oceniana od zera. Dziś nie tracisz życia.
          </div>
        )}
      </div>

      {result.redZoneDetected?.length > 0 && (
        <Card color="var(--red)" background="rgba(247,79,79,0.1)">
          <Label color="var(--red)">🚫 PROMPT NIE ZOSTAŁ WYSŁANY DO AI</Label>
          <div style={body}>Wykryto dane z czerwonej strefy: <b style={{ color: '#ff9999' }}>{result.redZoneDetected.join(', ')}</b>. W prawdziwej pracy właśnie w tym momencie dane wyciekłyby do zewnętrznego dostawcy.</div>
        </Card>
      )}

      {!result.redZoneDetected?.length && (
        <Card color="rgba(255,255,255,0.12)" background="rgba(10,10,26,0.95)">
          <Label>📋 KRYTERIA STREFY ZIELONEJ</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {green.map((c, i) => {
              const ok = result.spelnione?.includes(i + 1);
              return (
                <div key={i} style={{ ...body, fontSize: 14, display: 'flex', gap: 8, color: ok ? 'var(--white)' : '#ffc4c4', animation: `pop-in 0.3s ease-out ${0.05 * i}s both` }}>
                  <span style={{ flexShrink: 0, color: ok ? 'var(--green)' : 'var(--red)' }}>{ok ? '✓' : '✗'}</span>
                  <span>{c}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}

export function RevealAfterPass({ reveal }) {
  return (
    <Card color="rgba(247,201,79,0.5)" background="rgba(247,201,79,0.06)">
      <Label color="var(--gold)">{reveal.title}</Label>
      <Bullets items={reveal.items} color="#f3e3b0" marker="🪤" />
    </Card>
  );
}

export function ReferencePrompt({ reference, unlocked, reason }) {
  const [open, setOpen] = useState(false);
  if (!reference) return null;
  if (!unlocked) {
    return (
      <div style={{ ...body, fontSize: 13, color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 4, padding: '8px 12px' }}>
        🔒 Wzorcowy prompt zobaczysz po zaliczeniu ćwiczenia (strefa zielona).
      </div>
    );
  }
  return (
    <Card color="rgba(79,142,247,0.5)" background="rgba(79,142,247,0.06)">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Label color="var(--accent)" style={{ marginBottom: 0 }}>📘 WZORCOWY PROMPT</Label>
        <button onClick={() => setOpen(o => !o)} className="chip-button">{open ? '▲ Zwiń' : '▼ Pokaż'}</button>
      </div>
      {reason && <div style={{ ...body, fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{reason}</div>}
      {open && (
        <div style={{ marginTop: 10 }}>
          {reference.situation && <div style={{ ...body, fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{reference.situation}</div>}
          <div style={{ ...body, fontSize: 14, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{reference.prompt}</div>
        </div>
      )}
    </Card>
  );
}
