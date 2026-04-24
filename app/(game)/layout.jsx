'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function GameLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const playerId = sessionStorage.getItem('playerId');
    if (!playerId) {
      router.push('/login');
      return;
    }

    const characterId = sessionStorage.getItem('characterId');
    const displayName = sessionStorage.getItem('displayName');

    if ((!characterId || characterId === 'null' || characterId === '') && pathname !== '/character-select') {
      router.push('/character-select');
      return;
    }

    setChecking(false);
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
          fontSize: 10,
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
