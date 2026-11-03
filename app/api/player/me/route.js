import { getServiceClient } from '@/lib/supabase';
import { sessionPlayerId } from '@/lib/session';

// Gracz z podpisanej sesji — to samo źródło tożsamości, którego używa zapis prób
export async function GET() {
  try {
    const playerId = await sessionPlayerId();
    if (!playerId) return Response.json({ error: 'Sesja wygasła — zaloguj się ponownie.', code: 'no_session' }, { status: 401 });

    const supabase = getServiceClient();
    const { data: player, error } = await supabase
      .from('players')
      .select('id, username, display_name, character_id, role, total_xp, current_module, current_lives, current_level_in_module, created_at')
      .eq('id', playerId)
      .single();

    if (error || !player) return Response.json({ error: 'Nie znaleziono gracza', code: 'no_session' }, { status: 401 });

    return Response.json({ player });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
