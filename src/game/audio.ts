import { GameLevelId } from '../types';

/**
 * Synthesized Web Audio Engine for 3D Road Runner
 * Delivers zero-latency SFX, UI audio cues, and dynamic festival race background music.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  // Music player state (game BGM)
  private isMusicPlaying: boolean = false;
  private bgmBuffer: AudioBuffer | null = null;
  private bgmSource: AudioBufferSourceNode | null = null;

  // Ambient Start Sound
  private startAmbientBuffer: AudioBuffer | null = null;
  private startAmbientSource: AudioBufferSourceNode | null = null;
  private startAmbientGain: GainNode | null = null;
  private isStartAmbientPlaying = false;
  private synthAmbientTimer: number | null = null;

  // Last hover sound timestamp to avoid spamming
  private lastHoverTime: number = 0;

  // Scale for coin combo chimes (Pentatonic Major C5-C7)
  private coinFrequencies = [
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    1174.66, // D6
    1318.51, // E6
    1567.98, // G6
    1760.00, // A6
    2093.00, // C7
  ];

  constructor() {
    // Background music removed as requested ("music ko remove krdo")
    // Zero latency Web Audio SFX (page 3 sounds) initialized on interaction
  }

  public initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.95;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.45;
      this.musicGain.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public unlockAudio(): boolean {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return !!(this.ctx && this.ctx.state === 'running');
  }

  public async loadStartAmbient(url: string = '/start_cheer.mp3') {
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      this.initContext();
      if (this.ctx) {
        this.startAmbientBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      }
    } catch (e) {
      // Handled via synthesized crowd cheer
    }
  }

  public playStartAmbient() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    if (this.startAmbientSource) {
      try { this.startAmbientSource.stop(); } catch(e){}
    }

    if (this.startAmbientBuffer) {
      this.startAmbientSource = this.ctx.createBufferSource();
      this.startAmbientSource.buffer = this.startAmbientBuffer;
      this.startAmbientSource.loop = true;
      
      this.startAmbientGain = this.ctx.createGain();
      this.startAmbientGain.gain.value = 0.8;

      this.startAmbientSource.connect(this.startAmbientGain);
      this.startAmbientGain.connect(this.sfxGain);

      this.startAmbientSource.start();
      this.isStartAmbientPlaying = true;
    } else {
      this.playCrowdCheer();
      this.isStartAmbientPlaying = true;
    }
  }

  public slowDownStartAmbient() {
    if (!this.isStartAmbientPlaying) return;
    
    if (this.startAmbientSource && this.startAmbientGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.startAmbientSource.playbackRate.setValueAtTime(1.0, t);
      this.startAmbientSource.playbackRate.exponentialRampToValueAtTime(0.2, t + 2.5);
      this.startAmbientGain.gain.setValueAtTime(0.8, t);
      this.startAmbientGain.gain.exponentialRampToValueAtTime(0.01, t + 2.5);
      this.startAmbientSource.stop(t + 2.6);
      setTimeout(() => {
        this.startAmbientSource = null;
        this.startAmbientGain = null;
      }, 2600);
    }
    this.isStartAmbientPlaying = false;
  }

  public playUiClick() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(450, t + 0.05);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playUiHover() {
    if (!this.soundEnabled) return;
    const now = Date.now();
    if (now - this.lastHoverTime < 70) return;
    this.lastHoverTime = now;

    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.035);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playPageTransition(direction: 'next' | 'back' = 'next') {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    if (direction === 'next') {
      // Energetic forward transition: ascending triple tone + stereo whoosh
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, idx) => {
        const st = t + idx * 0.05;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, st);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, st + 0.18);
        gain.gain.setValueAtTime(0.24, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(st);
        osc.stop(st + 0.22);
      });

      // Air rush sweep
      const bufSize = Math.floor(this.ctx.sampleRate * 0.2);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(2200, t + 0.18);
      filter.Q.value = 2.0;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.21);
    } else {
      // Warm backward slide (G5 -> E5 -> C5)
      const freqs = [783.99, 659.25, 523.25];
      freqs.forEach((freq, idx) => {
        const st = t + idx * 0.05;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.18, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(st);
        osc.stop(st + 0.2);
      });
    }
  }

  public playLevelSelectSound(levelId: GameLevelId) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    switch (levelId) {
      case 1: {
        // Level 1 (City): Cheerful melodic xylophone chime (F4 -> A4 -> C5)
        const notes = [349.23, 440.00, 523.25];
        notes.forEach((freq, i) => {
          const st = t + i * 0.06;
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, st);
          gain.gain.setValueAtTime(0.24, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(st);
          osc.stop(st + 0.22);
        });
        break;
      }
      case 2: {
        // Level 2 (Highway): Sleek turbo doppler synth sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(720, t + 0.16);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.28);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.Q.value = 4.0;

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 0.29);
        break;
      }
      case 3: {
        // Level 3 (Night City): Shimmering neon synthwave chord (D4 -> F4 -> A4 -> C5)
        const notes = [293.66, 349.23, 440.00, 523.25];
        notes.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.11, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(t);
          osc.stop(t + 0.39);
        });
        break;
      }
      case 4: {
        // Level 4 (Mountain): Crystal alpine bell echo with warm sub harmonics
        const notes = [220.0, 440.0, 880.0];
        notes.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.05);
          gain.gain.setValueAtTime(0.22 / (idx + 1), t + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.4);
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(t + idx * 0.05);
          osc.stop(t + idx * 0.05 + 0.42);
        });
        break;
      }
      case 5: {
        // Level 5 (Extreme): Electro punch kick + dual alert laser blips
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(150, t);
        kick.frequency.exponentialRampToValueAtTime(35, t + 0.18);
        kickGain.gain.setValueAtTime(0.4, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        kick.connect(kickGain);
        kickGain.connect(this.sfxGain);
        kick.start(t);
        kick.stop(t + 0.21);

        [0.04, 0.12].forEach((offset) => {
          const laser = this.ctx!.createOscillator();
          const laserGain = this.ctx!.createGain();
          laser.type = 'sawtooth';
          laser.frequency.setValueAtTime(1200, t + offset);
          laser.frequency.exponentialRampToValueAtTime(400, t + offset + 0.07);
          laserGain.gain.setValueAtTime(0.18, t + offset);
          laserGain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.07);
          laser.connect(laserGain);
          laserGain.connect(this.sfxGain!);
          laser.start(t + offset);
          laser.stop(t + offset + 0.08);
        });
        break;
      }
    }
  }

  public playWhistle() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      const st = t + offset;
      const osc = this.ctx!.createOscillator();
      const mod = this.ctx!.createOscillator();
      const modGain = this.ctx!.createGain();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2450, st);

      mod.frequency.setValueAtTime(28, st);
      modGain.gain.setValueAtTime(120, st);

      mod.connect(osc.frequency);
      mod.start(st);
      mod.stop(st + 0.09);

      gain.gain.setValueAtTime(0.28, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(st);
      osc.stop(st + 0.1);
    });
  }

  public playChampionCheer() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    this.playCrowdCheer();

    const t = this.ctx.currentTime;
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.50];
    fanfareNotes.forEach((freq, idx) => {
      const st = t + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.32, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(st);
      osc.stop(st + 0.36);
    });
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public playCoin(combo: number = 0) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const noteIdx = Math.min(combo, this.coinFrequencies.length - 1);
    const freq = this.coinFrequencies[noteIdx];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.08);

    // Harmonic sparkle
    const harm = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harm.type = 'triangle';
    harm.frequency.setValueAtTime(freq * 2, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    harmGain.gain.setValueAtTime(0.12, t);
    harmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    harm.connect(harmGain);
    gain.connect(this.sfxGain);
    harmGain.connect(this.sfxGain);

    osc.start(t);
    harm.start(t);
    osc.stop(t + 0.26);
    harm.stop(t + 0.16);
  }

  public playJump() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playLand() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playLaneSwitch() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  public playSlide() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // White noise swoosh for sneakers sliding
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.18);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.19);
  }

  public playHit() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    
    // Low punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.38);

    // Noise crunch
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(t);
    noise.start(t);
    osc.stop(t + 0.4);
    noise.stop(t + 0.26);
  }

  public playCrowdCheer() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Filtered noise with warm swell mimicking a burst of cheering
    const bufferSize = this.ctx.sampleRate * 0.8;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(1300, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.8);
    filter.Q.value = 1.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.82);
  }

  public playMilestone() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const startTime = t + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  }

  public playLevelUp() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Triumphant 5-note fanfare: G4 -> C5 -> E5 -> G5 -> C6
    const fanfare = [392.00, 523.25, 659.25, 783.99, 1046.50];
    fanfare.forEach((freq, idx) => {
      const startTime = t + idx * 0.09;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = idx === fanfare.length - 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      const holdDuration = idx === fanfare.length - 1 ? 0.6 : 0.22;
      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + holdDuration);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(startTime);
      osc.stop(startTime + holdDuration + 0.05);
    });

    // Secondary crowd cheer burst
    this.playCrowdCheer();
  }

  public playCountdownBeep(isGo: boolean = false) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isGo) {
      // High energetic chime on GO!
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1046.5, t); // C6
      osc.frequency.exponentialRampToValueAtTime(1318.5, t + 0.2); // E6

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.56);
      this.playCrowdCheer();
    } else {
      // Short crisp prep beep (3, 2, 1)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, t); // D5

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  public startMusic() {
    // Music removed as requested ("music ko remove krdo")
    this.isMusicPlaying = false;
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.bgmSource) {
      try {
        this.bgmSource.stop();
        this.bgmSource.disconnect();
      } catch(e) {}
      this.bgmSource = null;
    }
  }

  public isPlayingMusic(): boolean {
    return false;
  }
}

export const sound = new SoundEngine();
