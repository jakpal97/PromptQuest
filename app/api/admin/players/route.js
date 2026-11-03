import { getServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/session';

const PUBLIC_COLUMNS = 'id, username, display_name, character_id, role, total_xp, current_module, current_level_in_module, current_lives, created_at';

export async function GET() {
  try {
    const { denied } = await requireAdmin();
    if (denied) return denied;

    const { data: players } = await getServiceClient()
      .from('players').select(PUBLIC_COLUMNS).order('total_xp', { ascending: false });
    return Response.json({ players: players || [] });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
