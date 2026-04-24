import { getServiceClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const {
      playerId, levelId, moduleId, score,
      co_poszlo_dobrze, co_poprawic, wskazowka, promptUsed,
      levelNumber, totalLevels, xpReward,
    } = await req.json();

    if (!playerId || !levelId) {
      return Response.json({ error: 'Brak danych' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Pobierz aktualny stan gracza
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (!player) return Response.json({ error: 'Brak gracza' }, { status: 404 });

    // Sprawdź czy już walczył (attempt_number)
    const { data: existingBattle } = await supabase
      .from('battles')
      .select('id, attempt_number')
      .eq('player_id', playerId)
      .eq('level_id', levelId)
      .single();

    const attemptNumber = existingBattle ? (existingBattle.attempt_number + 1) : 1;
    const xpEarned = Math.max(5, Math.round((score / 100) * xpReward));

    // Zapisz bitwę (upsert)
    const battleData = {
      player_id: playerId,
      level_id: levelId,
      prompt_used: promptUsed,
      score,
      xp_earned: xpEarned,
      co_poszlo_dobrze,
      co_poprawic,
      wskazowka,
      attempt_number: attemptNumber,
    };

    if (existingBattle) {
      await supabase.from('battles').update(battleData).eq('id', existingBattle.id);
    } else {
      await supabase.from('battles').insert(battleData);
    }

    // Score < 40 → strata życia
    if (score < 40) {
      const newLives = Math.max(0, player.current_lives - 1);

      if (newLives === 0) {
        // Reset modułu
        await supabase.from('battles')
          .delete()
          .eq('player_id', playerId)
          .in('level_id',
            (await supabase.from('levels').select('id').eq('module_id', moduleId)).data?.map(l => l.id) || []
          );

        await supabase.from('players').update({
          current_lives: 3,
          current_level_in_module: 1,
        }).eq('id', playerId);

        return Response.json({ gameOver: true, newLives: 3 });
      }

      await supabase.from('players').update({ current_lives: newLives }).eq('id', playerId);
      return Response.json({ success: true, newLives, newTotalXp: player.total_xp });
    }

    // Score >= 40 → XP + awans levelu
    const newTotalXp = player.total_xp + xpEarned;
    const newLevelInModule = Math.max(player.current_level_in_module, levelNumber + 1);
    const isLastLevel = levelNumber >= totalLevels;

    if (isLastLevel) {
      // Ukończono moduł
      const newModule = player.current_module + 1;

      const updates = {
        total_xp: newTotalXp,
        current_lives: 3,
        current_level_in_module: 1,
      };

      // Odblokuj następny moduł
      if (newModule <= 4) {
        updates.current_module = newModule;
        await supabase.from('modules').update({ unlocked: true }).eq('day_number', newModule);
      }

      await supabase.from('players').update(updates).eq('id', playerId);
      return Response.json({ success: true, moduleComplete: true, newTotalXp, newLives: 3 });
    }

    // Zwykły level
    await supabase.from('players').update({
      total_xp: newTotalXp,
      current_level_in_module: newLevelInModule,
      current_lives: player.current_lives,
    }).eq('id', playerId);

    return Response.json({ success: true, newTotalXp, newLives: player.current_lives });
  } catch (err) {
    console.error('Battle complete error:', err);
    return Response.json({ error: 'Błąd serwera: ' + err.message }, { status: 500 });
  }
}
