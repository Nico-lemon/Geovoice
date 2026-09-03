import React, { useState } from 'react';
import { GpsPoint } from '../types';
import {
  exportToGPX,
  exportToGeoJSON,
  exportToKML,
  exportToCSV,
  exportToHTMLReport,
  createFullZipArchive,
  createAudioOnlyZip,
} from '../services/db';
import {
  X,
  Download,
  FileArchive,
  FileCode,
  Table,
  Map,
  Trash2,
  CheckCircle2,
  Loader2,
  Music,
  Globe,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface ExportModalProps {
  points: GpsPoint[];
  onClose: () => void;
  onClearAll: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ points, onClose, onClearAll }) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [isExportingAudioZip, setIsExportingAudioZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const audioCount = points.filter((p) => p.audioBlob && p.audioBlob.size > 0).length;

  const notifySuccess = (name: string) => {
    setDownloadSuccess(name);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notifySuccess(filename);
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const zipBlob = await createFullZipArchive(points);
      downloadFile(
        zipBlob,
        `geovoice_archive_complete_${new Date().toISOString().slice(0, 10)}.zip`,
        'application/zip'
      );
    } catch (e) {
      console.error('Error creating ZIP:', e);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportHtmlReport = async () => {
    setIsExportingHtml(true);
    try {
      const htmlContent = await exportToHTMLReport(points);
      downloadFile(
        htmlContent,
        `geovoice_carte_avec_audios_${new Date().toISOString().slice(0, 10)}.html`,
        'text/html;charset=utf-8;'
      );
    } catch (e) {
      console.error('Error creating HTML report:', e);
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleExportAudioOnlyZip = async () => {
    setIsExportingAudioZip(true);
    try {
      const zipBlob = await createAudioOnlyZip(points);
      downloadFile(
        zipBlob,
        `geovoice_memos_vocaux_${new Date().toISOString().slice(0, 10)}.zip`,
        'application/zip'
      );
    } catch (e) {
      console.error('Error creating audio ZIP:', e);
    } finally {
      setIsExportingAudioZip(false);
    }
  };

  const handleExportGPX = () => {
    const content = exportToGPX(points);
    downloadFile(
      content,
      `geovoice_points_${new Date().toISOString().slice(0, 10)}.gpx`,
      'application/gpx+xml'
    );
  };

  const handleExportGeoJSON = () => {
    const content = exportToGeoJSON(points);
    downloadFile(
      content,
      `geovoice_points_${new Date().toISOString().slice(0, 10)}.geojson`,
      'application/geo+json'
    );
  };

  const handleExportKML = () => {
    const content = exportToKML(points);
    downloadFile(
      content,
      `geovoice_points_${new Date().toISOString().slice(0, 10)}.kml`,
      'application/vnd.google-earth.kml+xml'
    );
  };

  const handleExportCSV = () => {
    const content = exportToCSV(points);
    downloadFile(
      '\uFEFF' + content,
      `geovoice_releve_${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                Centre d'exportation de données
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {points.length} point{points.length > 1 ? 's' : ''} GPS • {audioCount} note{audioCount > 1 ? 's' : ''} vocale{audioCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-export-modal"
            type="button"
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message de succès */}
        {downloadSuccess && (
          <div className="bg-emerald-600 text-white px-6 py-3 flex items-center gap-2 text-xs sm:text-sm font-bold animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Fichier "{downloadSuccess}" généré et téléchargé avec succès !</span>
          </div>
        )}

        {/* Corps avec défilement */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Option phare : Archive ZIP complète avec tous les audios */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                    Recommandé
                  </span>
                  <h4 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Archive Complète Packagée (ZIP)
                  </h4>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Contient tous les fichiers <strong>GPX, KML, GeoJSON, CSV</strong> ainsi que <strong>tous les enregistrements vocaux (.webm)</strong> organisés dans un sous-dossier et une <strong>carte interactive autonome</strong>.
                </p>
              </div>

              <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl shrink-0">
                <FileArchive className="w-7 h-7" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-200 dark:border-emerald-500/20">
              <button
                onClick={handleExportZip}
                disabled={isExportingZip || points.length === 0}
                id="btn-export-full-zip"
                type="button"
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {isExportingZip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Création du ZIP en cours...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Télécharger l'Archive Complète (.zip)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportHtmlReport}
                disabled={isExportingHtml || points.length === 0}
                id="btn-export-html-map"
                type="button"
                className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-300 dark:border-slate-700 text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors"
                title="Générer un fichier HTML autonome avec carte et audios embarqués"
              >
                {isExportingHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                <span>Carte Web Autonome (.html)</span>
              </button>
            </div>
          </div>

          {/* Grille des formats standards */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100">
              Exports individuels par format
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* GPX */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Format GPX</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Garmin, Strava, OsmAnd, Komoot, QGIS
                  </p>
                </div>

                <button
                  onClick={handleExportGPX}
                  disabled={points.length === 0}
                  id="btn-export-gpx"
                  type="button"
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
                >
                  .GPX
                </button>
              </div>

              {/* GeoJSON */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Format GeoJSON</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Web SIG, Leaflet, Mapbox, Python, QGIS
                  </p>
                </div>

                <button
                  onClick={handleExportGeoJSON}
                  disabled={points.length === 0}
                  id="btn-export-geojson"
                  type="button"
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
                >
                  .GeoJSON
                </button>
              </div>

              {/* KML */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Format KML</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Google Earth, Google My Maps
                  </p>
                </div>

                <button
                  onClick={handleExportKML}
                  disabled={points.length === 0}
                  id="btn-export-kml"
                  type="button"
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
                >
                  .KML
                </button>
              </div>

              {/* CSV / Excel */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Table className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Tableur CSV / Excel</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Excel, Google Sheets, LibreOffice (UTF-8)
                  </p>
                </div>

                <button
                  onClick={handleExportCSV}
                  disabled={points.length === 0}
                  id="btn-export-csv"
                  type="button"
                  className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-bold border border-slate-300 dark:border-slate-700 transition-colors shadow-xs"
                >
                  .CSV
                </button>
              </div>
            </div>
          </div>

          {/* Section Danger : Nettoyage */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-extrabold text-rose-700 dark:text-rose-400">
                Effacer les relevés locaux
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pensez à exporter vos données avant de réinitialiser la session.
              </p>
            </div>

            <button
              onClick={() => {
                if (confirm('Attention : Êtes-vous sûr de vouloir supprimer tous les points et enregistrements vocaux enregistrés sur cet appareil ?')) {
                  onClearAll();
                  onClose();
                }
              }}
              disabled={points.length === 0}
              id="btn-clear-all-points"
              type="button"
              className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Tout effacer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
