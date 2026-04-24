import { getServiceClient } from '@/lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get('moduleId');
    const levelId = searchParams.get('id');

    const supabase = getServiceClient();

    if (levelId) {
      const { data: level, error } = await supabase
        .from('levels')
        .select('*, modules(*)')
        .eq('id', levelId)
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ level });
    }

    if (moduleId) {
      const { data: levels, error } = await supabase
        .from('levels')
        .select('id, level_number, sort_order, type')
        .eq('module_id', moduleId)
        .order('sort_order');
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ levels });
    }

    return Response.json({ error: 'Podaj moduleId lub id' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
