import { getServiceClient } from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get('playerId');
  if (!playerId) return Response.json({ error: 'Brak playerId' }, { status: 400 });

  const { data, error } = await getServiceClient()
    .from('prompt_library')
    .select('id, title, prompt, created_at, level_id, levels(code, title)')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ entries: data || [] });
}

export async function POST(req) {
  const { playerId, levelId, title, prompt } = await req.json();
  if (!playerId || !prompt?.trim()) return Response.json({ error: 'Brak danych' }, { status: 400 });

  const { data, error } = await getServiceClient()
    .from('prompt_library')
    .insert({ player_id: playerId, level_id: levelId || null, title: title?.trim() || null, prompt: prompt.trim() })
    .select('id')
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, id: data.id });
}

export async function DELETE(req) {
  const { playerId, id } = await req.json();
  if (!playerId || !id) return Response.json({ error: 'Brak danych' }, { status: 400 });

  const { error } = await getServiceClient()
    .from('prompt_library')
    .delete()
    .eq('id', id)
    .eq('player_id', playerId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
