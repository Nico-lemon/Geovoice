import JSZip from 'jszip';
import { GpsPoint } from '../types';

const DB_NAME = 'GeoVoiceDB';
const DB_VERSION = 1;
const STORE_POINTS = 'points';
const STORE_TRACKS = 'tracks';

export class GeoDatabase {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_POINTS)) {
          const pointStore = db.createObjectStore(STORE_POINTS, { keyPath: 'id' });
          pointStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_TRACKS)) {
          db.createObjectStore(STORE_TRACKS, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPoints(): Promise<GpsPoint[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_POINTS, 'readonly');
      const store = transaction.objectStore(STORE_POINTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const points = (request.result as GpsPoint[]) || [];
        points.sort((a, b) => b.timestamp - a.timestamp);
        resolve(points);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async savePoint(point: GpsPoint): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_POINTS, 'readwrite');
      const store = transaction.objectStore(STORE_POINTS);
      const request = store.put(point);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deletePoint(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_POINTS, 'readwrite');
      const store = transaction.objectStore(STORE_POINTS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_POINTS, 'readwrite');
      const store = transaction.objectStore(STORE_POINTS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new GeoDatabase();

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getAudioFilename(pt: GpsPoint, index: number): string {
  const d = new Date(pt.timestamp);
  const time = `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`;
  const safeTitle = (pt.title || `point_${index + 1}`).replace(/[^a-z0-9_-]/gi, '_');
  return `${String(index + 1).padStart(3, '0')}_${safeTitle}_${time}.webm`;
}

// Export GPX avec liens vers les fichiers audio et retranscriptions
export function exportToGPX(points: GpsPoint[], trackName = 'Points GeoVoice'): string {
  const dateStr = new Date().toISOString();
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GeoVoice App" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <name>${escapeXml(trackName)}</name>
    <time>${dateStr}</time>
    <desc>Points GPS et notes vocales enregistrés avec GeoVoice</desc>
  </metadata>
`;

  points.forEach((pt, idx) => {
    const timeIso = new Date(pt.timestamp).toISOString();
    const ele = pt.coords.altitude !== null ? `\n    <ele>${pt.coords.altitude.toFixed(1)}</ele>` : '';
    const audioFile = pt.audioBlob ? getAudioFilename(pt, idx) : '';
    
    const descParts = [
      pt.transcription ? `Note vocale: ${pt.transcription}` : '',
      pt.notes ? `Commentaire: ${pt.notes}` : '',
      `Catégorie: ${pt.category}`,
      `Précision GPS: ±${pt.coords.accuracy.toFixed(1)}m`,
      pt.coords.speed !== null ? `Vitesse: ${(pt.coords.speed * 3.6).toFixed(1)} km/h` : '',
      audioFile ? `Fichier audio: audio/${audioFile}` : ''
    ].filter(Boolean);

    gpx += `  <wpt lat="${pt.coords.latitude}" lon="${pt.coords.longitude}">${ele}
    <time>${timeIso}</time>
    <name>${escapeXml(pt.title || `Point #${idx + 1}`)}</name>
    <cmt>${escapeXml(pt.transcription || '')}</cmt>
    <desc>${escapeXml(descParts.join(' | '))}</desc>
    <sym>Flag, Blue</sym>
    <type>${escapeXml(pt.category)}</type>${audioFile ? `\n    <link href="audio/${escapeXml(audioFile)}">\n      <text>Mémo vocal (${pt.audioDuration}s)</text>\n    </link>` : ''}
  </wpt>\n`;
  });

  gpx += `</gpx>`;
  return gpx;
}

// Export GeoJSON
export function exportToGeoJSON(points: GpsPoint[]): string {
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      generatedAt: new Date().toISOString(),
      count: points.length,
      generator: 'GeoVoice'
    },
    features: points.map((pt, idx) => {
      const audioFile = pt.audioBlob ? getAudioFilename(pt, idx) : null;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [pt.coords.longitude, pt.coords.latitude, pt.coords.altitude || 0]
        },
        properties: {
          id: pt.id,
          title: pt.title,
          index: idx + 1,
          timestamp: pt.timestamp,
          formattedDate: new Date(pt.timestamp).toLocaleString('fr-FR'),
          transcription: pt.transcription,
          notes: pt.notes || '',
          category: pt.category,
          accuracy: pt.coords.accuracy,
          speedKmh: pt.coords.speed !== null ? Number((pt.coords.speed * 3.6).toFixed(1)) : null,
          audioDuration: pt.audioDuration,
          audioFile: audioFile ? `audio/${audioFile}` : null
        }
      };
    })
  };
  return JSON.stringify(geojson, null, 2);
}

// Export KML
export function exportToKML(points: GpsPoint[], title = 'Relevé GPS GeoVoice'): string {
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    <description>Relevés de terrain et mémos vocaux enregistrés avec GeoVoice</description>
`;

  points.forEach((pt, idx) => {
    const audioFile = pt.audioBlob ? getAudioFilename(pt, idx) : '';
    const desc = `
      <![CDATA[
        <h3>${escapeXml(pt.title)}</h3>
        <p><strong>Date:</strong> ${new Date(pt.timestamp).toLocaleString('fr-FR')}</p>
        <p><strong>Note vocale:</strong> <em>${pt.transcription || 'Aucune retranscription'}</em></p>
        <p><strong>Catégorie:</strong> ${pt.category}</p>
        <p><strong>Précision:</strong> ±${pt.coords.accuracy.toFixed(1)} m</p>
        ${pt.coords.altitude ? `<p><strong>Altitude:</strong> ${pt.coords.altitude.toFixed(1)} m</p>` : ''}
        ${audioFile ? `<p><strong>Fichier audio :</strong> <code>audio/${audioFile}</code> (${pt.audioDuration}s)</p>` : ''}
      ]]>
    `;
    kml += `    <Placemark>
      <name>${escapeXml(pt.title)}</name>
      <description>${desc.trim()}</description>
      <Point>
        <coordinates>${pt.coords.longitude},${pt.coords.latitude},${pt.coords.altitude || 0}</coordinates>
      </Point>
    </Placemark>\n`;
  });

  kml += `  </Document>
</kml>`;
  return kml;
}

// Export CSV avec UTF-8 BOM
export function exportToCSV(points: GpsPoint[]): string {
  const headers = [
    'ID',
    'Numéro',
    'Date',
    'Heure',
    'Titre',
    'Latitude',
    'Longitude',
    'Altitude (m)',
    'Précision (m)',
    'Vitesse (km/h)',
    'Catégorie',
    'Transcription Vocale',
    'Fichier Audio',
    'Durée Audio (s)',
    'Notes'
  ];

  const rows = points.map((pt, idx) => {
    const d = new Date(pt.timestamp);
    const audioFile = pt.audioBlob ? getAudioFilename(pt, idx) : '';
    return [
      `"${pt.id}"`,
      idx + 1,
      `"${d.toLocaleDateString('fr-FR')}"`,
      `"${d.toLocaleTimeString('fr-FR')}"`,
      `"${(pt.title || '').replace(/"/g, '""')}"`,
      pt.coords.latitude,
      pt.coords.longitude,
      pt.coords.altitude ? pt.coords.altitude.toFixed(1) : '',
      pt.coords.accuracy.toFixed(1),
      pt.coords.speed ? (pt.coords.speed * 3.6).toFixed(1) : '',
      `"${pt.category}"`,
      `"${(pt.transcription || '').replace(/"/g, '""')}"`,
      `"${audioFile ? `audio/${audioFile}` : ''}"`,
      pt.audioDuration || 0,
      `"${(pt.notes || '').replace(/"/g, '""')}"`
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\n');
}

// Génération du Rapport Web Interactif HTML autonome avec AUDIOS INTÉGRÉS en Base64
export async function exportToHTMLReport(points: GpsPoint[]): Promise<string> {
  const pointsWithAudioData = await Promise.all(
    points.map(async (pt, idx) => {
      let base64Audio = '';
      if (pt.audioBlob && pt.audioBlob.size > 0) {
        try {
          base64Audio = await blobToBase64(pt.audioBlob);
        } catch (e) {
          console.warn('Failed to convert audio blob for point', pt.id, e);
        }
      }
      return {
        ...pt,
        index: idx + 1,
        audioDataUrl: base64Audio,
        audioFilename: pt.audioBlob ? getAudioFilename(pt, idx) : null
      };
    })
  );

  const pointsJson = JSON.stringify(pointsWithAudioData);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relevé GPS & Notes Vocales - GeoVoice</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    :root {
      --bg: #090d16;
      --card: #0f172a;
      --border: #1e293b;
      --primary: #10b981;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    header {
      background: var(--card);
      border-bottom: 1px solid var(--border);
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon {
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: var(--primary);
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    .badge {
      background: rgba(16, 185, 129, 0.15);
      color: var(--primary);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    #map {
      flex: 1;
      height: 100%;
      background: #020617;
    }
    .sidebar {
      width: 420px;
      background: var(--card);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sidebar-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 600;
    }
    .points-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .point-card {
      background: rgba(2, 6, 23, 0.6);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .point-card:hover, .point-card.active {
      border-color: var(--primary);
      background: rgba(16, 185, 129, 0.05);
    }
    .point-title {
      font-weight: bold;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .point-meta {
      font-size: 11px;
      color: var(--text-muted);
      font-family: monospace;
      margin-bottom: 8px;
    }
    .transcription {
      font-size: 12px;
      font-style: italic;
      color: #e2e8f0;
      background: rgba(0, 0, 0, 0.3);
      padding: 8px 10px;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 3px solid var(--primary);
    }
    audio {
      width: 100%;
      height: 36px;
      border-radius: 6px;
      outline: none;
    }
    .custom-pin {
      background: var(--primary);
      color: #020617;
      border: 2px solid #ffffff;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    @media (max-width: 768px) {
      .main-layout { flex-direction: column; }
      .sidebar { width: 100%; height: 50%; border-left: none; border-top: 1px solid var(--border); }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">🎙️</div>
      <div>
        <h1 style="font-size: 16px; font-weight: bold;">GeoVoice - Rapport de Terrain</h1>
        <p style="font-size: 11px; color: var(--text-muted);">Points GPS et notes vocales associées</p>
      </div>
    </div>
    <div class="badge">${points.length} point${points.length > 1 ? 's' : ''} avec audio</div>
  </header>

  <div class="main-layout">
    <div id="map"></div>
    <div class="sidebar">
      <div class="sidebar-header">Liste des mémos audio et positions GPS</div>
      <div class="points-list" id="points-container"></div>
    </div>
  </div>

  <script>
    const points = ${pointsJson};
    
    // Initialisation de la carte
    const initialLat = points.length > 0 ? points[0].coords.latitude : 48.8566;
    const initialLon = points.length > 0 ? points[0].coords.longitude : 2.3522;
    const map = L.map('map').setView([initialLat, initialLon], points.length > 0 ? 15 : 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB & OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    const markers = {};
    const container = document.getElementById('points-container');

    points.forEach((pt, index) => {
      // Marqueur sur la carte
      const icon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: '<div class="custom-pin">' + (index + 1) + '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([pt.coords.latitude, pt.coords.longitude], { icon }).addTo(map);
      
      let popupHtml = '<div style="color:#020617; font-family:sans-serif; min-width:200px;">' +
        '<strong>#' + (index + 1) + ' ' + (pt.title || 'Point GPS') + '</strong><br/>' +
        '<small>' + new Date(pt.timestamp).toLocaleString('fr-FR') + '</small><br/>';
      
      if (pt.transcription) {
        popupHtml += '<p style="margin:6px 0; font-size:12px; font-style:italic;">"' + pt.transcription + '"</p>';
      }

      if (pt.audioDataUrl) {
        popupHtml += '<audio controls style="width:100%; margin-top:6px;" src="' + pt.audioDataUrl + '"></audio>';
      }

      popupHtml += '</div>';
      marker.bindPopup(popupHtml);
      markers[pt.id] = marker;

      // Carte dans la barre latérale
      const card = document.createElement('div');
      card.className = 'point-card';
      card.id = 'card-' + pt.id;
      
      let cardHtml = '<div class="point-title">' +
        '<span>#' + (index + 1) + ' ' + (pt.title || 'Point GPS') + '</span>' +
        '<span style="font-size:11px; color:#10b981; font-weight:normal;">±' + pt.coords.accuracy.toFixed(1) + 'm</span>' +
        '</div>' +
        '<div class="point-meta">' +
        '🕒 ' + new Date(pt.timestamp).toLocaleString('fr-FR') + ' | 📍 ' + pt.coords.latitude.toFixed(5) + ', ' + pt.coords.longitude.toFixed(5) +
        '</div>';

      if (pt.transcription) {
        cardHtml += '<div class="transcription">"' + pt.transcription + '"</div>';
      }

      if (pt.audioDataUrl) {
        cardHtml += '<audio controls preload="none" src="' + pt.audioDataUrl + '"></audio>';
      }

      card.innerHTML = cardHtml;
      
      let currentAudio = null;

      marker.on('click', () => {
        if (pt.audioDataUrl) {
          if (currentAudio) {
            currentAudio.pause();
          }
          const aud = new Audio(pt.audioDataUrl);
          currentAudio = aud;
          aud.play().catch(e => console.log('Autoplay requires user click', e));
        }

        document.querySelectorAll('.point-card').forEach(c => c.classList.remove('active'));
        if (card) {
          card.classList.add('active');
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      card.onclick = () => {
        map.setView([pt.coords.latitude, pt.coords.longitude], 17);
        marker.openPopup();
        document.querySelectorAll('.point-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        if (pt.audioDataUrl) {
          if (currentAudio) {
            currentAudio.pause();
          }
          const aud = new Audio(pt.audioDataUrl);
          currentAudio = aud;
          aud.play().catch(console.warn);
        }
      };

      container.appendChild(card);
    });

    if (points.length > 1) {
      const group = new L.featureGroup(Object.values(markers));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  </script>
</body>
</html>`;
}

// Archive ZIP complète : Contient tous les fichiers audios .webm originaux + formats SIG + rapport interactif
export async function createFullZipArchive(points: GpsPoint[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. Fichiers de données géographiques
  zip.file('points.gpx', exportToGPX(points));
  zip.file('points.geojson', exportToGeoJSON(points));
  zip.file('points.kml', exportToKML(points));
  zip.file('points.csv', '\uFEFF' + exportToCSV(points));

  // 2. Rapport web interactif autonome avec lecteurs audio
  const htmlReport = await exportToHTMLReport(points);
  zip.file('rapport_interactif.html', htmlReport);

  // 3. Dossier de tous les fichiers audio .webm
  const audioFolder = zip.folder('audio');
  if (audioFolder) {
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (pt.audioBlob && pt.audioBlob.size > 0) {
        const filename = getAudioFilename(pt, i);
        audioFolder.file(filename, pt.audioBlob);
      }
    }
  }

  // 4. Fichier d'aide et documentation
  const readmeContent = `GEOVOICE - ARCHIVE COMPLETE D'ENREGISTREMENT GPS & VOCAL
======================================================
Date de génération: ${new Date().toLocaleString('fr-FR')}
Nombre de points enregistrés: ${points.length}

CONTENU DE L'ARCHIVE :
---------------------
1. rapport_interactif.html :
   Ouvrez ce fichier dans n'importe quel navigateur (Chrome, Firefox, Safari, Edge).
   Vous y retrouverez la carte interactive avec tous vos points GPS et les lecteurs audio pour écouter vos enregistrements vocaux en un clic !

2. Dossier /audio/ :
   Contient tous vos fichiers audio d'origine au format haute fidélité (.webm).
   Vous pouvez les écouter avec VLC, les importer dans un logiciel de montage ou les archiver.

3. points.gpx :
   Format standard GPS compatible Garmin, Strava, OpenRunner, QGIS, TwoNav, etc.
   Inclut les coordonnées, les transcriptions textuelles et les liens vers les fichiers audio.

4. points.kml :
   Fichier pour Google Earth et Google My Maps.

5. points.csv :
   Tableau prêt pour Excel ou Google Sheets (avec séparateur point-virgule et encodage UTF-8).

6. points.geojson :
   Pour les SIG et développeurs cartographiques (QGIS, ArcGIS, Mapbox, Leaflet).
`;
  zip.file('LISEZMOI_AUDIO.txt', readmeContent);

  return await zip.generateAsync({ type: 'blob' });
}

// Archive ZIP contenant uniquement tous les fichiers audio
export async function createAudioOnlyZip(points: GpsPoint[]): Promise<Blob> {
  const zip = new JSZip();

  let audioCount = 0;
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.audioBlob && pt.audioBlob.size > 0) {
      const filename = getAudioFilename(pt, i);
      zip.file(filename, pt.audioBlob);
      audioCount++;
    }
  }

  if (audioCount === 0) {
    zip.file('info.txt', 'Aucun enregistrement audio disponible pour ces points.');
  }

  return await zip.generateAsync({ type: 'blob' });
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
