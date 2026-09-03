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
      className="bg-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold shadow-md animate-in slide-in-from-top duration-300 z-40 border-b border-amber-600"
    >
      <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1">
        <div className="p-1 rounded-lg bg-amber-600/30 text-slate-950 shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <p className="leading-tight">
          <span className="font-extrabold uppercase tracking-wide mr-1.5 underline decoration-amber-900">
            Mode Hors-Ligne Actif :
          </span>
          L'application fonctionne à 100% sans connexion Internet. Vos coordonnées GPS, mémos vocaux et déclencheurs Bluetooth sont enregistrés directement dans la mémoire de votre appareil.
        </p>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="ml-3 px-2.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-slate-950 font-bold text-xs transition-colors shrink-0"
        title="Masquer l'alerte"
      >
        Compris
      </button>
    </aside>
  );
};
