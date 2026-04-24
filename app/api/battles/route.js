import { getServiceClient } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get('playerId');
  const moduleId = searchParams.get('moduleId');

  if (!playerId || !moduleId) return Response.json({ bestScores: {} });

  try {
    const supabase = getServiceClient();

    // Pobierz levele dla modułu
    const { data: levels } = await supabase
      .from('levels')
      .select('id')
      .eq('module_id', moduleId);

    const levelIds = levels?.map(l => l.id) || [];
    if (!levelIds.length) return Response.json({ bestScores: {} });

    // Pobierz wyniki gracza dla tych levelów
    const { data: battles, error } = await supabase
      .from('battles')
      .select('level_id, score')
      .eq('player_id', playerId)
      .in('level_id', levelIds);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Najlepszy wynik per level
    const bestScores = {};
    battles?.forEach(b => {
      if (!bestScores[b.level_id] || b.score > bestScores[b.level_id]) {
        bestScores[b.level_id] = b.score;
      }
    });

    return Response.json({ bestScores });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
