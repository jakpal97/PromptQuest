import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getServiceClient } from '@/lib/supabase';

const COOKIE = 'pq_session';
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) throw new Error('Brak SESSION_SECRET');
  return value;
}

function sign(playerId) {
  return createHmac('sha256', secret()).update(playerId).digest('base64url');
}

export async function setSessionCookie(playerId) {
  (await cookies()).set(COOKIE, `${playerId}.${sign(playerId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

// playerId z podpisanego ciasteczka — jedyne źródło tożsamości przy ocenie i zapisie prób
export async function sessionPlayerId() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  const playerId = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(playerId));
  if (dot < 1 || given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return playerId;
}

const LOCK_MESSAGES = {
  module: 'Ten dzień szkolenia jest jeszcze zamknięty.',
  block: 'Ten blok odblokuje trener.',
  missing: 'Nie ma takiego ćwiczenia.',
};

export function lockMessage(lock) {
  if (lock.reason !== 'previous') return LOCK_MESSAGES[lock.reason];
  const r = lock.required;
  return `Najpierw zalicz: ${r.label || r.code}${r.title ? ` — ${r.title}` : ''}`;
}

// Zwraca Response z błędem, jeśli gracz nie ma dostępu do ćwiczenia; null = można grać
export async function guardLevelAccess(playerId, levelId) {
  if (!playerId) {
    return Response.json({ error: 'Sesja wygasła — zaloguj się ponownie.', code: 'no_session' }, { status: 401 });
  }
  const { data: lock, error } = await getServiceClient()
    .rpc('level_lock', { p_player_id: playerId, p_level_id: levelId });
  if (error) return Response.json({ error: 'Błąd sprawdzania dostępu: ' + error.message }, { status: 500 });
  if (!lock?.reason) return null;
  const status = lock.reason === 'missing' ? 404 : 403;
  return Response.json({ error: lockMessage(lock), code: 'locked', lock }, { status });
}
