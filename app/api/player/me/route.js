import { getServiceClient } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('id');

    if (!playerId) return Response.json({ error: 'Brak id gracza' }, { status: 400 });

    const supabase = getServiceClient();
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (error || !player) return Response.json({ error: 'Nie znaleziono gracza' }, { status: 404 });

    return Response.json({ player });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
