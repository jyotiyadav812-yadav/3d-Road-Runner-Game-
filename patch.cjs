const fs = require('fs');
let code = fs.readFileSync('src/game/audio.ts', 'utf8');

const target = `  // Festival background music loop
  public startMusic() {`;
const replaceIndex = code.indexOf(target);
if (replaceIndex === -1) throw new Error("Target not found");

const endClassStr = `\n}\n\nexport const sound = new SoundEngine();\n`;
const tailIndex = code.lastIndexOf(endClassStr);
if (tailIndex === -1) throw new Error("End class not found");

const replacement = `  // Festival background music loop (using HTMLAudioElement)
  public startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    if (this.bgmAudio) {
      this.bgmAudio.play().catch(e => console.warn('BGM play blocked:', e));
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }`;

code = code.substring(0, replaceIndex) + replacement + code.substring(tailIndex);
fs.writeFileSync('src/game/audio.ts', code);
