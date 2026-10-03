import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Coins, MapPin, Gauge, Home } from 'lucide-react';
import { GameStats, GAME_LEVELS } from '../types';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onExit: () => void;
  onToCover?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart, onExit, onToCover }) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;
  const levelInfo = GAME_LEVELS[stats.currentLevel || 1];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'KeyR'].includes(e.code)) {
        e.preventDefault();
        onRestart();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart, onExit]);

  useEffect(() => {
    if (isNewHighScore) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isNewHighScore]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-950/70 backdrop-blur-sm select-none animate-fadeIn overflow-y-auto">
      <div 
        id="game-over-card"
        className="w-full max-w-sm bg-slate-900/95 border border-slate-700/80 rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center gap-3.5 sm:gap-5 my-auto"
      >
        {/* Banner header */}
        <div className="flex flex-col items-center gap-1">
          {isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold text-xs uppercase tracking-wider animate-pulse">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>NEW PERSONAL BEST!</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              SPRINT FINISHED
            </span>
          )}

          <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] mt-1">
            {isNewHighScore ? 'AMAZING RUN!' : 'GREAT EFFORT!'}
          </h2>
        </div>

        {/* Big Final Score */}
        <div className="w-full py-3.5 px-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${levelInfo.badgeClass} text-[10px] font-black uppercase text-white shadow-sm`}>
              LVL {stats.currentLevel || 1}
            </span>
            <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              {levelInfo.subtitle}
            </span>
          </div>
          <span className="text-4xl font-black text-amber-300 tracking-tight font-['Outfit'] mt-0.5">
            {stats.score.toLocaleString()}
          </span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            TOTAL SCORE
          </span>
        </div>

        {/* Detailed Run Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          {/* Distance */}
          <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex flex-col items-center gap-1">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-extrabold text-white font-['Outfit']">
              {stats.distance}m
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Distance</span>
          </div>

          {/* Coins */}
          <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex flex-col items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-extrabold text-white font-['Outfit']">
              {stats.coins}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">Coins</span>
          </div>

          {/* Top Speed */}
          <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/40 flex flex-col items-center gap-1">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-extrabold text-white font-['Outfit']">
              {stats.speed}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">km/h</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-3 mt-1">
          <button
            id="btn-play-again"
            onClick={onRestart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-base tracking-wider uppercase shadow-xl shadow-rose-600/35 hover:scale-[1.02] active:scale-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RUN AGAIN</span>
          </button>

          <button
            id="btn-exit"
            onClick={onExit}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm tracking-wider uppercase border border-slate-700/80 hover:border-slate-600 active:scale-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span>GAME INTERFACE (PAGE 3)</span>
          </button>

          {onToCover && (
            <button
              id="btn-exit-cover"
              onClick={onToCover}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              Back to Title Cover (Page 1)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
