'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Karta pamięta gracza w sessionStorage, a serwer zapisuje próby według ciasteczka sesji (wspólnego dla całej
// przeglądarki). Gdy w innej karcie ktoś zaloguje się na inne konto, te dwa źródła się rozjeżdżają.
async function sessionMismatch() {
  const playerId = sessionStorage.getItem('playerId');
  if (!playerId) return { text: null };
  try {
    const res = await fetch('/api/player/me', { cache: 'no-store' });
    if (res.status === 401) return { text: 'Sesja wygasła — zaloguj się ponownie.' };
    if (!res.ok) return null;
    const { player } = await res.json();
    if (player.id === playerId) return null;
    return {
      text: `W tej przeglądarce zalogowano się w międzyczasie na inne konto (${player.username}), np. w innej karcie. Zaloguj się ponownie na swoje konto — na jednym komputerze graj tylko na jednym koncie naraz.`,
    };
  } catch {
    return null;
  }
}

export default function GameLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mismatch = await sessionMismatch();
      if (cancelled) return;
      if (mismatch) {
        sessionStorage.clear();
        if (mismatch.text) sessionStorage.setItem('loginNotice', mismatch.text);
        router.replace('/login');
        return;
      }

      const characterId = sessionStorage.getItem('characterId');
      if ((!characterId || characterId === 'null' || characterId === '') && pathname !== '/character-select') {
        router.push('/character-select');
        return;
      }

      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [router, pathname]);

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 12,
          color: 'var(--accent)',
          animation: 'pulse 1s ease-in-out infinite',
        }}>
          ŁADOWANIE...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
