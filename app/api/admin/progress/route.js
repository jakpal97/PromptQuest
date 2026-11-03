import { getServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/session';

// Postęp uczestnika w ćwiczeniach danego dnia (domyślnie Dzień 1) — dla panelu trenera
export async function GET(req) {
  try {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');
    const day = Number(searchParams.get('day') || 1);
    if (!playerId) return Response.json({ error: 'Brak danych' }, { status: 400 });

    const supabase = getServiceClient();
    const { data: levels } = await supabase
      .from('levels')
      .select('id, code, title, sort_order, level_number, block, config, modules!inner(day_number)')
      .eq('modules.day_number', day)
      .order('sort_order')
      .order('level_number');

    const ids = levels?.map(l => l.id) || [];
    const { data: battles } = ids.length
      ? await supabase.from('battles')
        .select('level_id, score, zone, attempt_number, completed_via')
        .eq('player_id', playerId).in('level_id', ids)
      : { data: [] };

    const byLevel = Object.fromEntries((battles || []).map(b => [b.level_id, b]));
    return Response.json({
      exercises: (levels || []).map(l => {
        const b = byLevel[l.id];
        const passMark = l.config?.zones ? 90 : 40;
        return {
          id: l.id,
          code: l.code || null,
          label: l.config?.label || null,
          title: l.title || null,
          block: l.block || 1,
          attempts: b?.attempt_number || 0,
          zone: b?.zone || null,
          completedVia: b?.completed_via || null,
          passed: !!b && (!!b.completed_via || (b.score ?? 0) >= passMark),
        };
      }),
    });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
