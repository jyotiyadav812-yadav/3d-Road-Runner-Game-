import React, { useEffect } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Music } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onExitToInterface?: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onExitToInterface,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Escape', 'Space'].includes(e.key) || e.code === 'Space') {
        e.preventDefault();
        onResume();
      } else if (['Enter', 'KeyR'].includes(e.code)) {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResume, onRestart]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-950/65 backdrop-blur-sm select-none overflow-y-auto">
      <div 
        id="pause-card"
        className="w-full max-w-xs bg-slate-900/95 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center gap-4 sm:gap-5 my-auto"
      >
        <h3 className="text-2xl font-black text-white font-['Outfit'] tracking-wide">
          GAME PAUSED
        </h3>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            id="btn-resume-run"
            onClick={onResume}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-rose-600/30 active:scale-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME</span>
          </button>

          <button
            id="btn-restart-run"
            onClick={onRestart}
            className="w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm tracking-wider uppercase border border-slate-700 active:scale-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART</span>
          </button>

          {onExitToInterface && (
            <button
              id="btn-pause-exit-interface"
              onClick={onExitToInterface}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs tracking-wider uppercase border border-slate-800 active:scale-90 transition-all cursor-pointer"
            >
              Exit to Game Interface (Page 3)
            </button>
          )}
        </div>

        {/* Audio Toggles in Pause Menu */}
        <div className="flex items-center justify-center gap-3 pt-1 border-t border-slate-800 w-full">
          <button
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
              soundEnabled
                ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>SFX</span>
          </button>

          <button
            onClick={onToggleMusic}
            className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
              musicEnabled
                ? 'bg-slate-800/90 border-slate-700 text-amber-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Music</span>
          </button>
        </div>
      </div>
    </div>
  );
};
