import { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowRestored(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearTimeout(timerRef.current);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        isOnline
          ? 'bg-emerald-500/90 dark:bg-emerald-600/90'
          : 'bg-destructive/90 dark:bg-red-600/90'
      } backdrop-blur-sm`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-white text-sm font-medium">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Connection restored</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You are offline — some features may not work</span>
          </>
        )}
      </div>
    </div>
  );
}
