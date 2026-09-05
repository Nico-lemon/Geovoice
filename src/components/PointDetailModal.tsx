import React, { useState } from 'react';
import { GpsPoint } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { X, Save, MapPin, ExternalLink, Download } from 'lucide-react';
import { formatGpsCoords } from '../services/gpsService';
import { exportToGPX } from '../services/db';

interface PointDetailModalProps {
  point: GpsPoint;
  onClose: () => void;
  onSave: (updatedPoint: GpsPoint) => void;
}

const CATEGORIES = [
  { id: 'remarquable', label: 'Remarquable' },
  { id: 'obstacle', label: 'Obstacle / Alerte' },
  { id: 'faune_flore', label: 'Faune & Flore' },
  { id: 'travaux', label: 'Travaux / Chantier' },
  { id: 'orientation', label: 'Repère & Orientation' },
  { id: 'divers', label: 'Divers' },
];

export const PointDetailModal: React.FC<PointDetailModalProps> = ({ point, onClose, onSave }) => {
  const [title, setTitle] = useState(point.title);
  const [category, setCategory] = useState(point.category);
  const [transcription, setTranscription] = useState(point.transcription);
  const [notes, setNotes] = useState(point.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...point,
      title: title.trim() || 'Point GPS',
      category: category as any,
      transcription: transcription.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  const handleDownloadSingleGpx = () => {
    const gpxContent = exportToGPX([point], point.title || 'Point_GeoVoice');
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(point.title || 'point').replace(/[^a-z0-9_-]/gi, '_')}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = () => {
    if (!point.audioBlob) return;
    const url = URL.createObjectURL(point.audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(point.title || 'audio_memo').replace(/[^a-z0-9_-]/gi, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${point.coords.latitude},${point.coords.longitude}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${point.coords.latitude}&mlon=${point.coords.longitude}#map=17/${point.coords.latitude}/${point.coords.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="bg-[#12181B] border-2 border-[#4A6B52] rounded-none max-w-lg w-full max-h-[90vh] flex flex-col shadow-[6px_6px_0px_#000000] overflow-hidden text-[#CFCFCF]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#4A6B52] bg-[#172025]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#12181B] border border-[#4A6B52] text-[#FF6B35]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white uppercase font-tech tracking-wider">
                DÉTAILS // BALISE TACTIQUE
              </h3>
              <p className="text-[11px] text-[#8E9CA3] font-mono">
                {new Date(point.timestamp).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-modal"
            type="button"
            className="p-1.5 bg-[#12181B] border border-[#4A6B52] text-[#CFCFCF] hover:text-[#FF6B35] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps du formulaire */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Lecteur audio */}
          {point.audioBlob && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#FF6B35]">
                  // TRANSMISSION AUDIO
                </span>
                <button
                  type="button"
                  onClick={handleDownloadAudio}
                  id="btn-download-audio-point"
                  className="text-[#D1FF00] hover:underline inline-flex items-center gap-1 font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>EXPORTER (.WEBM)</span>
                </button>
              </div>
              <AudioPlayer audioBlob={point.audioBlob} duration={point.audioDuration} />
            </div>
          )}

          {/* Titre et Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[#CFCFCF]">
                NOM DU POINT / BALISE
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                id="input-point-title"
                className="w-full bg-[#172025] border-2 border-[#4A6B52] rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B35] font-mono shadow-[2px_2px_0px_#000000]"
                placeholder="Ex: BORNE ALPHA-01"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[#CFCFCF]">
                CATÉGORIE / STATUT
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                id="select-point-category"
                className="w-full bg-[#172025] border-2 border-[#4A6B52] rounded-none px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B35] font-mono shadow-[2px_2px_0px_#000000]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#172025] text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transcription vocale */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#CFCFCF] flex items-center justify-between">
              <span>TRANSCRIPTION VOCALE</span>
              <span className="text-[10px] text-[#8E9CA3] font-mono">[ÉDITABLE]</span>
            </label>
            <textarea
              rows={3}
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              id="textarea-point-transcription"
              className="w-full bg-[#172025] border-2 border-[#4A6B52] rounded-none p-2.5 text-xs text-[#CFCFCF] focus:outline-none focus:border-[#FF6B35] resize-none leading-relaxed font-mono shadow-[2px_2px_0px_#000000]"
              placeholder="Texte de la note vocale..."
            />
          </div>

          {/* Notes textuelles complémentaires */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-[#CFCFCF]">
              NOTES DE MISSION COMPLÉMENTAIRES
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="textarea-point-notes"
              className="w-full bg-[#172025] border-2 border-[#4A6B52] rounded-none p-2.5 text-xs text-[#CFCFCF] focus:outline-none focus:border-[#FF6B35] resize-none font-mono shadow-[2px_2px_0px_#000000]"
              placeholder="Données tactiques de terrain..."
            />
          </div>

          {/* Bloc Coordonnées & Données GPS précises */}
          <div className="bg-[#172025] border-2 border-[#2E3E47] p-3.5 space-y-2 text-xs font-mono shadow-[2px_2px_0px_#000000]">
            <div className="font-bold text-[#FF6B35] uppercase tracking-wider text-[11px]">
              // TÉLÉMÉTRIE & GÉOLOCALISATION
            </div>
            <div className="grid grid-cols-2 gap-2 text-[#CFCFCF]">
              <div>
                LAT : <strong className="text-white">{point.coords.latitude.toFixed(6)}</strong>
              </div>
              <div>
                LON : <strong className="text-white">{point.coords.longitude.toFixed(6)}</strong>
              </div>
              <div>
                PRÉCISION : <strong className="text-[#D1FF00]">±{point.coords.accuracy.toFixed(1)}m</strong>
              </div>
              <div>
                ALTITUDE : <strong className="text-white">{point.coords.altitude !== null ? `${point.coords.altitude.toFixed(0)}m` : 'N/A'}</strong>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2E3E47]">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#12181B] hover:bg-[#2E3E47] text-white border border-[#4A6B52] text-xs uppercase shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#D1FF00]" />
                <span>GOOGLE MAPS</span>
              </a>

              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#12181B] hover:bg-[#2E3E47] text-white border border-[#4A6B52] text-xs uppercase shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#D1FF00]" />
                <span>OPENSTREETMAP</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadSingleGpx}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#12181B] hover:bg-[#2E3E47] text-white border border-[#4A6B52] text-xs uppercase shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span>EXPORT GPX</span>
              </button>
            </div>
          </div>

          {/* Boutons d'action du formulaire */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2E3E47]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-[#2E3E47] text-[#8E9CA3] hover:text-white font-mono uppercase text-xs shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
            >
              ANNULER
            </button>
            <button
              type="submit"
              id="btn-save-point-details"
              className="px-5 py-2 bg-[#4A6B52] hover:bg-[#3d5843] border-2 border-[#707B71] text-white font-mono font-black uppercase text-xs flex items-center gap-2 shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Save className="w-4 h-4 text-[#D1FF00]" />
              <span>ENREGISTRER MODIFICATIONS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
