const fs = require('fs');
let code = fs.readFileSync('src/game/audio.ts', 'utf8');

code = code.replace("this.bgmAudio.volume = 0.45;", "this.bgmAudio.volume = 1.0;");
fs.writeFileSync('src/game/audio.ts', code);
