import React from 'react';
import { Mic, Square } from 'lucide-react';
import { GpsCoordinates } from '../types';

interface LiveRecordingBarProps {
  isRecording: boolean;
  recordingDuration: number;
  liveTranscription: string;
  audioMeterLevel: number;
  currentLocation: GpsCoordinates | null;
  lastTriggerSource: string;
  onTriggerRecord: () => void;
}

export const LiveRecordingBar: React.FC<LiveRecordingBarProps> = ({
  isRecording,
  recordingDuration,
  liveTranscription,
  audioMeterLevel,
  currentLocation,
  lastTriggerSource,
  onTriggerRecord,
}) => {
  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-30">
      <div
        className={`rounded-3xl border shadow-2xl p-4 transition-all duration-300 backdrop-blur-md ${
          isRecording
            ? 'bg-rose-950/95 border-rose-500 shadow-rose-900/40 text-white'
            : 'bg-white/95 dark:bg-slate-900/95 border-slate-300 dark:border-slate-800 shadow-slate-900/20 text-slate-900 dark:text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between gap-3.5">
          {/* Côté gauche : Statut & visualiseur sonore */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Bouton d'action principal */}
            <button
              onClick={onTriggerRecord}
              id="btn-main-trigger-record"
              type="button"
              className={`p-4 rounded-full font-black flex items-center justify-center transition-transform active:scale-90 shrink-0 shadow-lg ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/50 ring-4 ring-rose-400/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/40'
              }`}
              title={isRecording ? 'Arrêter et mémoriser le point GPS' : 'Démarrer un point GPS'}
            >
              {isRecording ? (
                <Square className="w-6 h-6 fill-current" />
              ) : (
                <Mic className="w-6 h-6 fill-current" />
              )}
            </button>

            {/* Texte et infos */}
            <div className="flex-1 min-w-0">
              {isRecording ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-rose-300 uppercase tracking-wider animate-pulse flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                      Enregistrement en cours
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-black text-white bg-rose-900/90 px-2.5 py-0.5 rounded-lg border border-rose-600">
                      {recordingDuration.toFixed(1)}s
                    </span>
                  </div>

                  {/* Transcription live */}
                  <div className="text-xs sm:text-sm text-rose-100 font-medium truncate italic">
                    {liveTranscription ? `"${liveTranscription}"` : 'Parlez maintenant dans le micro...'}
                  </div>

                  {/* Vumètre graphique réactif */}
                  <div className="w-full bg-rose-950 rounded-full h-2 overflow-hidden border border-rose-700">
                    <div
                      style={{ width: `${Math.max(8, audioMeterLevel)}%` }}
                      className="h-full bg-rose-400 transition-all duration-75"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Prêt au balisage GPS
                    </span>
                    <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 rounded-lg">
                      Prêt
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate font-medium">
                    {lastTriggerSource
                      ? `Dernier déclic : ${lastTriggerSource}`
                      : 'Appuyez sur le micro pour enregistrer un point.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Côté droit : Statut GPS rapide */}
          <div className="hidden sm:flex flex-col items-end text-right text-xs font-mono shrink-0 border-l border-slate-300 dark:border-slate-800 pl-4 space-y-0.5">
            <span className="font-extrabold text-slate-900 dark:text-slate-100">
              {currentLocation
                ? `GPS ±${currentLocation.accuracy.toFixed(1)}m`
                : 'GPS indisponible'}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-semibold">
              {currentLocation?.altitude !== null
                ? `${currentLocation?.altitude?.toFixed(0)}m altitude`
                : 'Altitude --'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
