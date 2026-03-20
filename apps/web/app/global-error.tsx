'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Կարող եք լոգ անել սխալը սերվերի վրա
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}>
          <h2>Ինչ-որ բան այն չէ:</h2>
          <button onClick={() => reset()}>Կրկին փորձել</button>
        </div>
      </body>
    </html>
  );
}