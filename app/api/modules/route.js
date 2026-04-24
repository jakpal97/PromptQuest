import { getServiceClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .order('day_number');

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ modules });
  } catch (err) {
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
