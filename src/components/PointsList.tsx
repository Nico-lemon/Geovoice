import React, { useState } from 'react';
import { GpsPoint } from '../types';
import { AudioPlayer } from './AudioPlayer';
import {
  MapPin,
  Search,
  Trash2,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { formatGpsCoords } from '../services/gpsService';

interface PointsListProps {
  points: GpsPoint[];
  selectedPointId?: string | null;
  onSelectPoint: (point: GpsPoint) => void;
  onEditPoint: (point: GpsPoint) => void;
  onDeletePoint: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; bgLight: string; textLight: string; borderLight: string; bgDark: string; textDark: string; borderDark: string }> = {
  remarquable: {
    label: 'Remarquable',
    bgLight: 'bg-emerald-100',
    textLight: 'text-emerald-900',
    borderLight: 'border-emerald-300',
    bgDark: 'bg-emerald-500/20',
    textDark: 'text-emerald-300',
    borderDark: 'border-emerald-500/40',
  },
  obstacle: {
    label: 'Obstacle / Alerte',
    bgLight: 'bg-rose-100',
    textLight: 'text-rose-900',
    borderLight: 'border-rose-300',
    bgDark: 'bg-rose-500/20',
    textDark: 'text-rose-300',
    borderDark: 'border-rose-500/40',
  },
  faune_flore: {
    label: 'Faune & Flore',
    bgLight: 'bg-lime-100',
    textLight: 'text-lime-900',
    borderLight: 'border-lime-300',
    bgDark: 'bg-lime-500/20',
    textDark: 'text-lime-300',
    borderDark: 'border-lime-500/40',
  },
  travaux: {
    label: 'Travaux / Chantier',
    bgLight: 'bg-amber-100',
    textLight: 'text-amber-900',
    borderLight: 'border-amber-300',
    bgDark: 'bg-amber-500/20',
    textDark: 'text-amber-300',
    borderDark: 'border-amber-500/40',
  },
  orientation: {
    label: 'Repère & Cap',
    bgLight: 'bg-cyan-100',
    textLight: 'text-cyan-900',
    borderLight: 'border-cyan-300',
    bgDark: 'bg-cyan-500/20',
    textDark: 'text-cyan-300',
    borderDark: 'border-cyan-500/40',
  },
  divers: {
    label: 'Divers',
    bgLight: 'bg-purple-100',
    textLight: 'text-purple-900',
    borderLight: 'border-purple-300',
    bgDark: 'bg-purple-500/20',
    textDark: 'text-purple-300',
    borderDark: 'border-purple-500/40',
  },
};

export const PointsList: React.FC<PointsListProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
  onEditPoint,
  onDeletePoint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPoints = points.filter((pt) => {
    const matchesSearch =
      (pt.title && pt.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pt.transcription && pt.transcription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (pt.notes && pt.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || pt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCopyCoords = (pt: GpsPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${pt.coords.latitude.toFixed(6)}, ${pt.coords.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(pt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadAudio = (pt: GpsPoint, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pt.audioBlob) return;
    const url = URL.createObjectURL(pt.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(pt.title || 'memo_vocal').replace(/[^a-z0-9_-]/gi, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-3.5">
      {/* Barre de recherche et filtres */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un point, un mot-clé ou une note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="input-search-points"
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* Filtres par catégories (chips) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            id="filter-cat-all"
            type="button"
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shadow-xs ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800'
            }`}
          >
            Tous ({points.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, info]) => {
            const count = points.filter((p) => p.category === key).length;
            if (count === 0 && selectedCategory !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                id={`filter-cat-${key}`}
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border shadow-xs ${
                  selectedCategory === key
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-800'
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste défilante des points */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {filteredPoints.length === 0 ? (
          <div className="text-center py-14 px-4 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl space-y-3 bg-white/50 dark:bg-slate-900/30">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900 dark:text-slate-200">
                {points.length === 0 ? 'Aucun point balisé pour le moment' : 'Aucun point correspondant'}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {points.length === 0
                  ? 'Appuyez sur votre bouton Bluetooth ou sur le micro vert en bas pour créer votre premier point géolocalisé avec note vocale.'
                  : 'Modifiez vos termes de recherche ou sélectionnez un autre filtre de catégorie.'}
              </p>
            </div>
          </div>
        ) : (
          filteredPoints.map((pt) => {
            const isSelected = pt.id === selectedPointId;
            const catInfo = CATEGORY_LABELS[pt.category] || CATEGORY_LABELS.divers;
            const date = new Date(pt.timestamp);
            const num = points.length - points.findIndex((p) => p.id === pt.id);

            return (
              <div
                key={pt.id}
                onClick={() => onSelectPoint(pt)}
                className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-sm border ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-md'
                }`}
              >
                {/* En-tête de carte */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-black font-mono flex items-center justify-center shrink-0 shadow-xs">
                      {num}
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                      {pt.title || `Point #${num}`}
                    </h4>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-lg font-bold shrink-0 border ${catInfo.bgLight} ${catInfo.textLight} ${catInfo.borderLight} dark:${catInfo.bgDark} dark:${catInfo.textDark} dark:${catInfo.borderDark}`}
                  >
                    {catInfo.label}
                  </span>
                </div>

                {/* Transcription vocale claire */}
                {pt.transcription ? (
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-3 italic">
                    "{pt.transcription}"
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic mb-2.5">
                    Aucune retranscription vocale textuelle
                  </div>
                )}

                {/* Lecteur audio intégré */}
                {pt.audioBlob && (
                  <div className="mb-3">
                    <AudioPlayer audioBlob={pt.audioBlob} duration={pt.audioDuration} compact />
                  </div>
                )}

                {/* Données techniques GPS & Horodatage */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-850 mb-3">
                  <div className="flex items-center gap-1">
                    <span>🕒</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-300">
                      {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{' '}
                      {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                    <span>🎯</span>
                    <span>±{pt.coords.accuracy.toFixed(1)} m</span>
                  </div>

                  <div className="col-span-2 flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="font-semibold">
                      {formatGpsCoords(pt.coords.latitude, pt.coords.longitude)}
                    </span>
                    {pt.coords.altitude !== null && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        ⛰️ {pt.coords.altitude.toFixed(0)} m
                      </span>
                    )}
                  </div>
                </div>

                {/* Barre d'actions rapides sous chaque point */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleCopyCoords(pt, e)}
                      id={`btn-copy-${pt.id}`}
                      className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                      title="Copier les coordonnées GPS"
                    >
                      {copiedId === pt.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline font-semibold">GPS</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${pt.coords.latitude},${pt.coords.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 font-semibold"
                      title="Ouvrir dans Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Maps</span>
                    </a>

                    {pt.audioBlob && (
                      <button
                        type="button"
                        onClick={(e) => handleDownloadAudio(pt, e)}
                        className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs flex items-center gap-1 font-semibold"
                        title="Télécharger l'enregistrement audio individuel"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Audio</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPoint(pt);
                      }}
                      id={`btn-edit-${pt.id}`}
                      className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Modifier les informations"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Supprimer le point "${pt.title || 'Point'}" ?`)) {
                          onDeletePoint(pt.id);
                        }
                      }}
                      id={`btn-delete-${pt.id}`}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Supprimer ce point"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
