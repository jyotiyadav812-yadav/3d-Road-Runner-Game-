import * as THREE from 'three';
import { GAME_CONSTANTS, GameStats, LaneIndex, CameraMode, GameLevelId, GameLevelInfo, GAME_LEVELS } from '../types';
import { sound } from './audio';
import { AdventurerCharacter } from './AdventurerCharacter';
import { ObstacleManager } from './ObstacleManager';
import { WorldManager } from './WorldManager';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (stats: GameStats) => void;
  onMilestone: (distance: number) => void;
  onLevelUp?: (level: GameLevelInfo) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Level Progression
  public currentLevel: GameLevelId = 1;
  private startingLevel: GameLevelId = 1;

  // Three.js Core
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animFrameId: number | null = null;

  // Subsystems
  public character: AdventurerCharacter;
  public worldManager: WorldManager;
  public obstacleManager: ObstacleManager;

  // Game Loop State
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // Runner Movement & Physics
  private playerZ: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private targetLane: LaneIndex = 0;
  private jumpVelocity: number = 0;
  private isJumping: boolean = false;
  private isSliding: boolean = false;
  private slideTimer: number = 0;
  private lateralVelocity: number = 0;

  // Gameplay Metrics
  private currentSpeed: number = GAME_CONSTANTS.INITIAL_SPEED;
  private distanceRun: number = 0;
  private coinsCollected: number = 0;
  private score: number = 0;
  private comboStreak: number = 0;
  private comboTimer: number = 0;
  private lastMilestone: number = 0;
  private highScore: number = 0;

  // Camera dynamics - optimized for clear runner and road visibility
  public cameraMode: CameraMode = 'follow';
  private cameraOffset = new THREE.Vector3(0, 3.2, 5.8);
  private cameraLookTarget = new THREE.Vector3(0, 1.5, -7.0);
  private cameraShakeIntensity: number = 0;

  public toggleCameraMode(): CameraMode {
    if (this.cameraMode === 'follow') this.cameraMode = 'front';
    else if (this.cameraMode === 'front') this.cameraMode = 'angled';
    else this.cameraMode = 'follow';
    return this.cameraMode;
  }

  public setCameraMode(mode: CameraMode) {
    this.cameraMode = mode;
  }

  /**
   * Detect mobile device / small screen
   */
  public detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 768;
    return isMobileUa || (hasTouch && isSmallScreen);
  }

  /**
   * Dynamically adapts the field of view based on viewport aspect ratio.
   * On tall/narrow phone portrait screens, horizontal FOV would normally shrink severely,
   * cutting off side lanes and upcoming obstacles. This formula dynamically negotiates
   * the vertical FOV so that all 3 lanes, curbs, and road margins stay fully and clearly visible.
   */
  public calculateBaseFov(aspect: number): number {
    if (aspect >= 1.0) {
      return 60;
    }
    // Fixed comfortable horizontal half-angle coverage (~35.5 degrees = full 3-lane road + shoulders)
    const targetHalfAngle = (35.5 * Math.PI) / 180;
    const computedVerticalFov = 2 * Math.atan(Math.tan(targetHalfAngle) / Math.max(aspect, 0.40)) * (180 / Math.PI);
    return Math.min(84, Math.max(62, computedVerticalFov));
  }

  // ResizeObserver for robust layout detection
  private resizeObserver: ResizeObserver | null = null;

  // Lighting
  private hemiLight: THREE.HemisphereLight;
  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    // Load High Score
    const savedHighScore = localStorage.getItem('road_runner_3d_highscore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 0;
    }

    // 1. Scene with crystal clear bright morning atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x60a5fa); // Cheerful radiant sky blue
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0035); // Soft, light fog for great horizon visibility

    // 2. Camera with resilient dimension fallback and mobile aspect ratio adaptation
    const initW = Math.max(container.clientWidth || window.innerWidth, 320);
    const initH = Math.max(container.clientHeight || window.innerHeight, 240);
    const aspect = initW / initH;
    const initialFov = this.calculateBaseFov(aspect);
    this.camera = new THREE.PerspectiveCamera(initialFov, aspect, 0.1, 400);
    this.camera.position.set(0, aspect < 1.0 ? 3.65 : 3.2, aspect < 1.0 ? 6.4 : 5.8);
    this.camera.lookAt(0, 1.4, -9.0);

    // 3. WebGL Renderer configured for high performance, smooth 60fps on phones and desktops
    const isMobile = this.detectMobile();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isMobile, // Disable MSAA on mobile for massive fillrate speedup; pixel density already hides aliasing
      powerPreference: 'high-performance',
      precision: isMobile ? 'mediump' : 'highp',
      depth: true,
      stencil: false,
    });
    this.renderer.setSize(initW, initH, false);
    // On high-DPI mobile devices (2.5x - 4x), cap pixel ratio to 1.35 to prevent severe GPU fillrate bottlenecks
    const maxRatio = isMobile ? Math.min(window.devicePixelRatio || 1, 1.35) : Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(maxRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Ensure canvas strictly fills viewport
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);

    // 4. Lighting - optimized shadow map for 60fps mobile gaming
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x38bdf8, 0.85);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xfffaed, 0.65);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.sunLight.position.set(25, 45, 20);
    this.sunLight.castShadow = true;
    const shadowMapDim = isMobile ? 512 : 1024;
    this.sunLight.shadow.mapSize.width = shadowMapDim;
    this.sunLight.shadow.mapSize.height = shadowMapDim;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 120;
    const d = isMobile ? 22 : 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.radius = isMobile ? 1.0 : 2.0;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Add stylized clouds in the sky for charming depth
    this.createSkyClouds();

    // 5. Initialize Subsystems
    this.character = new AdventurerCharacter();
    this.scene.add(this.character.mesh);

    this.worldManager = new WorldManager(this.scene);
    this.obstacleManager = new ObstacleManager(this.scene);

    // Apply Level 1 initial environment
    this.applyLevelEnvironment(1);

    // Resize handling using both ResizeObserver and window resize
    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.container);
    window.addEventListener('resize', this.onResize);

    // Delayed size calibrations to guarantee exact match after flex/grid layout completes
    requestAnimationFrame(() => this.onResize());
    setTimeout(() => this.onResize(), 100);
    setTimeout(() => this.onResize(), 300);

    // Start rendering idle view
    this.clock.start();
    this.renderLoop();
  }

  private createSkyClouds() {
    const cloudGeo = new THREE.DodecahedronGeometry(2.2, 1);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 16; i++) {
      const cloudGroup = new THREE.Group();
      const puffs = 3 + (i % 3);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(cloudGeo, cloudMat);
        puff.position.set((p - puffs / 2) * 2.2, (p % 2) * 0.5, (p % 3) * 0.4);
        puff.scale.set(1.1, 0.7, 1.1);
        cloudGroup.add(puff);
      }
      const cx = ((i % 4) - 1.5) * 28 + (Math.random() - 0.5) * 8;
      const cy = 20 + (i % 3) * 4;
      const cz = -i * 22 + 20;
      cloudGroup.position.set(cx, cy, cz);
      this.scene.add(cloudGroup);
    }
  }

  public onResize = () => {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || this.container.clientWidth || window.innerWidth || 800;
    const height = rect.height || this.container.clientHeight || window.innerHeight || 600;
    if (width <= 0 || height <= 0) return;

    const aspect = width / height;
    this.camera.aspect = aspect;
    this.camera.fov = this.calculateBaseFov(aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    
    // Crisp HD quality with mobile performance throttle:
    // High-density phone screens (2.5x - 4x) lag heavily at native resolution with 3D shaders;
    // 1.35x provides visually razor-sharp rendering with ~50% GPU fillrate savings for smooth 60fps!
    const isMobile = this.detectMobile();
    const maxRatio = isMobile ? Math.min(window.devicePixelRatio || 1, 1.35) : Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(maxRatio);
  };

  /**
   * Start or Restart the running session
   */
  public start() {
    this.reset();
    this.isRunning = true;
    this.isPaused = false;
    const isPortrait = this.camera.aspect < 1.0;
    const initialCamY = isPortrait ? 3.65 : 3.2;
    const initialCamZ = this.playerZ + (isPortrait ? 6.4 : 5.8);
    this.camera.position.set(0, initialCamY, initialCamZ);
    this.cameraLookTarget.set(0, isPortrait ? 1.55 : 1.8, this.playerZ - (isPortrait ? 11.5 : 10.0));
    this.camera.lookAt(this.cameraLookTarget);
    sound.startMusic();
  }

  public pause() {
    this.isPaused = true;
    sound.stopMusic();
  }

  public resume() {
    this.isPaused = false;
    this.clock.getDelta(); // clear accumulated delta
    sound.startMusic();
  }

  public selectLevel(levelId: GameLevelId) {
    this.startingLevel = levelId;
    this.currentLevel = levelId;
    this.applyLevelEnvironment(levelId);
    this.worldManager.rebuildAllChunks(this.playerZ, levelId);
    this.obstacleManager.setLevel(levelId);
    this.updateStatsUI();
  }

  public applyLevelEnvironment(levelId: GameLevelId) {
    const levelInfo = GAME_LEVELS[levelId];
    if (!levelInfo) return;

    this.scene.background = new THREE.Color(levelInfo.skyColor);
    this.scene.fog = new THREE.FogExp2(levelInfo.fogColor, levelInfo.fogDensity);

    if (this.sunLight) {
      this.sunLight.color.setHex(levelInfo.sunColor);
      this.sunLight.intensity = levelInfo.sunIntensity;
    }

    if (this.ambientLight) {
      this.ambientLight.color.setHex(levelInfo.ambientColor);
      this.ambientLight.intensity = levelInfo.ambientIntensity;
    }

    if (this.hemiLight) {
      this.hemiLight.color.setHex(levelInfo.sunColor);
      this.hemiLight.groundColor.setHex(levelInfo.groundColor);
      this.hemiLight.intensity = levelInfo.ambientIntensity;
    }
  }

  public reset(levelId?: GameLevelId) {
    if (levelId) {
      this.startingLevel = levelId;
      this.currentLevel = levelId;
    } else {
      this.currentLevel = this.startingLevel;
    }

    this.playerZ = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.targetLane = 0;
    this.jumpVelocity = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.lateralVelocity = 0;

    this.currentSpeed = GAME_CONSTANTS.INITIAL_SPEED;
    this.distanceRun = GAME_LEVELS[this.currentLevel].distanceThreshold;
    this.coinsCollected = 0;
    this.score = 0;
    this.comboStreak = 0;
    this.comboTimer = 0;
    this.lastMilestone = Math.floor(this.distanceRun / 250) * 250;
    this.cameraShakeIntensity = 0;

    this.character.resetPose();
    this.character.mesh.position.set(0, 0, 0);

    this.applyLevelEnvironment(this.currentLevel);
    this.worldManager.reset(this.playerZ, this.currentLevel);
    this.obstacleManager.reset(this.playerZ);
    this.obstacleManager.setLevel(this.currentLevel);

    this.sunLight.position.set(25, 45, this.playerZ + 20);
    this.sunLight.target.position.set(0, 0, this.playerZ);

    this.clock.getDelta();
    this.updateStatsUI();
  }

  // --- Input Handlers ---

  public moveLeft() {
    if (!this.isRunning || this.isPaused) return;
    if (this.targetLane > -1) {
      this.targetLane = (this.targetLane - 1) as LaneIndex;
      sound.playLaneSwitch();
    }
  }

  public moveRight() {
    if (!this.isRunning || this.isPaused) return;
    if (this.targetLane < 1) {
      this.targetLane = (this.targetLane + 1) as LaneIndex;
      sound.playLaneSwitch();
    }
  }

  public jump() {
    if (!this.isRunning || this.isPaused) return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.isSliding = false;
      this.jumpVelocity = GAME_CONSTANTS.JUMP_FORCE;
      sound.playJump();
    }
  }

  public slide() {
    if (!this.isRunning || this.isPaused) return;
    if (this.isJumping) {
      // Stomp down fast if in air!
      this.jumpVelocity = -GAME_CONSTANTS.JUMP_FORCE * 1.6;
    } else {
      this.isSliding = true;
      this.slideTimer = GAME_CONSTANTS.SLIDE_DURATION;
      sound.playSlide();
    }
  }

  // --- Core Game Loop ---

  private renderLoop = () => {
    this.animFrameId = requestAnimationFrame(this.renderLoop);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.isRunning && !this.isPaused) {
      this.updatePhysics(delta);
    } else if (!this.isRunning) {
      // Idle character animation in start menu
      this.character.update(delta, 'idle');
    }

    this.updateCamera(delta);
    this.renderer.render(this.scene, this.camera);
  };

  private updatePhysics(delta: number) {
    // 1. Forward continuous running motion
    const forwardStep = this.currentSpeed * delta;
    this.playerZ -= forwardStep;
    this.distanceRun += forwardStep;
    this.score += forwardStep * (1 + this.comboStreak * 0.2);

    // Dynamic speed scaling: increases every 100m
    this.currentSpeed = Math.min(
      GAME_CONSTANTS.MAX_SPEED,
      GAME_CONSTANTS.INITIAL_SPEED + (this.distanceRun / 100) * GAME_CONSTANTS.SPEED_INCREMENT
    );

    // Level progression check based on distance thresholds
    if (this.currentLevel < 5) {
      const nextLevelId = (this.currentLevel + 1) as GameLevelId;
      const nextThreshold = GAME_LEVELS[nextLevelId].distanceThreshold;
      if (this.distanceRun >= nextThreshold) {
        this.currentLevel = nextLevelId;
        this.applyLevelEnvironment(nextLevelId);
        this.worldManager.setLevel(nextLevelId);
        this.obstacleManager.setLevel(nextLevelId);
        sound.playLevelUp();
        this.callbacks.onLevelUp?.(GAME_LEVELS[nextLevelId]);
      }
    }

    // Distance Milestone celebration every 250 meters
    const currentMilestone = Math.floor(this.distanceRun / 250) * 250;
    if (currentMilestone > this.lastMilestone && currentMilestone > 0) {
      this.lastMilestone = currentMilestone;
      sound.playMilestone();
      sound.playCrowdCheer();
      this.callbacks.onMilestone(currentMilestone);
    }

    // 2. Lateral Movement (Switching between 3 lanes smoothly and cleanly with exponential damping)
    const targetX = GAME_CONSTANTS.LANES[this.targetLane + 1];
    const prevX = this.playerX;
    const laneLerp = 1 - Math.exp(-18 * delta);
    this.playerX = THREE.MathUtils.lerp(this.playerX, targetX, laneLerp);
    if (Math.abs(this.playerX - targetX) < 0.005) {
      this.playerX = targetX;
      this.lateralVelocity = 0;
    } else {
      this.lateralVelocity = (this.playerX - prevX) / Math.max(delta, 0.001);
    }

    // 3. Vertical Movement (Jump & Gravity)
    if (this.isJumping) {
      this.playerY += this.jumpVelocity * delta;
      this.jumpVelocity -= GAME_CONSTANTS.GRAVITY * delta;

      // Landing
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        sound.playLand();
      }
    }

    // 4. Sliding / Rolling Ducking Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // 5. Update Combo Streak decay
    if (this.comboStreak > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboStreak = 0;
      }
    }

    // 6. Update Girl Character Transform & Rig Animation
    this.character.mesh.position.set(this.playerX, this.playerY, this.playerZ);

    let animState: 'run' | 'jump' | 'slide' | 'hit' | 'idle' = 'run';
    if (this.isJumping) animState = 'jump';
    else if (this.isSliding) animState = 'slide';

    const speedRatio = this.currentSpeed / GAME_CONSTANTS.INITIAL_SPEED;
    this.character.update(delta, animState, speedRatio, this.lateralVelocity, this.playerY);

    // 7. Update Sunlight Position to follow runner
    this.sunLight.position.set(25, 45, this.playerZ + 20);
    this.sunLight.target.position.set(0, 0, this.playerZ - 10);

    // 8. Update World Chunks & Obstacles
    this.worldManager.update(this.playerZ, delta);
    this.obstacleManager.update(this.playerZ, delta, this.currentSpeed, this.distanceRun);

    // 9. Collision Checks
    this.checkCoinCollections();
    this.checkObstacleCollisions(delta);

    // 10. Broadcast stats to UI
    this.updateStatsUI();
  }

  private checkCoinCollections() {
    const playerRadius = 1.3;
    const playerCenter = new THREE.Vector3(this.playerX, this.playerY + 1.0, this.playerZ);

    for (let coin of this.obstacleManager.coins) {
      if (coin.collected) continue;

      const coinPos = new THREE.Vector3(coin.x, coin.y, coin.z);
      const dist = playerCenter.distanceTo(coinPos);

      // Magnet effect if close
      if (dist < 3.2) {
        coin.mesh.position.lerp(playerCenter, 0.25);
      }

      // Collection
      if (dist < playerRadius) {
        coin.collected = true;
        this.obstacleManager.scene.remove(coin.mesh);

        this.coinsCollected++;
        this.comboStreak++;
        this.comboTimer = 2.5; // combo streak window
        const comboMultiplier = Math.min(5, 1 + Math.floor(this.comboStreak / 4));
        this.score += GAME_CONSTANTS.COIN_VALUE * comboMultiplier;

        sound.playCoin(this.comboStreak);
        this.obstacleManager.triggerCoinCollectionEffect(coin.x, coin.y, coin.z);
      }
    }
  }

  private checkObstacleCollisions(delta: number) {
    // Player bounding box
    const playerMinX = this.playerX - 0.35;
    const playerMaxX = this.playerX + 0.35;
    
    // Swept Z-axis collision (Continuous Collision Detection against tunneling)
    const forwardStep = this.currentSpeed * delta;
    const playerMinZ = this.playerZ - 0.35; 
    const playerMaxZ = this.playerZ + 0.35 + forwardStep; // Extend back to where we were last frame
    
    const playerMinY = this.playerY;
    const playerMaxY = this.isSliding ? this.playerY + 0.75 : this.playerY + 1.85;

    for (let obs of this.obstacleManager.obstacles) {
      // Check Z distance first for quick cull
      const obsMinZ = obs.z - obs.depth / 2;
      const obsMaxZ = obs.z + obs.depth / 2;
      
      if (playerMinZ > obsMaxZ || playerMaxZ < obsMinZ) continue;

      // Check X lane overlap
      const obsMinX = obs.x - obs.width / 2 + 0.25; // forgiving hitbox margins
      const obsMaxX = obs.x + obs.width / 2 - 0.25;
      if (playerMinX > obsMaxX || playerMaxX < obsMinX) continue;

      // Check Y height clearance
      const obsMinY = obs.y;
      const obsMaxY = obs.y + obs.height;

      // Can jump over? (Strictly enforce jumping action to avoid phasing)
      if (obs.canJumpOver && this.isJumping && playerMinY >= obsMaxY - 0.4) {
        // Clean jump over barrier!
        continue;
      }

      // Can slide under?
      if (obs.canSlideUnder && this.isSliding && playerMaxY <= obsMaxY) {
        // Clean slide under!
        continue;
      }

      // COLLISION OCCURRED!
      this.handleCollision();
      break;
    }
  }

  private handleCollision() {
    this.isRunning = false;
    sound.stopMusic();
    sound.playHit();
    this.cameraShakeIntensity = 0.8;

    // Trigger stumble animation
    this.character.update(0.1, 'hit');

    // Update high score
    const finalScore = Math.floor(this.score);
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
      localStorage.setItem('road_runner_3d_highscore', this.highScore.toString());
    }

    const currentThresh = GAME_LEVELS[this.currentLevel].distanceThreshold;
    const nextLevelId = (this.currentLevel < 5 ? (this.currentLevel + 1) : 5) as GameLevelId;
    const nextThresh = this.currentLevel < 5 ? GAME_LEVELS[nextLevelId].distanceThreshold : currentThresh + 1000;
    const levelProgress = this.currentLevel === 5 ? 1.0 : Math.min(1.0, Math.max(0, (this.distanceRun - currentThresh) / (nextThresh - currentThresh)));

    const stats: GameStats = {
      score: finalScore,
      coins: this.coinsCollected,
      distance: Math.floor(this.distanceRun),
      speed: Math.round(this.currentSpeed * 3.6), // in km/h
      combo: this.comboStreak,
      multiplier: Math.min(5, 1 + Math.floor(this.comboStreak / 4)),
      highScore: this.highScore,
      totalCoins: this.coinsCollected,
      currentLevel: this.currentLevel,
      levelName: GAME_LEVELS[this.currentLevel].name,
      levelProgress,
    };

    // Delay game over modal slightly for impact reaction
    setTimeout(() => {
      this.callbacks.onGameOver(stats);
    }, 700);
  }

  private updateCamera(delta: number) {
    const isPortrait = this.camera.aspect < 1.0;
    const baseFov = this.calculateBaseFov(this.camera.aspect);

    if (!this.isRunning) {
      // Menu Mode: Elevate behind runner girl showing her athletic stance and the scenic highway stretching ahead
      const menuCamX = isPortrait ? 0.0 : 0.25;
      const menuCamY = isPortrait ? 3.3 : 2.9;
      const menuCamZ = this.playerZ + (isPortrait ? 6.2 : 5.2);

      const menuLerp = 1 - Math.exp(-8 * delta);
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, menuCamX, menuLerp);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, menuCamY, menuLerp);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, menuCamZ, menuLerp);

      this.cameraLookTarget.set(0, isPortrait ? 1.5 : 1.3, this.playerZ - (isPortrait ? 9.5 : 8.0));
      this.camera.lookAt(this.cameraLookTarget);
      return;
    }

    // Dynamic camera modes during sprint - comfortably scaled for portrait phone screens
    const camOffset = isPortrait
      ? new THREE.Vector3(0, 3.65, 6.4)
      : this.cameraOffset;

    let targetCamX = this.playerX * (isPortrait ? 0.55 : 0.72);
    let targetCamY = this.playerY * 0.4 + camOffset.y;
    let targetCamZ = this.playerZ + camOffset.z;

    if (this.cameraMode === 'front') {
      // Action Front Chase Camera: runs ahead of the character, facing back to show her face, expressions, and running action
      targetCamX = this.playerX * (isPortrait ? 0.65 : 0.8);
      targetCamY = this.playerY * 0.3 + (isPortrait ? 2.0 : 1.8);
      targetCamZ = this.playerZ - (isPortrait ? 5.2 : 4.6);
      this.cameraLookTarget.set(this.playerX, this.playerY + 1.25, this.playerZ + 0.5);
    } else if (this.cameraMode === 'angled') {
      // Dynamic Broadcast 3/4 angle showing both face and upcoming road
      targetCamX = this.playerX + (isPortrait ? 2.8 : 3.8);
      targetCamY = this.playerY * 0.4 + (isPortrait ? 3.4 : 3.0);
      targetCamZ = this.playerZ + (isPortrait ? 4.8 : 4.2);
      this.cameraLookTarget.set(this.playerX * 0.4, this.playerY + 1.2, this.playerZ - 6.0);
    } else {
      // Default: Follow Camera behind runner
      targetCamX = this.playerX * (isPortrait ? 0.55 : 0.72);
      targetCamY = this.playerY * 0.4 + camOffset.y;
      targetCamZ = this.playerZ + camOffset.z;
      this.cameraLookTarget.set(
        this.playerX * (isPortrait ? 0.3 : 0.4),
        this.playerY * 0.35 + (isPortrait ? 1.55 : 1.8),
        this.playerZ - (isPortrait ? 11.5 : 10.0)
      );
    }

    const camLerpXY = 1 - Math.exp(-10 * delta);
    const camLerpZ = 1 - Math.exp(-14 * delta);
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, camLerpXY);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, camLerpXY);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, camLerpZ);
    this.camera.lookAt(this.cameraLookTarget);

    // Speed FOV expansion (thrilling sense of speed smoothly calculated from base dynamic FOV)
    const targetFov = baseFov + ((this.currentSpeed - GAME_CONSTANTS.INITIAL_SPEED) / (GAME_CONSTANTS.MAX_SPEED - GAME_CONSTANTS.INITIAL_SPEED)) * (isPortrait ? 8 : 12);
    const fovLerp = 1 - Math.exp(-5 * delta);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, fovLerp);
    this.camera.updateProjectionMatrix();

    // Camera Shake on impact
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
    }
  }

  private lastStatsUpdateTime: number = 0;

  private updateStatsUI() {
    const now = performance.now();
    // Throttle React state updates to ~15 FPS to prevent massive frame drops and freezing
    if (now - this.lastStatsUpdateTime < 66) return;
    this.lastStatsUpdateTime = now;

    const currentThresh = GAME_LEVELS[this.currentLevel].distanceThreshold;
    const nextLevelId = (this.currentLevel < 5 ? (this.currentLevel + 1) : 5) as GameLevelId;
    const nextThresh = this.currentLevel < 5 ? GAME_LEVELS[nextLevelId].distanceThreshold : currentThresh + 1000;
    const levelProgress = this.currentLevel === 5 ? 1.0 : Math.min(1.0, Math.max(0, (this.distanceRun - currentThresh) / (nextThresh - currentThresh)));

    this.callbacks.onStatsUpdate({
      score: Math.floor(this.score),
      coins: this.coinsCollected,
      distance: Math.floor(this.distanceRun),
      speed: Math.round(this.currentSpeed * 3.6),
      combo: this.comboStreak,
      multiplier: Math.min(5, 1 + Math.floor(this.comboStreak / 4)),
      highScore: this.highScore,
      totalCoins: this.coinsCollected,
      currentLevel: this.currentLevel,
      levelName: GAME_LEVELS[this.currentLevel].name,
      levelProgress,
    });
  }

  public cleanup() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.onResize);
    sound.stopMusic();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
