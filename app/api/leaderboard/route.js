import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServiceClient();

    const { data: players } = await supabase
      .from('players')
      .select('id, display_name, username, character_id, total_xp, current_module, role')
      .eq('role', 'player')
      .order('total_xp', { ascending: false });

    const playerIds = (players || []).map(p => p.id);

    let countMap = {};
    if (playerIds.length > 0) {
      const { data: battleCounts } = await supabase
        .from('battles')
        .select('player_id')
        .in('player_id', playerIds)
        .gte('score', 40);

      battleCounts?.forEach(b => {
        countMap[b.player_id] = (countMap[b.player_id] || 0) + 1;
      });
    }

    const result = (players || []).map(p => ({ ...p, battles_won: countMap[p.id] || 0 }));
    return Response.json({ players: result });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
