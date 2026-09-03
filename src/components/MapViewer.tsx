import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { GpsPoint, GpsCoordinates, TrackingTrackPoint } from '../types';
import {
  Layers,
  Crosshair,
  Navigation,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { formatGpsCoords } from '../services/gpsService';

// Fix pour les icônes par défaut de Leaflet avec Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewerProps {
  points: GpsPoint[];
  currentLocation: GpsCoordinates | null;
  trackPoints?: TrackingTrackPoint[];
  selectedPointId?: string | null;
  theme?: 'light' | 'dark';
  onSelectPoint?: (point: GpsPoint) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  remarquable: '#059669', // emerald
  obstacle: '#dc2626',    // red
  faune_flore: '#65a30d', // lime
  travaux: '#d97706',     // amber
  orientation: '#0891b2', // cyan
  divers: '#9333ea',      // purple
};

const CATEGORY_LABELS: Record<string, string> = {
  remarquable: 'Remarquable',
  obstacle: 'Obstacle / Alerte',
  faune_flore: 'Faune & Flore',
  travaux: 'Travaux / Chantier',
  orientation: 'Point de repère',
  divers: 'Divers',
};

const TILE_LAYERS = {
  streets: {
    name: 'Plan Clair (OpenStreetMap)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  topo: {
    name: 'Topo Randonnée (OpenTopoMap)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
  },
  satellite: {
    name: 'Satellite (Esri Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri & Maxar',
  },
};

export const MapViewer: React.FC<MapViewerProps> = ({
  points,
  currentLocation,
  trackPoints = [],
  selectedPointId,
  theme = 'light',
  onSelectPoint,
}) => {
  const isLight = theme === 'light';
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const trackPolylineRef = useRef<L.Polyline | null>(null);
  const currentPosMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayer, setActiveLayer] = useState<keyof typeof TILE_LAYERS>('streets');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [autoPlayOnClick, setAutoPlayOnClick] = useState(true);

  // État de lecture audio en direct sur la carte
  const [activeAudioPoint, setActiveAudioPoint] = useState<GpsPoint | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialisation du fond de carte
  useEffect(() => {
    setActiveLayer('streets');
  }, []);

  // Fonction pour jouer l'audio d'un point
  const playPointAudio = (point: GpsPoint) => {
    if (!point.audioBlob) return;

    if (activeAudioPoint?.id === point.id && currentAudioRef.current) {
      if (isPlaying) {
        currentAudioRef.current.pause();
        setIsPlaying(false);
      } else {
        currentAudioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
      }
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    const audioUrl = URL.createObjectURL(point.audioBlob);
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackRate;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || point.audioDuration || 0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = (e) => {
      console.warn('Audio playback error', e);
      setIsPlaying(false);
    };

    currentAudioRef.current = audio;
    setActiveAudioPoint(point);
    setCurrentTime(0);
    setDuration(point.audioDuration || 0);

    audio.play().then(() => {
      setIsPlaying(true);
    }).catch((err) => {
      console.warn('Playback error (requires user gesture):', err);
    });
  };

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setActiveAudioPoint(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const toggleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (currentAudioRef.current) {
      currentAudioRef.current.playbackRate = nextRate;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (currentAudioRef.current) {
      currentAudioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Initialisation de la carte Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = currentLocation?.latitude || (points.length > 0 ? points[0].coords.latitude : 48.8566);
    const initialLon = currentLocation?.longitude || (points.length > 0 ? points[0].coords.longitude : 2.3522);
    const initialZoom = points.length > 0 ? 15 : 13;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: false,
    });

    const tile = L.tileLayer(TILE_LAYERS[activeLayer].url, {
      attribution: TILE_LAYERS[activeLayer].attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tile;
    markersLayerRef.current = L.layerGroup().addTo(map);

    trackPolylineRef.current = L.polyline([], {
      color: '#059669',
      weight: 4,
      opacity: 0.9,
      dashArray: '6, 8',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  // Changement de fond de carte
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newTile = L.tileLayer(TILE_LAYERS[activeLayer].url, {
      attribution: TILE_LAYERS[activeLayer].attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [activeLayer]);

  // Mise à jour de la position GPS courante en direct
  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation) return;
    const map = mapInstanceRef.current;
    const latlng: L.LatLngExpression = [currentLocation.latitude, currentLocation.longitude];

    if (!currentPosMarkerRef.current) {
      const pulseIcon = L.divIcon({
        className: 'current-pos-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-60"></div>
            <div class="relative w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      currentPosMarkerRef.current = L.marker(latlng, { icon: pulseIcon }).addTo(map);
    } else {
      currentPosMarkerRef.current.setLatLng(latlng);
    }

    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle(latlng, {
        radius: currentLocation.accuracy,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.18,
        weight: 2,
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng(latlng);
      accuracyCircleRef.current.setRadius(currentLocation.accuracy);
    }
  }, [currentLocation]);

  // Tracé du parcours continu
  useEffect(() => {
    if (!trackPolylineRef.current) return;
    const latlngs: L.LatLngExpression[] = trackPoints.map((tp) => [tp.latitude, tp.longitude]);
    trackPolylineRef.current.setLatLngs(latlngs);
  }, [trackPoints]);

  // Mise à jour des marqueurs et synchronisation audio
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    points.forEach((point, idx) => {
      const isSelected = point.id === selectedPointId;
      const isThisAudioPlaying = activeAudioPoint?.id === point.id && isPlaying;
      const color = CATEGORY_COLORS[point.category] || '#059669';
      const number = points.length - idx;

      const customIcon = L.divIcon({
        className: 'custom-gps-pin',
        html: `
          <div class="relative group cursor-pointer transition-transform duration-200 ${isSelected || isThisAudioPlaying ? 'scale-125 z-50' : 'hover:scale-110'}">
            ${isThisAudioPlaying ? `
              <div class="absolute -inset-2 bg-emerald-500/40 rounded-full animate-ping"></div>
              <div class="absolute -inset-1 border-2 border-emerald-500 rounded-full animate-pulse"></div>
            ` : ''}
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white shadow-xl border-2 ${isThisAudioPlaying ? 'border-emerald-300 ring-4 ring-emerald-400' : 'border-white dark:border-slate-900'}" style="background-color: ${color};">
              ${number}
            </div>
            ${point.audioDuration > 0 ? `
              <div class="absolute -top-1 -right-1 w-5 h-5 ${isThisAudioPlaying ? 'bg-white text-emerald-700 animate-bounce' : 'bg-emerald-500 text-white'} border border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
                ${isThisAudioPlaying ? '🔊' : '🎙️'}
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([point.coords.latitude, point.coords.longitude], {
        icon: customIcon,
      }).addTo(layer);

      const timeStr = new Date(point.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date(point.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans max-w-[280px]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b ${isLight ? 'border-slate-200 text-slate-900' : 'border-slate-700 text-white'} pb-2 mb-2">
          <div class="font-extrabold text-sm truncate">${point.title || `Point #${number}`}</div>
          <span class="text-[11px] px-2 py-0.5 rounded-md text-white shrink-0 font-bold" style="background-color: ${color}">
            ${CATEGORY_LABELS[point.category] || point.category}
          </span>
        </div>

        <div class="text-xs ${isLight ? 'text-slate-800 bg-slate-100 border-slate-200' : 'text-slate-200 bg-slate-800 border-slate-700'} mb-2.5 italic p-2.5 rounded-xl border leading-relaxed">
          ${point.transcription ? `"${point.transcription}"` : '<span class="text-slate-400">Aucune note vocale</span>'}
        </div>

        <div class="grid grid-cols-2 gap-1.5 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'} font-mono mb-2.5">
          <div>🕒 ${dateStr} ${timeStr}</div>
          <div class="font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}">🎯 ±${point.coords.accuracy.toFixed(1)} m</div>
          ${point.coords.altitude !== null ? `<div>⛰️ ${point.coords.altitude.toFixed(0)} m alt.</div>` : ''}
          ${point.audioDuration > 0 ? `<div class="text-emerald-600 dark:text-emerald-400 font-bold">🎙️ ${point.audioDuration}s audio</div>` : ''}
        </div>
      `;

      if (point.audioBlob) {
        const audioBtn = document.createElement('button');
        audioBtn.className = 'w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer';
        audioBtn.innerHTML = `<span>▶️ Rejouer le mémo vocal (${point.audioDuration}s)</span>`;

        audioBtn.onclick = (e) => {
          e.stopPropagation();
          playPointAudio(point);
        };

        popupContent.appendChild(audioBtn);
      }

      marker.bindPopup(popupContent, {
        className: isLight ? 'theme-light' : 'theme-dark',
      });

      marker.on('click', () => {
        if (onSelectPoint) {
          onSelectPoint(point);
        }

        if (autoPlayOnClick && point.audioBlob) {
          playPointAudio(point);
        }
      });
    });
  }, [points, selectedPointId, activeAudioPoint, isPlaying, autoPlayOnClick, isLight, onSelectPoint]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !currentLocation) return;
    mapInstanceRef.current.flyTo([currentLocation.latitude, currentLocation.longitude], 17, {
      duration: 1.2,
    });
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.coords.latitude, p.coords.longitude]));
    if (currentLocation) {
      bounds.extend([currentLocation.latitude, currentLocation.longitude]);
    }
    mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  };

  const effectiveDuration = duration || activeAudioPoint?.audioDuration || 1;

  return (
    <div
      className={`relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden border shadow-md transition-colors ${
        isLight
          ? 'border-slate-300 bg-slate-100 shadow-slate-200'
          : 'border-slate-800 bg-slate-950 shadow-slate-950'
      }`}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Contrôles flottants sur la carte (Haut Droit) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Toggle Lecture Vocale Directe au Clic */}
        <button
          onClick={() => setAutoPlayOnClick(!autoPlayOnClick)}
          id="btn-toggle-map-autoplay"
          type="button"
          className={`p-3 rounded-2xl border shadow-md backdrop-blur-md transition-all active:scale-95 flex items-center justify-center ${
            autoPlayOnClick
              ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
              : isLight
              ? 'bg-white/95 text-slate-500 border-slate-300 hover:bg-white'
              : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:bg-slate-800'
          }`}
          title={
            autoPlayOnClick
              ? 'Lecture vocale automatique au clic : ACTIVÉE (cliquez pour désactiver)'
              : 'Lecture vocale automatique au clic : DÉSACTIVÉE (cliquez pour activer)'
          }
        >
          {autoPlayOnClick ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Sélecteur de fonds de carte */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            id="btn-map-layers"
            type="button"
            className={`p-3 rounded-2xl border shadow-md backdrop-blur-md transition-all active:scale-95 ${
              isLight
                ? 'bg-white/95 hover:bg-white text-slate-800 border-slate-300'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
            title="Changer de fond de carte"
          >
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>

          {showLayerMenu && (
            <div
              className={`absolute right-0 mt-2 w-52 border rounded-2xl shadow-2xl backdrop-blur-md p-2 space-y-1 z-30 ${
                isLight ? 'bg-white/98 border-slate-300' : 'bg-slate-900/95 border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase px-2 py-1">
                Fonds de carte
              </div>
              {(Object.keys(TILE_LAYERS) as Array<keyof typeof TILE_LAYERS>).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveLayer(key);
                    setShowLayerMenu(false);
                  }}
                  id={`btn-tile-${key}`}
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    activeLayer === key
                      ? 'bg-emerald-600 text-white'
                      : isLight
                      ? 'text-slate-800 hover:bg-slate-100'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {TILE_LAYERS[key].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Centrer sur GPS courant */}
        <button
          onClick={handleRecenter}
          id="btn-map-center-gps"
          type="button"
          disabled={!currentLocation}
          className={`p-3 rounded-2xl border shadow-md backdrop-blur-md transition-all active:scale-95 disabled:opacity-50 ${
            isLight
              ? 'bg-white/95 hover:bg-white text-blue-600 border-slate-300'
              : 'bg-slate-900/90 hover:bg-slate-800 text-blue-400 border-slate-700'
          }`}
          title="Centrer sur ma position GPS"
        >
          <Navigation className="w-5 h-5 fill-current" />
        </button>

        {/* Vue globale de tous les points */}
        <button
          onClick={handleFitAll}
          id="btn-map-fit-all"
          type="button"
          disabled={points.length === 0}
          className={`p-3 rounded-2xl border shadow-md backdrop-blur-md transition-all active:scale-95 disabled:opacity-50 ${
            isLight
              ? 'bg-white/95 hover:bg-white text-amber-600 border-slate-300'
              : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-slate-700'
          }`}
          title="Voir tous les points"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>

      {/* Lecteur Audio Flottant sur la carte */}
      {activeAudioPoint && (
        <div
          className={`absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 border-2 rounded-3xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200 ${
            isLight
              ? 'bg-white/98 border-emerald-600 text-slate-900 shadow-slate-400/30'
              : 'bg-slate-900/95 border-emerald-500/80 text-white shadow-black/80'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold shrink-0">
                <Volume2 className="w-4 h-4 animate-pulse" />
              </div>
              <div className="truncate">
                <div className="text-sm font-extrabold truncate">
                  {activeAudioPoint.title || 'Note vocale GPS'}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  Lecture audio en direct
                </div>
              </div>
            </div>

            <button
              onClick={stopAudio}
              id="btn-close-map-audio"
              type="button"
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeAudioPoint.transcription && (
            <p
              className={`text-xs italic line-clamp-2 p-2.5 rounded-xl border mb-3 leading-relaxed ${
                isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-slate-950 text-slate-200 border-slate-800'
              }`}
            >
              "{activeAudioPoint.transcription}"
            </p>
          )}

          {/* Contrôles du lecteur */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => playPointAudio(activeAudioPoint)}
              id="btn-map-player-toggle"
              type="button"
              className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-transform active:scale-95 shadow-md shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <div className="flex-1 space-y-1">
              <input
                type="range"
                min="0"
                max={effectiveDuration}
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-slate-300 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(effectiveDuration)}</span>
              </div>
            </div>

            <button
              onClick={toggleSpeed}
              id="btn-map-player-speed"
              type="button"
              className="text-xs font-mono font-bold px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      )}

      {/* Légende en bas à gauche de la carte */}
      {!activeAudioPoint && (
        <div
          className={`absolute bottom-4 left-4 z-20 backdrop-blur-md border rounded-2xl px-3.5 py-2 text-xs shadow-md hidden sm:flex items-center gap-3 ${
            isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-slate-300'
          }`}
        >
          <span className="font-bold">Points :</span>
          <div className="flex items-center gap-3">
            {Object.entries(CATEGORY_COLORS).slice(0, 4).map(([key, col]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: col }} />
                <span className="text-xs font-semibold">{CATEGORY_LABELS[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge de statut GPS flottant en haut à gauche */}
      {currentLocation && (
        <div
          className={`absolute top-4 left-4 z-20 backdrop-blur-md border rounded-2xl px-3.5 py-2 shadow-md flex items-center gap-2 text-xs font-mono font-bold ${
            isLight ? 'bg-white/95 border-slate-300 text-slate-900' : 'bg-slate-900/90 border-slate-800 text-slate-200'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{formatGpsCoords(currentLocation.latitude, currentLocation.longitude)}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
            ±{currentLocation.accuracy.toFixed(1)}m
          </span>
        </div>
      )}
    </div>
  );
};
