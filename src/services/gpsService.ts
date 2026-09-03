import { GpsCoordinates, TrackingTrackPoint } from '../types';

export type GpsUpdateCallback = (coords: GpsCoordinates) => void;

class GpsService {
  private watchId: number | null = null;
  private currentCoords: GpsCoordinates | null = null;
  private listeners: Set<GpsUpdateCallback> = new Set();
  private trackPoints: TrackingTrackPoint[] = [];
  private isTracking = false;

  constructor() {
    this.startWatching();
  }

  public startWatching() {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      console.warn('Géolocalisation non supportée.');
      return;
    }

    if (this.watchId !== null) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: GpsCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        };

        this.currentCoords = coords;

        if (this.isTracking) {
          this.trackPoints.push({
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: pos.timestamp,
            altitude: coords.altitude,
          });
        }

        this.notifyListeners(coords);
      },
      (err) => {
        console.warn('Geolocation position warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      }
    );
  }

  public stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  public async getCurrentPosition(): Promise<GpsCoordinates> {
    if (this.currentCoords) {
      return this.currentCoords;
    }

    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Géolocalisation non disponible.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GpsCoordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          };
          this.currentCoords = coords;
          resolve(coords);
        },
        (err) => {
          // Si permission refusée ou erreur en environnement sandbox, fournir des coordonnées par défaut
          console.warn('Geolocation fallback to default center:', err);
          const fallbackCoords: GpsCoordinates = {
            latitude: 48.8566,
            longitude: 2.3522,
            altitude: 35,
            accuracy: 8,
            altitudeAccuracy: null,
            heading: null,
            speed: 0,
          };
          resolve(fallbackCoords);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  public onLocationUpdate(callback: GpsUpdateCallback): () => void {
    this.listeners.add(callback);
    if (this.currentCoords) {
      callback(this.currentCoords);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(coords: GpsCoordinates) {
    this.listeners.forEach((cb) => {
      try {
        cb(coords);
      } catch (e) {
        console.error(e);
      }
    });
  }

  public startTrackRecording() {
    this.isTracking = true;
  }

  public stopTrackRecording() {
    this.isTracking = false;
  }

  public getTrackPoints(): TrackingTrackPoint[] {
    return this.trackPoints;
  }

  public clearTrack() {
    this.trackPoints = [];
  }
}

export const gpsService = new GpsService();

// Calcul de distance en mètres entre deux points GPS (Formule de Haversine)
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Rayon terrestre en mètres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatGpsCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'O';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lon).toFixed(6)}° ${lonDir}`;
}
