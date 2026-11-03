import { getServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/session';
import { LEVEL_SELECT, applyPass, battlePassed } from '@/lib/progress-server';

// Trener ręcznie zalicza ćwiczenie uczestnikowi — pełne XP za ćwiczenie, bez bonusu
export async function POST(req) {
  try {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    const { targetPlayerId, levelId } = await req.json();
    if (!targetPlayerId || !levelId) return Response.json({ error: 'Brak danych' }, { status: 400 });

    const supabase = getServiceClient();
    const [{ data: player }, { data: level }, { data: battle }] = await Promise.all([
      supabase.from('players').select('*').eq('id', targetPlayerId).single(),
      supabase.from('levels').select(LEVEL_SELECT).eq('id', levelId).single(),
      supabase.from('battles').select('id, score, xp_earned, completed_via')
        .eq('player_id', targetPlayerId).eq('level_id', levelId).maybeSingle(),
    ]);

    if (!player) return Response.json({ error: 'Brak uczestnika' }, { status: 404 });
    if (!level) return Response.json({ error: 'Brak ćwiczenia' }, { status: 404 });
    if (battlePassed(battle, level)) return Response.json({ error: 'Ćwiczenie jest już zaliczone.' }, { status: 409 });

    const levelXp = level.xp_reward;
    const xpGained = Math.max(0, levelXp - (battle?.xp_earned ?? 0));
    const row = { completed_via: 'trainer', bonus: false, xp_earned: Math.max(levelXp, battle?.xp_earned ?? 0) };

    const { error } = battle
      ? await supabase.from('battles').update(row).eq('id', battle.id)
      : await supabase.from('battles').insert({
        ...row, player_id: targetPlayerId, level_id: levelId, score: 0, attempt_number: 0,
        prompt_used: '(zaliczone przez trenera)',
      });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const progress = await applyPass(supabase, player, level, xpGained);
    return Response.json({ success: true, xpGained, ...progress });
  } catch (err) {
    console.error('Mark passed error:', err);
    return Response.json({ error: 'Błąd serwera: ' + err.message }, { status: 500 });
  }
}
