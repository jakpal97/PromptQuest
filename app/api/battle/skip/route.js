import { getServiceClient } from '@/lib/supabase';
import { guardLevelAccess, sessionPlayerId } from '@/lib/session';
import { LEVEL_SELECT, SKIP_AFTER_ATTEMPTS, applyPass, battlePassed } from '@/lib/progress-server';

// „Pokaż wzorzec i przejdź dalej” — po 5 nieudanych próbach ćwiczenie liczy się jako zaliczone za 50% XP, bez bonusu
export async function POST(req) {
  try {
    const { levelId } = await req.json();
    if (!levelId) return Response.json({ error: 'Brak danych' }, { status: 400 });

    const playerId = await sessionPlayerId();
    const denied = await guardLevelAccess(playerId, levelId);
    if (denied) return denied;

    const supabase = getServiceClient();
    const [{ data: player }, { data: level }, { data: battle }] = await Promise.all([
      supabase.from('players').select('*').eq('id', playerId).single(),
      supabase.from('levels').select(LEVEL_SELECT).eq('id', levelId).single(),
      supabase.from('battles').select('id, attempt_number, score, xp_earned, completed_via')
        .eq('player_id', playerId).eq('level_id', levelId).maybeSingle(),
    ]);

    if (!player) return Response.json({ error: 'Brak gracza' }, { status: 404 });
    if (!level?.config?.zones) return Response.json({ error: 'To ćwiczenie nie ma tej opcji.' }, { status: 400 });
    if (battlePassed(battle, level)) return Response.json({ error: 'To ćwiczenie jest już zaliczone.' }, { status: 409 });
    if ((battle?.attempt_number ?? 0) < SKIP_AFTER_ATTEMPTS) {
      return Response.json({ error: `Wzorzec odblokuje się po ${SKIP_AFTER_ATTEMPTS} próbach.` }, { status: 403 });
    }

    const levelXp = Math.round(level.xp_reward * 0.5);
    const xpGained = Math.max(0, levelXp - (battle.xp_earned ?? 0));
    await supabase.from('battles').update({
      completed_via: 'reference',
      bonus: false,
      xp_earned: Math.max(levelXp, battle.xp_earned ?? 0),
    }).eq('id', battle.id);

    const progress = await applyPass(supabase, player, level, xpGained);
    return Response.json({ success: true, xpGained, completedVia: 'reference', ...progress });
  } catch (err) {
    console.error('Battle skip error:', err);
    return Response.json({ error: 'Błąd serwera: ' + err.message }, { status: 500 });
  }
}
