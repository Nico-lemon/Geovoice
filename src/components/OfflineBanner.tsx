import React, { useState, useEffect } from 'react';
import { WifiOff, CheckCircle2, CloudOff, Info } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline || dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Statut hors-ligne"
      className="bg-[#172025] text-[#FF6B35] px-4 py-2 flex items-center justify-between text-xs font-mono font-bold shadow-[2px_2px_0px_#000000] z-40 border-b-2 border-[#FF6B35]"
    >
      <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1">
        <div className="p-1 bg-[#12181B] border border-[#FF6B35] text-[#FF6B35] shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <p className="leading-tight">
          <span className="font-black uppercase tracking-wider mr-1.5 text-white">
            [MODE HORS-LIGNE AUTONOME] :
          </span>
          GPS satellite actif. Données et audio sauvegardés localement en mémoire IndexedDB.
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="ml-3 px-2.5 py-1 bg-[#12181B] hover:bg-[#FF6B35] text-[#FF6B35] hover:text-black border border-[#FF6B35] font-mono uppercase text-xs transition-colors shrink-0"
        title="Masquer l'alerte"
      >
        OK
      </button>
    </aside>
  );
};
