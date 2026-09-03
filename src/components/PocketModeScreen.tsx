import React, { useState, useEffect } from 'react';
import { Bluetooth, Mic, MapPin, Volume2, ShieldCheck, Lock, Unlock, ArrowLeft, Radio, AlertCircle } from 'lucide-react';
import { GpsPoint, GpsCoordinates } from '../types';
import { formatGpsCoords } from '../services/gpsService';

interface PocketModeScreenProps {
  isRecording: boolean;
  recordingDuration: number;
  liveTranscription: string;
  audioMeterLevel: number;
  lastPoint: GpsPoint | null;
  currentLocation: GpsCoordinates | null;
  lastTriggerSource: string;
  onManualTrigger: () => void;
  onExitPocketMode: () => void;
}

export const PocketModeScreen: React.FC<PocketModeScreenProps> = ({
  isRecording,
  recordingDuration,
  liveTranscription,
  audioMeterLevel,
  lastPoint,
  currentLocation,
  lastTriggerSource,
  onManualTrigger,
  onExitPocketMode,
}) => {
  const [isLocked, setIsLocked] = useState(true);
  const [unlockProgress, setUnlockProgress] = useState(0);

  // Déverrouillage par glissement ou appui maintenu
  const handleUnlockTouch = () => {
    setIsLocked(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 select-none touch-manipulation overflow-hidden">
      {/* En-tête statut en poche */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute inset-0 opacity-75"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 relative"></div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              Mode Poche Actif
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Écran sécurisé & Retour haptique
            </div>
          </div>
        </div>

        <button
          onClick={onExitPocketMode}
          id="btn-exit-pocket-mode"
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white active:scale-95 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quitter</span>
        </button>
      </div>

      {/* Cœur visuel interactif */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-6 space-y-6">
        {isRecording ? (
          <div className="relative flex flex-col items-center">
            {/* Onde concentrique sonore */}
            <div
              style={{ transform: `scale(${1 + (audioMeterLevel / 100) * 0.75})` }}
              className="absolute w-56 h-56 rounded-full bg-rose-500/20 transition-transform duration-75 blur-xl pointer-events-none"
            />
            <div
              style={{ transform: `scale(${1 + (audioMeterLevel / 100) * 0.4})` }}
              className="absolute w-44 h-44 rounded-full bg-rose-600/30 transition-transform duration-75"
            />

            {/* Bouton central d'enregistrement actif */}
            <div
              onClick={onManualTrigger}
              className="relative w-36 h-36 rounded-full bg-rose-600 border-4 border-rose-400 flex flex-col items-center justify-center shadow-2xl cursor-pointer active:scale-95 transition-transform"
            >
              <Mic className="w-10 h-10 text-white animate-bounce" />
              <div className="text-xl font-mono font-black tracking-wider text-white mt-1">
                {recordingDuration.toFixed(1)}s
              </div>
            </div>

            <div className="mt-6 space-y-1 max-w-xs">
              <div className="text-sm font-bold text-rose-400 uppercase tracking-wider animate-pulse">
                🎙️ Enregistrement du mémo...
              </div>
              <p className="text-xs text-slate-300 italic min-h-[1.5rem]">
                {liveTranscription ? `"${liveTranscription}"` : 'Parlez maintenant... Appuyez à nouveau pour enregistrer'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 max-w-sm">
            {/* Cercle d'attente prêt au déclencheur Bluetooth */}
            <div
              onClick={onManualTrigger}
              className="relative w-40 h-40 rounded-full border-2 border-emerald-500/40 bg-emerald-950/20 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all shadow-[0_0_50px_rgba(16,185,129,0.15)] group"
            >
              <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-ping opacity-25"></div>
              <Bluetooth className="w-10 h-10 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Prêt au déclic
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Bouton Bluetooth
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-200">
                Laissez le téléphone en poche
              </div>
              <div className="text-xs text-slate-400 leading-relaxed px-4">
                Appuyez sur votre <strong className="text-emerald-400">bouton Bluetooth</strong> pour marquer un point GPS et enregistrer votre note vocale.
              </div>
            </div>
          </div>
        )}

        {/* Dernier déclencheur détecté */}
        {lastTriggerSource && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[11px] font-mono text-slate-400">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Déclencheur : {lastTriggerSource}</span>
          </div>
        )}
      </div>

      {/* Informations GPS et Dernier Point mémorisé */}
      <div className="space-y-3 bg-slate-950/90 border border-slate-900 p-4 rounded-2xl">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>GPS :</span>
            <span className="text-slate-200">
              {currentLocation
                ? formatGpsCoords(currentLocation.latitude, currentLocation.longitude)
                : 'Recherche satellite...'}
            </span>
          </div>
          {currentLocation && (
            <span className="text-emerald-400 font-bold">
              ±{currentLocation.accuracy.toFixed(1)}m
            </span>
          )}
        </div>

        {lastPoint && (
          <div className="border-t border-slate-900 pt-2 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <div className="text-[11px] text-slate-400">Dernier point marqué :</div>
              <div className="font-semibold text-emerald-400 truncate">
                {lastPoint.title}
                {lastPoint.transcription && ` — "${lastPoint.transcription.slice(0, 35)}..."`}
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400 shrink-0">
              {new Date(lastPoint.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
