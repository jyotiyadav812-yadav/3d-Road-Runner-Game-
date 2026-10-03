const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const hookToFind = "  const handleToggleCamera = useCallback(() => {\n    if (engineRef.current) {\n      const nextMode = engineRef.current.toggleCameraMode();\n      setCameraMode(nextMode);\n    }\n  }, []);";

const newHook = `  const handleToggleCamera = useCallback(() => {
    if (engineRef.current) {
      const nextMode = engineRef.current.toggleCameraMode();
      setCameraMode(nextMode);
    }
  }, []);

  // Global Keyboard Navigation (Escape for Pause, Enter for Menus)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') handlePause();
        else if (gameState === 'paused') handleResume();
      } else if (e.key === 'Enter') {
        if (gameState === 'gameover') handleRestart();
        else if (gameState === 'menu') handleStart();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, handlePause, handleResume, handleRestart, handleStart]);`;

if (code.includes(hookToFind)) {
    code = code.replace(hookToFind, newHook);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched global keys");
} else {
    console.log("Could not find hook to patch");
}
