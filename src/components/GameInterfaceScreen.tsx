import React, { useState, useEffect } from 'react';
import { 
  Play, 
  ArrowLeft, 
  Sparkles, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Music, 
  Gauge, 
  Flame, 
  Camera, 
  ChevronRight, 
  ShieldAlert, 
  Coins, 
  CheckCircle2, 
  Smartphone,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { GameLevelId, GAME_LEVELS, CameraMode } from '../types';
import { sound } from '../game/audio';

interface GameInterfaceScreenProps {
  selectedLevel: GameLevelId;
  cameraMode: CameraMode;
  highScore: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onSelectCamera: (mode: CameraMode) => void;
  onStartGame: () => void;
  onBackToLevels: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  alwaysShowControls: boolean;
  onToggleAlwaysShowControls: () => void;
}

export const GameInterfaceScreen: React.FC<GameInterfaceScreenProps> = ({
  selectedLevel,
  cameraMode,
  highScore,
  soundEnabled,
  musicEnabled,
  onSelectCamera,
  onStartGame,
  onBackToLevels,
  onToggleSound,
  onToggleMusic,
  alwaysShowControls,
  onToggleAlwaysShowControls,
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [testAction, setTestAction] = useState<string | null>(null);
  const level = GAME_LEVELS[selectedLevel];

  // Calculate distance goal to next level
  const nextLevelId = (selectedLevel < 5 ? selectedLevel + 1 : 5) as GameLevelId;
  const targetDistance = selectedLevel < 5 ? GAME_LEVELS[nextLevelId].distanceThreshold : 3000;

  // Key navigation: Space or Enter to trigger countdown or start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (countdown !== null) return;
      if (['Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
        startCountdown();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBackToLevels();
      } else if (e.key === 'v' || e.key === 'V') {
        const nextCam: CameraMode = cameraMode === 'follow' ? 'front' : cameraMode === 'front' ? 'angled' : 'follow';
        onSelectCamera(nextCam);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [countdown, onBackToLevels, cameraMode, onSelectCamera]);

  const startCountdown = () => {
    if (countdown !== null) return;
    setCountdown(3);
    sound.playCountdownBeep(false);

    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playCountdownBeep(false);
      } else if (count === 0) {
        setCountdown(0); // GO!
        sound.playCountdownBeep(true);
      } else {
        clearInterval(timer);
        onStartGame();
      }
    }, 700);
  };

  const handleTestKey = (action: string) => {
    setTestAction(action);
    if (action === 'JUMP') sound.playJump();
    else if (action === 'SLIDE') sound.playSlide();
    else sound.playLaneSwitch();
    setTimeout(() => setTestAction(null), 400);
  };

  return (
    <div 
      id="game-interface-page-3"
      className="absolute inset-0 z-30 flex flex-col justify-between p-2.5 sm:p-5 pt-[max(0.6rem,env(safe-area-inset-top))] pb-[max(0.6rem,env(safe-area-inset-bottom))] px-[max(0.6rem,env(safe-area-inset-left))] pr-[max(0.6rem,env(safe-area-inset-right))] select-none overflow-y-auto pointer-events-auto bg-slate-950/40 backdrop-blur-[2px]"
    >
      {/* 3... 2... 1... GO! Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-md animate-fadeIn">
          <div className="text-center flex flex-col items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              {level.name}
            </span>
            <div className="text-8xl sm:text-9xl font-black font-['Outfit'] text-white drop-shadow-[0_0_35px_rgba(244,63,94,0.8)] animate-scaleUp">
              {countdown === 0 ? (
                <span className="bg-gradient-to-r from-amber-300 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                  SPRINT!
                </span>
              ) : (
                countdown
              )}
            </div>
            <p className="text-sm font-bold text-slate-300 tracking-wide mt-2">
              {countdown === 0 ? 'DODGE OBSTACLES & GRAB COINS!' : 'READY YOUR REFLEXES...'}
            </p>
          </div>
        </div>
      )}

      {/* Top Floating Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Navigation & Page Status */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            id="btn-back-to-levels"
            onClick={onBackToLevels}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 backdrop-blur-md text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-90"
            title="Back to Track Selection (Page 2)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-pink-400" />
            <span>Tracks</span>
          </button>

          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] sm:text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-md">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
            <span>Page 3 • Race Cockpit</span>
          </div>
        </div>

        {/* High Score & Audio Quick Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Launch button for mobile phone top bar */}
          <button
            id="btn-mobile-quick-launch"
            onClick={startCountdown}
            className="md:hidden px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-xs tracking-wider uppercase shadow-md active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>LAUNCH</span>
          </button>

          {highScore > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-md text-amber-300 shadow-md">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold">BEST: {highScore.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-2xl p-0.5 sm:p-1 shadow-md">
            <button
              onClick={onToggleSound}
              className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                soundEnabled ? 'text-slate-200 hover:text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Toggle Sound Effects"
              aria-label="Toggle Sound Effects"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={onToggleMusic}
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

      {/* Main Interactive Real Game Console Cockpit */}
      <main className="w-full max-w-5xl mx-auto my-auto py-2 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left Column: Selected Track & Mission Intel */}
        <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                TRACK TELEMETRY
              </span>
              <span className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${level.badgeClass} text-[10px] font-black uppercase text-white shadow-sm`}>
                LVL {level.id}
              </span>
            </div>

            <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
              {level.name}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {level.description}
            </p>
          </div>

          {/* Track Condition Cards */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Start Milestone:</span>
              <span className="font-extrabold text-amber-300">{level.distanceThreshold}m</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Next Level Gate:</span>
              <span className="font-extrabold text-emerald-400">{targetDistance}m</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">Traffic Intensity:</span>
              <span className="font-extrabold text-rose-400">
                {level.trafficDensity >= 0.8 ? 'EXTREME' : level.trafficDensity >= 0.5 ? 'MODERATE' : 'LIGHT'}
              </span>
            </div>
          </div>

          {/* Mission Objectives Checklist */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RUN OBJECTIVES</span>
            </span>
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Reach {targetDistance}m distance checkpoint</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Collect gold coins for combo multiplier</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Dodge roadblocks & moving vehicles</span>
            </div>
          </div>
        </div>

        {/* Center Column: Live Cockpit Telemetry & Camera Angle Selection */}
        <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              RACE INSTRUMENTS
            </span>

            {/* Speed & Multiplier Gauges */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center gap-1 text-center">
                <Gauge className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-black text-white font-['Outfit']">34</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Base Speed (km/h)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center gap-1 text-center">
                <Flame className="w-5 h-5 text-rose-500" />
                <span className="text-2xl font-black text-amber-300 font-['Outfit']">5x</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Max Combo Bonus
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Camera Angle Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>CHOOSE CAMERA ANGLE</span>
              </span>
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                Key V
              </kbd>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'follow', label: 'Rear Follow', sub: 'Classic' },
                { id: 'front', label: 'Face Cam', sub: 'Action' },
                { id: 'angled', label: '3/4 Cam', sub: 'Broadcast' },
              ].map((c) => {
                const isSelected = cameraMode === c.id;
                return (
                  <button
                    key={c.id}
                    id={`btn-cam-${c.id}`}
                    onClick={() => {
                      onSelectCamera(c.id as CameraMode);
                      sound.playLaneSwitch();
                    }}
                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-black shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400 border border-white/30'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold'
                    }`}
                  >
                    <span className="text-xs">{c.label}</span>
                    <span className="text-[9px] opacity-80 uppercase tracking-wider">{c.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* On-Screen Virtual Controls Toggle */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">On-Screen Virtual Buttons</span>
                <span className="text-[10px] text-slate-400">Display steering buttons on screen</span>
              </div>
            </div>

            <button
              id="btn-toggle-virtual-controls"
              onClick={onToggleAlwaysShowControls}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                alwaysShowControls
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {alwaysShowControls ? 'ENABLED' : 'AUTO'}
            </button>
          </div>
        </div>

        {/* Right Column: Controls Reference & Live Test Pad */}
        <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                CONTROLS GUIDE
              </span>
              <span className="text-[10px] font-bold text-slate-400">KEYBOARD & TOUCH</span>
            </div>

            {/* Key list */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Left Lane</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-pink-300 font-bold border border-slate-700">A / ⬅</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Right Lane</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-pink-300 font-bold border border-slate-700">D / ➡</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Jump Hurdles</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">W / ⬆ / Space</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Slide Under</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold border border-slate-700">S / ⬇</span>
              </div>
            </div>
          </div>

          {/* Interactive Test Control Pad */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              <span>TEST CONTROLS SOUNDS</span>
              {testAction && (
                <span className="text-amber-400 font-black animate-pulse">
                  TEST: {testAction}
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                id="btn-test-left"
                onClick={() => handleTestKey('LEFT')}
                className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-600/80 text-white font-bold text-xs border border-slate-700 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px]">LEFT</span>
              </button>

              <button
                id="btn-test-jump"
                onClick={() => handleTestKey('JUMP')}
                className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-rose-600/80 text-white font-bold text-xs border border-slate-700 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                <ArrowUp className="w-4 h-4 text-rose-400" />
                <span className="text-[10px]">JUMP</span>
              </button>

              <button
                id="btn-test-slide"
                onClick={() => handleTestKey('SLIDE')}
                className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-amber-600/80 text-white font-bold text-xs border border-slate-700 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                <ArrowDown className="w-4 h-4 text-amber-400" />
                <span className="text-[10px]">SLIDE</span>
              </button>

              <button
                id="btn-test-right"
                onClick={() => handleTestKey('RIGHT')}
                className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-600/80 text-white font-bold text-xs border border-slate-700 flex flex-col items-center gap-1 transition-all cursor-pointer active:scale-95"
              >
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px]">RIGHT</span>
              </button>
            </div>
          </div>

          {/* Quick Launch CTA in card */}
          <div className="pt-2">
            <button
              id="btn-launch-race-primary"
              onClick={startCountdown}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-rose-600/35 hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>LAUNCH SPRINT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <button
          onClick={onBackToLevels}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Track Level</span>
        </button>

        <span className="font-semibold text-slate-400 text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">SPACE</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">ENTER</kbd> to Launch
        </span>

        <span className="font-bold text-rose-400">
          Page 3 of 3 • Real Game Interface
        </span>
      </footer>
    </div>
  );
};
