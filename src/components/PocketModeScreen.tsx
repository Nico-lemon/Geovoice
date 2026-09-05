import React, { useState } from 'react';
import { Bluetooth, Mic, MapPin, ArrowLeft, Radio, Volume2 } from 'lucide-react';
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
  return (
    <div className="fixed inset-0 z-50 bg-[#12181B] text-[#CFCFCF] flex flex-col justify-between p-4 sm:p-6 select-none touch-manipulation overflow-hidden font-mono border-4 border-[#4A6B52]">
      {/* En-tête statut en poche */}
      <div className="flex items-center justify-between border-b-2 border-[#4A6B52] pb-3 bg-[#172025] px-4 py-2.5 shadow-[4px_4px_0px_#000000]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 bg-[#D1FF00] animate-ping absolute inset-0 opacity-75"></div>
            <div className="w-3 h-3 bg-[#D1FF00] relative"></div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-[#D1FF00] font-black font-tech">
              MODE POCHE ACTIF // SÉCURISÉ
            </div>
            <div className="text-[10px] text-[#8E9CA3] font-mono">
              Écran verrouillé • Déclenchement Vol +/- ou BT
            </div>
          </div>
        </div>

        <button
          onClick={onExitPocketMode}
          id="btn-exit-pocket-mode"
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 bg-[#12181B] border-2 border-[#4A6B52] hover:border-[#FF6B35] text-xs font-bold text-white uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span>QUITTER</span>
        </button>
      </div>

      {/* Cœur visuel interactif */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-4 space-y-5">
        {isRecording ? (
          <div className="relative flex flex-col items-center">
            {/* Onde concentrique sonore */}
            <div
              style={{ transform: `scale(${1 + (audioMeterLevel / 100) * 0.75})` }}
              className="absolute w-56 h-56 bg-[#FF6B35]/20 transition-transform duration-75 blur-xl pointer-events-none"
            />
            <div
              style={{ transform: `scale(${1 + (audioMeterLevel / 100) * 0.4})` }}
              className="absolute w-44 h-44 bg-[#FF6B35]/30 transition-transform duration-75"
            />

            {/* Bouton central d'enregistrement actif */}
            <div
              onClick={onManualTrigger}
              className="relative w-36 h-36 bg-[#FF6B35] border-4 border-white flex flex-col items-center justify-center shadow-[6px_6px_0px_#000000] cursor-pointer active:translate-x-1 active:translate-y-1 transition-all"
            >
              <Mic className="w-10 h-10 text-black animate-bounce" />
              <div className="text-xl font-mono font-black tracking-wider text-black mt-1">
                {recordingDuration.toFixed(1)}s
              </div>
            </div>

            <div className="mt-5 space-y-1.5 max-w-sm px-2">
              <div className="text-xs sm:text-sm font-black text-[#FF6B35] uppercase tracking-wider animate-pulse flex items-center justify-center gap-2">
                <Radio className="w-4 h-4" />
                <span>DICTÉE EN COURS // GPS FIGÉ</span>
              </div>
              <p className="text-xs text-[#CFCFCF] italic bg-[#172025] p-2 border border-[#4A6B52] min-h-[2rem]">
                {liveTranscription
                  ? `"${liveTranscription}"`
                  : 'Parlez... Réappuyez sur le bouton Volume ou l’écran pour valider.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-5 max-w-sm">
            {/* Boîtier d'attente prêt au déclencheur Bluetooth / Volume */}
            <div
              onClick={onManualTrigger}
              className="relative w-40 h-40 border-2 border-[#4A6B52] bg-[#172025] flex flex-col items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 transition-all shadow-[6px_6px_0px_#000000] group"
            >
              <div className="absolute inset-0 border border-[#D1FF00] animate-ping opacity-25"></div>
              <div className="flex items-center gap-1 mb-2">
                <Bluetooth className="w-8 h-8 text-[#D1FF00] group-hover:scale-110 transition-transform" />
                <Volume2 className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <div className="text-xs font-black text-white uppercase tracking-wider font-tech">
                PRÊT AU DÉCLIC
              </div>
              <div className="text-[10px] text-[#D1FF00] font-mono mt-0.5 font-bold">
                VOL + / VOL - OU BT
              </div>
            </div>

            <div className="space-y-1.5 bg-[#172025] p-3 border border-[#4A6B52] shadow-[3px_3px_0px_#000000]">
              <div className="text-xs font-black text-white uppercase flex items-center justify-center gap-1.5">
                <span>CONSERVEZ LE TÉLÉPHONE EN POCHE</span>
              </div>
              <div className="text-[11px] text-[#8E9CA3] leading-relaxed">
                Appuyez sur la touche <strong className="text-white">Volume (+)</strong> ou{' '}
                <strong className="text-white">Volume (-)</strong> de votre télécommande Bluetooth
                pour consigner instantanément un point GPS.
              </div>
            </div>
          </div>
        )}

        {/* Dernier déclencheur détecté */}
        {lastTriggerSource && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#172025] border border-[#4A6B52] text-[11px] font-mono text-[#D1FF00] shadow-[2px_2px_0px_#000000]">
            <Radio className="w-3 h-3 text-[#FF6B35] animate-pulse" />
            <span>SIGNAL REÇU : {lastTriggerSource}</span>
          </div>
        )}
      </div>

      {/* Informations GPS et Dernier Point mémorisé */}
      <div className="space-y-2.5 bg-[#172025] border-2 border-[#4A6B52] p-3 sm:p-4 shadow-[4px_4px_0px_#000000]">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#8E9CA3]">
            <MapPin className="w-3.5 h-3.5 text-[#FF6B35]" />
            <span>COORDONNÉES :</span>
            <span className="text-white font-bold">
              {currentLocation
                ? formatGpsCoords(currentLocation.latitude, currentLocation.longitude)
                : 'Acquisition satellites en cours...'}
            </span>
          </div>
          {currentLocation && (
            <span className="text-[#D1FF00] font-black bg-[#12181B] px-1.5 py-0.5 border border-[#4A6B52]">
              ±{currentLocation.accuracy.toFixed(1)}m
            </span>
          )}
        </div>

        {lastPoint && (
          <div className="border-t border-[#2E3E47] pt-2 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <div className="text-[10px] text-[#8E9CA3] uppercase">Dernier point marqué :</div>
              <div className="font-bold text-[#D1FF00] truncate">
                {lastPoint.title}
                {lastPoint.transcription && ` — "${lastPoint.transcription.slice(0, 30)}..."`}
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#8E9CA3] shrink-0">
              {new Date(lastPoint.timestamp).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
