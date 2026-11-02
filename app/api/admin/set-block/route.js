import { getServiceClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { moduleId, activeBlock, playerId } = await req.json();
    const supabase = getServiceClient();

    const { data: requester } = await supabase.from('players').select('role').eq('id', playerId).single();
    if (!requester || requester.role !== 'admin') return Response.json({ error: 'Brak uprawnień' }, { status: 403 });

    const { error } = await supabase
      .from('modules')
      .update({ active_block: Math.max(1, parseInt(activeBlock) || 1) })
      .eq('id', moduleId);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
