import React, { useState, useEffect } from 'react';
import { BluetoothConfig, AudioFeedbackSettings } from '../types';
import { bluetoothService } from '../services/bluetoothTrigger';
import { audioFeedback } from '../services/audioFeedback';
import {
  X,
  Bluetooth,
  Radio,
  Volume2,
  Vibrate,
  Mic,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Info,
} from 'lucide-react';

interface BluetoothConfigModalProps {
  config: BluetoothConfig;
  audioSettings: AudioFeedbackSettings;
  onUpdateConfig: (newConfig: Partial<BluetoothConfig>) => void;
  onUpdateAudioSettings: (newSettings: Partial<AudioFeedbackSettings>) => void;
  onClose: () => void;
}

export const BluetoothConfigModal: React.FC<BluetoothConfigModalProps> = ({
  config,
  audioSettings,
  onUpdateConfig,
  onUpdateAudioSettings,
  onClose,
}) => {
  const [isScanningBle, setIsScanningBle] = useState(false);
  const [lastDetectedTestKey, setLastDetectedTestKey] = useState<string | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);

  // Écouter les appuis pour le testeur interactif
  useEffect(() => {
    const unsubscribe = bluetoothService.onTrigger((source) => {
      setLastDetectedTestKey(source);
      audioFeedback.playRecordStart(audioSettings);
      setTimeout(() => {
        audioFeedback.playRecordStop(audioSettings);
      }, 400);
    });

    return () => {
      unsubscribe();
    };
  }, [audioSettings]);

  const handleConnectBle = async () => {
    setIsScanningBle(true);
    setBleError(null);
    try {
      const result = await bluetoothService.connectBleDevice();
      if (result.success) {
        onUpdateConfig({
          isConnectedBle: true,
          bleDeviceName: result.deviceName,
        });
      } else if (result.error) {
        setBleError(result.error);
      }
    } catch (e: any) {
      setBleError(e.message || 'Erreur Bluetooth BLE');
    } finally {
      setIsScanningBle(false);
    }
  };

  const handleDisconnectBle = () => {
    bluetoothService.disconnectBle();
    onUpdateConfig({
      isConnectedBle: false,
      bleDeviceName: undefined,
    });
  };

  const handleSimulateClick = () => {
    bluetoothService.triggerManual('Bouton de test');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <Bluetooth className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Configuration Déclencheur Bluetooth
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Paramétrez vos boutons physiques pour l'usage direct en poche
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-bt-modal"
            type="button"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu avec défilement */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Section 1 : Guide rapide de fonctionnement */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4" />
              <span>Comment utiliser un bouton Bluetooth en poche ?</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Vous pouvez appairer n'importe quel déclencheur Bluetooth à votre téléphone :
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-800 dark:text-slate-200 font-semibold ml-1">
              <li><strong>Télécommande selfie Bluetooth</strong> (déclencheur universel à 3€)</li>
              <li><strong>Bouton d'écouteurs / casque audio</strong> (Play/Pause ou Volume)</li>
              <li><strong>Bouton guidon vélo / télécommande volant</strong></li>
              <li><strong>Bouton connecté BLE</strong> (Flic, iTag, etc.)</li>
            </ul>
          </div>

          {/* Section 2 : Testeur de bouton en direct */}
          <div className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Testeur de déclencheur en direct</span>
              </div>
              <button
                type="button"
                onClick={handleSimulateClick}
                id="btn-simulate-trigger"
                className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
              >
                Simuler un appui
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Appuyez maintenant sur votre bouton Bluetooth. Le voyant ci-dessous s'illuminera et émettra un bip de confirmation.
            </p>

            <div
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                lastDetectedTestKey
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3 font-mono font-bold">
                <div
                  className={`w-4 h-4 rounded-full ${
                    lastDetectedTestKey
                      ? 'bg-emerald-500 animate-ping'
                      : 'bg-slate-400 dark:bg-slate-600'
                  }`}
                />
                <span>
                  {lastDetectedTestKey
                    ? `DÉTECTÉ : ${lastDetectedTestKey}`
                    : 'En attente d’un appui sur votre bouton...'}
                </span>
              </div>
              {lastDetectedTestKey && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
          </div>

          {/* Section 3 : Comportement de la commande vocale */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100">
              Comportement lors de l'appui sur le bouton
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'toggle',
                  title: '1er appui = Début / 2e = Fin',
                  desc: 'Idéal pour les mémos de longueur variable sans garder le doigt appuyé.',
                },
                {
                  id: 'timer5s',
                  title: 'Enregistrement auto 5 secondes',
                  desc: 'Un seul clic déclenche 5s de note vocale puis mémorise automatiquement.',
                },
                {
                  id: 'timer10s',
                  title: 'Enregistrement auto 10 secondes',
                  desc: 'Un seul clic déclenche 10s de note vocale pour des descriptions détaillées.',
                },
                {
                  id: 'pushToTalk',
                  title: 'Maintenir appuyé (Push-to-Talk)',
                  desc: 'Enregistre tant que le bouton physique reste enfoncé.',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => onUpdateConfig({ behavior: opt.id as any })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    config.behavior === opt.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {opt.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {opt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 : Retours haptiques et sonores en poche */}
          <div className="bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-2xl p-4 space-y-4">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100">
              Retours sensoriels pour l'usage sans regarder l'écran
            </h4>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      Bips sonores de confirmation
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Bip aigu au début, bip grave à la fin de l'enregistrement
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioSettings.beepsEnabled}
                  onChange={(e) => onUpdateAudioSettings({ beepsEnabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                    <Vibrate className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      Retour par vibration haptique
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Vibration courte lors du démarrage et de l'enregistrement du point
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioSettings.vibrationEnabled}
                  onChange={(e) => onUpdateAudioSettings({ vibrationEnabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Pied de modal */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            id="btn-close-modal-bottom"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all"
          >
            Terminer et enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
