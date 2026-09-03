import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GpsPoint, GpsCoordinates, BluetoothConfig, AudioFeedbackSettings } from './types';
import { dbService } from './services/db';
import { gpsService } from './services/gpsService';
import { voiceRecorder } from './services/voiceRecorder';
import { bluetoothService } from './services/bluetoothTrigger';
import { audioFeedback } from './services/audioFeedback';

import { Header } from './components/Header';
import { MapViewer } from './components/MapViewer';
import { PointsList } from './components/PointsList';
import { PocketModeScreen } from './components/PocketModeScreen';
import { PointDetailModal } from './components/PointDetailModal';
import { BluetoothConfigModal } from './components/BluetoothConfigModal';
import { ExportModal } from './components/ExportModal';
import { QrCodeModal } from './components/QrCodeModal';
import { LiveRecordingBar } from './components/LiveRecordingBar';
import { OfflineBanner } from './components/OfflineBanner';
import { AndroidApkModal } from './components/AndroidApkModal';

import { Map as MapIcon, List, Download } from 'lucide-react';

export default function App() {
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GpsCoordinates | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<GpsPoint | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Thème clair haute visibilité pour l'extérieur
  const theme = 'light';

  useEffect(() => {
    localStorage.removeItem('geovoice_theme');
    document.documentElement.classList.remove('dark');
  }, []);

  // États d'enregistrement
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [audioMeterLevel, setAudioMeterLevel] = useState(0);
  const [lastTriggerSource, setLastTriggerSource] = useState('');

  // Vue et modales
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [pocketModeActive, setPocketModeActive] = useState(false);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [editingPoint, setEditingPoint] = useState<GpsPoint | null>(null);

  // Capture de l'événement d'installation PWA Android
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  // Configuration Bluetooth & Retours sensoriels
  const [bluetoothConfig, setBluetoothConfig] = useState<BluetoothConfig>({
    mode: 'all',
    behavior: 'toggle',
    customKeyCodes: ['Space', 'Enter', 'AudioVolumeUp', 'MediaPlayPause', 'MediaTrackNext'],
    isConnectedBle: false,
    pocketModeActive: false,
    keepScreenAwake: true,
  });

  const [audioSettings, setAudioSettings] = useState<AudioFeedbackSettings>({
    beepsEnabled: true,
    vibrationEnabled: true,
    voicePromptEnabled: true,
    voiceLanguage: 'fr-FR',
    beepVolume: 0.8,
  });

  const recordingTimerRef = useRef<number | null>(null);
  const autoStopTimeoutRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);
  isRecordingRef.current = isRecording;

  // 1. Chargement initial de la base IndexedDB
  useEffect(() => {
    dbService.getAllPoints().then((savedPoints) => {
      setPoints(savedPoints);
      if (savedPoints.length > 0) {
        setSelectedPointId(savedPoints[0].id);
      }
    });

    // 2. Écoute de la géolocalisation
    const unsubscribeGps = gpsService.onLocationUpdate((coords) => {
      setCurrentLocation(coords);
    });

    return () => {
      unsubscribeGps();
    };
  }, []);

  // 3. Gestion de l'enregistrement de début et de fin
  const startRecordingFlow = useCallback(async (sourceName: string) => {
    if (isRecordingRef.current || isStartingRef.current || isStoppingRef.current) {
      return;
    }

    isStartingRef.current = true;
    setLastTriggerSource(sourceName);
    bluetoothService.activateBackgroundAudio();

    try {
      audioFeedback.playRecordStart(audioSettings);

      setRecordingDuration(0);
      setLiveTranscription('');
      setIsRecording(true);

      const startTime = Date.now();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((Date.now() - startTime) / 1000);
      }, 100);

      await voiceRecorder.startRecording(
        (meterLevel) => setAudioMeterLevel(meterLevel),
        (transcript) => setLiveTranscription(transcript)
      );

      isStartingRef.current = false;

      // Si mode minuteur automatique configuré (ex: 5s ou 10s)
      if (bluetoothConfig.behavior === 'timer5s' || bluetoothConfig.behavior === 'timer10s') {
        const delay = bluetoothConfig.behavior === 'timer5s' ? 5000 : 10000;
        if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = window.setTimeout(() => {
          stopRecordingFlow();
        }, delay);
      }
    } catch (err: any) {
      console.error('Recording start failed:', err);
      audioFeedback.playError(audioSettings);
      setIsRecording(false);
      isStartingRef.current = false;
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  }, [audioSettings, bluetoothConfig.behavior]);

  const stopRecordingFlow = useCallback(async () => {
    if ((!isRecordingRef.current && !isStartingRef.current) || isStoppingRef.current) {
      return;
    }

    isStoppingRef.current = true;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    setIsRecording(false);
    setAudioMeterLevel(0);

    try {
      // Obtenir la position GPS la plus précise possible au moment du déclic
      const [coords, recordResult] = await Promise.all([
        gpsService.getCurrentPosition(),
        voiceRecorder.stopRecording(),
      ]);

      const newPointNumber = points.length + 1;
      const pointTitle = `Point #${newPointNumber}`;

      const newPoint: GpsPoint = {
        id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: Date.now(),
        title: pointTitle,
        coords: coords,
        audioBlob: recordResult.audioBlob,
        audioDuration: recordResult.duration,
        transcription: recordResult.transcription || liveTranscription,
        category: 'remarquable',
      };

      // Sauvegarder dans IndexedDB
      await dbService.savePoint(newPoint);

      setPoints((prev) => [newPoint, ...prev]);
      setSelectedPoint(newPoint);
      setSelectedPointId(newPoint.id);

      // Retours sensoriels
      audioFeedback.playRecordStop(audioSettings);

      const promptText = `Point ${newPointNumber} marqué. Précision ${coords.accuracy.toFixed(0)} mètres.`;
      audioFeedback.speak(promptText, audioSettings);
    } catch (err) {
      console.error('Error saving GPS voice point:', err);
      audioFeedback.playError(audioSettings);
    } finally {
      isStoppingRef.current = false;
      isStartingRef.current = false;
    }
  }, [points.length, liveTranscription, audioSettings]);

  // 4. Déclencheur Bluetooth unifié
  const handleTriggerAction = useCallback((source: string) => {
    if (isRecordingRef.current) {
      stopRecordingFlow();
    } else {
      startRecordingFlow(source);
    }
  }, [startRecordingFlow, stopRecordingFlow]);

  useEffect(() => {
    const unsubscribe = bluetoothService.onTrigger((source) => {
      handleTriggerAction(source);
    });

    return () => {
      unsubscribe();
    };
  }, [handleTriggerAction]);

  // 5. Gestion des points
  const handleSaveEditedPoint = async (updated: GpsPoint) => {
    await dbService.savePoint(updated);
    setPoints((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedPoint?.id === updated.id) {
      setSelectedPoint(updated);
    }
  };

  const handleDeletePoint = async (id: string) => {
    await dbService.deletePoint(id);
    setPoints((prev) => prev.filter((p) => p.id !== id));
    if (selectedPointId === id) {
      setSelectedPointId(null);
      setSelectedPoint(null);
    }
  };

  const handleClearAll = async () => {
    await dbService.clearAll();
    setPoints([]);
    setSelectedPoint(null);
    setSelectedPointId(null);
  };

  const handleSelectPoint = (point: GpsPoint) => {
    setSelectedPoint(point);
    setSelectedPointId(point.id);
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* En-tête globale */}
      <Header
        gpsLocation={currentLocation}
        bluetoothConfig={bluetoothConfig}
        audioSettings={audioSettings}
        pointsCount={points.length}
        theme={theme}
        onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenQrCodeModal={() => setIsQrCodeModalOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        onToggleMute={() =>
          setAudioSettings((prev) => ({ ...prev, beepsEnabled: !prev.beepsEnabled }))
        }
        onToggleVibrate={() =>
          setAudioSettings((prev) => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))
        }
      />

      {/* Bannière d'état hors-ligne */}
      <OfflineBanner />

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4 pb-28">
        {/* Navigation par onglets (sur mobile) */}
        <div
          className={`flex items-center justify-between lg:hidden border-b pb-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div
            className={`flex items-center gap-1 p-1 rounded-2xl border ${
              isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <button
              onClick={() => setActiveTab('map')}
              id="tab-btn-map"
              type="button"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Carte ({points.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              id="tab-btn-list"
              type="button"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Liste des points</span>
            </button>
          </div>
        </div>

        {/* Disposition Desktop en 2 colonnes / Mobile avec bascule d'onglets */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
          {/* Colonne Carte */}
          <div
            className={`lg:col-span-7 flex flex-col h-[480px] lg:h-[700px] ${
              activeTab === 'map' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <MapViewer
              points={points}
              currentLocation={currentLocation}
              selectedPointId={selectedPointId}
              theme={theme}
              onSelectPoint={handleSelectPoint}
            />
          </div>

          {/* Colonne Liste des points & notes vocales */}
          <div
            className={`lg:col-span-5 flex flex-col h-[520px] lg:h-[700px] ${
              activeTab === 'list' ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div
              className={`border rounded-3xl p-4 sm:p-5 flex flex-col h-full shadow-sm transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 shadow-slate-200/50'
                  : 'bg-slate-900/90 border-slate-800 shadow-black/40'
              }`}
            >
              <div
                className={`flex items-center justify-between mb-3.5 border-b pb-3 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Relevés de terrain ({points.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  id="btn-quick-export"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter ({points.length})</span>
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                <PointsList
                  points={points}
                  selectedPointId={selectedPointId}
                  onSelectPoint={handleSelectPoint}
                  onEditPoint={(pt) => setEditingPoint(pt)}
                  onDeletePoint={handleDeletePoint}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Barre flottante d'enregistrement réactive */}
      {!pocketModeActive && (
        <LiveRecordingBar
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          liveTranscription={liveTranscription}
          audioMeterLevel={audioMeterLevel}
          currentLocation={currentLocation}
          lastTriggerSource={lastTriggerSource}
          onTriggerRecord={() => handleTriggerAction('Bouton Écran')}
        />
      )}

      {/* Écran plein écran Mode Poche */}
      {pocketModeActive && (
        <PocketModeScreen
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          liveTranscription={liveTranscription}
          audioMeterLevel={audioMeterLevel}
          lastPoint={points[0] || null}
          currentLocation={currentLocation}
          lastTriggerSource={lastTriggerSource}
          onManualTrigger={() => handleTriggerAction('Écran Poche')}
          onExitPocketMode={() => setPocketModeActive(false)}
        />
      )}

      {/* Modale d'édition de point */}
      {editingPoint && (
        <PointDetailModal
          point={editingPoint}
          onClose={() => setEditingPoint(null)}
          onSave={handleSaveEditedPoint}
        />
      )}

      {/* Modale de configuration Bluetooth */}
      {isBluetoothModalOpen && (
        <BluetoothConfigModal
          config={bluetoothConfig}
          audioSettings={audioSettings}
          onUpdateConfig={(cfg) => setBluetoothConfig((prev) => ({ ...prev, ...cfg }))}
          onUpdateAudioSettings={(st) => setAudioSettings((prev) => ({ ...prev, ...st }))}
          onClose={() => setIsBluetoothModalOpen(false)}
        />
      )}

      {/* Modale d'exportation */}
      {isExportModalOpen && (
        <ExportModal
          points={points}
          onClose={() => setIsExportModalOpen(false)}
          onClearAll={handleClearAll}
        />
      )}

      {/* Modale QR Code Smartphone */}
      <QrCodeModal
        isOpen={isQrCodeModalOpen}
        onClose={() => setIsQrCodeModalOpen(false)}
      />

      {/* Modale Application Android & Fichier APK */}
      <AndroidApkModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
        deferredPrompt={deferredInstallPrompt}
        onInstallPwa={handleInstallPwa}
      />
    </div>
  );
}
