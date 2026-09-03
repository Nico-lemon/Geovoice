import { BluetoothConfig } from '../types';

export type TriggerCallback = (source: string) => void;

class BluetoothTriggerService {
  private config: BluetoothConfig = {
    mode: 'all',
    behavior: 'toggle',
    customKeyCodes: ['Space', 'Enter', 'AudioVolumeUp', 'MediaPlayPause', 'MediaTrackNext', 'MediaStop'],
    isConnectedBle: false,
    pocketModeActive: false,
    keepScreenAwake: true
  };

  private listeners: Set<TriggerCallback> = new Set();
  private bleDevice: any = null;
  private bleServer: any = null;
  private wakeLockSentinel: any = null;
  private silentAudio: HTMLAudioElement | null = null;
  private isHandlingEvent = false;
  private lastTriggerTime = 0;

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

  public onTrigger(callback: TriggerCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private dispatchTrigger(source: string) {
    const now = Date.now();
    // Anti-rebond (debounce) de 400ms pour éviter les doubles appuis involontaires
    if (now - this.lastTriggerTime < 400) {
      return;
    }
    this.lastTriggerTime = now;

    this.listeners.forEach((cb) => {
      try {
        cb(source);
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
          title: 'GeoVoice - Déclencheur en poche',
          artist: 'Bouton Bluetooth actif',
          album: 'Marquage GPS de terrain',
          artwork: [
            { src: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=128&auto=format&fit=crop&q=80', sizes: '128x128', type: 'image/jpeg' }
          ]
        });

        const handleMediaAction = (actionName: string) => {
          this.dispatchTrigger(`Bouton Média (${actionName})`);
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

  private initKeyboardListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      // Ignorer si l'utilisateur est en train de taper dans un champ texte / formulaire
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Codes fréquents envoyés par les déclencheurs Bluetooth selfie / boutons HID
      const match = this.config.customKeyCodes.some((code) => {
        return e.code === code || e.key === code;
      });

      if (match || e.code === 'Space' || e.code === 'Enter' || e.key === 'MediaPlayPause' || e.key === 'MediaTrackNext' || e.key === 'AudioVolumeUp') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
        }
        this.dispatchTrigger(`Bouton Bluetooth (${e.code || e.key})`);
      }
    });
  }

  // Support Web Bluetooth API pour boutons BLE dédiés (Flic, iTag, Xiaomi, etc.)
  public async connectBleDevice(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (!('bluetooth' in navigator)) {
      return { success: false, error: 'Web Bluetooth n\'est pas supporté par ce navigateur.' };
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
                  this.dispatchTrigger(`Bouton BLE (${this.bleDevice?.name || 'GATT'})`);
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
  public triggerManual(source = 'Bouton Écran') {
    this.dispatchTrigger(source);
  }
}

export const bluetoothService = new BluetoothTriggerService();
