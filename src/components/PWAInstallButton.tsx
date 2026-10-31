import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Windows 11 Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-amber-500 font-semibold text-slate-950 shadow-sm hover:bg-amber-400 active:scale-95 transition whitespace-nowrap shrink-0 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
        }`}
        title="Install AUI Campus Manager on your device"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 font-medium text-amber-300 hover:bg-amber-500/20 active:scale-95 transition whitespace-nowrap shrink-0 ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm'
          }`}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print">
            <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-semibold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-xs text-slate-950">
                    1
                  </span>
                  <p>
                    Tap the <strong className="text-white">Share</strong> icon at the bottom of your Safari screen.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-xs text-slate-950">
                    2
                  </span>
                  <p>
                    Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-xs text-slate-950">
                    3
                  </span>
                  <p>
                    Tap <strong className="text-white">Add</strong> in the top right corner. The app will launch with full screen access!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Always accessible manual install advice button for any unsupported browser
  return (
    <button
      onClick={() => {
        alert(
          'To install on Windows or Android: Open browser menu (⋮ or ...) and click "Install AUI Campus Manager" or "Add to Home screen".'
        );
      }}
      className={`hidden md:flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 font-medium text-amber-300 hover:bg-amber-500/20 active:scale-95 transition whitespace-nowrap shrink-0 ${
        compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs'
      }`}
    >
      <Download className="w-3.5 h-3.5 shrink-0" />
      <span>Install PWA</span>
    </button>
  );
};
