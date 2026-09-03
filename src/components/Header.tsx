import React from 'react';
import {
  Bluetooth,
  MapPin,
  Download,
  Volume2,
  VolumeX,
  Vibrate,
  QrCode,
} from 'lucide-react';
import { BluetoothConfig, AudioFeedbackSettings, GpsCoordinates } from '../types';

interface HeaderProps {
  gpsLocation: GpsCoordinates | null;
  bluetoothConfig: BluetoothConfig;
  audioSettings: AudioFeedbackSettings;
  pointsCount: number;
  theme?: 'light' | 'dark';
  onTogglePocketMode?: () => void;
  onOpenBluetoothModal: () => void;
  onOpenExportModal: () => void;
  onOpenQrCodeModal: () => void;
  onToggleMute: () => void;
  onToggleVibrate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gpsLocation,
  bluetoothConfig,
  audioSettings,
  pointsCount,
  theme = 'light',
  onOpenBluetoothModal,
  onOpenExportModal,
  onOpenQrCodeModal,
  onToggleMute,
  onToggleVibrate,
}) => {
  const isLight = theme === 'light';

  const getAccuracyColor = (acc: number | undefined) => {
    if (acc === undefined) {
      return isLight
        ? 'text-slate-600 bg-slate-100 border-slate-300'
        : 'text-slate-400 bg-slate-800/80 border-slate-700';
    }
    if (acc <= 5) {
      return isLight
        ? 'text-emerald-800 bg-emerald-100 border-emerald-300 font-bold'
        : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
    if (acc <= 15) {
      return isLight
        ? 'text-amber-800 bg-amber-100 border-amber-300 font-bold'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
    return isLight
      ? 'text-rose-800 bg-rose-100 border-rose-300 font-bold'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

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
          {/* Statut GPS haute précision */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors shadow-xs ${getAccuracyColor(
              gpsLocation?.accuracy
            )}`}
            title={
              gpsLocation
                ? `Précision GPS: ±${gpsLocation.accuracy.toFixed(1)} m`
                : 'Recherche de position GPS'
            }
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                gpsLocation
                  ? 'bg-emerald-500 animate-pulse'
                  : isLight
                  ? 'bg-slate-400'
                  : 'bg-slate-600'
              }`}
            />
            <span className="font-bold">
              {gpsLocation ? `GPS ±${gpsLocation.accuracy.toFixed(1)}m` : 'Recherche GPS...'}
            </span>
          </div>

          {/* Statut Bluetooth */}
          <button
            onClick={onOpenBluetoothModal}
            id="btn-header-bluetooth"
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-95 shadow-xs ${
              bluetoothConfig.isConnectedBle
                ? isLight
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                  : 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="Configurer le déclencheur Bluetooth"
          >
            <Bluetooth className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">
              {bluetoothConfig.isConnectedBle
                ? bluetoothConfig.bleDeviceName || 'BLE Connecté'
                : 'Bouton Bluetooth Actif'}
            </span>
          </button>

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


        </div>
      </div>
    </header>
  );
};
