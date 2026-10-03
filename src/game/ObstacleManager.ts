import * as THREE from 'three';
import { GAME_CONSTANTS, LaneIndex, ObstacleType, GameLevelId } from '../types';

export interface CoinInstance {
  mesh: THREE.Group;
  lane: LaneIndex;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  baseY: number;
}

export interface ObstacleInstance {
  mesh: THREE.Group;
  type: ObstacleType;
  lane: LaneIndex;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  canJumpOver: boolean;
  canSlideUnder: boolean;
  speedZ: number; // for moving vehicles
}

export interface ParticleEffect {
  mesh: THREE.Points;
  velocities: THREE.Vector3[];
  life: number;
  maxLife: number;
}

export class ObstacleManager {
  public scene: THREE.Scene;
  public currentLevel: GameLevelId = 1;
  public coins: CoinInstance[] = [];
  public obstacles: ObstacleInstance[] = [];
  public particles: ParticleEffect[] = [];

  private coinRimMaterial: THREE.MeshStandardMaterial;
  private coinFaceMaterial: THREE.MeshStandardMaterial;
  private coinGlowMaterial: THREE.MeshBasicMaterial;

  private spawnZ: number = -40;
  private minSpacing: number = 24;

  // Obstacle Materials
  private coneOrangeMat: THREE.MeshStandardMaterial;
  private coneWhiteMat: THREE.MeshStandardMaterial;
  private hazardMat: THREE.MeshStandardMaterial;
  private vehicleBodyMat: THREE.MeshStandardMaterial;
  private vehicleGlassMat: THREE.MeshStandardMaterial;
  private tireMat: THREE.MeshStandardMaterial;
  private boulderMat: THREE.MeshStandardMaterial;

  public setLevel(levelId: GameLevelId) {
    this.currentLevel = levelId;
  }

  // Shared Coin Geometries & Materials for zero-allocation 60fps performance
  private coinCoreGeo: THREE.CylinderGeometry;
  private coinRimGeo: THREE.BufferGeometry;
  private coinFaceGeo: THREE.BufferGeometry;
  private coinGlintGeo: THREE.BufferGeometry;
  private coinGlowGeo: THREE.BufferGeometry;
  private coinGlintMat: THREE.MeshBasicMaterial;

  // Shared Obstacle Geometries
  private coneBaseGeo: THREE.BoxGeometry;
  private coneBodyGeo: THREE.ConeGeometry;
  private coneBandGeo: THREE.CylinderGeometry;

  private lowBarrierLeg1Geo: THREE.BoxGeometry;
  private lowBarrierLeg2Geo: THREE.BoxGeometry;
  private lowBarrierBoardGeo: THREE.BoxGeometry;
  private lowBarrierBeaconGeo: THREE.CylinderGeometry;
  private lowBarrierBeaconMat: THREE.MeshBasicMaterial;

  private highBarrierPostGeo: THREE.CylinderGeometry;
  private highBarrierBoardGeo: THREE.BoxGeometry;
  private highBarrierSignGeo: THREE.PlaneGeometry;
  private highBarrierSignMat: THREE.MeshBasicMaterial;

  private roadblockBoardGeo: THREE.BoxGeometry;
  private roadblockLegGeo: THREE.CylinderGeometry;

  // Shared Vehicle Geometries
  private vehicleChassisGeo: THREE.BoxGeometry;
  private vehicleCabinGeo: THREE.BoxGeometry;
  private vehicleWindshieldGeo: THREE.PlaneGeometry;
  private vehicleWheelGeo: THREE.CylinderGeometry;
  private vehicleTailGeo: THREE.BoxGeometry;
  private vehicleTailMat: THREE.MeshBasicMaterial;
  private vehicleBodyMats: THREE.MeshStandardMaterial[];

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // --- Stylized Cartoon Coin System ---
    const coinTexture = this.createMintedCoinTexture();

    // The cartoon coin uses basic unlit or low-lit materials to preserve the 2D illustration look
    this.coinFaceMaterial = new THREE.MeshStandardMaterial({
      map: coinTexture,
      color: 0xffffff, // Let the texture shine
      metalness: 0.1,
      roughness: 0.8,
      emissive: 0x221100, // Very slight ambient warmth
    });

    this.coinRimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Brown/orange rim to match the cartoon line art
      metalness: 0.1,
      roughness: 0.8,
    });

    // Shared Coin Geometry (single mesh instead of 7!)
    this.coinCoreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 16);
    this.coinCoreGeo.rotateX(Math.PI / 2); // Rotate so faces are on Z axis
    
    // We don't need the other complex geometries anymore to make it run smoothly!
    this.coinRimGeo = new THREE.BufferGeometry(); 
    this.coinFaceGeo = new THREE.BufferGeometry();
    this.coinGlintGeo = new THREE.BufferGeometry();
    this.coinGlowGeo = new THREE.BufferGeometry();
    this.coinGlowMaterial = new THREE.MeshBasicMaterial();
    this.coinGlintMat = new THREE.MeshBasicMaterial();

    // Obstacle Materials
    this.coneOrangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    this.coneWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    this.vehicleBodyMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.4 });
    this.vehicleGlassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 });
    this.boulderMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });

    // Shared Cone Geometries
    this.coneBaseGeo = new THREE.BoxGeometry(0.7, 0.08, 0.7);
    this.coneBodyGeo = new THREE.ConeGeometry(0.3, 0.95, 10);
    this.coneBodyGeo.translate(0, 0.48, 0);
    this.coneBandGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.22, 10);
    this.coneBandGeo.translate(0, 0.5, 0);

    // Shared Low Barrier Geometries
    this.lowBarrierLeg1Geo = new THREE.BoxGeometry(0.08, 1.2, 0.08);
    this.lowBarrierLeg1Geo.rotateZ(0.2);
    this.lowBarrierLeg2Geo = new THREE.BoxGeometry(0.08, 1.2, 0.08);
    this.lowBarrierLeg2Geo.rotateZ(-0.2);
    this.lowBarrierBoardGeo = new THREE.BoxGeometry(2.5, 0.38, 0.08);
    this.lowBarrierBeaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 8);
    this.lowBarrierBeaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Shared High Barrier Geometries & Material
    this.highBarrierPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.7, 8);
    this.highBarrierPostGeo.translate(0, 1.35, 0);
    this.highBarrierBoardGeo = new THREE.BoxGeometry(2.7, 0.8, 0.1);
    this.highBarrierSignGeo = new THREE.PlaneGeometry(2.4, 0.7);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#ef4444';
      sCtx.fillRect(0, 0, 256, 128);
      sCtx.fillStyle = '#ffffff';
      sCtx.font = 'bold 36px Outfit, sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('ROAD WORK', 128, 50);
      sCtx.font = '24px Outfit, sans-serif';
      sCtx.fillText('SLIDE / DETOUR', 128, 90);
    }
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    signTex.anisotropy = 4;
    this.highBarrierSignMat = new THREE.MeshBasicMaterial({ map: signTex });

    // Shared Roadblock Geometries
    this.roadblockBoardGeo = new THREE.BoxGeometry(2.6, 0.45, 0.1);
    this.roadblockLegGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8);

    // Hazard Stripes texture for barricades
    const hazardCanvas = document.createElement('canvas');
    hazardCanvas.width = 128;
    hazardCanvas.height = 128;
    const hCtx = hazardCanvas.getContext('2d');
    if (hCtx) {
      hCtx.fillStyle = '#facc15';
      hCtx.fillRect(0, 0, 128, 128);
      hCtx.fillStyle = '#1e293b';
      for (let i = -128; i < 256; i += 32) {
        hCtx.beginPath();
        hCtx.moveTo(i, 0);
        hCtx.lineTo(i + 16, 0);
        hCtx.lineTo(i + 16 + 128, 128);
        hCtx.lineTo(i + 128, 128);
        hCtx.closePath();
        hCtx.fill();
      }
    }
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.colorSpace = THREE.SRGBColorSpace;
    hazardTex.anisotropy = 4;
    hazardTex.wrapS = THREE.RepeatWrapping;
    hazardTex.wrapT = THREE.RepeatWrapping;
    hazardTex.repeat.set(4, 1);
    this.hazardMat = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.5 });

    // Pre-allocate Vehicle Geometries & Materials
    const colors = [0x3b82f6, 0xef4444, 0x10b981, 0xf59e0b];
    this.vehicleBodyMats = colors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, metalness: 0.2 }));
    this.vehicleChassisGeo = new THREE.BoxGeometry(2.0, 0.85, 3.8);
    this.vehicleChassisGeo.translate(0, 0.65, 0);
    this.vehicleCabinGeo = new THREE.BoxGeometry(1.85, 0.85, 2.2);
    this.vehicleCabinGeo.translate(0, 1.5, -0.3);
    this.vehicleWindshieldGeo = new THREE.PlaneGeometry(1.7, 0.75);
    this.vehicleWheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
    this.vehicleWheelGeo.rotateZ(Math.PI / 2);
    this.vehicleTailGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    this.vehicleTailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  }

  /**
   * Procedurally generate chunks of obstacles & coins ahead of player
   */
  public update(playerZ: number, delta: number, currentSpeed: number, distanceRun: number) {
    const time = Date.now() * 0.005;

    // 1. Rotate coins smoothly around their vertical axis
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin.collected) continue;

      coin.mesh.rotation.y += delta * 3.2;

      // Despawn passed coins
      if (coin.mesh.position.z > playerZ + 15) {
        this.scene.remove(coin.mesh);
        this.coins.splice(i, 1);
      }
    }

    // 2. Update obstacles (animate moving vehicles or blinking hazard lights)
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      if (obs.speedZ !== 0) {
        obs.z += obs.speedZ * delta;
        obs.mesh.position.z = obs.z;
      }

      // Despawn passed obstacles
      if (obs.mesh.position.z > playerZ + 20) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // 3. Update particle effects (coin sparkles)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      const positions = p.mesh.geometry.attributes.position.array as Float32Array;

      for (let j = 0; j < p.velocities.length; j++) {
        positions[j * 3 + 0] += p.velocities[j].x * delta;
        positions[j * 3 + 1] += p.velocities[j].y * delta;
        positions[j * 3 + 2] += p.velocities[j].z * delta;
        p.velocities[j].y -= 9.8 * delta * 0.4; // gravity
      }
      p.mesh.geometry.attributes.position.needsUpdate = true;

      const pMat = p.mesh.material as THREE.PointsMaterial;
      pMat.opacity = 1 - (p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        pMat.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 4. Spawn ahead up to 140 meters ahead of player
    const spawnHorizon = playerZ - 130;
    while (this.spawnZ > spawnHorizon) {
      this.generateSegment(this.spawnZ, distanceRun);
      // Spacing scales down with speed/difficulty for tight arcade excitement
      const spacing = Math.max(16, this.minSpacing - Math.min(8, (distanceRun / 300) * 4));
      this.spawnZ -= spacing;
    }
  }

  private generateSegment(zPos: number, distanceRun: number) {
    const lanes: LaneIndex[] = [-1, 0, 1];
    const difficulty = Math.min(1.0, distanceRun / 600); // 0.0 to 1.0

    // Decide obstacle arrangement:
    // Ensure NEVER all 3 lanes are blocked without safe path!
    const roll = Math.random();

    if (roll < 0.28) {
      // Single obstacle in one lane + coins in others
      const obsLane = lanes[Math.floor(Math.random() * 3)];
      const obsType = this.pickObstacleType(difficulty);
      this.spawnObstacle(obsType, obsLane, zPos);

      // Safe coin line in an adjacent lane
      const coinLane = lanes.filter((l) => l !== obsLane)[Math.floor(Math.random() * 2)];
      this.spawnCoinLine(coinLane, zPos - 4, 4);

    } else if (roll < 0.55) {
      // Low Barrier (jumpable) with an ARC of coins right over it!
      const barrierLane = lanes[Math.floor(Math.random() * 3)];
      this.spawnObstacle('barrier_low', barrierLane, zPos);
      this.spawnCoinArc(barrierLane, zPos);

      // Additional obstacle in another lane, leaving one open
      if (Math.random() < 0.6) {
        const remainingLanes = lanes.filter((l) => l !== barrierLane);
        const secondLane = remainingLanes[Math.floor(Math.random() * 2)];
        this.spawnObstacle('cone', secondLane, zPos);
      }

    } else if (roll < 0.78) {
      // Two obstacles leaving 1 safe lane
      const safeLane = lanes[Math.floor(Math.random() * 3)];
      const blockedLanes = lanes.filter((l) => l !== safeLane);

      const type1 = this.pickObstacleType(difficulty);
      const type2 = difficulty > 0.4 ? this.pickObstacleType(difficulty) : 'cone';

      this.spawnObstacle(type1, blockedLanes[0], zPos);
      this.spawnObstacle(type2, blockedLanes[1], zPos);

      // Rewarding cluster or line of coins in the safe lane
      this.spawnCoinLine(safeLane, zPos - 3, 5);

    } else {
      // Zigzag coin pattern across lanes
      this.spawnCoinZigzag(zPos);
      // Put a cone at the end to prompt jumping or lane switch
      const endLane = (Math.random() > 0.5 ? -1 : 1) as LaneIndex;
      this.spawnObstacle('cone', endLane, zPos - 12);
    }
  }

  private pickObstacleType(difficulty: number): ObstacleType {
    if (this.currentLevel === 5) {
      // Level 5 Extreme Traffic: high vehicle presence!
      const roll = Math.random();
      if (roll < 0.65) return 'vehicle';
      if (roll < 0.85) return 'roadblock';
      return 'cone';
    } else if (this.currentLevel === 4) {
      // Level 4 Mountain Road: rocky boulders and mountain timber
      const roll = Math.random();
      if (roll < 0.5) return 'boulder';
      if (roll < 0.75) return 'barrier_low';
      return 'cone';
    } else if (this.currentLevel === 3) {
      // Level 3 Night City: vehicles, high barriers, roadblocks
      const roll = Math.random();
      if (roll < 0.4) return 'vehicle';
      if (roll < 0.7) return 'barrier_high';
      if (roll < 0.88) return 'roadblock';
      return 'barrier_low';
    } else if (this.currentLevel === 2) {
      // Level 2 Highway: vehicles, high gantries, cones
      const roll = Math.random();
      if (roll < 0.45) return 'vehicle';
      if (roll < 0.75) return 'barrier_high';
      return 'cone';
    }

    // Level 1 City Road: balanced
    const types: ObstacleType[] = ['cone', 'barrier_low'];
    if (difficulty > 0.2) types.push('barrier_high');
    if (difficulty > 0.35) types.push('vehicle');
    if (difficulty > 0.5) types.push('roadblock');
    return types[Math.floor(Math.random() * types.length)];
  }

  public spawnObstacle(type: ObstacleType, lane: LaneIndex, z: number) {
    const x = GAME_CONSTANTS.LANES[lane + 1];
    let mesh: THREE.Group;
    let width = 2.0;
    let height = 1.2;
    let depth = 1.0;
    let canJumpOver = false;
    let canSlideUnder = false;
    let speedZ = 0;

    switch (type) {
      case 'cone': {
        mesh = this.createTrafficConeGroup();
        width = 1.6;
        height = 1.0;
        depth = 0.8;
        canJumpOver = true;
        break;
      }
      case 'barrier_low': {
        mesh = this.createLowBarrierGroup();
        width = 2.4;
        height = 1.15;
        depth = 0.6;
        canJumpOver = true; // Can jump cleanly over!
        break;
      }
      case 'barrier_high': {
        mesh = this.createHighBarrierGroup();
        width = 2.6;
        height = 2.8;
        depth = 0.8;
        canJumpOver = false; // Must dodge!
        canSlideUnder = true; // Can slide under the clearance bar!
        break;
      }
      case 'vehicle': {
        mesh = this.createVehicleGroup();
        width = 2.2;
        height = 2.0;
        depth = 4.2;
        canJumpOver = false;
        // In Level 5 Extreme Traffic, cars move with varied highway traffic speeds
        if (this.currentLevel === 5) {
          speedZ = -2.5 - Math.random() * 4.5;
        } else if (this.currentLevel === 2) {
          speedZ = -3.5;
        } else {
          speedZ = -2.5;
        }
        break;
      }
      case 'boulder': {
        mesh = this.createMountainBoulderObstacle();
        width = 2.1;
        height = 1.2;
        depth = 1.6;
        canJumpOver = true; // Can jump over boulder!
        break;
      }
      case 'roadblock':
      default: {
        mesh = this.createRoadblockGroup();
        width = 2.6;
        height = 1.4;
        depth = 0.8;
        canJumpOver = true;
        break;
      }
    }

    mesh.position.set(x, 0, z);
    this.scene.add(mesh);

    this.obstacles.push({
      mesh,
      type,
      lane,
      x,
      y: 0,
      z,
      width,
      height,
      depth,
      canJumpOver,
      canSlideUnder,
      speedZ,
    });
  }

  // --- Obstacle 3D Mesh Builders ---

  private createTrafficConeGroup(): THREE.Group {
    const group = new THREE.Group();

    // 2 Cones slightly staggered in the lane for visual presence
    [-0.4, 0.4].forEach((dx) => {
      const coneGroup = new THREE.Group();
      coneGroup.position.set(dx, 0, (Math.random() - 0.5) * 0.3);

      // Base plate
      const base = new THREE.Mesh(this.coneBaseGeo, this.coneOrangeMat);
      base.position.y = 0.04;
      base.castShadow = true;
      coneGroup.add(base);

      // Orange cone body
      const cone = new THREE.Mesh(this.coneBodyGeo, this.coneOrangeMat);
      cone.castShadow = true;
      coneGroup.add(cone);

      // Reflective white band
      const band = new THREE.Mesh(this.coneBandGeo, this.coneWhiteMat);
      coneGroup.add(band);

      group.add(coneGroup);
    });

    return group;
  }

  private createLowBarrierGroup(): THREE.Group {
    const group = new THREE.Group();

    // Two A-frame leg stands
    [-1.0, 1.0].forEach((lx) => {
      const leg1 = new THREE.Mesh(this.lowBarrierLeg1Geo, this.coneOrangeMat);
      leg1.position.set(lx, 0.55, 0.2);
      group.add(leg1);

      const leg2 = new THREE.Mesh(this.lowBarrierLeg2Geo, this.coneOrangeMat);
      leg2.position.set(lx, 0.55, -0.2);
      group.add(leg2);
    });

    // Horizontal warning board with yellow/black hazard stripes
    const board = new THREE.Mesh(this.lowBarrierBoardGeo, this.hazardMat);
    board.position.set(0, 0.82, 0);
    board.castShadow = true;
    group.add(board);

    // Blinking amber construction beacon on top
    const beacon = new THREE.Mesh(this.lowBarrierBeaconGeo, this.lowBarrierBeaconMat);
    beacon.position.set(0, 1.1, 0);
    group.add(beacon);

    return group;
  }

  private createHighBarrierGroup(): THREE.Group {
    const group = new THREE.Group();

    // Tall vertical support posts
    [-1.2, 1.2].forEach((lx) => {
      const post = new THREE.Mesh(this.highBarrierPostGeo, this.coneOrangeMat);
      post.castShadow = true;
      group.add(post);
    });

    // High overhead gantry board
    const board = new THREE.Mesh(this.highBarrierBoardGeo, this.hazardMat);
    board.position.set(0, 2.3, 0);
    board.castShadow = true;
    group.add(board);

    // Clearance warning banner
    const sign = new THREE.Mesh(this.highBarrierSignGeo, this.highBarrierSignMat);
    sign.position.set(0, 2.3, 0.06);
    group.add(sign);

    return group;
  }

  private createVehicleGroup(): THREE.Group {
    const group = new THREE.Group();

    // Random pre-allocated body material
    const bodyMat = this.vehicleBodyMats[Math.floor(Math.random() * this.vehicleBodyMats.length)];

    // Lower chassis
    const chassis = new THREE.Mesh(this.vehicleChassisGeo, bodyMat);
    chassis.castShadow = true;
    group.add(chassis);

    // Cabin / roof
    const cabin = new THREE.Mesh(this.vehicleCabinGeo, bodyMat);
    cabin.castShadow = true;
    group.add(cabin);

    // Windshield & windows
    const frontWindshield = new THREE.Mesh(this.vehicleWindshieldGeo, this.vehicleGlassMat);
    frontWindshield.position.set(0, 1.5, 0.82);
    group.add(frontWindshield);

    const backWindshield = new THREE.Mesh(this.vehicleWindshieldGeo, this.vehicleGlassMat);
    backWindshield.position.set(0, 1.5, -1.42);
    backWindshield.rotation.y = Math.PI;
    group.add(backWindshield);

    // 4 Wheels
    [
      { x: -1.02, z: 1.1 },
      { x: 1.02, z: 1.1 },
      { x: -1.02, z: -1.1 },
      { x: 1.02, z: -1.1 },
    ].forEach((pos) => {
      const wheel = new THREE.Mesh(this.vehicleWheelGeo, this.tireMat);
      wheel.position.set(pos.x, 0.35, pos.z);
      group.add(wheel);
    });

    // Glowing taillights & headlights
    [-0.7, 0.7].forEach((tx) => {
      const tail = new THREE.Mesh(this.vehicleTailGeo, this.vehicleTailMat);
      tail.position.set(tx, 0.8, 1.92);
      group.add(tail);
    });

    return group;
  }

  private createRoadblockGroup(): THREE.Group {
    const group = new THREE.Group();

    // Sawhorse barricade
    const board = new THREE.Mesh(this.roadblockBoardGeo, this.hazardMat);
    board.position.set(0, 0.85, 0);
    board.castShadow = true;
    group.add(board);

    [-1.05, 1.05].forEach((lx) => {
      const legA = new THREE.Mesh(this.roadblockLegGeo, this.coneOrangeMat);
      legA.position.set(lx, 0.55, 0.25);
      legA.rotation.x = 0.25;
      group.add(legA);

      const legB = new THREE.Mesh(this.roadblockLegGeo, this.coneOrangeMat);
      legB.position.set(lx, 0.55, -0.25);
      legB.rotation.x = -0.25;
      group.add(legB);
    });

    return group;
  }

  private createMountainBoulderObstacle(): THREE.Group {
    const group = new THREE.Group();

    // Central jumpable boulder
    const rockGeo = new THREE.DodecahedronGeometry(0.85, 1);
    const mainRock = new THREE.Mesh(rockGeo, this.boulderMat);
    mainRock.position.set(0, 0.65, 0);
    mainRock.scale.set(1.2, 0.9, 1.0);
    mainRock.castShadow = true;
    group.add(mainRock);

    // Flanking smaller rock pebbles
    [-0.75, 0.75].forEach((rx) => {
      const smallGeo = new THREE.DodecahedronGeometry(0.4, 0);
      const smallRock = new THREE.Mesh(smallGeo, this.boulderMat);
      smallRock.position.set(rx, 0.25, (Math.random() - 0.5) * 0.4);
      smallRock.castShadow = true;
      group.add(smallRock);
    });

    return group;
  }

  // --- Realistic 24K Minted Gold Coin Generator ---

  private createMintedCoinTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const cx = 256;
      const cy = 256;
      const r = 240; // Outer radius

      ctx.clearRect(0, 0, 512, 512);

      // --- Outer Rim ---
      // Thick dark brown outline for the cartoon look
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#4a2500';
      ctx.fillStyle = '#facc15'; // bright gold/yellow

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner rim circle
      const innerR = 170;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b'; // darker gold/orange inside
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.stroke();

      // Rim segments (the lines cutting across the outer rim)
      const numSegments = 10;
      ctx.lineWidth = 10;
      for (let i = 0; i < numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.stroke();
      }

      // Stylized diagonal shine/reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(cx, cy, innerR - 6, Math.PI * 1.1, Math.PI * 1.7);
      ctx.lineTo(cx, cy - 80);
      ctx.fill();

      // Big Dollar Sign
      ctx.font = '900 180px "Arial Black", Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = '$';
      // Dollar sign shadow/outline
      ctx.lineWidth = 20;
      ctx.strokeStyle = '#4a2500';
      ctx.lineJoin = 'round';
      ctx.strokeText(text, cx, cy + 12); 
      
      // Dollar sign fill
      ctx.fillStyle = '#fbbf24'; 
      ctx.fillText(text, cx, cy + 12);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    return tex;
  }

  // --- Coins Spawning ---

  public spawnCoin(lane: LaneIndex, z: number, y: number = 0.85) {
    const x = GAME_CONSTANTS.LANES[lane + 1];
    const group = new THREE.Group();

    // 1. Coin Cylindrical Core Body (using single shared geometry for performance)
    // Use an array of materials [sideMaterial, topMaterial, bottomMaterial] for the Cylinder
    const coinCore = new THREE.Mesh(this.coinCoreGeo, [
      this.coinRimMaterial,   // Side
      this.coinFaceMaterial,  // Top (Front Face)
      this.coinFaceMaterial   // Bottom (Back Face)
    ]);
    coinCore.castShadow = false; // Disable shadows on coins for massive performance boost
    
    // Slight rotation fix since we want the face to correctly orient towards the camera if needed
    // The cylinder is rotated X by PI/2, so top and bottom faces are on +Z and -Z
    group.add(coinCore);

    group.position.set(x, y, z);
    this.scene.add(group);

    this.coins.push({
      mesh: group,
      lane,
      x,
      y,
      z,
      collected: false,
      baseY: y,
    });
  }

  public spawnCoinLine(lane: LaneIndex, startZ: number, count: number = 4) {
    const step = 2.4;
    for (let i = 0; i < count; i++) {
      this.spawnCoin(lane, startZ - i * step, 0.85);
    }
  }

  public spawnCoinArc(lane: LaneIndex, centerZ: number) {
    // 5 coins forming a high arc over a barrier
    const count = 5;
    const spacing = 2.0;
    const startZ = centerZ + (count - 1) * spacing * 0.5;

    for (let i = 0; i < count; i++) {
      const frac = i / (count - 1);
      const z = startZ - i * spacing;
      // Parabolic jump arc: peaking at y = 2.45m
      const arcHeight = Math.sin(frac * Math.PI) * 1.6 + 0.85;
      this.spawnCoin(lane, z, arcHeight);
    }
  }

  public spawnCoinZigzag(startZ: number) {
    const lanes: LaneIndex[] = [-1, 0, 1, 0, -1];
    lanes.forEach((lane, idx) => {
      this.spawnCoin(lane, startZ - idx * 2.8, 0.85);
    });
  }

  /**
   * Spawn particle burst when coin collected
   */
  public triggerCoinCollectionEffect(x: number, y: number, z: number) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4.0;
      velocities.push(
        new THREE.Vector3(
          Math.cos(angle) * speed,
          1.5 + Math.random() * 4.0,
          Math.sin(angle) * speed
        )
      );
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.25,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Points(geometry, material);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocities,
      life: 0,
      maxLife: 0.45,
    });
  }

  public reset(startPlayerZ: number = 0) {
    for (let c of this.coins) {
      this.scene.remove(c.mesh);
    }
    this.coins = [];

    for (let o of this.obstacles) {
      this.scene.remove(o.mesh);
    }
    this.obstacles = [];

    for (let p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];

    this.spawnZ = startPlayerZ - 30;
  }
}
