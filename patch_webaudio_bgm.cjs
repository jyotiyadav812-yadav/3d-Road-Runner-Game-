const fs = require('fs');
let code = fs.readFileSync('src/game/audio.ts', 'utf8');

// Replace HTMLAudioElement with Web Audio API for BGM
const targetDecl = `  // Music player state
  private isMusicPlaying: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;`;

const newDecl = `  // Music player state
  private isMusicPlaying: boolean = false;
  private bgmBuffer: AudioBuffer | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;`;

code = code.replace(targetDecl, newDecl);

const targetConstructor = `    if (typeof window !== 'undefined') {
      this.bgmAudio = new Audio('/bgm.mp3?v=' + Date.now());
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 1.0;
    }`;

const newConstructor = `    if (typeof window !== 'undefined') {
      this.loadBGM();
    }`;

code = code.replace(targetConstructor, newConstructor);

const targetMethods = `  // Festival background music loop (using HTMLAudioElement)
  public startMusic() {
    if (!this.musicEnabled) return;
    this.isMusicPlaying = true;
    if (this.bgmAudio) {
      
      this.bgmAudio.play().catch(e => {
        console.warn('BGM play blocked:', e);
        this.isMusicPlaying = false;
      });
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }`;

const newMethods = `  private async loadBGM() {
    try {
      const response = await fetch('/bgm.mp3?v=' + Date.now());
      const arrayBuffer = await response.arrayBuffer();
      this.initContext();
      if (this.ctx) {
        this.bgmBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        if (this.isMusicPlaying) {
          this.startMusic();
        }
      }
    } catch (e) {
      console.warn('Failed to load BGM:', e);
    }
  }

  public startMusic() {
    if (!this.musicEnabled) return;
    this.isMusicPlaying = true;
    this.initContext();
    
    if (this.bgmBuffer && !this.bgmSource && this.ctx && this.musicGain) {
      this.bgmSource = this.ctx.createBufferSource();
      this.bgmSource.buffer = this.bgmBuffer;
      this.bgmSource.loop = true;
      this.bgmSource.connect(this.musicGain);
      this.bgmSource.start(0);
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.bgmSource) {
      this.bgmSource.stop();
      this.bgmSource.disconnect();
      this.bgmSource = null;
    }
  }`;

code = code.replace(targetMethods, newMethods);

fs.writeFileSync('src/game/audio.ts', code);
