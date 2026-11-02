import { getServiceClient } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get('playerId');
  const moduleId = searchParams.get('moduleId');

  if (!playerId || !moduleId) return Response.json({ bestScores: {}, attempts: {}, prompts: {} });

  try {
    const supabase = getServiceClient();

    const { data: levels } = await supabase
      .from('levels')
      .select('id')
      .eq('module_id', moduleId);

    const levelIds = levels?.map(l => l.id) || [];
    if (!levelIds.length) return Response.json({ bestScores: {}, attempts: {}, prompts: {} });

    // Jeden wiersz na (gracz, level) — trzyma najlepszy wynik i licznik prób
    const { data: battles, error } = await supabase
      .from('battles')
      .select('level_id, score, zone, attempt_number, prompt_used')
      .eq('player_id', playerId)
      .in('level_id', levelIds);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const bestScores = {};
    const attempts = {};
    const prompts = {};
    const zones = {};
    battles?.forEach(b => {
      bestScores[b.level_id] = b.score;
      attempts[b.level_id] = b.attempt_number || 1;
      prompts[b.level_id] = b.prompt_used;
      zones[b.level_id] = b.zone;
    });

    return Response.json({ bestScores, attempts, prompts, zones });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
