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

    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('*')
      .order('session_date', { ascending: false });

    return Response.json({ sessions: sessions || [] });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
