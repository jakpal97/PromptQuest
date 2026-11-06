import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*, levels(block, active, config)')
      .order('day_number');

    if (error) return Response.json({ error: error.message }, { status: 500 });
    const withBlocks = modules.map(({ levels, ...mod }) => {
      const active = (levels || []).filter(l => l.active);
      const blockLabels = {};
      for (const l of active) {
        const b = l.block || 1;
        if (!blockLabels[b]) blockLabels[b] = l.config?.block_name || `Blok ${b}`;
      }
      return {
        ...mod,
        max_block: Math.max(1, ...active.map(l => l.block || 1)),
        block_labels: blockLabels,
      };
    });
    return Response.json({ modules: withBlocks });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
