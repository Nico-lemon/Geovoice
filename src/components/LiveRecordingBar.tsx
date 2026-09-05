import React from 'react';
import { Mic, Square, Radio, Activity, Volume2 } from 'lucide-react';
import { GpsCoordinates } from '../types';

interface LiveRecordingBarProps {
  isRecording: boolean;
  recordingDuration: number;
  liveTranscription: string;
  audioMeterLevel: number;
  currentLocation: GpsCoordinates | null;
  lastTriggerSource: string;
  onTriggerRecord: () => void;
  onOpenBluetoothModal?: () => void;
}

export const LiveRecordingBar: React.FC<LiveRecordingBarProps> = ({
  isRecording,
  recordingDuration,
  liveTranscription,
  audioMeterLevel,
  currentLocation,
  lastTriggerSource,
  onTriggerRecord,
  onOpenBluetoothModal,
}) => {
  return (
    <div className="fixed bottom-3 left-3 right-3 max-w-2xl mx-auto z-30 pointer-events-auto">
      <div
        className={`border-2 transition-all duration-200 shadow-[6px_6px_0px_#000000] p-3 sm:p-3.5 backdrop-blur-md ${
          isRecording
            ? 'bg-[#172025] border-[#FF6B35]'
            : 'bg-[#172025]/95 border-[#4A6B52]'
        }`}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Côté gauche : Console de statut tactique & transcription */}
          <div className="flex-1 min-w-0 font-mono">
            {isRecording ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-[#FF6B35] animate-ping" />
                  <span className="text-xs sm:text-sm font-black text-[#FF6B35] uppercase tracking-wider">
                    TRANSMISSION VOCALE EN COURS
                  </span>
                  <span className="text-xs font-mono font-bold text-black bg-[#FF6B35] px-2 py-0.5 border border-black shadow-xs">
                    {recordingDuration.toFixed(1)}s
                  </span>
                </div>

                {/* Transcription textuelle directe */}
                <div className="text-xs text-[#CFCFCF] truncate italic font-sans bg-[#12181B] border border-[#2E3E47] px-2 py-1">
                  {liveTranscription ? `"${liveTranscription}"` : 'Écoute radio active...'}
                </div>

                {/* Vumètre graphique tactique en barres / segments orange */}
                <div className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                  <div className="flex-1 bg-[#12181B] border border-[#2E3E47] h-2.5 p-0.5 flex items-center">
                    <div
                      style={{ width: `${Math.max(6, audioMeterLevel)}%` }}
                      className="h-full bg-[#FF6B35] transition-all duration-75"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#4A6B52] animate-pulse" />
                  <span className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
                    CONSOLE PRÊTE // POINT GPS
                  </span>
                  <span className="text-[10px] text-[#D1FF00] font-bold px-1.5 py-0.5 bg-[#12181B] border border-[#4A6B52]">
                    STANDBY
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-[#8E9CA3]">
                  <span className="truncate">
                    {lastTriggerSource
                      ? `Signal : ${lastTriggerSource}`
                      : 'Touches Volume (+/-) ou bouton REC actif'}
                  </span>
                  {onOpenBluetoothModal && (
                    <button
                      type="button"
                      onClick={onOpenBluetoothModal}
                      className="text-[10px] font-bold text-[#D1FF00] hover:text-white uppercase bg-[#12181B] hover:bg-[#4A6B52] px-1.5 py-0.5 border border-[#4A6B52] transition-colors cursor-pointer flex items-center gap-1"
                      title="Configurer les boutons de volume et le Bluetooth"
                    >
                      <Volume2 className="w-3 h-3 text-[#FF6B35]" />
                      <span>CONFIG VOL +/-</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CENTRE : GRAND BOUTON CIRCULAIRE D'ENREGISTREMENT AVEC 'REC' EN ORANGE */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <button
              onClick={onTriggerRecord}
              id="btn-main-trigger-record"
              type="button"
              className={`relative group rounded-full flex flex-col items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer select-none ${
                isRecording
                  ? 'w-20 h-20 sm:w-22 sm:h-22 bg-[#12181B] border-4 border-[#FF6B35] shadow-[0_0_20px_rgba(255,107,53,0.6)]'
                  : 'w-20 h-20 sm:w-22 sm:h-22 bg-[#12181B] hover:bg-[#1A2328] border-4 border-[#4A6B52] hover:border-[#FF6B35] shadow-[3px_3px_0px_#000000]'
              }`}
              title={isRecording ? 'Arrêter et enregistrer le point' : 'Démarrer un enregistrement de balise'}
            >
              {/* Anneau interne texturé / concentrique */}
              <div
                className={`absolute inset-1.5 rounded-full border border-dashed transition-colors ${
                  isRecording ? 'border-[#FF6B35] animate-spin' : 'border-[#4A6B52]/60'
                }`}
                style={{ animationDuration: '8s' }}
              />

              {isRecording ? (
                <>
                  <Square className="w-6 h-6 fill-[#FF6B35] text-[#FF6B35] mb-0.5 animate-pulse" />
                  <span className="text-xs sm:text-sm font-black font-tech tracking-widest text-[#FF6B35] uppercase">
                    STOP
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 text-[#FF6B35] mb-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm sm:text-base font-black font-tech tracking-wider text-[#FF6B35] uppercase leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    REC
                  </span>
                </>
              )}
            </button>
            <span className="text-[9px] font-mono font-bold text-[#8E9CA3] tracking-widest uppercase mt-1">
              {isRecording ? 'EN COURS' : 'DÉCLENCHEUR'}
            </span>
          </div>

          {/* Côté droit : Télémétrie GPS détaillée (Masquée sur très petit écran) */}
          <div className="hidden md:flex flex-col items-end text-right text-xs font-mono shrink-0 border-l border-[#2E3E47] pl-4 space-y-1 text-[#8E9CA3]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#D1FF00] rounded-none"></span>
              <span className="font-bold text-[#CFCFCF]">
                {currentLocation ? `±${currentLocation.accuracy.toFixed(1)}m` : 'GPS SATELLITE'}
              </span>
            </div>
            <div className="text-[11px] text-[#8E9CA3]">
              {currentLocation?.altitude !== null
                ? `ALT ${currentLocation?.altitude?.toFixed(0)}m`
                : 'ALT --'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
