export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
}

export interface GpsPoint {
  id: string;
  timestamp: number;
  title: string;
  coords: GpsCoordinates;
  audioBlob?: Blob;
  audioDuration: number; // in seconds
  transcription: string;
  notes?: string;
  category: 'remarquable' | 'obstacle' | 'faune_flore' | 'travaux' | 'orientation' | 'divers';
  isFavorite?: boolean;
}

export type TriggerMode = 'media' | 'ble' | 'keyboard' | 'all';
export type RecordingBehavior = 'pushToTalk' | 'toggle' | 'timer5s' | 'timer10s';

export interface BluetoothConfig {
  mode: TriggerMode;
  behavior: RecordingBehavior;
  customKeyCodes: string[];
  bleDeviceName?: string;
  bleDeviceId?: string;
  bleServiceUuid?: string;
  bleCharUuid?: string;
  isConnectedBle: boolean;
  pocketModeActive: boolean;
  keepScreenAwake: boolean;
}

export interface AudioFeedbackSettings {
  beepsEnabled: boolean;
  vibrationEnabled: boolean;
  voicePromptEnabled: boolean;
  voiceLanguage: string;
  beepVolume: number;
}

export interface TrackingTrackPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  altitude: number | null;
}
