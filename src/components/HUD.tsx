import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Pause, Flame, Zap, Camera, Sparkles } from 'lucide-react';
import { GameStats, CameraMode, GAME_LEVELS } from '../types';

interface HUDProps {
  stats: GameStats;
  milestoneMessage: string | null;
  levelAnnouncement?: string | null;
  soundEnabled: boolean;
  musicEnabled: boolean;
  cameraMode: CameraMode;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleCamera: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  milestoneMessage,
  levelAnnouncement,
  soundEnabled,
  musicEnabled,
  cameraMode,
  onToggleSound,
  onToggleMusic,
  onToggleCamera,
  onPause,
}) => {
  const [coinBump, setCoinBump] = useState(false);
  const currentLevelInfo = GAME_LEVELS[stats.currentLevel || 1];

  useEffect(() => {
    if (stats.coins > 0) {
      setCoinBump(true);
      const timer = setTimeout(() => setCoinBump(false), 150);
      return () => clearTimeout(timer);
    }
  }, [stats.coins]);

  const cameraModeLabels: Record<CameraMode, string> = {
    follow: 'REAR CAM',
    front: 'FACE CAM',
    angled: '3/4 ANGLE',
  };

  return (
    <header className="absolute top-0 left-0 right-0 p-2 sm:p-5 pt-[max(0.5rem,env(safe-area-inset-top))] px-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pointer-events-none z-20 select-none">
      <div className="max-w-4xl mx-auto flex items-start justify-between gap-1.5 sm:gap-3">
        
        {/* Left: Runner Badge & Coins & Multiplier */}
        <div className="flex flex-col gap-1 items-start min-w-0">
          <div className="flex items-center gap-1.5">
            {/* Runner Girl Face Badge */}
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-pink-500/40 shadow-lg shadow-pink-500/10">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-pink-500 to-amber-300 flex items-center justify-center text-[10px] sm:text-xs shadow-inner">
                🏃‍♀️
              </div>
              <span className="font-extrabold text-[10px] sm:text-xs text-pink-300 tracking-wide hidden xs:inline">
                BIB #07
              </span>
            </div>

            {/* Gold Coin Pill with Realism Shimmer */}
            <div 
              id="hud-coin-counter"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-amber-400/50 shadow-lg shadow-amber-500/15 transition-transform duration-150 ${
                coinBump ? 'scale-115 border-amber-300' : 'scale-100'
              }`}
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 flex items-center justify-center shadow text-slate-950 font-black text-[9px] sm:text-[11px] border border-amber-200">
                ★
              </div>
              <span className="font-black text-sm sm:text-base text-amber-300 tracking-wider">
                {stats.coins}
              </span>
            </div>
          </div>

          {/* Combo Multiplier Badge */}
          {stats.combo > 1 && (
            <div className="flex items-center gap-1 px-2 sm:px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500/90 to-rose-600/90 text-white font-black text-[10px] sm:text-xs shadow-md animate-pulse">
              <Flame className="w-3 h-3 text-yellow-200" />
              <span>{stats.multiplier}x COMBO</span>
            </div>
          )}
        </div>

        {/* Center: Distance, Level & Score */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          {/* Level Pill */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-md">
            <span className={`px-1.5 sm:px-2 py-0.2 rounded-full bg-gradient-to-r ${currentLevelInfo.badgeClass} text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white shadow-sm`}>
              LVL {stats.currentLevel || 1}
            </span>
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-200 tracking-wide uppercase truncate max-w-[90px] sm:max-w-none">
              {currentLevelInfo.subtitle}
            </span>
          </div>

          <div 
            id="hud-distance"
            className="flex items-baseline gap-1 px-2.5 sm:px-4 py-0.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 shadow-xl"
          >
            <span className="text-xl sm:text-3xl font-black tracking-tight text-white font-['Outfit']">
              {stats.distance.toLocaleString()}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
              m
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-300/90 tracking-wide drop-shadow">
              SCORE: <strong className="text-yellow-300 font-extrabold">{stats.score.toLocaleString()}</strong>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-cyan-400">
              <Zap className="w-3 h-3" />
              <span>{stats.speed} km/h</span>
            </div>
          </div>

          {/* Level Progression Progress Bar */}
          <div 
            id="hud-level-progress-bar"
            className="w-24 sm:w-44 bg-slate-950/80 rounded-full h-1 sm:h-1.5 border border-slate-700/60 overflow-hidden shadow-inner mt-0.5" 
            title={`Level Progress: ${Math.round(stats.levelProgress * 100)}%`}
          >
            <div 
              className={`h-full bg-gradient-to-r ${currentLevelInfo.badgeClass} transition-all duration-300 rounded-full`}
              style={{ width: `${Math.min(100, Math.max(4, Math.round(stats.levelProgress * 100)))}%` }}
            />
          </div>
        </div>

        {/* Right: Camera Angle, Sound Controls & Pause */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto">
          {/* Camera View Switcher */}
          <button
            id="btn-toggle-camera"
            onClick={onToggleCamera}
            title="Switch Camera View (V)"
            aria-label="Switch Camera View"
            className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-indigo-500/40 backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline text-[11px] font-black tracking-wider text-indigo-300">
              {cameraModeLabels[cameraMode]}
            </span>
          </button>

          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            aria-label="Toggle Sound Effects"
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              soundEnabled
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          <button
            id="btn-toggle-music"
            onClick={onToggleMusic}
            aria-label="Toggle Background Music"
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              musicEnabled
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
            }`}
          >
            <Music className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${musicEnabled ? 'text-amber-400' : 'opacity-40'}`} />
          </button>

          <button
            id="btn-pause-game"
            onClick={onPause}
            aria-label="Pause Game"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Floating Level Up Announcement Banner */}
      {levelAnnouncement && (
        <div className="mt-3 flex justify-center pointer-events-none animate-bounce">
          <div className={`px-6 py-2 rounded-2xl bg-gradient-to-r ${currentLevelInfo.badgeClass} text-white font-black text-sm sm:text-base shadow-2xl border border-white/40 flex items-center gap-2 tracking-wider uppercase`}>
            <Sparkles className="w-4 h-4 text-yellow-200" />
            <span>{levelAnnouncement}</span>
          </div>
        </div>
      )}

      {/* Floating Milestone Celebration Banner */}
      {milestoneMessage && (
        <div className="mt-2 flex justify-center pointer-events-none">
          <div className="px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-rose-500/30 border border-white/20 animate-bounce text-center">
            {milestoneMessage}
          </div>
        </div>
      )}
    </header>
  );
};
