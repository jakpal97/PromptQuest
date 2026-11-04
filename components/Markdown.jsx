// Odpowiedzi AI w podglądzie: pogrubienia, listy, nagłówki i tabele jako elementy React (bez wstawiania HTML)

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

const base = { fontFamily: FONT, fontSize: 17, lineHeight: 1.6, fontWeight: 400, color: 'var(--white)', overflowWrap: 'anywhere' };

const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const BULLET = /^(\s*)[-*+•]\s+(.*)$/;
const NUMBERED = /^(\s*)(\d+)[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const FENCE = /^\s*```/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function inline(text, keyPrefix) {
  const parts = [];
  const pattern = /(\*\*|__)(.+?)\1|`([^`]+)`|(?<![\w*])\*(?!\s)([^*\n]+?)\*(?![\w*])/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${match.index}`;
    if (match[2] !== undefined) parts.push(<strong key={key} style={{ fontWeight: 700 }}>{inline(match[2], key)}</strong>);
    else if (match[3] !== undefined) parts.push(<code key={key} style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 16, background: 'rgba(255,255,255,0.08)', padding: '0 4px', borderRadius: 3 }}>{match[3]}</code>);
    else parts.push(<em key={key}>{inline(match[4], key)}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function cells(row) {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

function parseBlocks(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (FENCE.test(line)) {
      const code = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++]);
      i++;
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) { blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] }); i++; continue; }
    if (RULE.test(line)) { blocks.push({ type: 'rule' }); i++; continue; }
    if (TABLE_ROW.test(line) && TABLE_SEPARATOR.test(lines[i + 1] || '')) {
      const head = cells(line);
      const rows = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push({ type: 'table', head, rows });
      continue;
    }
    if (BULLET.test(line) || NUMBERED.test(line)) {
      const items = [];
      while (i < lines.length) {
        const bullet = lines[i].match(BULLET);
        const numbered = lines[i].match(NUMBERED);
        if (bullet) items.push({ depth: Math.floor(bullet[1].length / 2), text: bullet[2] });
        else if (numbered) items.push({ depth: Math.floor(numbered[1].length / 2), number: numbered[2], text: numbered[3] });
        else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) items.at(-1).text += `\n${lines[i].trim()}`;
        else break;
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    if (QUOTE.test(line)) {
      const quoted = [];
      while (i < lines.length && QUOTE.test(lines[i])) quoted.push(lines[i++].match(QUOTE)[1]);
      blocks.push({ type: 'quote', text: quoted.join('\n') });
      continue;
    }
    const paragraph = [];
    while (
      i < lines.length && lines[i].trim() && !FENCE.test(lines[i]) && !HEADING.test(lines[i]) && !RULE.test(lines[i])
      && !BULLET.test(lines[i]) && !NUMBERED.test(lines[i]) && !QUOTE.test(lines[i])
      && !(TABLE_ROW.test(lines[i]) && TABLE_SEPARATOR.test(lines[i + 1] || ''))
    ) paragraph.push(lines[i++]);
    blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
  }
  return blocks;
}

function withBreaks(text, key) {
  return text.split('\n').flatMap((line, n) => (n ? [<br key={`${key}-br${n}`} />, ...inline(line, `${key}-${n}`)] : inline(line, `${key}-${n}`)));
}

const cell = { border: '1px solid rgba(255,255,255,0.2)', padding: '6px 8px', textAlign: 'left', verticalAlign: 'top' };

export default function Markdown({ text, style }) {
  const blocks = parseBlocks(text || '');
  return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      {blocks.map((block, b) => {
        const key = `b${b}`;
        switch (block.type) {
          case 'heading':
            return <div key={key} role="heading" aria-level={block.level} style={{ fontSize: block.level <= 2 ? 20 : 18, fontWeight: 700, lineHeight: 1.35, marginTop: b ? 4 : 0 }}>{inline(block.text, key)}</div>;
          case 'rule':
            return <hr key={key} style={{ border: 0, borderTop: '1px solid rgba(255,255,255,0.18)', margin: '2px 0', width: '100%' }} />;
          case 'code':
            return <pre key={key} style={{ margin: 0, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 16, whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: 4 }}>{block.text}</pre>;
          case 'quote':
            return <div key={key} style={{ borderLeft: '3px solid rgba(255,255,255,0.3)', paddingLeft: 10, color: '#d6d8f0' }}>{withBreaks(block.text, key)}</div>;
          case 'table':
            return (
              <div key={key} style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 17 }}>
                  <thead>
                    <tr>{block.head.map((h, c) => <th key={c} style={{ ...cell, fontWeight: 700, background: 'rgba(255,255,255,0.06)' }}>{inline(h, `${key}h${c}`)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>{block.head.map((_, c) => <td key={c} style={cell}>{inline(row[c] || '', `${key}r${r}c${c}`)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'list':
            return (
              <div key={key} role="list" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {block.items.map((item, n) => (
                  <div key={n} role="listitem" style={{ display: 'flex', gap: 8, paddingLeft: item.depth * 20 }}>
                    <span aria-hidden style={{ flexShrink: 0, minWidth: item.number ? 22 : 12, fontWeight: item.number ? 700 : 400 }}>{item.number ? `${item.number}.` : '•'}</span>
                    <span>{withBreaks(item.text, `${key}i${n}`)}</span>
                  </div>
                ))}
              </div>
            );
          default:
            return <p key={key} style={{ margin: 0 }}>{withBreaks(block.text, key)}</p>;
        }
      })}
    </div>
  );
}
