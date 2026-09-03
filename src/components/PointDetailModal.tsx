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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Détails du point GPS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">
                {new Date(point.timestamp).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-modal"
            type="button"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du formulaire */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Lecteur audio */}
          {point.audioBlob && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Note vocale enregistrée
                </span>
                <button
                  type="button"
                  onClick={handleDownloadAudio}
                  id="btn-download-audio-point"
                  className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exporter l'audio (.webm)</span>
                </button>
              </div>
              <AudioPlayer audioBlob={point.audioBlob} duration={point.audioDuration} />
            </div>
          )}

          {/* Titre et Catégorie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Titre du point
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                id="input-point-title"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                placeholder="Ex: Borne sentier #4"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                id="select-point-category"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transcription vocale */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Transcription de la voix</span>
              <span className="text-xs text-slate-500 font-normal">Modifiable</span>
            </label>
            <textarea
              rows={3}
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              id="textarea-point-transcription"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none leading-relaxed font-medium"
              placeholder="Texte de la note vocale..."
            />
          </div>

          {/* Notes textuelles complémentaires */}
          <div className="space-y-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              Notes additionnelles (optionnel)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="textarea-point-notes"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none font-medium"
              placeholder="Informations supplémentaires de terrain..."
            />
          </div>

          {/* Bloc Coordonnées & Données GPS précises */}
          <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 text-xs font-mono">
            <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Coordonnées GPS exactes
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <div>
                Latitude : <strong className="text-slate-900 dark:text-slate-100">{point.coords.latitude.toFixed(6)}</strong>
              </div>
              <div>
                Longitude : <strong className="text-slate-900 dark:text-slate-100">{point.coords.longitude.toFixed(6)}</strong>
              </div>
              <div>
                Précision : <strong className="text-emerald-700 dark:text-emerald-400">±{point.coords.accuracy.toFixed(1)}m</strong>
              </div>
              <div>
                Altitude : <strong className="text-slate-900 dark:text-slate-100">{point.coords.altitude !== null ? `${point.coords.altitude.toFixed(0)}m` : 'N/A'}</strong>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-400 font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-xs shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir Google Maps</span>
              </a>

              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-xs shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OpenStreetMap</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadSingleGpx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-xs shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export GPX</span>
              </button>
            </div>
          </div>

          {/* Boutons d'action du formulaire */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="btn-save-point-details"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
