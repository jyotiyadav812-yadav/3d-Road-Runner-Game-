const fs = require('fs');
let code = fs.readFileSync('src/game/audio.ts', 'utf8');

code = code.replace("new Audio('/bgm.mp3')", "new Audio('/bgm.mp3?v=' + Date.now())");
fs.writeFileSync('src/game/audio.ts', code);
