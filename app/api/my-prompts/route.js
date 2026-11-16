import { getServiceClient } from '@/lib/supabase';
import { sessionPlayerId } from '@/lib/session';
import { battlePassed } from '@/lib/progress-server';
import { bypassesLocks } from '@/lib/progress';
import { bestPrompts, parseToolAttempt, toolLabel } from '@/lib/tools';

// „Moje polecenia” (Dzień 4): najlepiej ocenione (zielone/żółte) polecenie z każdego zadania (4.7: z każdej tury); ekran otwiera się po pierwszym zaliczonym zadaniu
export async function GET(req) {
  try {
    const playerId = await sessionPlayerId();
    if (!playerId) return Response.json({ error: 'Sesja wygasła — zaloguj się ponownie.', code: 'no_session' }, { status: 401 });
    const moduleId = new URL(req.url).searchParams.get('moduleId');
    if (!moduleId) return Response.json({ error: 'Brak modułu' }, { status: 400 });

    const supabase = getServiceClient();
    const [{ data: player }, { data: levels }] = await Promise.all([
      supabase.from('players').select('role').eq('id', playerId).maybeSingle(),
      supabase.from('levels').select('id, code, title, config, modules(title)')
        .eq('module_id', moduleId).eq('active', true).order('sort_order'),
    ]);
    const toolLevels = (levels || []).filter(l => l.config?.tool);
    if (!toolLevels.length) return Response.json({ error: 'Ten moduł nie ma zadań z narzędziem.' }, { status: 404 });

    const { data: battles } = await supabase.from('battles')
      .select('level_id, score, completed_via, prompt_used')
      .eq('player_id', playerId).in('level_id', toolLevels.map(l => l.id));
    const byLevel = Object.fromEntries((battles || []).map(b => [b.level_id, b]));

    const done = toolLevels.filter(l => battlePassed(byLevel[l.id], l)).length;
    const unlocked = done > 0 || bypassesLocks(player?.role);
    const moduleTitle = toolLevels[0].modules?.title || null;
    if (!unlocked) return Response.json({ unlocked: false, done, total: toolLevels.length, moduleTitle, items: [] });

    const items = toolLevels
      .filter(l => !l.config.tool.checks)
      .flatMap(l => bestPrompts(parseToolAttempt(byLevel[l.id]?.prompt_used)).map(best => ({
        key: `${l.id}-${best.turn || 0}`,
        levelId: l.id,
        code: l.code,
        title: best.turn ? `${l.title} · Tura ${best.turn}` : l.title,
        tool: toolLabel(best.tool),
        zone: best.zone,
        prompt: best.prompt,
      })));

    return Response.json({ unlocked: true, done, total: toolLevels.length, moduleTitle, items });
  } catch (err) {
    console.error('My prompts error:', err);
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
