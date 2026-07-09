import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt() {
  const [waitingSW, setWaitingSW] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let regRef = null;
    let updateFoundHandler = null;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.ready.then((reg) => {
      regRef = reg;
      // Check if there's already a waiting worker
      if (reg.waiting) {
        setWaitingSW(reg.waiting);
      }

      updateFoundHandler = () => {
        const installing = reg.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingSW(installing);
          }
        });
      };
      reg.addEventListener('updatefound', updateFoundHandler);
    });

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      if (regRef && updateFoundHandler) {
        regRef.removeEventListener('updatefound', updateFoundHandler);
      }
      setWaitingSW(null);
    };
  }, []);

  const handleUpdate = () => {
    if (!waitingSW) return;
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
    // The controllerchange listener will handle the reload
  };

  if (!waitingSW || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[9999]">
      <div className="bg-card rounded-2xl p-4 shadow-2xl border border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-card-foreground">Update Available</p>
          <p className="text-xs text-muted-foreground">A new version is ready. Reload to update.</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Reload
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
