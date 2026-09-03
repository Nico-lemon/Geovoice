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
    <header
      className={`border-b sticky top-0 z-30 px-4 py-3 sm:px-6 transition-colors shadow-sm ${
        isLight
          ? 'bg-white/95 border-slate-200 backdrop-blur-md text-slate-900'
          : 'bg-slate-950/90 border-slate-800 backdrop-blur-md text-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Titre et identité */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md font-black shrink-0">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1
                className={`font-black text-lg sm:text-xl tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                GeoVoice
              </h1>
            </div>
          </div>


        </div>

        {/* Indicateurs de statut et actions rapides */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Statut Réseau / Hors-Ligne & Stockage Local */}
          {!isOnline ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-400 bg-amber-50 text-amber-900 text-xs font-bold shadow-xs animate-pulse"
              title="Fonctionnement autonome 100% hors-ligne. Relevés GPS et notes vocales sauvegardés en local."
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Hors-ligne (100% Actif)</span>
            </div>
          ) : (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-medium shadow-xs"
              title="Les relevés GPS et vocaux sont stockés localement sur votre appareil (IndexedDB)."
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stockage 100% Local</span>
            </div>
          )}

          {/* Bouton Muet / Son */}
          <button
            onClick={onToggleMute}
            id="btn-toggle-sound"
            type="button"
            className={`p-2 rounded-xl border transition-colors shadow-xs ${
              audioSettings.beepsEnabled
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800'
                : isLight
                ? 'bg-slate-100 border-slate-300 text-slate-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
            }`}
            title={audioSettings.beepsEnabled ? 'Bips sonores activés' : 'Bips sonores coupés'}
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
            className={`p-2 rounded-xl border transition-colors shadow-xs ${
              audioSettings.vibrationEnabled
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800'
                : isLight
                ? 'bg-slate-100 border-slate-300 text-slate-400'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
            }`}
            title={audioSettings.vibrationEnabled ? 'Vibrations activées' : 'Vibrations coupées'}
          >
            <Vibrate className="w-4 h-4" />
          </button>

          {/* Bouton Export ZIP Direct */}
          <button
            onClick={onOpenExportModal}
            id="btn-header-export"
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            title="Exporter l'archive complète avec tous les enregistrements vocaux et formats GPS"
          >
            <Download className="w-4 h-4" />
            <span>Export ZIP ({pointsCount})</span>
          </button>

          {/* Bouton QR Code / Mobile */}
          <button
            onClick={onOpenQrCodeModal}
            id="btn-header-qrcode"
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors shadow-xs ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
            title="Afficher le QR code pour ouvrir l'application sur smartphone"
          >
            <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">QR Mobile</span>
          </button>

          {/* Bouton APK Android */}
          <button
            onClick={onOpenAndroidModal}
            id="btn-header-apk"
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                : 'bg-emerald-950/50 hover:bg-emerald-950 border-emerald-800 text-emerald-300'
            }`}
            title="Installer l'application sur Android ou télécharger le package APK"
          >
            <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>APK Android</span>
          </button>


        </div>
      </div>
    </header>
  );
};
