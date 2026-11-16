'use client';

import { useState, useEffect } from 'react';
import Markdown from '@/components/Markdown';
import { TOOLS, FREE_ACCOUNT_NOTE, toolLabel } from '@/lib/tools';

const PIXEL = "'Press Start 2P'";
const TEXT = "'Rajdhani'";

export const ZONES = {
  green:  { color: 'var(--green)', icon: '✅', label: 'STREFA ZIELONA', sub: 'zaliczone' },
  yellow: { color: 'var(--gold)',  icon: '⚠',  label: 'STREFA ŻÓŁTA',   sub: 'do poprawy' },
  red:    { color: 'var(--red)',   icon: '❌', label: 'STREFA CZERWONA', sub: 'niezaliczone' },
};

export function zoneBossLine(zone) {
  if (zone === 'green') return 'Świetnie! Tak to się robi — strefa zielona. Zapisz ten prompt w bibliotece!';
  if (zone === 'yellow') return 'Blisko! Popraw jedną rzecz i będzie zielono.';
  return 'Stop — w takiej wersji to nie przejdzie. Zobacz, co poprawić, i spróbuj jeszcze raz.';
}

export function Label({ color = 'var(--muted)', children, style }) {
  return (
    <div style={{ fontFamily: PIXEL, fontSize: 11, color, marginBottom: 8, letterSpacing: 0.5, lineHeight: 1.6, ...style }}>
      {children}
    </div>
  );
}

function Card({ color = 'rgba(79,142,247,0.3)', background = 'rgba(15,12,36,0.95)', children, style, className }) {
  return (
    <div className={className} style={{ background, border: `1px solid ${color}`, borderRadius: 4, padding: '12px 14px', flexShrink: 0, ...style }}>
      {children}
    </div>
  );
}

function Fold({ title, color = 'var(--muted)', defaultOpen = false, children }) {
  return (
    <details open={defaultOpen} style={{ background: 'rgba(10,10,26,0.94)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 4, padding: '0 12px', flexShrink: 0 }}>
      <summary className="fold-summary" style={{ fontFamily: TEXT, fontSize: 18, fontWeight: 700, color, cursor: 'pointer', lineHeight: 1.4 }}>{title}</summary>
      <div style={{ marginTop: 2, marginBottom: 12 }}>{children}</div>
    </details>
  );
}

const body = { fontFamily: TEXT, fontSize: 17, color: 'var(--white)', lineHeight: 1.5, fontWeight: 600 };

// Zadania z listą „Nie zapomnij o:” (Dzień 2): większa czcionka, długie słowa łamane zamiast poziomego przewijania
const large = { ...body, fontSize: 18, lineHeight: 1.55, overflowWrap: 'anywhere' };

function Heading({ color, children }) {
  return <div style={{ ...large, fontWeight: 700, color, marginBottom: 8 }}>{children}</div>;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Telefon w sieci lokalnej (http) nie ma Clipboard API
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    area.remove();
    return ok;
  }
}

function DataBlock({ block }) {
  const [state, setState] = useState(null);
  const content = block.text ?? (block.lines || []).join('\n');
  async function copy() {
    setState(await copyText(content) ? 'ok' : 'error');
    setTimeout(() => setState(null), 2000);
  }
  return (
    <Card color="rgba(247,201,79,0.45)">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <div style={{ ...large, fontWeight: 700, color: 'var(--gold)' }}>📝 {block.title}</div>
        {block.copy && (
          <button onClick={copy} className="chip-button" style={{ borderColor: 'var(--gold)', color: 'var(--gold)', fontSize: 16, minHeight: 44 }}>
            {state === 'ok' ? '✓ Skopiowano' : state === 'error' ? 'Zaznacz tekst i skopiuj ręcznie' : '📋 Kopiuj'}
          </button>
        )}
      </div>
      {block.lines
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{block.lines.map((l, i) => <div key={i} style={large}>{l}</div>)}</div>
        : <div style={{ ...large, whiteSpace: 'pre-wrap' }}>{block.text}</div>}
    </Card>
  );
}

function Bullets({ items, color = 'var(--white)', marker = '•', style = body }) {
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {items.map((it, i) => (
        <li key={i} style={{ ...style, color, display: 'flex', gap: 8 }}>
          <span style={{ flexShrink: 0, opacity: 0.8 }}>{marker}</span><span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function RedZoneBanner() {
  return (
    <div style={{ background: 'rgba(247,79,79,0.08)', border: '1px dashed rgba(247,79,79,0.6)', borderRadius: 4, padding: '8px 12px', ...body, color: '#ffb3b3' }}>
      🚫 <b>Czerwona strefa:</b> nie wklejaj nazwisk, danych kontaktowych, PESEL-i, kwot z umów ani nazw klientów. Pisz [KLIENT], [KWOTA], Firma X.
    </div>
  );
}

// Lewa kolumna: sytuacja, dane i polecenie
export function ExerciseBrief({ level, relatedPrompt, onInsert }) {
  const cfg = level.config;
  return (
    <>
      <Card>
        <Heading color="var(--accent)">📋 Sytuacja</Heading>
        <div style={large}>{cfg.situation}</div>
        {cfg.examples?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ ...large, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>{cfg.examples_title || 'Przykłady:'}</div>
            <Bullets items={cfg.examples} color="#dde0ff" style={large} />
          </div>
        )}
      </Card>

      {cfg.materials?.map((m, i) => (
        <Card key={i} color={m.danger ? 'var(--red)' : 'rgba(247,201,79,0.4)'} background={m.danger ? 'rgba(247,79,79,0.07)' : 'rgba(15,12,36,0.95)'}>
          <Heading color={m.danger ? '#ff8a8a' : 'var(--gold)'}>{m.danger ? '⚠ ' : '📝 '}{m.title}</Heading>
          <div style={{ ...large, color: m.danger ? '#ffc4c4' : '#ffb0b0', fontStyle: 'italic', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
            „{m.prompt}”
          </div>
          {m.facts && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...large, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Co autor wiedział, ale nie napisał:</div>
              <Bullets items={m.facts} color="#d8f5e6" marker="✓" style={large} />
            </div>
          )}
        </Card>
      ))}

      {cfg.blocks?.map((b, i) => <DataBlock key={i} block={b} />)}

      <Card className="battle-steps" color="var(--gold)" background="rgba(30,25,12,0.97)" style={{ borderWidth: 2 }}>
        <Heading color="var(--gold)">🎯 {cfg.steps_title || 'Co masz zrobić'}</Heading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(cfg.steps || []).map((s, i) => (
            <div key={i} style={{ ...large, fontWeight: 700, opacity: s.offline ? 0.8 : 1 }}>
              {s.offline && (
                <span style={{ fontFamily: PIXEL, fontSize: 11, lineHeight: 1.8, color: 'var(--accent2)', border: '1px solid var(--accent2)', padding: '2px 6px', marginRight: 6, verticalAlign: 'middle', display: 'inline-block' }}>
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
          <Heading color="var(--green)">↩ Twój prompt z {cfg.related_code}</Heading>
          <div style={{ ...large, whiteSpace: 'pre-wrap', fontWeight: 500, maxHeight: '12rem', overflowY: 'auto' }}>{relatedPrompt}</div>
          <button onClick={() => onInsert(relatedPrompt)} className="chip-button" style={{ marginTop: 8, borderColor: 'var(--green)', color: 'var(--green)' }}>
            ✏️ Wstaw jako punkt wyjścia
          </button>
        </Card>
      )}
    </>
  );
}

function Checklist({ items }) {
  const [checked, setChecked] = useState({});
  return (
    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((it, i) => (
        <li key={i}>
          <label className="check-row" style={{ ...large, display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', color: checked[i] ? '#b9f5d6' : 'var(--white)' }}>
            <input
              type="checkbox"
              checked={!!checked[i]}
              onChange={e => setChecked(c => ({ ...c, [i]: e.target.checked }))}
              className="check-box"
            />
            <span>{it}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

// Prawa kolumna: lista kontrolna zawsze rozwinięta, reszta pomocy zwinięta
export function ExerciseHelp({ level }) {
  const cfg = level.config;
  const checklist = cfg.remember?.length > 0;
  return (
    <>
      <Card className="battle-remember" color="rgba(79,247,160,0.6)" background="rgba(8,30,22,0.96)" style={{ borderWidth: 2 }}>
        <Heading color="var(--green)">{checklist ? '✅ Nie zapomnij o:' : '✅ Za co jest strefa zielona'}</Heading>
        <Checklist key={level.id} items={checklist ? cfg.remember : cfg.zones.green} />
      </Card>

      {cfg.hints?.length > 0 && (
        <Fold title="💡 Ściąga" color="var(--gold)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cfg.hints.map(h => (
              <div key={h.label} style={body}>
                <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{h.label}:</span> {h.text}
              </div>
            ))}
          </div>
        </Fold>
      )}

      <Fold title={checklist ? '✅ Za co jest strefa zielona' : '⚠ Kiedy strefa żółta i czerwona'} color="var(--green)">
        {checklist && <div style={{ ...body, marginBottom: 12 }}>Wszystko z listy „Nie zapomnij o…”.</div>}
        <div>
          <div style={{ ...body, color: 'var(--gold)', marginBottom: 4 }}>⚠ Żółta, gdy:</div>
          <Bullets items={cfg.zones.yellow} color="#f3e3b0" />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ ...body, color: '#ff8a8a', marginBottom: 4 }}>❌ Czerwona, gdy:</div>
          <Bullets items={cfg.zones.red} color="#ffc4c4" />
        </div>
      </Fold>

      {cfg.bonus && (
        <Fold title={`⭐ Bonus +${cfg.bonus.xp} XP`} color="var(--gold)">
          {cfg.bonus.hidden ? (
            <div style={{ ...body, color: 'var(--muted)' }}>{cfg.bonus.hidden}</div>
          ) : (
            <>
              {cfg.bonus.rule && <div style={{ ...body, color: 'var(--muted)', marginBottom: 6 }}>{cfg.bonus.rule}</div>}
              <Bullets items={cfg.bonus.items} color="#f3e3b0" marker="★" />
            </>
          )}
        </Fold>
      )}
    </>
  );
}

// children (wskazówki) stoją zaraz pod strefą, przed listą kryteriów — muszą być widoczne bez przewijania
export function ZoneResult({ result, level, saved, pending = false, children }) {
  const z = pending ? { ...ZONES.green, sub: 'dobry prompt — teraz odpowiedz AI na pytania' } : ZONES[result.zone] || ZONES.yellow;
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
            <div style={{ fontFamily: PIXEL, fontSize: 12, lineHeight: 1.5, color: xpGained > 0 ? 'var(--gold)' : 'var(--muted)' }}>
              {pending ? 'XP po odpowiedzi' : !saved ? '…' : xpGained > 0 ? `+${xpGained} XP` : '+0 XP'}
            </div>
            <div style={{ ...body, color: 'var(--muted)', marginTop: 4 }}>
              {saved?.practice && !xpGained ? 'masz już lepszy wynik' : result.zone === 'green' ? '' : 'XP dopiero za zieloną — wyślij nowy prompt'}
            </div>
          </div>
        </div>
        {result.zone === 'green' && bonusXp > 0 && (
          <div style={{ marginTop: 10, ...body, color: result.bonus ? 'var(--gold)' : 'var(--muted)' }}>
            {result.bonus ? `⭐ BONUS +${bonusXp} XP` : '☆ Bonus nie tym razem'}{result.bonus_powod ? ` — ${result.bonus_powod}` : ''}
          </div>
        )}
        {result.zone === 'yellow' && result.co_poprawic && (
          <div style={{ marginTop: 10, ...body, fontSize: 17, color: '#f3e3b0' }}>
            Blisko! Popraw jedną rzecz: {result.co_poprawic}
          </div>
        )}
        {result.zone !== 'green' && (
          <div style={{ marginTop: 10, ...body, color: '#cfd3ff' }}>
            {result.zone === 'yellow'
              ? 'Żółta jeszcze nie zalicza ćwiczenia. Dopisz brakującą rzecz i wyślij prompt jeszcze raz — dziś nie tracisz życia.'
              : 'Ćwiczenie trwa, dopóki nie zdobędziesz zielonej. Przeczytaj wskazówki i wyślij nowy, kompletny prompt — każda próba jest oceniana od zera. Dziś nie tracisz życia.'}
          </div>
        )}
      </div>

      {result.redZoneDetected?.length > 0 && (
        <Card color="var(--red)" background="rgba(247,79,79,0.1)">
          <Label color="var(--red)">🚫 PROMPT NIE ZOSTAŁ WYSŁANY DO AI</Label>
          <div style={body}>Wykryto dane z czerwonej strefy: <b style={{ color: '#ff9999' }}>{result.redZoneDetected.join(', ')}</b>. W prawdziwej pracy właśnie w tym momencie dane wyciekłyby do zewnętrznego dostawcy.</div>
        </Card>
      )}

      {children}

      {!result.redZoneDetected?.length && (
        <Card color="rgba(255,255,255,0.12)" background="rgba(10,10,26,0.95)">
          <Label>📋 KRYTERIA STREFY ZIELONEJ</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {green.map((c, i) => {
              const ok = result.spelnione?.includes(i + 1);
              return (
                <div key={i} style={{ ...body, display: 'flex', gap: 8, color: ok ? 'var(--white)' : '#ffc4c4', animation: `pop-in 0.3s ease-out ${0.05 * i}s both` }}>
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

const EXAMPLE_TAGS = {
  ROLA:           { color: 'var(--accent)',  bg: 'rgba(79,142,247,0.14)' },
  KONTEKST:       { color: 'var(--accent2)', bg: 'rgba(247,79,142,0.14)' },
  ZADANIE:        { color: 'var(--gold)',    bg: 'rgba(247,201,79,0.14)' },
  ZABEZPIECZENIE: { color: 'var(--red)',     bg: 'rgba(247,79,79,0.14)' },
  FORMAT:         { color: 'var(--green)',   bg: 'rgba(79,247,160,0.14)' },
};

// Po 3 nieudanych próbach: gotowy prompt dla innego scenariusza, żeby nie dało się go skopiować 1:1
export function OtherExample({ example, folded = false, hideLabel = false }) {
  if (!example?.lines?.length && !example?.text) return null;
  if (folded) {
    return (
      <Fold title="🧩 Przykład z innej sytuacji" color="var(--gold)">
        <OtherExample example={example} hideLabel />
      </Fold>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
      <Card color="var(--gold)" background="rgba(247,201,79,0.06)">
        {!hideLabel && <Label color="var(--gold)">🧩 PRZYKŁAD Z INNEJ SYTUACJI</Label>}
        {example.situation && <div style={{ ...large, color: 'var(--muted)', marginBottom: 8 }}>{example.situation}</div>}
        {example.text && <div style={{ ...large, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{example.text}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(example.lines || []).map((line, i) => {
            const tag = EXAMPLE_TAGS[line.tag];
            if (!tag) return <div key={i} style={{ ...body, color: 'var(--muted)' }}>{line.text}</div>;
            return (
              <div key={i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 10px', borderLeft: `3px solid ${tag.color}`, paddingLeft: 10 }}>
                <span style={{ fontFamily: PIXEL, fontSize: 10, lineHeight: 1.6, color: tag.color, background: tag.bg, border: `1px solid ${tag.color}`, padding: '2px 6px', borderRadius: 2, flexShrink: 0 }}>
                  {line.tag}
                </span>
                <span style={{ ...body, fontWeight: 500, flex: '1 1 14rem' }}>{line.text}</span>
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{ ...body, fontSize: 17, fontWeight: 700, color: '#f3e3b0' }}>
        👉 Zrób swój prompt tak samo, ale dla swojego zadania.
      </div>
    </div>
  );
}

// Po 5 nieudanych próbach: wzorzec + zaliczenie za 50% XP, bez bonusu
export function SkipOffer({ attempts, xpReward, state, onSkip, next }) {
  const half = Math.round(xpReward * 0.5);
  if (state?.done) {
    return (
      <Card color="var(--green)" background="rgba(79,247,160,0.08)">
        <Label color="var(--green)">✅ ĆWICZENIE ZALICZONE ZE WZORCEM</Label>
        <div style={body}>
          {state.xpGained > 0 ? `+${state.xpGained} XP` : '+0 XP'} (połowa nagrody, bez bonusu). Przeczytaj spokojnie wzorcowy prompt i porównaj go ze swoim — potem przejdź dalej.
        </div>
        {next && (
          <button onClick={next.onClick} className="pixel-button btn-primary" style={{ fontSize: 11, padding: '12px 10px', width: '100%', marginTop: 10 }}>
            {next.label}
          </button>
        )}
      </Card>
    );
  }
  return (
    <Card color="rgba(79,142,247,0.6)" background="rgba(79,142,247,0.08)">
      <Label color="var(--accent)">🤝 GOTOWY WZORZEC</Label>
      <div style={{ ...body, marginBottom: 10 }}>
        To już {attempts}. próba — świetnie, że się nie poddajesz! Możesz zobaczyć wzorcowy prompt i przejść do kolejnego ćwiczenia.
        Ćwiczenie zostanie zaliczone za {half} XP (połowa nagrody, bez bonusu).
      </div>
      <button onClick={onSkip} disabled={state?.saving} className="pixel-button btn-primary" style={{ fontSize: 11, padding: '12px 10px', width: '100%' }}>
        {state?.saving ? 'ZAPISUJĘ…' : '📘 Pokaż wzorzec i przejdź dalej'}
      </button>
      {state?.error && <div style={{ ...body, color: 'var(--red)', marginTop: 8 }}>{state.error}</div>}
    </Card>
  );
}

export function ReferencePrompt({ reference, unlocked, reason, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!reference) return null;
  if (!unlocked) {
    return (
      <div style={{ ...body, color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 4, padding: '8px 12px' }}>
        🔒 Wzorcowy prompt zobaczysz po zaliczeniu ćwiczenia (strefa zielona) albo po 5 próbach.
      </div>
    );
  }
  return (
    <Card color="rgba(79,142,247,0.5)" background="rgba(79,142,247,0.06)">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <Label color="var(--accent)" style={{ marginBottom: 0 }}>📘 WZORCOWY PROMPT</Label>
        <button onClick={() => setOpen(o => !o)} className="chip-button">{open ? '▲ Zwiń' : '▼ Pokaż'}</button>
      </div>
      {reason && <div style={{ ...body, color: 'var(--muted)', marginTop: 6 }}>{reason}</div>}
      {open && (
        <div style={{ marginTop: 10 }}>
          {reference.situation && <div style={{ ...body, color: 'var(--muted)', marginBottom: 6 }}>{reference.situation}</div>}
          <div style={{ ...body, fontWeight: 500, whiteSpace: 'pre-wrap' }}>{reference.prompt}</div>
        </div>
      )}
    </Card>
  );
}

const chatText = { fontFamily: TEXT, fontSize: 18, lineHeight: 1.55, fontWeight: 500, color: 'var(--white)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' };

function ChatBubble({ from, label, children }) {
  const mine = from !== 'ai';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '92%', minWidth: 0, padding: '10px 14px', borderRadius: 14,
        borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
        background: mine ? 'rgba(79,142,247,0.18)' : 'rgba(79,247,160,0.08)',
        border: `1px solid ${mine ? 'rgba(79,142,247,0.55)' : 'rgba(79,247,160,0.45)'}`,
      }}>
        <div style={{ fontFamily: TEXT, fontSize: 17, fontWeight: 700, color: mine ? 'var(--accent)' : 'var(--green)', marginBottom: 4 }}>
          {label || (mine ? 'Ty' : '🤖 AI')}
        </div>
        {mine ? <div style={chatText}>{children}</div> : <Markdown text={children} />}
      </div>
    </div>
  );
}

// Podgląd jako rozmowa: prompt → odpowiedź AI → (opcjonalnie) odpowiedzi uczestnika i kolejne odpowiedzi AI
export function ConversationChat({
  title, description, messages, canReply, replyLabel, replyNote, reply, onReplyChange, onSend, sending, error,
  replyRedZone, endNote, saveFailed, onSave, done, doneText, onFinish, finishLabel,
}) {
  return (
    <Card color="rgba(79,142,247,0.35)" background="rgba(10,10,26,0.95)" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {title && (
        <div>
          <div style={{ fontFamily: PIXEL, fontSize: 10, color: 'var(--accent)', lineHeight: 1.6 }}>🤖 {title}</div>
          {description && <div style={{ ...body, color: 'var(--muted)', marginTop: 4 }}>{description}</div>}
        </div>
      )}
      {messages.map((m, i) => <ChatBubble key={i} from={m.from} label={m.label}>{m.text}</ChatBubble>)}
      {canReply && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="conversation-reply" style={{ ...chatText, fontWeight: 700, color: '#f3e3b0' }}>{replyLabel}</label>
          {replyNote && <div style={{ ...body, color: 'var(--muted)', marginTop: -4 }}>{replyNote}</div>}
          <textarea
            id="conversation-reply"
            value={reply}
            onChange={e => onReplyChange(e.target.value)}
            readOnly={sending}
            rows={3}
            className="prompt-input"
            style={{ fontSize: 18, opacity: sending ? 0.6 : 1 }}
            onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onSend(); } }}
          />
          {replyRedZone?.length > 0 && (
            <div role="alert" style={{ ...chatText, fontSize: 17, fontWeight: 700, color: '#ff9999' }}>
              🚫 To wygląda na dane z czerwonej strefy: {replyRedZone.join(', ')}. Zamień je na placeholder.
            </div>
          )}
          {error && <div role="alert" style={{ ...chatText, fontSize: 17, fontWeight: 700, color: '#ff9999' }}>{error}</div>}
          <button onClick={onSend} disabled={sending || !reply.trim()} className="pixel-button btn-primary" style={{ fontSize: 12, padding: '14px 10px' }}>
            {sending ? 'AI pisze…' : '✉️ Wyślij'}
          </button>
        </div>
      )}

      {!canReply && error && !saveFailed && (
        <div role="alert" style={{ ...chatText, fontSize: 17, fontWeight: 700, color: '#ff9999' }}>{error}</div>
      )}

      {saveFailed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {error && <div role="alert" style={{ ...chatText, fontSize: 17, fontWeight: 700, color: '#ff9999' }}>{error}</div>}
          <button onClick={onSave} disabled={sending} className="pixel-button btn-primary" style={{ fontSize: 12, padding: '14px 10px' }}>
            {sending ? 'Zapisuję…' : '💾 Zapisz zaliczenie'}
          </button>
        </div>
      )}

      {endNote && <div style={{ ...chatText, color: 'var(--muted)', fontWeight: 600 }}>{endNote}</div>}

      {done && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ ...chatText, fontWeight: 700, color: 'var(--green)' }}>{doneText}</div>
          <button onClick={onFinish} className="pixel-button btn-primary" style={{ fontSize: 12, padding: '14px 10px' }}>
            {finishLabel}
          </button>
        </div>
      )}
    </Card>
  );
}

const KEYS = ['A', 'B', 'C'];

function xpForTries(n) {
  if (n <= 1) return 10;
  if (n === 2) return 5;
  return 0;
}

// Zła odpowiedź miga na czerwono przez sekundę (quiz Dnia 3, wybór narzędzia i lista kontrolna Dnia 4)
function useFlash() {
  const [flash, setFlash] = useState(null);
  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(cur => (cur === flash ? null : cur)), 1000);
    return () => clearTimeout(t);
  }, [flash]);
  return [flash, setFlash];
}

function choiceStyle({ flash, wrong, green }) {
  if (flash) return { borderColor: 'var(--red)', color: '#ffd0d0', background: 'rgba(247,79,79,0.45)', opacity: 1 };
  if (wrong) return { borderColor: 'rgba(247,79,79,0.35)', color: 'var(--muted)', background: 'transparent', opacity: 0.45 };
  if (green) return { borderColor: 'var(--green)', color: 'var(--green)', background: 'rgba(79,247,160,0.12)', opacity: 1 };
  return { borderColor: 'var(--border)', color: 'var(--white)', background: 'transparent', opacity: 1 };
}

export function QuizPanel({ questions, onFinish, saving }) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState(() => new Set());
  const [flash, setFlash] = useFlash();
  const [ok, setOk] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [first, setFirst] = useState(null);
  const [history, setHistory] = useState([]);
  const finished = history.length === questions.length;
  const q = questions[index];
  const firstCorrect = history.filter((row, i) => row.first === questions[i].correct).length;
  const totalXp = history.reduce((sum, row) => sum + row.xp, 0);

  function choose(key) {
    if (saving || ok || wrong.has(key) || flash) return;
    const n = attempts + 1;
    setAttempts(n);
    if (!first) setFirst(key);
    if (key !== q.correct) {
      setWrong(prev => new Set(prev).add(key));
      setFlash(key);
      return;
    }
    setOk(true);
  }

  function next() {
    if (!ok) return;
    const row = { first, tries: attempts, xp: xpForTries(attempts) };
    const nextHist = [...history, row];
    setHistory(nextHist);
    if (nextHist.length === questions.length) {
      onFinish(nextHist);
      return;
    }
    setIndex(nextHist.length);
    setWrong(new Set());
    setFlash(null);
    setOk(false);
    setAttempts(0);
    setFirst(null);
  }

  if (finished) {
    return (
      <Card color="rgba(79,247,160,0.45)" background="rgba(8,30,22,0.96)">
        <Heading color="var(--green)">Wynik quizu</Heading>
        <div style={{ ...large, marginBottom: 6 }}>
          Za pierwszym razem: <b>{firstCorrect}</b> z {questions.length}
        </div>
        <div style={{ ...large }}>
          Suma XP: <b>{totalXp}</b>
        </div>
      </Card>
    );
  }

  return (
    <Card color="rgba(79,142,247,0.45)">
      <div style={{ fontFamily: PIXEL, fontSize: 11, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>
        PYTANIE {index + 1} / {questions.length}
      </div>
      <Heading color="var(--accent)">{q.q}</Heading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {KEYS.map(k => {
          const isWrong = wrong.has(k);
          const isFlash = flash === k;
          const isGreen = ok && k === q.correct;
          return (
            <button
              key={k}
              type="button"
              onClick={() => choose(k)}
              disabled={saving || ok || isWrong || !!flash}
              className="chip-button"
              style={{
                justifyContent: 'flex-start', textAlign: 'left', minHeight: 48, fontSize: 17,
                ...choiceStyle({ flash: isFlash, wrong: isWrong, green: isGreen }),
                transition: 'background 0.15s ease, opacity 0.2s ease',
              }}
            >
              <b style={{ marginRight: 8 }}>{k}.</b> {q.options[k]}
            </button>
          );
        })}
      </div>
      {(flash || wrong.size > 0) && !ok && (
        <div style={{ ...large, color: '#ffb0b0', marginTop: 12 }}>
          Niestety nie. Spróbuj jeszcze raz.
        </div>
      )}
      {ok && (
        <div style={{ marginTop: 12 }}>
          <div style={{ ...large, color: 'var(--green)', marginBottom: 10 }}>
            Dobrze! <span style={{ color: 'var(--gold)' }}>+{xpForTries(attempts)} XP</span>
          </div>
          <button onClick={next} disabled={saving} className="pixel-button btn-primary" style={{ fontSize: 12, padding: '12px 10px' }}>
            {index + 1 === questions.length ? (saving ? 'Zapisuję…' : 'Zakończ quiz') : 'Dalej'}
          </button>
        </div>
      )}
    </Card>
  );
}

/* ===== DZIEŃ 4 · „Narzędzie + polecenie” ===== */

const compact = { fontFamily: TEXT, fontSize: 16, lineHeight: 1.4, fontWeight: 600, color: 'var(--white)', overflowWrap: 'anywhere' };

// Lewa kolumna: zwarta sytuacja, żeby razem z przyciskami i polem mieściła się na 1366×768
export function ToolBrief({ cfg, goal, task }) {
  return (
    <>
      <Card style={{ padding: '5px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={compact}><b style={{ color: 'var(--accent)' }}>📋 Sytuacja:</b> {cfg.situation}</div>
        {cfg.blocks?.map((b, i) => (
          <div
            key={i}
            style={b.mail
              ? { ...compact, fontWeight: 500, fontStyle: 'italic', color: '#f3e3b0', borderLeft: '3px solid var(--gold)', background: 'rgba(247,201,79,0.06)', padding: '4px 10px' }
              : compact}
          >
            {b.title && <b style={{ color: 'var(--gold)' }}>{b.title}: </b>}{b.text}
          </div>
        ))}
      </Card>
      {(goal || task) && (
        <section
          aria-label="Twoje zadanie"
          style={{ border: '2px solid var(--gold)', borderRadius: 4, background: 'rgba(247,201,79,0.08)', padding: '3px 12px', display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}
        >
          <div style={{ ...compact, fontWeight: 700, color: 'var(--gold)' }}>🎯 Twoje zadanie</div>
          {goal && <div style={compact}><b style={{ color: 'var(--gold)' }}>Cel:</b> {goal}</div>}
          {task && <div style={compact}><b style={{ color: 'var(--gold)' }}>Co zrobić:</b> {task}</div>}
        </section>
      )}
    </>
  );
}

const stepTitle = { fontFamily: TEXT, fontSize: 17, fontWeight: 700, lineHeight: 1.3, color: 'var(--gold)' };

// Krok 1: ten sam mechanizm co quiz Dnia 3 — zła odpowiedź miga na czerwono, wyszarza się i pokazuje podpowiedź
export function ToolPicker({ tool, solved, initialWrong = [], onWrong, onSolve, disabled }) {
  const [wrong, setWrong] = useState(() => new Set(initialWrong));
  const [flash, setFlash] = useFlash();
  const [hint, setHint] = useState(null);

  function choose(id) {
    if (disabled || solved || wrong.has(id) || flash) return;
    if (tool.accepted.includes(id)) {
      onSolve({ tool: id, tries: wrong.size + 1 });
      return;
    }
    const next = new Set(wrong).add(id);
    setWrong(next);
    setFlash(id);
    setHint(tool.hints?.[id] || null);
    onWrong?.([...next]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={stepTitle}>Krok 1 · Wybierz narzędzie</div>
      <div className="tool-grid" role="group" aria-label="Wybierz narzędzie">
        {TOOLS.map(t => {
          const isWrong = wrong.has(t.id);
          const isGreen = solved?.tool === t.id;
          const look = choiceStyle({ flash: flash === t.id, wrong: isWrong, green: isGreen });
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => choose(t.id)}
              disabled={disabled || !!solved || isWrong || !!flash}
              aria-pressed={isGreen}
              className="chip-button"
              style={{
                ...look,
                opacity: solved && !isGreen ? 0.45 : look.opacity,
                transition: 'background 0.15s ease, opacity 0.2s ease',
              }}
            >
              {isGreen ? '✓ ' : ''}{t.label}
            </button>
          );
        })}
      </div>
      {!solved && hint && (
        <div role="alert" style={{ ...compact, color: '#ffb0b0' }}>✗ {hint}</div>
      )}
      {solved && (
        <div style={{ ...compact, color: '#b9f5d6' }}><b style={{ color: 'var(--green)' }}>✓ Dlaczego:</b> {tool.why}</div>
      )}
    </div>
  );
}

export function FreeAccountBar() {
  return (
    <div role="note" style={{ ...compact, fontWeight: 700, color: '#ffd8a8', background: 'rgba(247,150,79,0.12)', border: '1px solid #f7964f', borderRadius: 4, padding: '6px 10px' }}>
      ⚠ {FREE_ACCOUNT_NOTE}
    </div>
  );
}

// 4.2, krok 2: wybór wielokrotny; złe zaznaczenia migają na czerwono jak w quizie
export function ToolChecks({ checks, onDone, saving, done }) {
  const [selected, setSelected] = useState(() => new Set());
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useFlash();
  const [hint, setHint] = useState(false);

  function toggle(i) {
    if (saving || done || flash) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function check() {
    if (!selected.size || saving || done || flash) return;
    const n = tries + 1;
    setTries(n);
    if (checks.options.every((o, i) => o.correct === selected.has(i))) {
      setHint(false);
      onDone(n);
      return;
    }
    setHint(true);
    const wrongPicked = [...selected].filter(i => !checks.options[i].correct);
    if (wrongPicked.length) setFlash(wrongPicked);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={stepTitle}>Krok 2 · {checks.question}</div>
      <div className="tool-checks" role="group" aria-label={checks.question}>
        {checks.options.map((o, i) => {
          const isFlash = Array.isArray(flash) && flash.includes(i);
          const isGreen = done && o.correct;
          const on = done ? o.correct : selected.has(i);
          return (
            <button
              key={i}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(i)}
              disabled={saving || done}
              className="chip-button"
              style={{
                justifyContent: 'flex-start', textAlign: 'left', display: 'flex', gap: 8, alignItems: 'center',
                ...choiceStyle({ flash: isFlash, green: isGreen }),
                ...(on && !isFlash && !isGreen ? { borderColor: 'var(--accent)', background: 'rgba(79,142,247,0.18)' } : {}),
                opacity: done && !o.correct ? 0.45 : 1,
              }}
            >
              <span aria-hidden style={{ fontSize: 18, flexShrink: 0 }}>{on ? '☑' : '☐'}</span>
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>
      {hint && !done && <div role="alert" style={{ ...compact, color: '#ffb0b0' }}>✗ {checks.hint}</div>}
      {!done && (
        <button onClick={check} disabled={saving || !selected.size || !!flash} className="pixel-button btn-primary attack-button">
          {saving ? 'ZAPISUJĘ…' : '✔ SPRAWDŹ'}
        </button>
      )}
    </div>
  );
}

// Prawa kolumna przed oceną: elementy dobrego polecenia (jak lista „Nie zapomnij o” w Dniu 2)
export function ToolCriteria({ criteria }) {
  return (
    <Card className="battle-remember" color="rgba(79,247,160,0.6)" background="rgba(8,30,22,0.96)" style={{ borderWidth: 2 }}>
      <Heading color="var(--green)">✅ Co ma zawierać polecenie</Heading>
      <Bullets items={criteria.map((c, i) => `${i + 1}) ${c}`)} marker="" style={large} />
      <div style={{ ...body, color: 'var(--muted)', marginTop: 8 }}>Zielona: co najmniej 2 z 3. Żółta: 1.</div>
    </Card>
  );
}

const TOOL_ZONE_SUB = {
  green: 'zaliczone',
  yellow: 'zaliczone — dopisz brakującą rzecz i wejdź na zieloną',
  red: 'niezaliczone — popraw polecenie',
};

// Prawa kolumna po ocenie: strefa, XP z obu kroków, podpowiedź i podgląd odpowiedzi narzędzia
export function ToolResult({ result, criteria, saved, lastZone }) {
  const z = ZONES[result.zone] || ZONES.yellow;
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
            <div style={{ ...body, color: 'var(--muted)', marginTop: 4 }}>{TOOL_ZONE_SUB[result.zone]}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: PIXEL, fontSize: 12, lineHeight: 1.5, color: xpGained > 0 ? 'var(--gold)' : 'var(--muted)' }}>
              {!saved ? '…' : xpGained > 0 ? `+${xpGained} XP` : '+0 XP'}
            </div>
            <div style={{ ...body, color: 'var(--muted)', marginTop: 4 }}>
              Krok 1: {result.step1} · Krok 2: {result.step2} = {result.score} XP
            </div>
            {saved?.practice && !xpGained && <div style={{ ...body, color: 'var(--muted)' }}>liczy się najlepsza ocena</div>}
          </div>
        </div>
        {lastZone && ZONES[lastZone] && (
          <div style={{ ...body, color: 'var(--muted)', marginTop: 8 }}>
            Poprzednio: <span style={{ color: ZONES[lastZone].color }}>{ZONES[lastZone].label.toLowerCase()}</span> → teraz: <span style={{ color: z.color }}>{z.label.toLowerCase()}</span>
          </div>
        )}
        {result.co_poprawic && (
          <div style={{ ...large, marginTop: 10, color: result.zone === 'green' ? '#cfd3ff' : '#f3e3b0' }}>
            {result.zone === 'green' ? '💡 Można jeszcze: ' : '👉 Podpowiedź: '}{result.co_poprawic}
          </div>
        )}
      </div>

      {result.redZoneDetected?.length > 0 && (
        <Card color="var(--red)" background="rgba(247,79,79,0.1)">
          <Label color="var(--red)">🚫 POLECENIE NIE ZOSTAŁO WYSŁANE</Label>
          <div style={body}>W poleceniu są dane, które nie mogą trafić do darmowego narzędzia: <b style={{ color: '#ff9999' }}>{result.redZoneDetected.join(', ')}</b>.</div>
        </Card>
      )}

      {result.co_poszlo_dobrze && (
        <Card color="rgba(79,247,160,0.4)" background="rgba(10,10,26,0.95)">
          <Label color="var(--green)">✅ CO POSZŁO DOBRZE</Label>
          <div style={body}>{result.co_poszlo_dobrze}</div>
        </Card>
      )}

      {criteria?.length > 0 && !result.redZoneDetected?.length && (
        <Card color="rgba(255,255,255,0.12)" background="rgba(10,10,26,0.95)">
          <Label>📋 CO MA ZAWIERAĆ POLECENIE</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {criteria.map((c, i) => {
              const ok = result.spelnione?.includes(i + 1);
              return (
                <div key={i} style={{ ...body, display: 'flex', gap: 8, color: ok ? 'var(--white)' : '#ffc4c4' }}>
                  <span style={{ flexShrink: 0, color: ok ? 'var(--green)' : 'var(--red)' }}>{ok ? '✓' : '✗'}</span>
                  <span>{c}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {result.aiResponse && (
        <Card color="rgba(79,142,247,0.35)" background="rgba(10,10,26,0.95)">
          <Label color="var(--accent)">🤖 PODGLĄD: CO {toolLabel(result.tool).toUpperCase()} MNIEJ WIĘCEJ BY ODPOWIEDZIAŁ</Label>
          <div style={{ ...body, color: 'var(--muted)', marginTop: -4, marginBottom: 8 }}>To symulacja. Ocena dotyczy Twojego polecenia.</div>
          <Markdown text={result.aiResponse} />
        </Card>
      )}
    </>
  );
}
