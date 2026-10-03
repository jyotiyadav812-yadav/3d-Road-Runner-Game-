import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Trophy, Volume2, VolumeX, Music, ArrowRight, PartyPopper } from 'lucide-react';
import { sound } from '../game/audio';

interface CoverScreenProps {
  onContinue: () => void;
  highScore: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({
  onContinue,
  highScore,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
}) => {
  const [cheerNotice, setCheerNotice] = useState<string | null>(null);

  // Allow Enter, Space, or ArrowUp to proceed with sound
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
        sound.playPageTransition('next');
        onContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onContinue]);

  const handleHeroClick = () => {
    sound.playChampionCheer();
    setCheerNotice('🎉 Champion Finish Line! Crowd Roaring!');
    setTimeout(() => setCheerNotice(null), 2500);
  };

  const handleProceed = () => {
    sound.playPageTransition('next');
    onContinue();
  };

  return (
    <div 
      id="cover-screen-page"
      className="absolute inset-0 z-40 flex flex-col justify-between items-center p-3 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] px-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 select-none overflow-y-auto"
    >
      {/* Top Bar: Title Badge & Audio Controls */}
      <header className="w-full max-w-4xl flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] sm:text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
            <span className="truncate max-w-[130px] sm:max-w-none">Festival Marathon 2026</span>
          </div>

          {/* Active Audio Visualizer Pill */}
          <div 
            onClick={() => {
              sound.playUiClick();
              onToggleMusic();
            }}
            onMouseEnter={() => sound.playUiHover()}
            className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer transition-all ${
              musicEnabled 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
            title="Click to toggle festival music"
          >
            <div className="flex items-end gap-0.5 h-3">
              <span className={`w-0.5 rounded-full bg-amber-400 ${musicEnabled ? 'h-3 animate-pulse' : 'h-1'}`} />
              <span className={`w-0.5 rounded-full bg-amber-400 ${musicEnabled ? 'h-2 animate-bounce' : 'h-1'}`} />
              <span className={`w-0.5 rounded-full bg-amber-400 ${musicEnabled ? 'h-3.5 animate-pulse' : 'h-1'}`} />
              <span className={`w-0.5 rounded-full bg-amber-400 ${musicEnabled ? 'h-1.5 animate-bounce' : 'h-1'}`} />
            </div>
            <span>{musicEnabled ? 'Festival Music Active' : 'Music Paused'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {highScore > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold">
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
              <span>Record: {highScore.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-0.5 sm:p-1 shadow-md">
            <button
              id="btn-cover-sound"
              onClick={(e) => {
                e.stopPropagation();
                sound.playUiClick();
                onToggleSound();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                soundEnabled ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Sound Effects"
              aria-label="Toggle Sound Effects"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              id="btn-cover-music"
              onClick={(e) => {
                e.stopPropagation();
                sound.playUiClick();
                onToggleMusic();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
                musicEnabled ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Music"
              aria-label="Toggle Music"
            >
              <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Content: The Victory Runner Girl Artwork & Title */}
      <main className="w-full max-w-md flex flex-col items-center my-auto py-1 sm:py-2 relative">
        {/* Crowd Cheer Toast when Champion image is tapped */}
        {cheerNotice && (
          <div className="absolute -top-10 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold text-xs shadow-xl flex items-center gap-2 animate-bounce z-50">
            <PartyPopper className="w-4 h-4" />
            <span>{cheerNotice}</span>
          </div>
        )}

        {/* The Champion Runner Illustration with Cheer Sound on Click */}
        <div 
          onClick={handleHeroClick}
          onMouseEnter={() => sound.playUiHover()}
          className="relative group cursor-pointer w-48 h-48 xs:w-56 xs:h-56 sm:w-72 sm:h-72 max-h-[34vh] rounded-3xl overflow-hidden border-2 border-pink-500/40 shadow-2xl shadow-pink-500/20 bg-slate-900 transition-all duration-300 hover:scale-102 hover:border-pink-400 active:scale-95"
          title="Click to cheer and celebrate!"
        >
          <img
            id="cover-runner-image"
            src="/splash_runner.jpg"
            alt="Victorious Runner Girl Crossing the Finish Line with Confetti"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle glossy overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 pointer-events-none" />
          
          <div className="absolute bottom-2.5 sm:bottom-3 left-0 right-0 text-center pointer-events-none">
            <span className="inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-950/80 border border-pink-500/40 text-pink-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg group-hover:bg-pink-600 group-hover:text-white transition-colors">
              🏁 Tap for Champion Cheer 🔊
            </span>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="text-center mt-3 sm:mt-5 mb-3 sm:mb-5">
          <h1 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
            3D ROAD{' '}
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
              RUNNER
            </span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm font-medium mt-0.5 sm:mt-1">
            Sprint down the festive highway, dodge hazards & collect gold coins!
          </p>
        </div>

        {/* Primary Call to Action Button */}
        <button
          id="btn-cover-enter"
          onClick={handleProceed}
          onMouseEnter={() => sound.playUiHover()}
          className="w-full py-3.5 sm:py-4 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-rose-600/30 hover:scale-103 active:scale-95 transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          <span>PROCEED TO TRACKS</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <p className="text-slate-400 text-[10px] sm:text-[11px] font-semibold mt-2 sm:mt-3 tracking-wide">
          Tap anywhere or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">SPACE</kbd>
        </p>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-md text-center py-2 text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
        <span>Page 1 of 3 • Championship Edition</span>
        <span>•</span>
        <span className="text-amber-400/90 font-semibold">🔊 Audio & Music Ready</span>
      </footer>
    </div>
  );
};
