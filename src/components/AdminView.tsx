import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  ArrowLeft,
  Crown,
  Lock,
  Unlock,
  KeyRound,
  Copy,
  Check,
  Flame,
  X,
  Send,
} from 'lucide-react';

interface AdminViewProps {
  onNavigateHome: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onNavigateHome }) => {
  // Security State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Interaction States
  const [copied, setCopied] = useState(false);
  const [isSorryModalOpen, setIsSorryModalOpen] = useState(false);
  const [copiedApology, setCopiedApology] = useState(false);
  const [sentLove, setSentLove] = useState(false);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = passcode.trim().toLowerCase();
    // Accept valid passcodes like koukar, ex, 1234, admin, 2026, or any master key
    if (
      cleanCode === 'koukar' ||
      cleanCode === 'ex' 
    ) {
      setIsAuthenticated(true);
      setAuthError(false);
      try {
        sessionStorage.setItem('admin_authenticated', 'true');
      } catch {
        // ignore storage error
      }
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2500);
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    setPasscode('');
    try {
      sessionStorage.removeItem('admin_authenticated');
    } catch {
      // ignore
    }
  };

  const handleCopyQuote = () => {
    navigator.clipboard.writeText('for the sexiest ex on earth');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apologyText =
    "I am truly sorry for any times I let you down, and caused you pain.pect in the world.";
  const handleCopyApology = () => {
    navigator.clipboard.writeText(apologyText);
    setCopiedApology(true);
    setTimeout(() => setCopiedApology(false), 2000);
  };

  const handleSendLove = () => {
    setSentLove(true);
    setTimeout(() => setSentLove(false), 3000);
  };

  // Locked Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans flex flex-col justify-between overflow-x-hidden selection:bg-rose-200">
        {/* Top Header */}
        <header className="h-16 border-b border-black flex items-center justify-between px-4 sm:px-8 bg-white sticky top-0 z-30 shrink-0">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 border border-black rounded-full hover:bg-black hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Studio Canvas</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
            <Lock className="w-3.5 h-3.5 text-black" />
            <span>Private Area</span>
          </div>
        </header>

        {/* Lock Card Container */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-md mx-auto w-full">
          <div className="w-full bg-white border-2 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-rose-600" />
            </div>

            <p className="text-[10px] uppercase tracking-[0.25em] font-mono text-gray-400 font-bold mb-1">
              Admin Exclusive Access
            </p>
            <h2 className="text-xl font-serif italic font-bold text-[#1A1A1A] mb-4">
              Enter Passcode
            </h2>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  autoFocus
                  className={`w-full px-4 py-2.5 bg-[#FAF9F6] border ${
                    authError ? 'border-red-500 ring-2 ring-red-200' : 'border-black'
                  } rounded-lg text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-black transition-all`}
                />
              </div>

              {authError && (
                <p className="text-xs text-red-600 font-mono font-bold animate-shake">
                  Incorrect passcode. Please try again.
                </p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPasscode('koukar');
                    setIsAuthenticated(true);
                    setAuthError(false);
                    try {
                      sessionStorage.setItem('admin_authenticated', 'true');
                    } catch {}
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Quick Unlock (Owner Key)
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-[11px] text-gray-400 hover:text-black font-mono underline cursor-pointer"
                >
                  {showHint ? 'Passcode: koukar / ex' : 'Need a hint?'}
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="border-t border-black/10 py-4 px-6 text-center text-[10px] font-mono text-gray-400">
          koukar's Craft • Secure Private Portal
        </footer>
      </div>
    );
  }

  // Authenticated Screen - Clean, Minimalist, Elegant
  return (
    <div className="min-h-screen w-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans flex flex-col justify-between overflow-x-hidden selection:bg-rose-200">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-black flex items-center justify-between px-4 sm:px-8 bg-white sticky top-0 z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateHome}
            className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 border border-black rounded-full hover:bg-black hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Studio Canvas</span>
          </button>
          <span className="text-[11px] font-mono text-gray-400">/</span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-rose-600 font-bold flex items-center gap-1">
            <Crown className="w-3 h-3 inline" /> Admin Dedication
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleLock}
            title="Lock Admin Access"
            className="px-3 py-1 bg-white hover:bg-gray-100 border border-black rounded-full text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Lock className="w-3 h-3 text-black" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Main Hero & Dedication Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-3xl mx-auto w-full">
        {/* Subtle Brand Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black text-xs font-mono uppercase tracking-[0.25em] shadow-xs mb-6">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          <span>koukar's Craft • her Ex edition v1</span>
        </div>

        {/* The Star Dedication Card - Clean, Focused, Minimalist */}
        <div className="relative w-full bg-white border-2 border-black p-8 sm:p-14 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center overflow-hidden">
          <div className="py-6 sm:py-8">
            <p className="text-[11px] uppercase tracking-[0.3em] font-mono text-gray-400 mb-4 font-semibold">
              EXCLUSIVE MESSAGE
            </p>

            {/* The Main Requested Dedication */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif italic font-bold tracking-tight text-[#1A1A1A] leading-tight px-2">
              “for the sexiest ex on earth”
            </h1>

            <div className="w-12 h-0.5 bg-rose-400 mx-auto my-6" />

            <p className="text-sm font-sans text-gray-600 max-w-md mx-auto leading-relaxed">
              Artisan fuse bead studio crafted with pixel-precision and boundless care.
            </p>
          </div>

          {/* Action Buttons: Copy Quote & Popout Sorry Message */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-black/10">
            <button
              onClick={handleCopyQuote}
              className="px-4 py-2.5 bg-[#FAF9F6] hover:bg-black hover:text-white border border-black rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                  <span>Copy Dedication</span>
                </>
              )}
            </button>

            {/* Button that pops out the Sorry Message */}
            <button
              onClick={() => setIsSorryModalOpen(true)}
              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:shadow-sm"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>A Personal Message for You</span>
            </button>
          </div>
        </div>

        {/* Back to Studio Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onNavigateHome}
            className="px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-mono font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Studio Canvas</span>
          </button>
        </div>
      </main>

      {/* Popout Sorry Message Modal */}
      {isSorryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-fade-in">
          <div className="bg-white border-2 border-black w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-black flex items-center justify-between bg-rose-50">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                <h3 className="text-lg font-serif italic font-bold text-rose-950">
                  From the Bottom of My Heart
                </h3>
              </div>
              <button
                onClick={() => setIsSorryModalOpen(false)}
                className="p-1 hover:bg-rose-100 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-4 bg-[#FAF9F6]">
              <div className="bg-white border border-rose-200 p-6 rounded-lg shadow-2xs">
                <p className="text-sm sm:text-base font-serif italic text-gray-800 leading-relaxed">
                  “{apologyText}”
                </p>
              </div>

              {sentLove && (
                <div className="p-3 bg-rose-100 border border-rose-300 rounded-lg text-center text-xs font-mono font-bold text-rose-800 flex items-center justify-center gap-1.5 animate-pulse">
                  <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                  <span>Message sent with warmth and appreciation ❤️</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black bg-white flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleCopyApology}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedApology ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-600" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendLove}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-rose-600" />
                  <span>Send Love</span>
                </button>

                <button
                  onClick={() => setIsSorryModalOpen(false)}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-black/10 py-4 px-6 text-center text-[10px] font-mono text-gray-400">
        koukar's Craft , her Ex edition v1 • Authenticated Private Route
      </footer>
    </div>
  );
};
