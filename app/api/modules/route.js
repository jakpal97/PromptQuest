import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*, levels(block)')
      .order('day_number');

    if (error) return Response.json({ error: error.message }, { status: 500 });
    const withBlocks = modules.map(({ levels, ...mod }) => ({
      ...mod,
      max_block: Math.max(1, ...(levels || []).map(l => l.block || 1)),
    }));
    return Response.json({ modules: withBlocks });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
