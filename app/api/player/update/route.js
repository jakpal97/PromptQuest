import { getServiceClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { playerId, character_id, display_name } = await req.json();
    if (!playerId) return Response.json({ error: 'Brak playerId' }, { status: 400 });

    const supabase = getServiceClient();
    const updates = {};
    if (character_id !== undefined) updates.character_id = character_id;
    if (display_name !== undefined) updates.display_name = display_name;

    const { error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
