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

const CATEGORY_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  remarquable: {
    label: 'POINT D\'INTÉRÊT',
    bg: 'bg-[#4A6B52]',
    text: 'text-white',
    border: 'border-[#707B71]',
  },
  obstacle: {
    label: 'OBSTACLE / ALERTE',
    bg: 'bg-[#FF6B35]',
    text: 'text-black font-black',
    border: 'border-black',
  },
  faune_flore: {
    label: 'FAUNE & FLORE',
    bg: 'bg-[#2E3E47]',
    text: 'text-[#D1FF00]',
    border: 'border-[#4A6B52]',
  },
  travaux: {
    label: 'TRAVAUX // RECON',
    bg: 'bg-[#1F2B32]',
    text: 'text-[#FF6B35]',
    border: 'border-[#FF6B35]',
  },
  orientation: {
    label: 'CAP // BALISE',
    bg: 'bg-[#172025]',
    text: 'text-[#CFCFCF]',
    border: 'border-[#4A6B52]',
  },
  divers: {
    label: 'DIVERS',
    bg: 'bg-[#172025]',
    text: 'text-[#8E9CA3]',
    border: 'border-[#2E3E47]',
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
    <div className="flex flex-col h-full space-y-3 font-mono">
      {/* Barre de recherche et filtres */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#FF6B35] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="RECHERCHER BALISE, MOT-CLÉ, TRANSCRIPTION..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="input-search-points"
            className="w-full bg-[#172025] border-2 border-[#4A6B52] rounded-none pl-10 pr-4 py-2.5 text-xs text-[#CFCFCF] placeholder-[#8E9CA3] focus:outline-none focus:border-[#FF6B35] transition-all shadow-[2px_2px_0px_#000000]"
          />
        </div>

        {/* Filtres par catégories (chips carrés tactiques) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            id="filter-cat-all"
            type="button"
            className={`px-3 py-1.5 rounded-none text-xs font-bold font-mono uppercase whitespace-nowrap transition-all border-2 shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
              selectedCategory === 'all'
                ? 'bg-[#4A6B52] text-white border-[#707B71]'
                : 'bg-[#172025] text-[#8E9CA3] hover:text-white border-[#2E3E47]'
            }`}
          >
            TOUS ({points.length})
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
                className={`px-2.5 py-1.5 rounded-none text-xs font-bold font-mono uppercase whitespace-nowrap transition-all border-2 shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 ${
                  selectedCategory === key
                    ? 'bg-[#4A6B52] text-white border-[#FF6B35]'
                    : 'bg-[#172025] text-[#8E9CA3] hover:text-white border-[#2E3E47]'
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste défilante des points */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredPoints.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-[#2E3E47] bg-[#172025] space-y-3 text-[#8E9CA3]">
            <div className="w-12 h-12 bg-[#12181B] border-2 border-[#4A6B52] text-[#FF6B35] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#000000]">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-black text-[#CFCFCF] uppercase">
                {points.length === 0 ? 'AUCUNE BALISE DÉTECTÉE' : 'AUCUN RÉSULTAT CORRESPONDANT'}
              </div>
              <p className="text-xs text-[#8E9CA3] max-w-sm mx-auto leading-relaxed">
                {points.length === 0
                  ? 'Appuyez sur le bouton circulaire REC en bas pour enregistrer un point GPS avec note vocale.'
                  : 'Modifiez vos filtres de recherche ou sélectionnez un autre paramètre.'}
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
                className={`group relative rounded-none p-3.5 transition-all duration-150 cursor-pointer border-2 shadow-[3px_3px_0px_#000000] ${
                  isSelected
                    ? 'bg-[#1F2B32] border-[#FF6B35]'
                    : 'bg-[#172025] border-[#4A6B52] hover:border-[#707B71]'
                }`}
              >
                {/* En-tête de carte */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-none bg-[#12181B] border-2 border-[#4A6B52] text-[#FF6B35] text-xs font-black font-mono flex items-center justify-center shrink-0">
                      {num}
                    </span>
                    <h4 className="text-sm font-black text-white truncate uppercase font-tech">
                      {pt.title || `BALISE #${num}`}
                    </h4>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 font-bold uppercase shrink-0 border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}
                  >
                    {catInfo.label}
                  </span>
                </div>

                {/* Transcription vocale claire */}
                {pt.transcription ? (
                  <div className="text-xs text-[#CFCFCF] bg-[#12181B] p-2.5 border border-[#2E3E47] mb-2.5 italic font-sans leading-relaxed">
                    "{pt.transcription}"
                  </div>
                ) : (
                  <div className="text-[11px] text-[#8E9CA3] italic mb-2">
                    Aucune note vocale enregistrée
                  </div>
                )}

                {/* Lecteur audio intégré */}
                {pt.audioBlob && (
                  <div className="mb-2.5">
                    <AudioPlayer audioBlob={pt.audioBlob} duration={pt.audioDuration} compact />
                  </div>
                )}

                {/* Données techniques GPS & Horodatage */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-[#8E9CA3] bg-[#12181B] p-2 border border-[#2E3E47] mb-2.5">
                  <div>
                    <span>TIME: </span>
                    <span className="font-bold text-[#CFCFCF]">
                      {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}{' '}
                      {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span>FIX: </span>
                    <span className="font-black text-[#FF6B35]">±{pt.coords.accuracy.toFixed(1)}m</span>
                  </div>

                  <div className="col-span-2 flex items-center justify-between pt-1 border-t border-[#2E3E47]">
                    <span className="font-bold text-[#CFCFCF]">
                      {formatGpsCoords(pt.coords.latitude, pt.coords.longitude)}
                    </span>
                    {pt.coords.altitude !== null && (
                      <span className="text-[#D1FF00] font-black">
                        ALT {pt.coords.altitude.toFixed(0)}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Barre d'actions rapides sous chaque point avec boutons carrés */}
                <div className="flex items-center justify-between pt-1 border-t border-[#2E3E47]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleCopyCoords(pt, e)}
                      id={`btn-copy-${pt.id}`}
                      className="px-2 py-1 bg-[#12181B] hover:bg-[#2E3E47] border border-[#4A6B52] text-[#CFCFCF] text-xs flex items-center gap-1 uppercase transition-all shadow-xs"
                      title="Copier les coordonnées GPS"
                    >
                      {copiedId === pt.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#D1FF00]" />
                          <span className="text-[#D1FF00] font-bold">COPIÉ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#FF6B35]" />
                          <span className="font-bold">GPS</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${pt.coords.latitude},${pt.coords.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 bg-[#12181B] hover:bg-[#2E3E47] border border-[#4A6B52] text-[#CFCFCF] text-xs flex items-center gap-1 uppercase transition-all shadow-xs"
                      title="Ouvrir dans Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#D1FF00]" />
                      <span>MAPS</span>
                    </a>

                    {pt.audioBlob && (
                      <button
                        type="button"
                        onClick={(e) => handleDownloadAudio(pt, e)}
                        className="px-2 py-1 bg-[#12181B] hover:bg-[#2E3E47] border border-[#4A6B52] text-[#CFCFCF] text-xs flex items-center gap-1 uppercase transition-all shadow-xs"
                        title="Télécharger l'enregistrement audio"
                      >
                        <Download className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span>AUDIO</span>
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
                      className="p-1.5 bg-[#12181B] hover:bg-[#4A6B52] border border-[#4A6B52] text-[#CFCFCF] hover:text-white transition-colors"
                      title="Modifier les informations"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Supprimer la balise "${pt.title || 'Point'}" ?`)) {
                          onDeletePoint(pt.id);
                        }
                      }}
                      id={`btn-delete-${pt.id}`}
                      className="p-1.5 bg-[#12181B] hover:bg-[#FF6B35] border border-[#4A6B52] text-[#FF6B35] hover:text-black transition-colors"
                      title="Supprimer cette balise"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
