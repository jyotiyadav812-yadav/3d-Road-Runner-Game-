import React, { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface ControlsOverlayProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onSlide: () => void;
  onToggleCamera?: () => void;
  active: boolean;
  alwaysShowControls?: boolean;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  onMoveLeft,
  onMoveRight,
  onJump,
  onSlide,
  onToggleCamera,
  active,
  alwaysShowControls = false,
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number; triggered: boolean } | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; time: number; triggered: boolean } | null>(null);

  // Keyboard controls
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent key repeat so 1 press = exactly 1 action
      if (e.repeat) return;

      // Prevent default page scroll on arrow keys / space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          onMoveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          onMoveRight();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          onJump();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          onSlide();
          break;
        case 'v':
        case 'V':
        case 'c':
        case 'C':
          onToggleCamera?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, onMoveLeft, onMoveRight, onJump, onSlide, onToggleCamera]);

  // Gesture detection for touch and mouse drag:
  // Strict 1 swipe = 1 lane change rule.
  // Once a swipe action is triggered, this gesture is locked until the user lifts their finger/cursor and initiates a new swipe.
  const processSwipe = (dx: number, dy: number): boolean => {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const minDistance = 25; // Clean threshold to differentiate tap from swipe

    if (absDx < minDistance && absDy < minDistance) return false;

    if (absDx > absDy) {
      if (dx > 0) onMoveRight();
      else onMoveLeft();
    } else {
      if (dy < 0) onJump();
      else onSlide();
    }
    return true;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!active) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      triggered: false,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!active || !touchStartRef.current) return;
    // If this swipe gesture has already executed a lane change/jump/slide, ignore further movement in this stroke
    if (touchStartRef.current.triggered) return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (processSwipe(dx, dy)) {
      touchStartRef.current.triggered = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!active || !touchStartRef.current) return;
    // Fallback if gesture was a very quick flick that finished before touchmove fired
    if (!touchStartRef.current.triggered && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      processSwipe(dx, dy);
    }
    touchStartRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!active || e.pointerType === 'touch') return;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      triggered: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active || !pointerStartRef.current || e.pointerType === 'touch') return;
    if (pointerStartRef.current.triggered) return;

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    if (processSwipe(dx, dy)) {
      pointerStartRef.current.triggered = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!active || !pointerStartRef.current || e.pointerType === 'touch') return;
    if (!pointerStartRef.current.triggered) {
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      processSwipe(dx, dy);
    }
    pointerStartRef.current = null;
  };

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch {
      // Ignored if not permitted
    }
  };

  return (
    <div
      id="game-touch-surface"
      onTouchStart={active ? handleTouchStart : undefined}
      onTouchMove={active ? handleTouchMove : undefined}
      onTouchEnd={active ? handleTouchEnd : undefined}
      onPointerDown={active ? handlePointerDown : undefined}
      onPointerMove={active ? handlePointerMove : undefined}
      onPointerUp={active ? handlePointerUp : undefined}
      onPointerCancel={active ? handlePointerUp : undefined}
      className={`absolute inset-0 z-10 select-none overflow-hidden touch-none cursor-default ${
        active ? 'pointer-events-auto' : 'pointer-events-none hidden'
      }`}
    >
      {/* On-screen virtual buttons for mobile / tablet / click accessibility */}
      <div className={`absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] flex justify-between items-end pointer-events-none ${
        alwaysShowControls ? '' : 'lg:hidden'
      }`}>
        {/* Left / Right Lane Navigation */}
        <div className="flex gap-2 sm:gap-3 pointer-events-auto">
          <button
            id="btn-ctrl-left"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onMoveLeft();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onMoveLeft();
            }}
            aria-label="Move Left Lane"
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-slate-900/80 active:bg-cyan-600/90 border border-slate-600/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl active:scale-90 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <button
            id="btn-ctrl-right"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onMoveRight();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onMoveRight();
            }}
            aria-label="Move Right Lane"
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-slate-900/80 active:bg-cyan-600/90 border border-slate-600/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl active:scale-90 transition-all cursor-pointer"
          >
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {/* Jump & Slide Actions */}
        <div className="flex gap-2 sm:gap-3 pointer-events-auto">
          <button
            id="btn-ctrl-slide"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onSlide();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onSlide();
            }}
            aria-label="Slide or Duck"
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-slate-900/80 active:bg-amber-600/90 border border-slate-600/60 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-xl active:scale-90 transition-all cursor-pointer"
          >
            <ArrowDown className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <button
            id="btn-ctrl-jump"
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onJump();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onJump();
            }}
            aria-label="Jump Over Obstacles"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-600/90 active:bg-rose-500 border border-rose-400/60 backdrop-blur-md flex items-center justify-center text-white shadow-xl shadow-rose-600/35 active:scale-90 transition-all cursor-pointer"
          >
            <ArrowUp className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Desktop Keyboard Hints on Bottom Edge */}
      <div className="hidden lg:flex absolute bottom-3 left-0 right-0 justify-center pointer-events-none">
        <div className="flex items-center gap-4 px-4 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-800 text-xs text-slate-300 shadow-lg">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">A</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">D</kbd>
            <span className="text-slate-400">or</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">←</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">→</kbd>
            <span className="text-slate-300">Change Lane</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">Space</kbd>
            <span className="text-slate-400">or</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">↑</kbd>
            <span className="text-slate-300">Jump</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">S</kbd>
            <span className="text-slate-400">or</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[10px]">↓</kbd>
            <span className="text-slate-300">Slide</span>
          </div>
        </div>
      </div>
    </div>
  );
};
