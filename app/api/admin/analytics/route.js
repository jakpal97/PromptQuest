import { getServiceClient } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get('requesterId');
    const supabase = getServiceClient();

    if (requesterId) {
      const { data: req_player } = await supabase.from('players').select('role').eq('id', requesterId).single();
      if (!req_player || req_player.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    const { data: battles } = await supabase
      .from('battles')
      .select('level_id, score, co_poprawic, attempt_number, levels(level_number, type, module_id, modules(day_number, title))');

    return Response.json({ battles: battles || [] });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
