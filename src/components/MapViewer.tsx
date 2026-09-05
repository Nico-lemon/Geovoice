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
  topo: {
    name: 'TOPO DÉTAILLÉE (OpenTopoMap)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors',
  },
  esriTopo: {
    name: 'TOPO RELIEF (Esri World Topo)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri & Garmin',
  },
  satellite: {
    name: 'SATELLITE RECON (Esri Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri & Maxar',
  },
  dark: {
    name: 'TACTIQUE NUIT (Carto Dark)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
};

export const MapViewer: React.FC<MapViewerProps> = ({
  points,
  currentLocation,
  trackPoints = [],
  selectedPointId,
  theme = 'dark',
  onSelectPoint,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const trackPolylineRef = useRef<L.Polyline | null>(null);
  const currentPosMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Topo détaillée par défaut
  const [activeLayer, setActiveLayer] = useState<keyof typeof TILE_LAYERS>('topo');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [autoPlayOnClick, setAutoPlayOnClick] = useState(true);

  // État de lecture audio en direct sur la carte
  const [activeAudioPoint, setActiveAudioPoint] = useState<GpsPoint | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialisation du fond de carte en Topo détaillée
  useEffect(() => {
    setActiveLayer('topo');
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
      color: '#FF6B35', // Orange sécurité
      weight: 5,
      opacity: 0.95,
      lineJoin: 'round',
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
      crossOrigin: true,
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
          <div class="relative flex items-center justify-center w-9 h-9">
            <div class="absolute w-9 h-9 bg-[#FF6B35]/25 rounded-full animate-ping"></div>
            <div class="absolute w-7 h-7 border border-[#FF6B35] rounded-full animate-pulse"></div>
            <div class="relative w-4 h-4 bg-[#FF6B35] border-2 border-[#12181B] rounded-none rotate-45 shadow-[0_0_8px_#FF6B35]"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      currentPosMarkerRef.current = L.marker(latlng, { icon: pulseIcon }).addTo(map);
    } else {
      currentPosMarkerRef.current.setLatLng(latlng);
    }

    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle(latlng, {
        radius: currentLocation.accuracy,
        color: '#FF6B35',
        fillColor: '#FF6B35',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4',
      }).addTo(map);
    } else {
      accuracyCircleRef.current.setLatLng(latlng);
      accuracyCircleRef.current.setRadius(currentLocation.accuracy);
    }
  }, [currentLocation]);

  // Tracé du parcours continu (Orange Sécurité #FF6B35)
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
      const number = points.length - idx;

      const customIcon = L.divIcon({
        className: 'custom-gps-pin',
        html: `
          <div class="relative group cursor-pointer transition-transform duration-150 ${isSelected || isThisAudioPlaying ? 'scale-125 z-50' : 'hover:scale-110'}">
            ${isThisAudioPlaying ? `
              <div class="absolute -inset-2 bg-[#FF6B35]/40 animate-ping"></div>
              <div class="absolute -inset-1 border-2 border-[#FF6B35] animate-pulse"></div>
            ` : ''}
            <div class="w-8 h-8 bg-[#172025] border-2 ${isSelected ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-[#4A6B52] text-[#CFCFCF]'} flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_#000] font-mono">
              ${number}
            </div>
            ${point.audioDuration > 0 ? `
              <div class="absolute -top-1.5 -right-1.5 px-1 py-0.2 bg-[#FF6B35] text-[#12181B] font-black text-[9px] border border-black shadow leading-tight">
                REC
              </div>
            ` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([point.coords.latitude, point.coords.longitude], {
        icon: customIcon,
      }).addTo(layer);

      const timeStr = new Date(point.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date(point.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 font-mono max-w-[280px] bg-[#172025] text-[#CFCFCF] border border-[#4A6B52]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-[#2E3E47] pb-2 mb-2">
          <div class="font-bold text-sm text-[#FF6B35] uppercase truncate">[WAYPOINT #${number}]</div>
          <span class="text-[10px] px-1.5 py-0.5 bg-[#4A6B52] text-white font-bold uppercase">
            ${CATEGORY_LABELS[point.category] || point.category}
          </span>
        </div>

        <div class="text-xs text-[#CFCFCF] bg-[#12181B] border border-[#2E3E47] mb-2 p-2 leading-relaxed font-sans">
          ${point.transcription ? `"${point.transcription}"` : '<span class="text-slate-500 italic">Aucune note vocale</span>'}
        </div>

        <div class="grid grid-cols-2 gap-1 text-[11px] text-[#8E9CA3] font-mono mb-2 border-t border-[#2E3E47] pt-1">
          <div>LOC: ${dateStr} ${timeStr}</div>
          <div class="text-[#FF6B35] font-bold">FIX: ±${point.coords.accuracy.toFixed(1)}m</div>
          ${point.coords.altitude !== null ? `<div>ALT: ${point.coords.altitude.toFixed(0)}m</div>` : ''}
          ${point.audioDuration > 0 ? `<div class="text-[#D1FF00] font-bold">AUDIO: ${point.audioDuration}s</div>` : ''}
        </div>
      `;

      if (point.audioBlob) {
        const audioBtn = document.createElement('button');
        audioBtn.className = 'w-full py-2 px-3 bg-[#FF6B35] hover:bg-[#ff8252] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider transition-all shadow active:translate-x-0.5 active:translate-y-0.5 cursor-pointer';
        audioBtn.innerHTML = `<span>▶ ECOUTER MÉMO (${point.audioDuration}s)</span>`;

        audioBtn.onclick = (e) => {
          e.stopPropagation();
          playPointAudio(point);
        };

        popupContent.appendChild(audioBtn);
      }

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectPoint) {
          onSelectPoint(point);
        }

        if (autoPlayOnClick && point.audioBlob) {
          playPointAudio(point);
        }
      });
    });
  }, [points, selectedPointId, activeAudioPoint, isPlaying, autoPlayOnClick, onSelectPoint]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !currentLocation) return;
    mapInstanceRef.current.setView([currentLocation.latitude, currentLocation.longitude], 17);
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current || points.length === 0) return;
    const group = L.featureGroup(
      points.map((p) => L.marker([p.coords.latitude, p.coords.longitude]))
    );
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
  };

  const effectiveDuration = duration || activeAudioPoint?.audioDuration || 0;

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-none overflow-hidden border-2 border-[#4A6B52] bg-[#12181B] shadow-[4px_4px_0px_#000000]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Réticules d'angle tactique HUD */}
      <div className="absolute top-1 left-1 pointer-events-none z-10 text-[#4A6B52] font-mono text-xs select-none">
        ┌─[TOPO-GRID]
      </div>
      <div className="absolute top-1 right-1 pointer-events-none z-10 text-[#4A6B52] font-mono text-xs select-none">
        [TAC-ZONE]─┐
      </div>
      <div className="absolute bottom-1 left-1 pointer-events-none z-10 text-[#4A6B52] font-mono text-xs select-none">
        └─[4A6B52]
      </div>
      <div className="absolute bottom-1 right-1 pointer-events-none z-10 text-[#4A6B52] font-mono text-xs select-none">
        [#FF6B35]─┘
      </div>

      {/* Badge de statut GPS & Coordonnées tactiques (Haut Gauche) */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div className="bg-[#172025]/95 border-2 border-[#4A6B52] px-3 py-1.5 text-xs font-mono shadow-[2px_2px_0px_#000000] flex items-center gap-2">
          <span className="w-2 h-2 rounded-none bg-[#FF6B35] animate-pulse"></span>
          <span className="text-[#FF6B35] font-black uppercase">
            {currentLocation ? 'GPS VERROUILLÉ' : 'RECHERCHE SATELLITES'}
          </span>
          {currentLocation && (
            <span className="text-[#CFCFCF] font-bold">
              ±{currentLocation.accuracy.toFixed(1)}m
            </span>
          )}
        </div>

        {currentLocation && (
          <div className="hidden sm:block bg-[#12181B]/95 border border-[#2E3E47] px-2.5 py-1 text-[11px] font-mono text-[#8E9CA3] shadow">
            <span>{currentLocation.latitude.toFixed(6)}°N, {currentLocation.longitude.toFixed(6)}°E</span>
            {currentLocation.altitude !== null && (
              <span className="text-[#D1FF00] ml-2 font-bold">ALT {currentLocation.altitude.toFixed(0)}m</span>
            )}
          </div>
        )}
      </div>

      {/* Contrôles tactiques imposants, carrés et robustes (Haut Droit) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {/* Zoom In (+) */}
        <button
          onClick={handleZoomIn}
          id="btn-map-zoom-in"
          type="button"
          className="w-11 h-11 bg-[#172025] hover:bg-[#4A6B52] text-[#CFCFCF] hover:text-white border-2 border-[#4A6B52] font-mono font-black text-xl shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
          title="Zoomer avant (+)"
        >
          +
        </button>

        {/* Zoom Out (-) */}
        <button
          onClick={handleZoomOut}
          id="btn-map-zoom-out"
          type="button"
          className="w-11 h-11 bg-[#172025] hover:bg-[#4A6B52] text-[#CFCFCF] hover:text-white border-2 border-[#4A6B52] font-mono font-black text-xl shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
          title="Dézoomer (-)"
        >
          -
        </button>

        {/* Centrer sur GPS courant */}
        <button
          onClick={handleRecenter}
          id="btn-map-center-gps"
          type="button"
          disabled={!currentLocation}
          className="w-11 h-11 bg-[#172025] hover:bg-[#FF6B35] text-[#FF6B35] hover:text-black border-2 border-[#FF6B35] shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40"
          title="Centrer la vue sur ma position GPS"
        >
          <Navigation className="w-5 h-5 fill-current" />
        </button>

        {/* Vue globale / Fit tous les points */}
        <button
          onClick={handleFitAll}
          id="btn-map-fit-all"
          type="button"
          disabled={points.length === 0}
          className="w-11 h-11 bg-[#172025] hover:bg-[#4A6B52] text-[#CFCFCF] hover:text-white border-2 border-[#4A6B52] shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-40"
          title="Recadrer sur l'ensemble des balises"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* Toggle Lecture Vocale Directe au Clic */}
        <button
          onClick={() => setAutoPlayOnClick(!autoPlayOnClick)}
          id="btn-toggle-map-autoplay"
          type="button"
          className={`w-11 h-11 border-2 font-mono shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 ${
            autoPlayOnClick
              ? 'bg-[#4A6B52] text-white border-[#707B71]'
              : 'bg-[#172025] text-slate-500 border-[#2E3E47]'
          }`}
          title={autoPlayOnClick ? 'Lecture audio au clic : ACTIVÉE' : 'Lecture audio au clic : COUPÉE'}
        >
          {autoPlayOnClick ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Sélecteur de fonds de carte */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            id="btn-map-layers"
            type="button"
            className="w-11 h-11 bg-[#172025] hover:bg-[#4A6B52] text-[#CFCFCF] hover:text-white border-2 border-[#4A6B52] shadow-[2px_2px_0px_#000000] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Changer de couche topographique"
          >
            <Layers className="w-5 h-5" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#172025] border-2 border-[#4A6B52] shadow-[4px_4px_0px_#000000] p-2 space-y-1 z-30 font-mono">
              <div className="text-[10px] font-bold tracking-widest text-[#FF6B35] uppercase px-2 py-1 border-b border-[#2E3E47]">
                COUCHES TOPOGRAPHIQUES
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
                  className={`w-full text-left px-3 py-2 text-xs font-bold font-mono uppercase transition-colors ${
                    activeLayer === key
                      ? 'bg-[#4A6B52] text-white border-l-4 border-[#FF6B35]'
                      : 'text-[#CFCFCF] hover:bg-[#1F2B32]'
                  }`}
                >
                  {TILE_LAYERS[key].name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lecteur Audio Flottant Tactique sur la carte */}
      {activeAudioPoint && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 border-2 border-[#FF6B35] bg-[#172025] p-4 shadow-[4px_4px_0px_#000000] text-[#CFCFCF] font-mono animate-in slide-in-from-bottom duration-150">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-2 bg-[#FF6B35] text-black font-black shrink-0">
                <Volume2 className="w-4 h-4 animate-pulse" />
              </div>
              <div className="truncate">
                <div className="text-sm font-extrabold text-white uppercase truncate">
                  {activeAudioPoint.title || 'MÉMO VOCAL'}
                </div>
                <div className="text-xs text-[#FF6B35] font-bold">
                  COMMUNICATION RADIO EN LECTURE
                </div>
              </div>
            </div>

            <button
              onClick={stopAudio}
              id="btn-close-map-audio"
              type="button"
              className="p-1 text-[#8E9CA3] hover:text-white hover:bg-[#2E3E47]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeAudioPoint.transcription && (
            <p className="text-xs text-[#CFCFCF] bg-[#12181B] border border-[#2E3E47] p-2.5 mb-3 leading-relaxed font-sans italic">
              "{activeAudioPoint.transcription}"
            </p>
          )}

          {/* Contrôles du lecteur */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => playPointAudio(activeAudioPoint)}
              id="btn-map-player-toggle"
              type="button"
              className="p-2.5 bg-[#FF6B35] hover:bg-[#ff8252] text-black font-bold transition-transform active:scale-95 shadow shrink-0"
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
                className="w-full h-2 bg-[#12181B] rounded-none appearance-none cursor-pointer accent-[#FF6B35]"
              />
              <div className="flex justify-between text-xs font-mono font-bold text-[#8E9CA3]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(effectiveDuration)}</span>
              </div>
            </div>

            <button
              onClick={toggleSpeed}
              id="btn-map-player-speed"
              type="button"
              className="text-xs font-mono font-bold px-2 py-1 bg-[#12181B] hover:bg-[#2E3E47] text-[#FF6B35] border border-[#4A6B52]"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      )}

      {/* Légende en bas à gauche de la carte */}
      {!activeAudioPoint && (
        <div className="absolute bottom-3 left-3 z-20 bg-[#172025]/95 border-2 border-[#4A6B52] px-3 py-1.5 text-xs font-mono shadow-[2px_2px_0px_#000000] hidden sm:flex items-center gap-3 text-[#CFCFCF]">
          <span className="font-bold text-[#FF6B35]">TRACÉ:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-1 bg-[#FF6B35]" />
            <span className="text-[11px]">ORANGE SÉCURITÉ</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#4A6B52] border border-[#707B71]" />
            <span className="text-[11px]">BALISES MISSION</span>
          </div>
        </div>
      )}
    </div>
  );
};
