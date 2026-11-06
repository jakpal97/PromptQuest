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
        .eq('active', true)
        .maybeSingle();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      if (!level) return Response.json({ error: 'Nie ma takiego ćwiczenia.' }, { status: 404 });
      return Response.json({ level });
    }

    if (moduleId) {
      const { data: levels, error } = await supabase
        .from('levels')
        .select('id, level_number, sort_order, type, code, title, block, requires:config->>requires, label:config->>label, block_name:config->>block_name, boss:config->boss, extra:config->extra, quiz:config->quiz, zones:config->zones')
        .eq('module_id', moduleId)
        .eq('active', true)
        .order('sort_order');
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ levels });
    }

    return Response.json({ error: 'Podaj moduleId lub id' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
