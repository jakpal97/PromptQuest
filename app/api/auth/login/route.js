import bcrypt from 'bcryptjs';
import { getServiceClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json({ error: 'Podaj kod dostępu i hasło' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('username', username.trim().toLowerCase())
      .single();

    if (error || !player) {
      return Response.json({ error: 'Nieprawidłowy kod dostępu lub hasło' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, player.password_hash);
    if (!valid) {
      return Response.json({ error: 'Nieprawidłowy kod dostępu lub hasło' }, { status: 401 });
    }

    return Response.json({ player });
  } catch (err) {
    console.error('Login error:', err);
    return Response.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
