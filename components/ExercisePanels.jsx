'use client';

import { useState } from 'react';
import Markdown from '@/components/Markdown';

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

async function copyText(text) {
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
