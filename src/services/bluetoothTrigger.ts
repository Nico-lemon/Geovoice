import { BluetoothConfig, VolumeTriggerMode } from '../types';

export interface TriggerEventInfo {
  source: string;
  isVolume: boolean;
  direction?: 'up' | 'down';
  rawKey?: string;
  timestamp: number;
}

export type TriggerCallback = (source: string, info?: TriggerEventInfo) => void;

class BluetoothTriggerService {
  private config: BluetoothConfig = {
    mode: 'all',
    behavior: 'toggle',
    customKeyCodes: [
      'AudioVolumeUp',
      'AudioVolumeDown',
      'VolumeUp',
      'VolumeDown',
      'AudioVolumeMute',
      'VolumeMute',
      'Space',
      'Enter',
      'MediaPlayPause',
      'MediaTrackNext',
      'MediaTrackPrevious',
      'MediaStop',
      'ArrowUp',
      'ArrowDown',
      'PageUp',
      'PageDown'
    ],
    volumeTriggerMode: 'both',
    preventVolumeAction: true,
    isConnectedBle: false,
    pocketModeActive: false,
    keepScreenAwake: true
  };

  private listeners: Set<TriggerCallback> = new Set();
  private bleDevice: any = null;
  private bleServer: any = null;
  private wakeLockSentinel: any = null;
  private silentAudio: HTMLAudioElement | null = null;
  private lastTriggerTime = 0;
  private lastTriggerInfo: TriggerEventInfo | null = null;

  constructor() {
    this.initKeyboardListener();
    this.initMediaSession();
  }

  public setConfig(newConfig: Partial<BluetoothConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.config.keepScreenAwake) {
      this.acquireWakeLock();
    } else {
      this.releaseWakeLock();
    }
  }

  public getConfig(): BluetoothConfig {
    return { ...this.config };
  }

  public getLastTriggerInfo(): TriggerEventInfo | null {
    return this.lastTriggerInfo;
  }

  public onTrigger(callback: TriggerCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private dispatchTrigger(source: string, infoDetails?: Partial<TriggerEventInfo>) {
    const now = Date.now();
    // Anti-rebond (debounce) de 350ms pour éviter les doubles appuis involontaires
    if (now - this.lastTriggerTime < 350) {
      return;
    }
    this.lastTriggerTime = now;

    const fullInfo: TriggerEventInfo = {
      source,
      isVolume: infoDetails?.isVolume ?? false,
      direction: infoDetails?.direction,
      rawKey: infoDetails?.rawKey,
      timestamp: now,
      ...infoDetails
    };

    this.lastTriggerInfo = fullInfo;
    this.config.lastVolumeTriggerTime = now;
    if (fullInfo.direction) {
      this.config.lastVolumeDirection = fullInfo.direction;
    }

    this.listeners.forEach((cb) => {
      try {
        cb(source, fullInfo);
      } catch (e) {
        console.error('Trigger callback error:', e);
      }
    });
  }

  // Active le son silencieux pour maintenir le MediaSession actif en arrière-plan / dans la poche
  public activateBackgroundAudio() {
    try {
      if (!this.silentAudio) {
        // Data URI d'un WAV silencieux de 1 seconde en boucle
        const silentWavBase64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this.silentAudio = new Audio(silentWavBase64);
        this.silentAudio.loop = true;
        this.silentAudio.volume = 0.01;

        // Détection éventuelle de variation de volume sur l'élément audio
        this.silentAudio.addEventListener('volumechange', () => {
          this.dispatchTrigger('Volume Système (volumechange)', {
            isVolume: true,
            rawKey: 'volumechange'
          });
        });
      }
      this.silentAudio.play().catch(() => {
        // Nécessite une première interaction utilisateur
      });
    } catch {
      // ignore
    }
  }

  private initMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'GeoVoice - Déclencheur Tactique',
          artist: 'Bouton Bluetooth / Volume actif',
          album: 'Marquage GPS de terrain',
          artwork: [
            {
              src: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=128&auto=format&fit=crop&q=80',
              sizes: '128x128',
              type: 'image/jpeg'
            }
          ]
        });

        const handleMediaAction = (actionName: string) => {
          this.dispatchTrigger(`Bouton Média (${actionName})`, {
            isVolume: false,
            rawKey: actionName
          });
        };

        const actions: MediaSessionAction[] = [
          'play',
          'pause',
          'stop',
          'nexttrack',
          'previoustrack'
        ];

        actions.forEach((action) => {
          try {
            navigator.mediaSession.setActionHandler(action, () => handleMediaAction(action));
          } catch {
            // Certaines actions peuvent ne pas être supportées
          }
        });
      } catch (e) {
        console.warn('MediaSession init notice:', e);
      }
    }
  }

  /**
   * Analyse si un événement de touche clavier correspond à une touche Volume
   * (Volume +, Volume -, Volume Mute) émise par les télécommandes Bluetooth ou boutons physiques.
   */
  public analyzeVolumeKey(e: KeyboardEvent): { isVolume: boolean; direction?: 'up' | 'down' } {
    const key = (e.key || '').toLowerCase();
    const code = (e.code || '').toLowerCase();
    const keyCode = e.keyCode || e.which;

    // Touche Volume Haut (Standard W3C, Android KeyCode 24, KeyboardEvent.keyCode 175)
    if (
      key === 'audiovolumeup' ||
      key === 'volumeup' ||
      code === 'audiovolumeup' ||
      code === 'volumeup' ||
      keyCode === 175 ||
      keyCode === 24
    ) {
      return { isVolume: true, direction: 'up' };
    }

    // Touche Volume Bas (Standard W3C, Android KeyCode 25, KeyboardEvent.keyCode 174)
    if (
      key === 'audiovolumedown' ||
      key === 'volumedown' ||
      code === 'audiovolumedown' ||
      code === 'volumedown' ||
      keyCode === 174 ||
      keyCode === 25
    ) {
      return { isVolume: true, direction: 'down' };
    }

    // Touche Volume Muet (parfois sur télécommandes de casque)
    if (
      key === 'audiovolumemute' ||
      key === 'volumemute' ||
      code === 'audiovolumemute' ||
      code === 'volumemute' ||
      keyCode === 173 ||
      keyCode === 164
    ) {
      return { isVolume: true };
    }

    return { isVolume: false };
  }

  private initKeyboardListener() {
    if (typeof window === 'undefined') return;

    const handleKey = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur saisit du texte dans un champ de formulaire
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 1. Vérification spécifique des touches Volume (+ / -)
      const volumeAnalysis = this.analyzeVolumeKey(e);
      if (volumeAnalysis.isVolume) {
        const filter = this.config.volumeTriggerMode || 'both';

        // Filtrer selon la préférence utilisateur si configurée
        if (filter === 'upOnly' && volumeAnalysis.direction === 'down') {
          return;
        }
        if (filter === 'downOnly' && volumeAnalysis.direction === 'up') {
          return;
        }

        if (this.config.preventVolumeAction) {
          try {
            e.preventDefault();
            e.stopPropagation();
          } catch {
            // ignore
          }
        }

        const dirLabel =
          volumeAnalysis.direction === 'up'
            ? 'Volume +'
            : volumeAnalysis.direction === 'down'
            ? 'Volume -'
            : 'Volume';

        this.dispatchTrigger(`Déclencheur Bluetooth (${dirLabel})`, {
          isVolume: true,
          direction: volumeAnalysis.direction,
          rawKey: e.code || e.key
        });
        return;
      }

      // 2. Vérification des touches Bluetooth / Selfie / Manette additionnelles
      const isCustomMatched = this.config.customKeyCodes.some((code) => {
        return e.code === code || e.key === code;
      });

      const isShutterMatch =
        e.code === 'Space' ||
        e.code === 'Enter' ||
        e.key === 'MediaPlayPause' ||
        e.key === 'MediaTrackNext' ||
        e.key === 'MediaTrackPrevious' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'PageUp' ||
        e.code === 'PageDown';

      if (isCustomMatched || isShutterMatch) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
        }

        const keyLabel =
          e.code === 'Enter'
            ? 'Bouton Shutter (Enter)'
            : e.code === 'Space'
            ? 'Bouton Shutter (Espace)'
            : `Bouton Bluetooth (${e.code || e.key})`;

        this.dispatchTrigger(keyLabel, {
          isVolume: false,
          rawKey: e.code || e.key
        });
      }
    };

    // Écoute en phase de capture sur window et document pour intercepter avant tout autre élément
    window.addEventListener('keydown', handleKey, { capture: true });
    document.addEventListener('keydown', handleKey, { capture: true });

    // Écoute des événements natifs injectés par l'APK Android (Capacitor / Android WebView)
    const handleNativeVolume = (e: any) => {
      const detail = e.detail || {};
      const direction: 'up' | 'down' = detail.direction === 'down' ? 'down' : 'up';
      const filter = this.config.volumeTriggerMode || 'both';

      if (filter === 'upOnly' && direction === 'down') return;
      if (filter === 'downOnly' && direction === 'up') return;

      const dirLabel = direction === 'up' ? 'Volume +' : 'Volume -';
      this.dispatchTrigger(`Déclencheur Matériel APK (${dirLabel})`, {
        isVolume: true,
        direction,
        rawKey: `KEYCODE_VOLUME_${direction.toUpperCase()}`
      });
    };

    window.addEventListener('nativeVolumeTrigger', handleNativeVolume);
    window.addEventListener('volume_button', handleNativeVolume);
    window.addEventListener('volumeChange', handleNativeVolume);

    // S'assurer que le document récupère le focus dès une interaction tactile
    document.addEventListener(
      'pointerdown',
      () => {
        try {
          window.focus();
        } catch {
          // ignore
        }
      },
      { passive: true }
    );
  }

  // Support Web Bluetooth API pour boutons BLE dédiés (Flic, iTag, Xiaomi, etc.)
  public async connectBleDevice(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!('bluetooth' in navigator)) {
      return {
        success: false,
        error: "Web Bluetooth n'est pas supporté par ce navigateur. Utilisez le mode standard Volume / Clavier."
      };
    }

    try {
      this.bleDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'generic_access',
          'battery_service',
          'immediate_alert',
          '0000ffe0-0000-1000-8000-00805f9b34fb', // iTag / Simple Key service
          '00001802-0000-1000-8000-00805f9b34fb'
        ]
      });

      if (!this.bleDevice) {
        return { success: false, error: 'Aucun appareil sélectionné.' };
      }

      this.bleDevice.addEventListener('gattserverdisconnected', () => {
        this.config.isConnectedBle = false;
        this.config.bleDeviceName = undefined;
      });

      if (this.bleDevice.gatt) {
        this.bleServer = await this.bleDevice.gatt.connect();
        this.config.isConnectedBle = true;
        this.config.bleDeviceName = this.bleDevice.name || 'Bouton BLE';
        this.config.bleDeviceId = this.bleDevice.id;

        // Essayer d'écouter les caractéristiques de notification de bouton
        try {
          const services = await this.bleServer.getPrimaryServices();
          for (const service of services) {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.notify || char.properties.indicate) {
                await char.startNotifications();
                char.addEventListener('characteristicvaluechanged', () => {
                  this.dispatchTrigger(`Bouton BLE (${this.bleDevice?.name || 'GATT'})`, {
                    isVolume: false,
                    rawKey: 'BLE_GATT'
                  });
                });
              }
            }
          }
        } catch {
          // Même si la lecture GATT échoue, la connexion est établie
        }

        return { success: true, deviceName: this.config.bleDeviceName };
      }

      return { success: true, deviceName: this.bleDevice.name || 'Appareil connecté' };
    } catch (err: unknown) {
      const error = err as Error;
      return { success: false, error: error.message || 'Échec de connexion Bluetooth BLE' };
    }
  }

  public disconnectBle() {
    if (this.bleDevice && this.bleDevice.gatt && this.bleDevice.gatt.connected) {
      this.bleDevice.gatt.disconnect();
    }
    this.bleDevice = null;
    this.bleServer = null;
    this.config.isConnectedBle = false;
    this.config.bleDeviceName = undefined;
  }

  // WakeLock pour garder l'appareil actif en poche
  public async acquireWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!this.wakeLockSentinel) {
          this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          this.wakeLockSentinel.addEventListener('release', () => {
            this.wakeLockSentinel = null;
          });
        }
      } catch {
        // Ignorer si refusé
      }
    }
  }

  public releaseWakeLock() {
    if (this.wakeLockSentinel) {
      this.wakeLockSentinel.release().catch(() => {});
      this.wakeLockSentinel = null;
    }
  }

  // Déclenchement manuel simulé (pour l'interface ou les tests)
  public triggerManual(source = 'Bouton Test', isVolume = false, direction?: 'up' | 'down') {
    this.dispatchTrigger(source, { isVolume, direction, rawKey: 'ManualTest' });
  }
}

export const bluetoothService = new BluetoothTriggerService();
