'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600/90 text-black px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 backdrop-blur-md shadow-md animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span>You appear to be offline. Reconnecting to college Wi-Fi/network...</span>
    </div>
  );
}
