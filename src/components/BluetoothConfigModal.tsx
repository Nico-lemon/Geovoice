import React, { useState, useEffect } from 'react';
import { BluetoothConfig, AudioFeedbackSettings, VolumeTriggerMode } from '../types';
import { bluetoothService, TriggerEventInfo } from '../services/bluetoothTrigger';
import { audioFeedback } from '../services/audioFeedback';
import {
  X,
  Bluetooth,
  Radio,
  Volume2,
  VolumeX,
  Vibrate,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Info,
  Sliders,
  Volume1,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface BluetoothConfigModalProps {
  config: BluetoothConfig;
  audioSettings: AudioFeedbackSettings;
  onUpdateConfig: (newConfig: Partial<BluetoothConfig>) => void;
  onUpdateAudioSettings: (newSettings: Partial<AudioFeedbackSettings>) => void;
  onClose: () => void;
  onOpenAndroidModal?: () => void;
}

export const BluetoothConfigModal: React.FC<BluetoothConfigModalProps> = ({
  config,
  audioSettings,
  onUpdateConfig,
  onUpdateAudioSettings,
  onClose,
  onOpenAndroidModal,
}) => {
  const [isScanningBle, setIsScanningBle] = useState(false);
  const [lastEvent, setLastEvent] = useState<TriggerEventInfo | null>(null);
  const [bleError, setBleError] = useState<string | null>(null);
  const [testCount, setTestCount] = useState(0);

  // Écouter les appuis réels pour le banc de test
  useEffect(() => {
    const unsubscribe = bluetoothService.onTrigger((source, info) => {
      setLastEvent(
        info || {
          source,
          isVolume: source.toLowerCase().includes('volume'),
          timestamp: Date.now()
        }
      );
      setTestCount((c) => c + 1);

      // Bip de confirmation sonore
      audioFeedback.playRecordStart(audioSettings);
      setTimeout(() => {
        audioFeedback.playRecordStop(audioSettings);
      }, 300);
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

  const handleSimulateVolumeUp = () => {
    bluetoothService.triggerManual('Déclencheur Bluetooth (Volume +)', true, 'up');
  };

  const handleSimulateVolumeDown = () => {
    bluetoothService.triggerManual('Déclencheur Bluetooth (Volume -)', true, 'down');
  };

  const handleSimulateShutter = () => {
    bluetoothService.triggerManual('Bouton Shutter (Enter)', false);
  };

  const currentFilter: VolumeTriggerMode = config.volumeTriggerMode || 'both';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div className="bg-[#172025] border-2 border-[#4A6B52] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-[8px_8px_0px_#000000] overflow-hidden text-[#CFCFCF]">
        {/* En-tête tactique */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b-2 border-[#4A6B52] bg-[#12181B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#172025] border-2 border-[#4A6B52] text-[#FF6B35] flex items-center justify-center shadow-[2px_2px_0px_#000000] font-black shrink-0">
              <Bluetooth className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white uppercase tracking-wider font-tech">
                  DÉCLENCHEUR BLUETOOTH & VOLUME
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#4A6B52] text-white border border-[#707B71]">
                  VOL +/-
                </span>
              </div>
              <p className="text-xs text-[#8E9CA3]">
                Télécommandes selfie, boutons volume et casques audio en poche
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-bt-modal"
            type="button"
            className="w-8 h-8 flex items-center justify-center border-2 border-[#4A6B52] bg-[#172025] hover:bg-[#FF6B35] hover:text-black hover:border-black text-[#CFCFCF] transition-colors shadow-[2px_2px_0px_#000000] cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Contenu avec défilement */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* SECTION CRITIQUE : Explication claire sur l'effet Volume */}
          <div className="bg-[#12181B] border-2 border-[#FF6B35] p-4 shadow-[4px_4px_0px_#000000] space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-[#FF6B35] shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h4 className="font-black text-white uppercase tracking-wider text-sm flex items-center gap-2">
                  <span>POURQUOI LE BOUTON MODIFIE LE VOLUME DU TÉLÉPHONE ?</span>
                  <span className="text-[10px] bg-[#FF6B35] text-black px-1.5 py-0.2 font-mono font-bold">
                    INFO TECHNIQUE
                  </span>
                </h4>
                <p className="text-xs text-[#CFCFCF] leading-relaxed">
                  Votre télécommande Bluetooth (shutter selfie, bouton guidon, commande d'écouteurs)
                  est conçue comme un mini-clavier émettant les touches matérielles{' '}
                  <strong className="text-white font-black underline decoration-[#FF6B35]">
                    VOLUME HAUT (+)
                  </strong>{' '}
                  ou{' '}
                  <strong className="text-white font-black underline decoration-[#FF6B35]">
                    VOLUME BAS (-)
                  </strong>
                  . Les smartphones utilisent ces touches pour déclencher la photo dans l'appareil photo natif.
                </p>
                <div className="bg-[#172025] border border-[#4A6B52] p-3 text-[11px] text-[#D1FF00] space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>DIFFÉRENCE IMPORTANTE : NAVIGATEUR CHROME vs APPLICATION APK NATIVE</span>
                  </div>
                  <p className="text-[#CFCFCF] leading-relaxed">
                    <strong>1. Dans le navigateur Chrome Mobile :</strong> Android bloque par mesure de sécurité l'accès direct aux touches de volume physique pour les pages web afin d'éviter le piratage du son. La barre de volume bouge, mais le navigateur ne transmet pas l'événement au site.
                  </p>
                  <p className="text-[#CFCFCF] leading-relaxed">
                    <strong>2. En version APK installée (Application Android) :</strong> L'application a un accès matériel complet à l'OS Android (<code className="text-[#D1FF00] bg-black px-1">KEYCODE_VOLUME_UP</code>). Elle intercepte le bouton physique sans même afficher la barre de volume et peut fonctionner écran éteint dans votre poche !
                  </p>
                  {onOpenAndroidModal && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={onOpenAndroidModal}
                        className="w-full py-2 px-3 bg-[#4A6B52] hover:bg-[#D1FF00] hover:text-black text-white font-bold text-xs uppercase border border-[#707B71] transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000000] cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>GÉNÉRER L'APPLICATION ANDROID (FICHIER APK)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BANC D'ESSAI EN TEMPS RÉEL (TESTEUR DE TOUCHES) */}
          <div className="bg-[#12181B] border-2 border-[#4A6B52] p-4 shadow-[4px_4px_0px_#000000] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2E3E47] pb-2.5">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF6B35] animate-pulse" />
                <span className="font-black text-white uppercase text-xs sm:text-sm tracking-wider">
                  BANC DE TEST EN DIRECT // VÉRIFICATION SIGNAL
                </span>
              </div>
              <span className="text-[10px] text-[#8E9CA3]">
                {testCount > 0 ? `${testCount} impulsion(s) reçue(s)` : 'En attente de signal'}
              </span>
            </div>

            <p className="text-xs text-[#8E9CA3]">
              Appuyez sur votre bouton Bluetooth physique ou les touches de volume de votre téléphone.
              Le voyant réagira instantanément avec un double signal sonore.
            </p>

            {/* Console de retour visuel */}
            <div
              className={`p-3.5 border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                lastEvent
                  ? 'bg-[#172025] border-[#D1FF00] text-white shadow-[2px_2px_0px_#000000]'
                  : 'bg-[#12181B] border-[#2E3E47] text-[#8E9CA3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 border-2 shrink-0 ${
                    lastEvent
                      ? 'bg-[#D1FF00] border-black animate-ping'
                      : 'bg-[#2E3E47] border-[#707B71]'
                  }`}
                />
                <div>
                  <div className="font-mono font-black text-xs sm:text-sm flex items-center gap-2">
                    {lastEvent ? (
                      <>
                        <span className="text-[#D1FF00] uppercase">SIGNAL CAPTÉ :</span>
                        <span className="text-white bg-[#12181B] px-2 py-0.5 border border-[#4A6B52]">
                          {lastEvent.source}
                        </span>
                      </>
                    ) : (
                      <span>CLIQUEZ SUR VOTRE TÉLÉCOMMANDE OU TOUCHE VOLUME...</span>
                    )}
                  </div>
                  {lastEvent && (
                    <div className="text-[11px] text-[#8E9CA3] mt-0.5">
                      Code brut : {lastEvent.rawKey || 'N/A'} • Type :{' '}
                      {lastEvent.isVolume ? 'TOUCHE VOLUME' : 'TOUCHE BLUETOOTH'}
                    </div>
                  )}
                </div>
              </div>

              {lastEvent && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#D1FF00] bg-[#12181B] px-2.5 py-1 border border-[#D1FF00] self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>OPÉRATIONNEL</span>
                </div>
              )}
            </div>

            {/* Boutons de simulation pour tester immédiatement dans le navigateur */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-[#8E9CA3]">TEST MANUEL :</span>
              <button
                type="button"
                onClick={handleSimulateVolumeUp}
                id="btn-test-vol-up"
                className="px-2.5 py-1 bg-[#172025] hover:bg-[#4A6B52] text-white border border-[#4A6B52] hover:border-white text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Simuler Volume +</span>
              </button>
              <button
                type="button"
                onClick={handleSimulateVolumeDown}
                id="btn-test-vol-down"
                className="px-2.5 py-1 bg-[#172025] hover:bg-[#4A6B52] text-white border border-[#4A6B52] hover:border-white text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
              >
                <Volume1 className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>Simuler Volume -</span>
              </button>
              <button
                type="button"
                onClick={handleSimulateShutter}
                id="btn-test-shutter"
                className="px-2.5 py-1 bg-[#172025] hover:bg-[#4A6B52] text-white border border-[#4A6B52] hover:border-white text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-[#D1FF00]" />
                <span>Simuler Shutter</span>
              </button>
            </div>
          </div>

          {/* FILTRE ET CONFIGURATION DES TOUCHES VOLUME */}
          <div className="bg-[#12181B] border-2 border-[#4A6B52] p-4 shadow-[4px_4px_0px_#000000] space-y-3">
            <div className="flex items-center gap-2 border-b border-[#2E3E47] pb-2">
              <Sliders className="w-4 h-4 text-[#4A6B52]" />
              <h4 className="font-black text-white uppercase text-xs sm:text-sm tracking-wider">
                SÉLECTEUR DE TOUCHES VOLUME ACTIVES
              </h4>
            </div>

            <p className="text-xs text-[#8E9CA3]">
              Choisissez quelles touches de volume de votre télécommande ou de votre smartphone doivent déclencher la capture GPS :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'both',
                  title: 'VOL + & VOL - (LES DEUX)',
                  desc: 'Recommandé. N’importe quel bouton de la télécommande déclenche.',
                  icon: Volume2,
                },
                {
                  id: 'upOnly',
                  title: 'VOLUME + UNIQUEMENT',
                  desc: 'Ignore les appuis Volume - (évite les conflits avec le son).',
                  icon: Volume2,
                },
                {
                  id: 'downOnly',
                  title: 'VOLUME - UNIQUEMENT',
                  desc: 'Ignore les appuis Volume +.',
                  icon: Volume1,
                },
              ].map((opt) => {
                const isSelected = currentFilter === opt.id;
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateConfig({ volumeTriggerMode: opt.id as VolumeTriggerMode })}
                    className={`p-3 border-2 text-left transition-all cursor-pointer shadow-[2px_2px_0px_#000000] flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#172025] border-[#FF6B35] text-white ring-1 ring-[#FF6B35]'
                        : 'bg-[#12181B] border-[#2E3E47] text-[#8E9CA3] hover:border-[#4A6B52]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase mb-1">
                        <IconComp
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-[#FF6B35]' : 'text-[#8E9CA3]'
                          }`}
                        />
                        <span className={isSelected ? 'text-white' : 'text-[#CFCFCF]'}>
                          {opt.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E9CA3] leading-snug">{opt.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] font-black text-[#FF6B35] uppercase mt-2 tracking-wider">
                        [SÉLECTIONNÉ]
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COMPORTEMENT D'ENREGISTREMENT LORS DE L'APPUI */}
          <div className="bg-[#12181B] border-2 border-[#4A6B52] p-4 shadow-[4px_4px_0px_#000000] space-y-3">
            <h4 className="font-black text-white uppercase text-xs sm:text-sm tracking-wider border-b border-[#2E3E47] pb-2">
              COMPORTEMENT LORS DU CLIC PHYSIQUE
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'toggle',
                  title: '1er appui = DÉBUT / 2e = FIN',
                  desc: 'Mode standard. Permet de dicter un mémo de n’importe quelle longueur sans rester appuyé.',
                },
                {
                  id: 'timer5s',
                  title: 'MINITEUR AUTO 5 SECONDES',
                  desc: 'Un seul clic = 5 secondes de dictée vocale puis sauvegarde automatique du point.',
                },
                {
                  id: 'timer10s',
                  title: 'MINITEUR AUTO 10 SECONDES',
                  desc: 'Un seul clic = 10 secondes d’enregistrement pour les descriptions détaillées.',
                },
                {
                  id: 'pushToTalk',
                  title: 'MAINTENIR APPUYÉ (PUSH-TO-TALK)',
                  desc: 'Enregistre tant que le bouton physique reste enfoncé dans votre main.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateConfig({ behavior: opt.id as any })}
                  className={`p-3 border-2 text-left transition-all cursor-pointer shadow-[2px_2px_0px_#000000] ${
                    config.behavior === opt.id
                      ? 'bg-[#172025] border-[#D1FF00] text-white ring-1 ring-[#D1FF00]'
                      : 'bg-[#12181B] border-[#2E3E47] text-[#8E9CA3] hover:border-[#4A6B52]'
                  }`}
                >
                  <div className="font-black text-xs uppercase mb-1 text-white">
                    {opt.title}
                  </div>
                  <p className="text-[11px] text-[#8E9CA3] leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* RETOURS HAPTIQUES & SONORES EN POCHE */}
          <div className="bg-[#12181B] border-2 border-[#4A6B52] p-4 shadow-[4px_4px_0px_#000000] space-y-3">
            <h4 className="font-black text-white uppercase text-xs sm:text-sm tracking-wider border-b border-[#2E3E47] pb-2">
              SIGNAUX SENSORIELS SANS REGARDER L'ÉCRAN
            </h4>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer p-2.5 bg-[#172025] border border-[#2E3E47] hover:border-[#4A6B52]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#12181B] border border-[#4A6B52] text-[#FF6B35] flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-white uppercase">
                      Bips sonores tactiques
                    </div>
                    <div className="text-[11px] text-[#8E9CA3]">
                      Bip aigu au déclic, bip grave à la fin de la mémorisation
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioSettings.beepsEnabled}
                  onChange={(e) => onUpdateAudioSettings({ beepsEnabled: e.target.checked })}
                  className="w-5 h-5 accent-[#FF6B35] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 bg-[#172025] border border-[#2E3E47] hover:border-[#4A6B52]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#12181B] border border-[#4A6B52] text-[#FF6B35] flex items-center justify-center">
                    <Vibrate className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-xs text-white uppercase">
                      Retour par vibration haptique
                    </div>
                    <div className="text-[11px] text-[#8E9CA3]">
                      Impulsion physique dans la poche au début et à la validation du point
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioSettings.vibrationEnabled}
                  onChange={(e) => onUpdateAudioSettings({ vibrationEnabled: e.target.checked })}
                  className="w-5 h-5 accent-[#FF6B35] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* WEb BLUETOOTH BLE AVANCÉ (OPTIONNEL) */}
          <div className="bg-[#12181B] border border-[#2E3E47] p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#8E9CA3] uppercase text-[11px]">
                APPAIRAGE WEB BLUETOOTH GATT (FLIC, ITAG, BOUTON BLE)
              </span>
              {config.isConnectedBle ? (
                <span className="text-[10px] bg-[#4A6B52] text-white px-2 py-0.5 border border-[#707B71] font-black">
                  CONNECTÉ : {config.bleDeviceName || 'BLE DEVICE'}
                </span>
              ) : (
                <span className="text-[10px] text-[#8E9CA3]">NON REQUIS POUR LES SHUTTERS VOLUME</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {config.isConnectedBle ? (
                <button
                  type="button"
                  onClick={handleDisconnectBle}
                  className="px-3 py-1.5 bg-[#172025] hover:bg-[#FF6B35] hover:text-black border border-[#FF6B35] text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#000000]"
                >
                  Déconnecter BLE
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectBle}
                  disabled={isScanningBle}
                  className="px-3 py-1.5 bg-[#172025] hover:bg-[#4A6B52] border border-[#4A6B52] text-white text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#000000] flex items-center gap-1.5"
                >
                  <Bluetooth className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span>{isScanningBle ? 'Scan BLE...' : 'Appairer bouton BLE dédié'}</span>
                </button>
              )}
              {bleError && <span className="text-[11px] text-[#FF6B35] truncate">{bleError}</span>}
            </div>
          </div>
        </div>

        {/* Pied de modal avec validation tactique */}
        <div className="px-4 sm:px-6 py-3.5 border-t-2 border-[#4A6B52] bg-[#12181B] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-[#8E9CA3] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#D1FF00]"></span>
            <span>RÉCEPTEUR ACTIF : ÉCOUTE PERMANENTE DES TOUCHES VOL+ / VOL-</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="btn-close-modal-bottom"
            className="w-full sm:w-auto px-6 py-2.5 bg-[#FF6B35] hover:bg-[#ff8252] text-black font-black uppercase text-xs sm:text-sm border-2 border-black shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            VALIDER & FERMER
          </button>
        </div>
      </div>
    </div>
  );
};
