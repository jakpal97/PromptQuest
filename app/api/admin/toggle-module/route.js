import { getServiceClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { moduleId, unlocked, playerId } = await req.json();
    const supabase = getServiceClient();

    const { data: req_player } = await supabase.from('players').select('role').eq('id', playerId).single();
    if (!req_player || req_player.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 });

    const { error } = await supabase.from('modules').update({ unlocked }).eq('id', moduleId);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
