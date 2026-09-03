import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Copy, Check, QrCode, Wifi } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-slate-100">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Ouvrir sur Téléphone</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scannez pour utiliser l'appli sur le terrain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="rounded-3xl bg-white p-4 shadow-xl border-4 border-emerald-500/40">
            <QRCodeSVG
              value={appUrl}
              size={220}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="mt-4 flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800/50 shadow-xs">
            <Wifi className="h-3.5 w-3.5" />
            <span>PWA & Web App prête pour le smartphone</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 rounded-2xl bg-slate-100 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <div className="flex items-start space-x-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[10px]">
              1
            </div>
            <p>Ouvrez l'appareil photo de votre smartphone (iPhone ou Android) et scannez le QR code ci-dessus.</p>
          </div>
          <div className="flex items-start space-x-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[10px]">
              2
            </div>
            <p>Autorisez le GPS et le Microphone lorsque le navigateur le demande.</p>
          </div>
          <div className="flex items-start space-x-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-[10px]">
              3
            </div>
            <p>Glissez le téléphone dans la poche et balisez avec votre <strong>bouton Bluetooth</strong> !</p>
          </div>
        </div>

        {/* Lien direct et bouton Copier */}
        <div className="mt-5 flex items-center space-x-2">
          <div className="flex-1 truncate rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold">
            {appUrl}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shrink-0 shadow-md"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
