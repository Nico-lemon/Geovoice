import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Download,
  Volume2,
  VolumeX,
  Vibrate,
  QrCode,
  WifiOff,
  HardDrive,
  Smartphone,
  Bluetooth,
} from 'lucide-react';
import { BluetoothConfig, AudioFeedbackSettings, GpsCoordinates } from '../types';

interface HeaderProps {
  gpsLocation?: GpsCoordinates | null;
  bluetoothConfig?: BluetoothConfig;
  audioSettings: AudioFeedbackSettings;
  pointsCount: number;
  theme?: 'light' | 'dark';
  onTogglePocketMode?: () => void;
  onOpenBluetoothModal?: () => void;
  onOpenExportModal: () => void;
  onOpenQrCodeModal: () => void;
  onOpenAndroidModal: () => void;
  onToggleMute: () => void;
  onToggleVibrate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  audioSettings,
  pointsCount,
  theme = 'light',
  onOpenBluetoothModal,
  onOpenExportModal,
  onOpenQrCodeModal,
  onOpenAndroidModal,
  onToggleMute,
  onToggleVibrate,
}) => {
  const isLight = theme === 'light';

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <header className="border-b-2 border-[#4A6B52] sticky top-0 z-30 px-3 py-2.5 sm:px-5 bg-[#12181B] text-[#CFCFCF] font-mono shadow-[0_4px_0px_#000000]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        {/* Titre et identité tactique */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#172025] border-2 border-[#4A6B52] text-[#FF6B35] flex items-center justify-center shadow-[2px_2px_0px_#000000] font-black shrink-0">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg tracking-wider text-white uppercase font-tech">
                  GEOVOICE
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#4A6B52] text-white border border-[#707B71] uppercase">
                  TAC-SPEC
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicateurs de statut et actions rapides tactiques */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Statut Réseau / Hors-Ligne & Stockage Local */}
          {!isOnline ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-[#FF6B35] bg-[#172025] text-[#FF6B35] text-xs font-bold shadow-[2px_2px_0px_#000000] animate-pulse"
              title="Fonctionnement autonome 100% hors-ligne. Relevés GPS et notes vocales sauvegardés en local."
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>HORS-LIGNE (AUTONOME)</span>
            </div>
          ) : (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-[#4A6B52] bg-[#172025] text-[#8E9CA3] text-xs font-bold shadow-[2px_2px_0px_#000000]"
              title="Les relevés GPS et vocaux sont stockés localement sur votre appareil (IndexedDB)."
            >
              <HardDrive className="w-3.5 h-3.5 text-[#4A6B52]" />
              <span className="text-[#CFCFCF]">LOCAL // OFFLINE READY</span>
            </div>
          )}

          {/* Bouton Muet / Son */}
          <button
            onClick={onToggleMute}
            id="btn-toggle-sound"
            type="button"
            className={`w-9 h-9 border-2 flex items-center justify-center transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
              audioSettings.beepsEnabled
                ? 'bg-[#4A6B52] border-[#707B71] text-white'
                : 'bg-[#172025] border-[#2E3E47] text-[#8E9CA3] hover:text-white'
            }`}
            title={audioSettings.beepsEnabled ? 'Bips sonores : ACTIVÉS' : 'Bips sonores : COUPÉS'}
          >
            {audioSettings.beepsEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Bouton Vibration */}
          <button
            onClick={onToggleVibrate}
            id="btn-toggle-vibrate"
            type="button"
            className={`w-9 h-9 border-2 flex items-center justify-center transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
              audioSettings.vibrationEnabled
                ? 'bg-[#4A6B52] border-[#707B71] text-white'
                : 'bg-[#172025] border-[#2E3E47] text-[#8E9CA3] hover:text-white'
            }`}
            title={audioSettings.vibrationEnabled ? 'Vibrations haptiques : ACTIVÉES' : 'Vibrations : COUPÉES'}
          >
            <Vibrate className="w-4 h-4" />
          </button>

          {/* Bouton Déclencheur Bluetooth & Volume */}
          {onOpenBluetoothModal && (
            <button
              onClick={onOpenBluetoothModal}
              id="btn-header-bluetooth"
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#172025] hover:bg-[#4A6B52] text-[#CFCFCF] hover:text-white border-2 border-[#4A6B52] text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Configurer les boutons Bluetooth & touches Volume (+/-) pour déclencher en poche"
            >
              <Bluetooth className="w-4 h-4 text-[#D1FF00]" />
              <span className="hidden sm:inline">DÉCLENCHEUR</span>
              <span className="text-[10px] font-black bg-[#4A6B52] text-white px-1.5 py-0.5 border border-[#707B71]">
                VOL +/-
              </span>
            </button>
          )}

          {/* Bouton Export ZIP Direct (Orange Sécurité) */}
          <button
            onClick={onOpenExportModal}
            id="btn-header-export"
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B35] hover:bg-[#ff8252] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Exporter l'archive tactique complète (audio + GPX/KML/GeoJSON/CSV)"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>ARCHIVE ZIP ({pointsCount})</span>
          </button>

          {/* Bouton QR Code / Mobile */}
          <button
            onClick={onOpenQrCodeModal}
            id="btn-header-qrcode"
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#172025] hover:bg-[#4A6B52] text-[#CFCFCF] hover:text-white border-2 border-[#4A6B52] text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Afficher le QR code d'appairage mobile"
          >
            <QrCode className="w-4 h-4 text-[#FF6B35]" />
            <span className="hidden sm:inline">QR MOBILE</span>
          </button>

          {/* Bouton APK Android */}
          <button
            onClick={onOpenAndroidModal}
            id="btn-header-apk"
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#172025] hover:bg-[#4A6B52] text-[#CFCFCF] hover:text-white border-2 border-[#4A6B52] text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Installer l'application sur terminal Android ou package APK"
          >
            <Smartphone className="w-4 h-4 text-[#D1FF00]" />
            <span>APK ANDROID</span>
          </button>
        </div>
      </div>
    </header>
  );
};
