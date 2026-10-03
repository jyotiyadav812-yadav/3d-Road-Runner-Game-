import React, { useEffect } from 'react';
import { Play, Trophy, Sparkles, Volume2, VolumeX, Music, ChevronRight, ArrowLeft } from 'lucide-react';
import { GameLevelId, GAME_LEVELS } from '../types';
import { sound } from '../game/audio';

interface StartMenuProps {
  onStart: () => void;
  onNext?: () => void;
  onBack?: () => void;
  highScore: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  selectedLevel: GameLevelId;
  onSelectLevel: (levelId: GameLevelId) => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  onStart,
  onNext,
  onBack,
  highScore,
  soundEnabled,
  musicEnabled,
  selectedLevel,
  onSelectLevel,
  onToggleSound,
  onToggleMusic,
}) => {
  const levelList: GameLevelId[] = [1, 2, 3, 4, 5];
  const levelIcons: Record<GameLevelId, string> = {
    1: '🏙️',
    2: '🛣️',
    3: '🌃',
    4: '🏔️',
    5: '🚗',
  };

  // Allow pressing Space, Enter, or ArrowUp to proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        sound.playPageTransition('next');
        if (onNext) onNext();
        else onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart, onNext]);

  const handleLevelClick = (lvlId: GameLevelId) => {
    sound.playLevelSelectSound(lvlId);
    onSelectLevel(lvlId);
  };

  const handleBackToCover = () => {
    sound.playPageTransition('back');
    if (onBack) onBack();
  };

  const handleProceed = () => {
    sound.playPageTransition('next');
    if (onNext) onNext();
    else onStart();
  };

  const handleQuickSprint = () => {
    sound.playWhistle();
    onStart();
  };

  return (
    <div 
      className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-2.5 sm:p-6 pt-[max(0.6rem,env(safe-area-inset-top))] pb-[max(0.6rem,env(safe-area-inset-bottom))] px-[max(0.6rem,env(safe-area-inset-left))] pr-[max(0.6rem,env(safe-area-inset-right))] select-none"
    >
      {/* Top Floating Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Title & Badge */}
        <div className="flex flex-col items-start gap-0.5 sm:gap-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {onBack && (
              <button
                id="btn-back-to-cover"
                onClick={handleBackToCover}
                onMouseEnter={() => sound.playUiHover()}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 backdrop-blur-md text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-90"
                title="Back to Title Screen"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-pink-400" />
                <span>Cover</span>
              </button>
            )}

            <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md shadow-lg">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-rose-300">
                Page 2 • Tracks
              </span>
            </div>

            {/* Music Equalizer Indicator */}
            <div 
              onClick={() => {
                sound.playUiClick();
                onToggleMusic();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold cursor-pointer transition-all ${
                musicEnabled 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
              title="Toggle Festival Music"
            >
              <div className="flex items-end gap-0.5 h-2.5">
                <span className={`w-0.5 rounded-full bg-amber-400 ${musicEnabled ? 'h-2.5 animate-pulse' : 'h-1'}`} />
                <span className={`w-0.5 rounded-full bg-amber-400 ${musicEnabled ? 'h-1.5 animate-bounce' : 'h-1'}`} />
                <span className={`w-0.5 rounded-full bg-amber-400 ${musicEnabled ? 'h-3 animate-pulse' : 'h-1'}`} />
              </div>
              <span>{musicEnabled ? 'Music ON' : 'Muted'}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-['Outfit'] drop-shadow-lg flex items-center gap-1.5 sm:gap-2">
            <span>3D ROAD</span>
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
              RUNNER
            </span>
          </h1>
        </div>

        {/* High Score & Audio Quick Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {highScore > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-md text-amber-300 shadow-md">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Best:</span>
              <span className="font-extrabold text-sm font-['Outfit']">{highScore.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/80 border border-slate-700/80 backdrop-blur-md rounded-2xl p-0.5 sm:p-1 shadow-md">
            <button
              id="btn-menu-sound"
              onClick={() => {
                sound.playUiClick();
                onToggleSound();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                soundEnabled ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Sound Effects"
              aria-label="Toggle Sound Effects"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              id="btn-menu-music"
              onClick={() => {
                sound.playUiClick();
                onToggleMusic();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
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

      {/* Middle is COMPLETELY CLEAR so the player sees the 3D runner girl & road perfectly! */}
      <div 
        className="flex-1 w-full flex items-center justify-center cursor-pointer pointer-events-auto group"
        onClick={handleProceed}
        onMouseEnter={() => sound.playUiHover()}
      >
        <div className="px-5 py-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-white text-xs sm:text-sm font-bold tracking-wider uppercase shadow-2xl flex items-center gap-2 transition-transform group-hover:scale-105 active:scale-90">
          <Play className="w-4 h-4 fill-current text-rose-400" />
          <span>Tap Anywhere or Press Space for Real Game Interface</span>
        </div>
      </div>

      {/* Bottom Area: Level Selector + Controls + Next Page Button */}
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-3 pointer-events-auto">
        {/* Interactive 5-Level Selector Bar with Custom Level Sound on Selection */}
        <div className="w-full bg-slate-950/85 backdrop-blur-md border border-slate-800/90 p-1.5 sm:p-2 rounded-2xl shadow-xl flex flex-col gap-1 sm:gap-1.5">
          <div className="flex items-center justify-between px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1 sm:gap-1.5">
              <span>SELECT TRACK</span>
              <span className="text-[9px] sm:text-[10px] text-pink-400 font-bold lowercase hidden xs:inline">(tap to preview)</span>
            </span>
            <span className="text-amber-400 truncate max-w-[140px] sm:max-w-none">{GAME_LEVELS[selectedLevel].tagline}</span>
          </div>

          <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
            {levelList.map((lvlId) => {
              const lvl = GAME_LEVELS[lvlId];
              const isSelected = selectedLevel === lvlId;
              return (
                <button
                  key={lvlId}
                  id={`btn-select-level-${lvlId}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLevelClick(lvlId);
                  }}
                  onMouseEnter={() => sound.playUiHover()}
                  className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer text-center active:scale-95 ${
                    isSelected
                      ? `bg-gradient-to-b ${lvl.badgeClass} text-white shadow-lg shadow-pink-500/20 scale-[1.03] border border-white/40 ring-2 ring-white/30 font-black`
                      : 'bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 border border-slate-700/60 font-bold'
                  }`}
                  title={lvl.description}
                >
                  <span className="text-xs sm:text-sm mb-0.5">{levelIcons[lvlId]}</span>
                  <span className="text-[9px] sm:text-[10px] leading-tight uppercase tracking-wider font-extrabold">
                    LVL {lvlId}
                  </span>
                  <span className="text-[9px] text-slate-200/90 font-medium leading-tight truncate w-full hidden sm:block">
                    {lvl.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Floating Controls & Navigation Buttons */}
        <footer className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          {/* Controls Interactive Sound Testing Pills */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/85 border border-slate-700/80 backdrop-blur-md shadow-xl text-xs font-semibold text-slate-300">
            <button
              onClick={() => sound.playLaneSwitch()}
              onMouseEnter={() => sound.playUiHover()}
              className="flex items-center gap-1 hover:text-white cursor-pointer active:scale-95"
              title="Click to test lane switch sound"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-[10px] font-mono text-slate-200 hover:border-pink-400">A</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-[10px] font-mono text-slate-200 hover:border-pink-400">D</kbd>
              <span className="text-[11px] text-slate-400 ml-0.5">Lanes 🔊</span>
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => sound.playJump()}
              onMouseEnter={() => sound.playUiHover()}
              className="flex items-center gap-1 hover:text-white cursor-pointer active:scale-95"
              title="Click to test jump sound"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-[10px] font-mono text-slate-200 hover:border-amber-400">W</kbd>
              <span className="text-[11px] text-slate-400 ml-0.5">Jump 🔊</span>
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => sound.playSlide()}
              onMouseEnter={() => sound.playUiHover()}
              className="flex items-center gap-1 hover:text-white cursor-pointer active:scale-95"
              title="Click to test slide sound"
            >
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-[10px] font-mono text-slate-200 hover:border-cyan-400">S</kbd>
              <span className="text-[11px] text-slate-400 ml-0.5">Slide 🔊</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Quick Sprint secondary button with whistle sound */}
            <button
              id="btn-quick-sprint"
              onClick={handleQuickSprint}
              onMouseEnter={() => sound.playUiHover()}
              className="px-3.5 sm:px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md flex-1 sm:flex-none"
              title="Start sprint directly with referee whistle"
            >
              <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>Quick Sprint</span>
            </button>

            {/* Primary Page 3 Navigation Button */}
            <button
              id="btn-to-interface"
              onClick={handleProceed}
              onMouseEnter={() => sound.playUiHover()}
              className="flex-2 sm:flex-none px-4 sm:px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-rose-600/35 hover:scale-105 active:scale-90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>GAME INTERFACE</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

