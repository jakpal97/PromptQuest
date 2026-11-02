import { getServiceClient } from '@/lib/supabase';

function levelXpFor({ score, zone, bonus, xpReward, bonusXp }) {
  if (zone) {
    return zone === 'green' ? xpReward + (bonus ? bonusXp : 0) : 0;
  }
  return score >= 40 ? Math.max(5, Math.round((score / 100) * xpReward)) : 0;
}

export async function POST(req) {
  try {
    const {
      playerId, levelId, score, zone, bonus,
      co_poszlo_dobrze, co_poprawic, wskazowka, promptUsed,
    } = await req.json();

    if (!playerId || !levelId) {
      return Response.json({ error: 'Brak danych' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const [{ data: player }, { data: level }] = await Promise.all([
      supabase.from('players').select('*').eq('id', playerId).single(),
      supabase.from('levels').select('id, module_id, level_number, xp_reward, config, modules(day_number, total_levels, lives_enabled)').eq('id', levelId).single(),
    ]);

    if (!player) return Response.json({ error: 'Brak gracza' }, { status: 404 });
    if (!level) return Response.json({ error: 'Brak zadania' }, { status: 404 });

    const moduleInfo = level.modules;
    const livesEnabled = moduleInfo?.lives_enabled !== false;
    const totalLevels = moduleInfo?.total_levels || 6;
    const levelNumber = level.level_number;
    const validZone = ['green', 'yellow', 'red'].includes(zone) ? zone : null;
    // Ćwiczenia strefowe zalicza się wyłącznie strefą zieloną
    const zoneLevel = !!level.config?.zones;
    const passMark = zoneLevel ? 90 : 40;
    const passed = zoneLevel ? validZone === 'green' : score >= passMark;

    const { data: existingBattle } = await supabase
      .from('battles')
      .select('id, attempt_number, score, xp_earned')
      .eq('player_id', playerId)
      .eq('level_id', levelId)
      .maybeSingle();

    const attemptNumber = existingBattle ? (existingBattle.attempt_number + 1) : 1;
    const previousBest = existingBattle?.score ?? null;
    const previousXp = existingBattle?.xp_earned ?? 0;
    const alreadyPassed = previousBest !== null && previousBest >= passMark;
    const levelXp = levelXpFor({
      score, zone: validZone, bonus: !!bonus,
      xpReward: level.xp_reward, bonusXp: level.config?.bonus?.xp || 0,
    });
    // XP tylko za poprawę własnego rekordu — powtórki nie nabijają rankingu
    const xpGained = Math.max(0, levelXp - previousXp);

    const battleData = {
      player_id: playerId,
      level_id: levelId,
      prompt_used: promptUsed,
      score,
      zone: validZone,
      bonus: !!bonus,
      xp_earned: Math.max(levelXp, previousXp),
      co_poszlo_dobrze,
      co_poprawic,
      wskazowka,
      attempt_number: attemptNumber,
    };

    if (!existingBattle) {
      await supabase.from('battles').insert(battleData);
    } else if (score >= previousBest) {
      await supabase.from('battles').update(battleData).eq('id', existingBattle.id);
    } else {
      await supabase.from('battles').update({ attempt_number: attemptNumber }).eq('id', existingBattle.id);
    }

    const base = { success: true, xpGained, previousBest, attemptNumber, livesEnabled };

    // Powtórka zaliczonego levelu to trening — bez kar i bez awansu
    if (alreadyPassed) {
      const newTotalXp = player.total_xp + xpGained;
      if (xpGained > 0) {
        await supabase.from('players').update({ total_xp: newTotalXp }).eq('id', playerId);
      }
      return Response.json({ ...base, newTotalXp, newLives: player.current_lives, practice: true });
    }

    if (!passed) {
      if (!livesEnabled) {
        return Response.json({ ...base, newTotalXp: player.total_xp, newLives: player.current_lives });
      }

      const newLives = Math.max(0, player.current_lives - 1);
      if (newLives === 0) {
        const { data: moduleLevels } = await supabase.from('levels').select('id').eq('module_id', level.module_id);
        await supabase.from('battles')
          .delete()
          .eq('player_id', playerId)
          .in('level_id', moduleLevels?.map(l => l.id) || []);

        await supabase.from('players').update({ current_lives: 3, current_level_in_module: 1 }).eq('id', playerId);
        return Response.json({ ...base, gameOver: true, newLives: 3 });
      }

      await supabase.from('players').update({ current_lives: newLives }).eq('id', playerId);
      return Response.json({ ...base, newLives, newTotalXp: player.total_xp });
    }

    const newTotalXp = player.total_xp + xpGained;
    const isCurrentModule = moduleInfo?.day_number === player.current_module;

    if (levelNumber >= totalLevels && isCurrentModule) {
      const updates = { total_xp: newTotalXp, current_lives: 3, current_level_in_module: 1 };
      if (player.current_module < 4) updates.current_module = player.current_module + 1;
      await supabase.from('players').update(updates).eq('id', playerId);
      return Response.json({ ...base, moduleComplete: true, newTotalXp, newLives: 3 });
    }

    const updates = { total_xp: newTotalXp };
    if (isCurrentModule) {
      updates.current_level_in_module = Math.max(player.current_level_in_module, levelNumber + 1);
    }
    await supabase.from('players').update(updates).eq('id', playerId);

    return Response.json({ ...base, newTotalXp, newLives: player.current_lives });
  } catch (err) {
    console.error('Battle complete error:', err);
    return Response.json({ error: 'Błąd serwera: ' + err.message }, { status: 500 });
  }
}
