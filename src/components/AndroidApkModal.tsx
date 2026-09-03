import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  ExternalLink,
  Terminal,
  Check,
  Copy,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstallPwa?: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallPwa,
}) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'builder' | 'capacitor'>('pwa');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const manifestDescription = "Enregistrement de points GPS et de mémos vocaux de terrain avec déclenchement Bluetooth et fonctionnement 100% hors-ligne.";

  const fullManifestJson = JSON.stringify({
    "id": "/",
    "name": "GeoVoice - Balises GPS & Notes Vocales",
    "short_name": "GeoVoice",
    "description": manifestDescription,
    "start_url": "/",
    "scope": "/",
    "display": "standalone",
    "orientation": "portrait-primary",
    "background_color": "#f8fafc",
    "theme_color": "#059669",
    "lang": "fr-FR",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
      { "src": "/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
      { "src": "/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }, null, 2);

  // URL de PWABuilder pré-remplie avec le domaine de l'application
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentOrigin)}`;

  const capacitorCommands = [
    'npm install @capacitor/core @capacitor/cli @capacitor/android',
    'npx cap add android',
    'npm run build',
    'npx cap copy android',
    'npx cap open android',
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Application Android & Fichier APK
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-300 dark:border-emerald-800">
                  Android 8 à 15+
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Installer sur votre téléphone ou générer le package APK autonome
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sélecteur d'onglets */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-2 bg-slate-100/50 dark:bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1. Installation Directe (Recommandé)</span>
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'builder'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2. Télécharger le fichier APK</span>
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'capacitor'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>3. Compiler soi-même (Android Studio)</span>
          </button>
        </div>

        {/* Corps avec défilement */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* ONGLET 1: INSTALLATION PWA DIRECTE */}
          {activeTab === 'pwa' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200">
                    Pourquoi l'installation directe est la meilleure solution :
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    Android intègre nativement le moteur PWA (Progressive Web App). Cela crée une <strong>vraie icône d'application autonome</strong> sur votre écran d'accueil, sans passer par le Play Store et <strong>sans avoir à autoriser les sources inconnues</strong>. L'application fonctionne à 100% hors-ligne avec accès au GPS et au Bluetooth.
                  </p>
                </div>
              </div>

              {deferredPrompt ? (
                <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div className="text-center sm:text-left">
                    <h5 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                      Prêt à installer sur cet appareil !
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Cliquez pour ajouter GeoVoice directement à vos applications.
                    </p>
                  </div>
                  <button
                    onClick={onInstallPwa}
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Installer sur mon Android</span>
                  </button>
                </div>
              ) : null}

              {/* Instructions étape par étape pour smartphone */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Étapes d'installation depuis Google Chrome / Firefox sur Android :</span>
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      1
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Ouvrez ce lien dans le navigateur de votre smartphone Android :{' '}
                      <code className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-emerald-700 dark:text-emerald-400 text-xs break-all">
                        {currentUrl}
                      </code>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      2
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Touchez les <strong>trois petits points verticaux (⋮)</strong> en haut à droite du navigateur.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      3
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Appuyez sur <strong>« Installer l'application »</strong> (ou <strong>« Ajouter à l'écran d'accueil »</strong>).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      4
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      L'icône GeoVoice est maintenant sur votre écran d'accueil et se lance en plein écran comme n'importe quelle application native Android.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 2: GENERER LE FICHIER APK VIA PWABUILDER */}
          {activeTab === 'builder' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800/60 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-900 dark:text-blue-300">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Génération automatique de fichier .APK (Package Android TWA)</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  Le projet contient déjà tous les fichiers certifiés (Manifest W3C, Service Worker, icônes 192px/512px). Vous pouvez utiliser le service officiel <strong>PWABuilder (maintenu par Microsoft et Google)</strong> pour générer un vrai fichier <code>.apk</code> ou <code>.aab</code> prêt à installer.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-4">
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Générateur d'APK en 1 Clic :
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Cliquez sur le bouton ci-dessous pour ouvrir PWABuilder avec l'adresse de votre application déjà configurée.
                  </p>
                </div>

                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-all active:scale-95"
                >
                  <span>Ouvrir PWABuilder pour générer mon APK</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Marche à suivre sur PWABuilder :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-1 font-medium">
                    <li>PWABuilder analyse l'URL et valide le score à 100%.</li>
                    <li>Cliquez sur le bouton violet <strong>« Package for Stores »</strong>.</li>
                    <li>Choisissez <strong>« Android »</strong> puis cliquez sur <strong>« Generate Package »</strong> pour télécharger votre fichier APK ou AAB.</li>
                  </ol>
                </div>

                {/* Encadré d'aide spécifique "description is missing" */}
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Si PWABuilder affiche "Your manifest description is missing" :</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    PWABuilder garde en mémoire cache la première vérification. Deux solutions rapides :
                  </p>
                  <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1 font-medium ml-1">
                    <li>
                      Cliquez sur le bouton <strong>« Re-test »</strong> en haut de PWABuilder pour forcer l'actualisation du fichier.
                    </li>
                    <li>
                      Ou cliquez sur <strong>« Edit your Manifest »</strong> dans PWABuilder et collez la description ci-dessous dans le champ <em>Description</em> :
                    </li>
                  </ul>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(manifestDescription);
                        setCopiedDesc(true);
                        setTimeout(() => setCopiedDesc(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      {copiedDesc ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDesc ? 'Description copiée !' : 'Copier le texte de la description'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(fullManifestJson);
                        setCopiedManifest(true);
                        setTimeout(() => setCopiedManifest(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      {copiedManifest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedManifest ? 'JSON Manifest copié !' : 'Copier tout le Manifest JSON'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 3: CAPACITOR & ANDROID STUDIO */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-slate-100">
                  <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Configuration Capacitor prête dans le code source</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  Le fichier <code>capacitor.config.json</code> est déjà configuré à la racine avec l'identifiant Android <code>com.geovoice.gpsaudio</code>. Vous pouvez compiler le projet directement avec <strong>Android Studio</strong> pour obtenir un binaire APK signé.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  Commandes à exécuter dans votre terminal :
                </h4>
                <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 text-emerald-400 font-mono text-xs space-y-2 relative">
                  {capacitorCommands.map((cmd, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 group">
                      <div className="truncate">
                        <span className="text-slate-500 mr-2">$</span>
                        <span>{cmd}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(cmd, i)}
                        className="p-1 text-slate-400 hover:text-white rounded bg-slate-800/80 hover:bg-slate-700 transition-colors shrink-0"
                        title="Copier la commande"
                      >
                        {copiedIndex === i ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  Dans Android Studio :
                </p>
                <p className="font-medium">
                  Allez dans le menu <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>. Le fichier <code>app-debug.apk</code> ou <code>app-release.apk</code> sera généré dans <code>android/app/build/outputs/apk/</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pied de page de la modale */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>GeoVoice PWA & Android v2.0</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
