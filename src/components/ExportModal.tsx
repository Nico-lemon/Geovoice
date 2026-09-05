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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="bg-[#12181B] border-2 border-[#4A6B52] rounded-none max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[6px_6px_0px_#000000] overflow-hidden text-[#CFCFCF]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-[#4A6B52] bg-[#172025]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#12181B] border border-[#4A6B52] text-[#FF6B35]">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white uppercase font-tech tracking-wider">
                CENTRE D'EXPORT // MISSION TACTIQUE
              </h3>
              <p className="text-[11px] text-[#8E9CA3] font-mono">
                {points.length} BALISE{points.length > 1 ? 'S' : ''} GPS • {audioCount} NOTE{audioCount > 1 ? 'S' : ''} VOCALE{audioCount > 1 ? 'S' : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-export-modal"
            type="button"
            className="p-1.5 bg-[#12181B] border border-[#4A6B52] text-[#CFCFCF] hover:text-[#FF6B35] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message de succès */}
        {downloadSuccess && (
          <div className="bg-[#4A6B52] border-b border-[#D1FF00] text-white px-5 py-2.5 flex items-center gap-2 text-xs font-bold font-mono animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#D1FF00]" />
            <span>FICHIER "{downloadSuccess}" EXPORTÉ AVEC SUCCÈS.</span>
          </div>
        )}

        {/* Corps avec défilement */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Option phare : Archive ZIP complète avec tous les audios */}
          <div className="bg-[#172025] border-2 border-[#4A6B52] p-4 space-y-3 shadow-[3px_3px_0px_#000000]">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#FF6B35] text-black">
                    RECOMMANDE
                  </span>
                  <h4 className="font-black text-sm text-white uppercase font-tech tracking-wider">
                    PACKAGE ARCHIVE COMPLET (ZIP)
                  </h4>
                </div>
                <p className="text-[#CFCFCF] leading-relaxed font-sans text-xs">
                  Contient l'ensemble des fichiers <strong>GPX, KML, GeoJSON, CSV</strong> ainsi que <strong>tous les enregistrements vocaux (.webm)</strong> et le visualiseur carte HTML autonome pour consultation hors-ligne.
                </p>
              </div>

              <div className="p-2.5 bg-[#12181B] border border-[#4A6B52] text-[#FF6B35] shrink-0">
                <FileArchive className="w-6 h-6" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#2E3E47]">
              <button
                onClick={handleExportZip}
                disabled={isExportingZip || points.length === 0}
                id="btn-export-full-zip"
                type="button"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-[#4A6B52] hover:bg-[#3d5843] border-2 border-[#707B71] text-white font-mono font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isExportingZip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D1FF00]" />
                    <span>COMPRESSION EN COURS...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#FF6B35]" />
                    <span>TÉLÉCHARGER ARCHIVE COMPLÈTE (.ZIP)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportHtmlReport}
                disabled={isExportingHtml || points.length === 0}
                id="btn-export-html-map"
                type="button"
                className="px-3.5 py-2.5 bg-[#12181B] hover:bg-[#2E3E47] border border-[#4A6B52] text-white font-mono font-bold text-xs uppercase flex items-center gap-2 shadow-[2px_2px_0px_#000000] transition-colors"
                title="Générer un fichier HTML autonome avec carte et audios embarqués"
              >
                {isExportingHtml ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 text-[#D1FF00]" />}
                <span>CARTE WEB AUTONOME (.HTML)</span>
              </button>
            </div>
          </div>

          {/* Grille des formats standards */}
          <div className="space-y-2.5">
            <h4 className="font-black text-xs uppercase text-[#CFCFCF] tracking-wider">
              // EXPORTS STANDARDS PAR FORMAT
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* GPX */}
              <div className="bg-[#172025] border border-[#2E3E47] p-3 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000000]">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5 uppercase">
                    <Map className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span>FORMAT GPX</span>
                  </div>
                  <p className="text-[10px] text-[#8E9CA3] mt-0.5">
                    Garmin, Strava, OsmAnd, Komoot, QGIS
                  </p>
                </div>

                <button
                  onClick={handleExportGPX}
                  disabled={points.length === 0}
                  id="btn-export-gpx"
                  type="button"
                  className="px-3 py-1.5 bg-[#12181B] hover:bg-[#4A6B52] text-white border border-[#4A6B52] font-mono font-black text-xs uppercase transition-colors"
                >
                  .GPX
                </button>
              </div>

              {/* GeoJSON */}
              <div className="bg-[#172025] border border-[#2E3E47] p-3 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000000]">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5 uppercase">
                    <FileCode className="w-3.5 h-3.5 text-[#D1FF00]" />
                    <span>FORMAT GEOJSON</span>
                  </div>
                  <p className="text-[10px] text-[#8E9CA3] mt-0.5">
                    Web SIG, Leaflet, Mapbox, QGIS
                  </p>
                </div>

                <button
                  onClick={handleExportGeoJSON}
                  disabled={points.length === 0}
                  id="btn-export-geojson"
                  type="button"
                  className="px-3 py-1.5 bg-[#12181B] hover:bg-[#4A6B52] text-white border border-[#4A6B52] font-mono font-black text-xs uppercase transition-colors"
                >
                  .GEOJSON
                </button>
              </div>

              {/* KML */}
              <div className="bg-[#172025] border border-[#2E3E47] p-3 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000000]">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5 uppercase">
                    <Globe className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span>FORMAT KML</span>
                  </div>
                  <p className="text-[10px] text-[#8E9CA3] mt-0.5">
                    Google Earth, My Maps, SIG
                  </p>
                </div>

                <button
                  onClick={handleExportKML}
                  disabled={points.length === 0}
                  id="btn-export-kml"
                  type="button"
                  className="px-3 py-1.5 bg-[#12181B] hover:bg-[#4A6B52] text-white border border-[#4A6B52] font-mono font-black text-xs uppercase transition-colors"
                >
                  .KML
                </button>
              </div>

              {/* CSV / Excel */}
              <div className="bg-[#172025] border border-[#2E3E47] p-3 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000000]">
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5 uppercase">
                    <Table className="w-3.5 h-3.5 text-[#D1FF00]" />
                    <span>TABLEUR CSV</span>
                  </div>
                  <p className="text-[10px] text-[#8E9CA3] mt-0.5">
                    Excel, Calc, Google Sheets
                  </p>
                </div>

                <button
                  onClick={handleExportCSV}
                  disabled={points.length === 0}
                  id="btn-export-csv"
                  type="button"
                  className="px-3 py-1.5 bg-[#12181B] hover:bg-[#4A6B52] text-white border border-[#4A6B52] font-mono font-black text-xs uppercase transition-colors"
                >
                  .CSV
                </button>
              </div>
            </div>
          </div>

          {/* Section Danger : Nettoyage */}
          <div className="pt-3 border-t border-[#2E3E47] flex items-center justify-between">
            <div>
              <div className="font-black text-[#FF6B35] uppercase">
                PURGER DONNÉES LOCALES
              </div>
              <p className="text-[10px] text-[#8E9CA3]">
                Supprime définitivement la mémoire IndexedDB de la session.
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
              className="px-3.5 py-2 bg-[#12181B] hover:bg-[#FF6B35] text-[#FF6B35] hover:text-black border-2 border-[#FF6B35] font-mono font-black text-xs uppercase flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-[2px_2px_0px_#000000]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>PURGER LA SESSION</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
