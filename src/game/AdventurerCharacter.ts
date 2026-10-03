import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type CharacterAnimState = 'run' | 'jump' | 'slide' | 'hit' | 'idle';

/**
 * 3D Adventurer Runner Character using Quaternius's Rigged & Animated GLTF Model
 * Model file: /Adventurer by Quaternius - 5EGWBMpuXq.glb (or /adventurer.glb)
 */
export class AdventurerCharacter {
  public mesh: THREE.Group;

  // Model & Animation Components
  private modelRoot: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentActionName: string | null = null;

  // Shadow & Visual FX
  private shadowMesh: THREE.Mesh;
  private starsGroup: THREE.Group;

  // Motion dynamics
  private currentBank: number = 0;
  public currentYaw: number = 0;
  public isLoaded: boolean = false;

  constructor() {
    this.mesh = new THREE.Group();

    // 1. Soft Dynamic Contact Shadow on Ground (stays grounded even during jumps)
    const shadowGeo = new THREE.PlaneGeometry(1.2, 1.6);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.y = 0.02;
    this.mesh.add(this.shadowMesh);

    // 2. Collision Dizzy Stars FX (spinning halo upon crash)
    this.starsGroup = new THREE.Group();
    this.starsGroup.position.y = 2.0;
    this.starsGroup.visible = false;
    const starGeo = new THREE.OctahedronGeometry(0.12, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    for (let i = 0; i < 4; i++) {
      const star = new THREE.Mesh(starGeo, starMat);
      const angle = (i / 4) * Math.PI * 2;
      star.position.set(Math.cos(angle) * 0.45, Math.sin(angle * 2) * 0.08, Math.sin(angle) * 0.45);
      this.starsGroup.add(star);
    }
    this.mesh.add(this.starsGroup);

    // 3. (Removed placeholder mesh to avoid showing a green dot while loading)

    // 4. Load the Quaternius Adventurer 3D Model
    this.loadModel();
  }

  private loadModel() {
    const loader = new GLTFLoader();
    
    // Prefer URL-encoded or sanitized filename, with fallback
    const primaryUrl = '/adventurer.glb?v=2';
    const fallbackUrl = '/Adventurer%20by%20Quaternius%20-%205EGWBMpuXq.glb?v=2';

    const onLoadSuccess = (gltf: any) => {
      try {
        this.modelRoot = gltf.scene as THREE.Group;

        // Enable real-time shadow casting and receiving for all meshes
        this.modelRoot.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const mat = child.material as THREE.Material & { map?: THREE.Texture };
              if (mat.map) {
                mat.map.anisotropy = 8;
                mat.map.colorSpace = THREE.SRGBColorSpace;
              }
            }
          }
        });

        // Character orientation
        this.modelRoot.rotation.y = Math.PI;
        this.modelRoot.position.set(0, 0, 0);
        this.modelRoot.scale.set(1.0, 1.0, 1.0);

        this.mesh.add(this.modelRoot);

        // Setup Animation Mixer and Actions
        this.mixer = new THREE.AnimationMixer(this.modelRoot);
        const animClips: THREE.AnimationClip[] = gltf.animations || [];

        animClips.forEach((clip) => {
          const action = this.mixer!.clipAction(clip);
          this.actions.set(clip.name, action);
        });

        // Default to Idle state
        this.playAction('idle', 0.2);
        this.isLoaded = true;
        console.log('Successfully loaded Quaternius Adventurer model');
      } catch (err) {
        console.error('Error initializing Quaternius model:', err);
      }
    };

    try {
      loader.load(
        primaryUrl,
        onLoadSuccess,
        undefined,
        (err) => {
          console.warn('Primary URL failed, trying fallback. Error:', err);
          loader.load(
            fallbackUrl,
            onLoadSuccess,
            undefined,
            (err2) => {
              console.error('Failed to load Adventurer 3D model completely:', err2);
            }
          );
        }
      );
    } catch (err) {
      console.error('Exception calling loader.load:', err);
    }
  }

  /**
   * Smoothly cross-fades between animations
   */
  private playAction(state: CharacterAnimState, fadeDuration: number = 0.2, speedRatio: number = 1.0) {
    if (!this.mixer) return;

    // Map gameplay state to Quaternius clip names
    let clipName = 'CharacterArmature|Idle';
    if (state === 'run') {
      clipName = 'CharacterArmature|Run';
    } else if (state === 'slide') {
      clipName = 'CharacterArmature|Roll';
    } else if (state === 'jump') {
      clipName = 'CharacterArmature|Run';
    } else if (state === 'hit') {
      clipName = 'CharacterArmature|HitRecieve';
    } else if (state === 'idle') {
      clipName = 'CharacterArmature|Idle';
    }

    if (this.currentActionName === clipName) {
      // Adjust speed scale if still running or jumping
      const current = this.actions.get(clipName);
      if (current) {
        if (state === 'run') {
          current.timeScale = Math.max(1.2, speedRatio * 1.7);
        } else if (state === 'slide') {
          current.timeScale = 1.85;
        } else if (state === 'jump') {
          current.timeScale = 0; // Pause animation while in the air
        }
      }
      return;
    }

    const nextAction = this.actions.get(clipName);
    if (!nextAction) return;

    if (this.currentActionName) {
      const prevAction = this.actions.get(this.currentActionName);
      if (prevAction) {
        prevAction.fadeOut(fadeDuration);
      }
    }

    nextAction.reset();
    if (state === 'run') {
      nextAction.timeScale = Math.max(1.2, speedRatio * 1.7);
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    } else if (state === 'slide') {
      nextAction.timeScale = 1.85;
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    } else if (state === 'jump') {
      // Set to a frame where legs are spread for a leaping pose
      nextAction.time = 0.15;
      nextAction.timeScale = 0;
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    } else if (state === 'hit') {
      nextAction.timeScale = 1.0;
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.timeScale = 1.0;
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    nextAction.fadeIn(fadeDuration);
    nextAction.play();
    this.currentActionName = clipName;
  }

  /**
   * Update character transforms and skeletal animation
   */
  public update(
    delta: number,
    state: CharacterAnimState,
    speedRatio: number = 1.0,
    lateralVelocity: number = 0,
    verticalY: number = 0
  ) {
    // 1. Advance Animation Mixer
    if (this.mixer) {
      this.playAction(state, 0.15, speedRatio);
      this.mixer.update(delta);
    }

    // 2. Lateral stability: Keep character upright and stable without tilting or wobbling
    this.currentBank = 0;
    this.currentYaw = 0;

    if (this.modelRoot) {
      this.modelRoot.rotation.z = 0;
      // Base rotation is Math.PI (facing -Z straight down track)
      this.modelRoot.rotation.y = Math.PI;

      // Dynamic athletic stance angles
      if (state === 'slide') {
        this.modelRoot.position.y = -0.3;
        this.modelRoot.rotation.x = -0.25;
      } else if (state === 'jump') {
        this.modelRoot.position.y = 0;
        this.modelRoot.rotation.x = 0.12; // Athletic hurdle leap angle
      } else if (state === 'run') {
        this.modelRoot.position.y = 0;
        this.modelRoot.rotation.x = -0.1; // Forward athletic sprint lean
      } else {
        this.modelRoot.position.y = 0;
        this.modelRoot.rotation.x = 0;
      }
    }

    // 4. Ground Shadow scaling & opacity depending on vertical jump height
    const shadowScale = Math.max(0.35, 1.0 - verticalY / 3.5);
    this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
    const shadowMat = this.shadowMesh.material as THREE.MeshBasicMaterial;
    shadowMat.opacity = Math.max(0.12, 0.65 - verticalY * 0.16);

    // 5. Collision Stars FX
    if (state === 'hit') {
      this.starsGroup.visible = true;
      this.starsGroup.rotation.y += delta * 6;
      this.starsGroup.position.y = 1.8 + Math.sin(Date.now() * 0.005) * 0.1;
    } else {
      this.starsGroup.visible = false;
    }
  }

  /**
   * Reset character to neutral run/idle stance
   */
  public resetPose() {
    this.currentBank = 0;
    this.currentYaw = 0;
    if (this.modelRoot) {
      this.modelRoot.rotation.set(0, Math.PI, 0);
      this.modelRoot.position.set(0, 0, 0);
    }
    this.starsGroup.visible = false;
    this.playAction('idle', 0.1);
  }
}
