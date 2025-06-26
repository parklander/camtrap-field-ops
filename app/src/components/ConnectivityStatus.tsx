'use client';

import { useEffect, useState } from 'react';
import { ConnectivityService } from '@/lib/connectivity-service';

export function ConnectivityStatus() {
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(true); // Default to true for SSR
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
    setOnline(ConnectivityService.getOnlineStatus());
    setSyncing(
      typeof ConnectivityService.isSyncInProgress === 'function'
        ? ConnectivityService.isSyncInProgress()
        : false
    );

    const listener = (isOnline: boolean) => setOnline(isOnline);
    ConnectivityService.addConnectivityListener(listener);

    const interval = setInterval(() => {
      setSyncing(
        typeof ConnectivityService.isSyncInProgress === 'function'
          ? ConnectivityService.isSyncInProgress()
          : false
      );
    }, 1000);

    return () => {
      ConnectivityService.removeConnectivityListener(listener);
      clearInterval(interval);
    };
  }, []);

  if (!mounted) return null; // Prevent SSR mismatch

  let status = '';
  if (!online) status = 'Offline';
  else if (syncing) status = 'Syncing...';
  else status = 'Online';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        padding: '8px 16px',
        borderRadius: 8,
        background: !online ? '#f87171' : syncing ? '#fbbf24' : '#34d399',
        color: '#fff',
        fontWeight: 'bold',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'background 0.3s'
      }}
    >
      {status}
    </div>
  );
} 