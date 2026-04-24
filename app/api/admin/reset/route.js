import { getServiceClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { sessionName, playerId } = await req.json();

    const supabase = getServiceClient();

    // Sprawdź czy admin
    const { data: player } = await supabase
      .from('players')
      .select('role')
      .eq('id', playerId)
      .single();

    if (!player || player.role !== 'admin') {
      return Response.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    // Pobierz wszystkie battles do archiwum
    const { data: battles } = await supabase.from('battles').select('*');
    const { data: playersSummary } = await supabase
      .from('players')
      .select('id, username, display_name, total_xp, current_module, character_id')
      .eq('role', 'player');

    // Zapisz do archiwum
    await supabase.from('training_sessions').insert({
      session_name: sessionName || `Sesja ${new Date().toLocaleDateString('pl-PL')}`,
      battles_data: battles || [],
      players_summary: playersSummary || [],
    });

    const battlesCount = battles?.length || 0;

    // Usuń wszystkie battles
    await supabase.from('battles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Reset graczy (tylko player, nie admin)
    await supabase.from('players').update({
      total_xp: 0,
      current_module: 1,
      current_lives: 3,
      current_level_in_module: 1,
      display_name: null,
      character_id: null,
    }).eq('role', 'player');

    // Zablokuj moduły 2-4
    await supabase.from('modules').update({ unlocked: false }).gt('day_number', 1);

    return Response.json({ success: true, archived: battlesCount });
  } catch (err) {
    console.error('Reset error:', err);
    return Response.json({ error: 'Błąd resetu: ' + err.message }, { status: 500 });
  }
}
