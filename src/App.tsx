import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { sound } from './game/audio';
import { GameState, GameStats, CameraMode, GameLevelId, GAME_LEVELS } from './types';
import { HUD } from './components/HUD';
import { ControlsOverlay } from './components/ControlsOverlay';
import { CoverScreen } from './components/CoverScreen';
import { StartMenu } from './components/StartMenu';
import { GameInterfaceScreen } from './components/GameInterfaceScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('cover');
  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [selectedLevel, setSelectedLevel] = useState<GameLevelId>(1);
  const [levelAnnouncement, setLevelAnnouncement] = useState<string | null>(null);
  const [alwaysShowControls, setAlwaysShowControls] = useState<boolean>(true);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 0,
    distance: 0,
    speed: 34,
    combo: 0,
    multiplier: 1,
    highScore: 0,
    totalCoins: 0,
    currentLevel: 1,
    levelName: GAME_LEVELS[1].name,
    levelProgress: 0,
  });

  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);

  // User interaction audio unlocker & music starter for entire game
  useEffect(() => {
    sound.startMusic();

    const handleFirstInteraction = () => {
      sound.unlockAudio();
      if (musicEnabled) {
        sound.startMusic();
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [musicEnabled]);

  // Initialize Game Engine
  useEffect(() => {
    // Preload start cheer and ambient sound
    sound.loadStartAmbient();

    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onStatsUpdate: (updatedStats) => {
        setStats(updatedStats);
      },
      onGameOver: (finalStats) => {
        setStats(finalStats);
        setGameState('gameover');
      },
      onMilestone: (dist) => {
        setMilestoneMessage(`🎉 ${dist}m MILESTONE REACHED! CROWD CHEERING!`);
        setTimeout(() => setMilestoneMessage(null), 3200);
      },
      onLevelUp: (levelInfo) => {
        setSelectedLevel(levelInfo.id);
        setLevelAnnouncement(`🏁 LEVEL ${levelInfo.id}: ${levelInfo.subtitle.toUpperCase()}!`);
        setTimeout(() => setLevelAnnouncement(null), 3600);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.cleanup();
      engineRef.current = null;
    };
  }, []);

  const handleSelectLevel = useCallback((levelId: GameLevelId) => {
    setSelectedLevel(levelId);
    engineRef.current?.selectLevel(levelId);
  }, []);

  const handleStart = useCallback(() => {
    setGameState('playing');
    engineRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    setGameState('paused');
    engineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    setGameState('playing');
    engineRef.current?.resume();
  }, []);

  const handleRestart = useCallback(() => {
    setGameState('playing');
    engineRef.current?.reset(selectedLevel);
    engineRef.current?.start();
  }, [selectedLevel]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      sound.setSoundEnabled(next);
      if (next) sound.playUiClick();
      return next;
    });
  }, []);

  const handleToggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev;
      sound.setMusicEnabled(next);
      return next;
    });
  }, []);

  const handleMoveLeft = useCallback(() => {
    engineRef.current?.moveLeft();
  }, []);

  const handleMoveRight = useCallback(() => {
    engineRef.current?.moveRight();
  }, []);

  const handleJump = useCallback(() => {
    engineRef.current?.jump();
  }, []);

  const handleSlide = useCallback(() => {
    engineRef.current?.slide();
  }, []);

  const handleToggleCamera = useCallback(() => {
    if (engineRef.current) {
      const nextMode = engineRef.current.toggleCameraMode();
      setCameraMode(nextMode);
    }
  }, []);

  const handleSelectCamera = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    engineRef.current?.setCameraMode(mode);
  }, []);

  const handleToggleAlwaysShowControls = useCallback(() => {
    setAlwaysShowControls((prev) => !prev);
  }, []);

  // Global Keyboard Navigation (Escape for Pause/Back, Enter for Start/Restart/Next)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') handlePause();
        else if (gameState === 'paused') handleResume();
        else if (gameState === 'interface') {
          sound.playLaneSwitch();
          setGameState('menu');
        } else if (gameState === 'menu') {
          sound.playLaneSwitch();
          setGameState('cover');
        } else if (gameState === 'gameover') {
          engineRef.current?.pause();
          setGameState('interface');
        }
      } else if (e.key === 'Enter') {
        if (gameState === 'gameover') handleRestart();
        else if (gameState === 'cover') {
          sound.unlockAudio();
          sound.playLaneSwitch();
          setGameState('menu');
        } else if (gameState === 'menu') {
          sound.playLaneSwitch();
          setGameState('interface');
        } else if (gameState === 'interface') {
          handleStart();
        } else if (gameState === 'paused') {
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, handlePause, handleResume, handleRestart, handleStart]);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 3D WebGL Canvas Viewport */}
      <div 
        id="runner-3d-canvas-container"
        ref={containerRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* In-Game Heads Up Display */}
      {gameState === 'playing' && (
        <HUD
          stats={stats}
          milestoneMessage={milestoneMessage}
          levelAnnouncement={levelAnnouncement}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          cameraMode={cameraMode}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
          onToggleCamera={handleToggleCamera}
          onPause={handlePause}
        />
      )}

      {/* Active Gesture & Key Control Surface */}
      <ControlsOverlay
        active={gameState === 'playing'}
        alwaysShowControls={alwaysShowControls}
        onMoveLeft={handleMoveLeft}
        onMoveRight={handleMoveRight}
        onJump={handleJump}
        onSlide={handleSlide}
        onToggleCamera={handleToggleCamera}
      />

      {/* Page 1: Champion Cover / Splash Screen */}
      {gameState === 'cover' && (
        <CoverScreen
          onContinue={() => {
            sound.unlockAudio();
            sound.playLaneSwitch();
            setGameState('menu');
          }}
          highScore={stats.highScore}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Page 2: Track & Level Selection Menu */}
      {gameState === 'menu' && (
        <StartMenu
          onStart={handleStart}
          onNext={() => {
            sound.playLaneSwitch();
            setGameState('interface');
          }}
          onBack={() => {
            sound.playLaneSwitch();
            setGameState('cover');
          }}
          highScore={stats.highScore}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          selectedLevel={selectedLevel}
          onSelectLevel={handleSelectLevel}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Page 3: Real Game Interface / Race Cockpit */}
      {gameState === 'interface' && (
        <GameInterfaceScreen
          selectedLevel={selectedLevel}
          cameraMode={cameraMode}
          highScore={stats.highScore}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          onSelectCamera={handleSelectCamera}
          onStartGame={handleStart}
          onBackToLevels={() => {
            sound.playLaneSwitch();
            setGameState('menu');
          }}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
          alwaysShowControls={alwaysShowControls}
          onToggleAlwaysShowControls={handleToggleAlwaysShowControls}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onExitToInterface={() => {
            engineRef.current?.pause();
            setGameState('interface');
          }}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {/* Game Over Summary Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestart}
          onExit={() => {
            engineRef.current?.pause();
            setGameState('interface');
          }}
          onToCover={() => {
            engineRef.current?.pause();
            setGameState('cover');
          }}
        />
      )}
    </div>
  );
}
