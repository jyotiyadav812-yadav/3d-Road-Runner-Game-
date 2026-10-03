import * as THREE from 'three';
import { GAME_CONSTANTS, GameLevelId, GAME_LEVELS } from '../types';

interface AnimatedSpectator {
  head: THREE.Mesh;
  body: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  actionType: 'wave' | 'clap' | 'jump' | 'flag';
  offset: number;
  baseY: number;
}

interface OverheadGarland {
  group: THREE.Group;
  flags: THREE.Mesh[];
}

interface WorldChunk {
  group: THREE.Group;
  spectators: AnimatedSpectator[];
  garlands: OverheadGarland[];
  zPos: number;
  levelId: GameLevelId;
}

export class WorldManager {
  public scene: THREE.Scene;
  public currentLevel: GameLevelId = 1;
  private chunks: WorldChunk[] = [];
  private chunkLength: number = 60;
  private chunkCount: number = 6;
  
  // Shared materials
  private asphaltMat: THREE.MeshStandardMaterial;
  private curbMatWhite: THREE.MeshStandardMaterial;
  private curbMatRed: THREE.MeshStandardMaterial;
  private sidewalkMat: THREE.MeshStandardMaterial;
  private grassMat: THREE.MeshStandardMaterial;
  private treeTrunkMat: THREE.MeshStandardMaterial;
  private foliageMat1: THREE.MeshStandardMaterial;
  private foliageMat2: THREE.MeshStandardMaterial;
  private pineTrunkMat: THREE.MeshStandardMaterial;
  private pineFoliageMat: THREE.MeshStandardMaterial;
  private lampPostMat: THREE.MeshStandardMaterial;
  private lampLightMat: THREE.MeshBasicMaterial;
  private barricadeMat: THREE.MeshStandardMaterial;
  private guardrailMat: THREE.MeshStandardMaterial;
  private concreteBarrierMat: THREE.MeshStandardMaterial;
  private rockMat: THREE.MeshStandardMaterial;
  private woodRailMat: THREE.MeshStandardMaterial;
  private hazardBeaconMat: THREE.MeshBasicMaterial;

  // Textures
  private bannerTextures: THREE.CanvasTexture[] = [];
  private highwaySignTextures: THREE.CanvasTexture[] = [];
  private nightBillboardTextures: THREE.CanvasTexture[] = [];
  private trafficSignTextures: THREE.CanvasTexture[] = [];
  private nightWindowTex: THREE.CanvasTexture | null = null;
  private dayWindowTex: THREE.CanvasTexture | null = null;

  // Crowd Assets
  private crowdSkinColors = [0xfcd0a1, 0xf5b281, 0xd48956, 0x8d5524, 0xffdfc4];
  private crowdShirtColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x06b6d4, 0xfacc15];
  private specSkinMats: THREE.MeshBasicMaterial[] = [];
  private specShirtMats: THREE.MeshBasicMaterial[] = [];
  private specPantsMat: THREE.MeshBasicMaterial;
  private specLegsGeo: THREE.BoxGeometry;
  private specBodyGeo: THREE.BoxGeometry;
  private specHeadGeo: THREE.SphereGeometry;
  private specArmGeo: THREE.BoxGeometry;
  private specCapGeo: THREE.CylinderGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Materials
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.75,
      metalness: 0.05,
    });

    this.curbMatWhite = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
    this.curbMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });

    this.sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0xc8d0d8,
      roughness: 0.75,
    });

    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.9,
    });

    this.treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    this.foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });
    this.foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });

    this.pineTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
    this.pineFoliageMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 });

    this.lampPostMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 });
    this.lampLightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

    this.barricadeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.4 });
    this.guardrailMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.25 });
    this.concreteBarrierMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95 });
    this.woodRailMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    this.hazardBeaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Crowd Geometries & Materials
    this.crowdSkinColors.forEach(c => this.specSkinMats.push(new THREE.MeshBasicMaterial({ color: c })));
    this.crowdShirtColors.forEach(c => this.specShirtMats.push(new THREE.MeshBasicMaterial({ color: c })));
    this.specPantsMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    
    this.specCapGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10);
    this.specLegsGeo = new THREE.BoxGeometry(0.4, 0.7, 0.28);
    this.specBodyGeo = new THREE.BoxGeometry(0.48, 0.55, 0.32);
    this.specHeadGeo = new THREE.SphereGeometry(0.2, 8, 8);
    this.specArmGeo = new THREE.BoxGeometry(0.12, 0.5, 0.12);
    this.specArmGeo.translate(0, 0.22, 0);

    this.initTextures();
    this.initChunks();
  }

  private initTextures() {
    // 1. City Festival Banners
    const banners = [
      { text: 'GO GIRL! 🏃‍♀️', bg: '#ef4444', fg: '#ffffff' },
      { text: 'CHAMPION! ⭐', bg: '#3b82f6', fg: '#ffffff' },
      { text: 'RUN FAST! 🔥', bg: '#f59e0b', fg: '#0f172a' },
      { text: 'FESTIVAL 2026 🏁', bg: '#10b981', fg: '#ffffff' },
      { text: 'YOU CAN DO IT! ❤️', bg: '#ec4899', fg: '#ffffff' },
      { text: 'SUPER RUNNER! ⚡', bg: '#8b5cf6', fg: '#ffffff' },
    ];

    banners.forEach((b) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = b.bg;
        ctx.fillRect(0, 0, 512, 128);
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(6, 6, 500, 116);
        ctx.fillStyle = b.fg;
        ctx.font = '900 52px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.text, 256, 64);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.bannerTextures.push(tex);
    });

    // 2. Highway Interstate Signs
    const highwaySigns = [
      { top: 'INTERSTATE 95 NORTH', sub: 'EXPRESSWAY SPEEDWAY 1 MILE' },
      { top: 'SPEED LIMIT 65', sub: 'RADAR ENFORCED • STAY ALERT' },
      { top: 'HIGHWAY METRO CORRIDOR', sub: 'EXIT 42 • DOWNTOWN VIA 2 MILES' },
    ];

    highwaySigns.forEach((hs) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#047857'; // Interstate Green
        ctx.fillRect(0, 0, 512, 160);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(6, 6, 500, 148);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 34px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hs.top, 256, 65);
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(hs.sub, 256, 115);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.highwaySignTextures.push(tex);
    });

    // 3. Night City Neon Billboards
    const nightSigns = [
      { text: 'CYBER CITY 2026', glow: '#06b6d4' },
      { text: 'NEON RUNNER ★', glow: '#ec4899' },
      { text: 'MIDNIGHT SPRINT', glow: '#a855f7' },
    ];

    nightSigns.forEach((ns) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#090514';
        ctx.fillRect(0, 0, 512, 140);
        ctx.lineWidth = 8;
        ctx.strokeStyle = ns.glow;
        ctx.strokeRect(6, 6, 500, 128);
        ctx.fillStyle = ns.glow;
        ctx.shadowColor = ns.glow;
        ctx.shadowBlur = 15;
        ctx.font = '900 44px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ns.text, 256, 70);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.nightBillboardTextures.push(tex);
    });

    // 4. Extreme Traffic LED Matrix Signs
    const trafficSigns = [
      { l1: '★ HEAVY TRAFFIC ZONE ★', l2: 'REDUCE SPEED • STAY IN LANE' },
      { l1: 'CONGESTION AHEAD', l2: 'EXPECT EXTENDED DELAYS' },
      { l1: 'ACCIDENT DETOUR AHEAD', l2: 'MERGE SAFELY • PROCEED SLOWLY' },
    ];

    trafficSigns.forEach((ts) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 512, 160);
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#f59e0b';
        ctx.strokeRect(6, 6, 500, 148);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 32px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ts.l1, 256, 62);
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.fillStyle = '#f97316';
        ctx.fillText(ts.l2, 256, 112);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.trafficSignTextures.push(tex);
    });

    // Night Windows Texture
    const nCanvas = document.createElement('canvas');
    nCanvas.width = 128;
    nCanvas.height = 256;
    const nCtx = nCanvas.getContext('2d');
    if (nCtx) {
      nCtx.fillStyle = '#090d16';
      nCtx.fillRect(0, 0, 128, 256);
      const glowColors = ['#06b6d4', '#ec4899', '#fef08a', '#818cf8'];
      for (let y = 10; y < 250; y += 28) {
        for (let x = 10; x < 120; x += 24) {
          nCtx.fillStyle = Math.random() > 0.3 ? glowColors[Math.floor(Math.random() * glowColors.length)] : '#1e293b';
          nCtx.fillRect(x, y, 16, 20);
        }
      }
    }
    this.nightWindowTex = new THREE.CanvasTexture(nCanvas);
    this.nightWindowTex.wrapS = THREE.RepeatWrapping;
    this.nightWindowTex.wrapT = THREE.RepeatWrapping;
  }

  public setLevel(levelId: GameLevelId) {
    this.currentLevel = levelId;
    const levelInfo = GAME_LEVELS[levelId];
    if (levelInfo) {
      this.asphaltMat.color.setHex(levelInfo.asphaltColor);
      this.grassMat.color.setHex(levelInfo.groundColor);
      this.sidewalkMat.color.setHex(levelInfo.sidewalkColor);
      this.curbMatRed.color.setHex(levelInfo.curbColor1);
      this.curbMatWhite.color.setHex(levelInfo.curbColor2);

      if (levelId === 3) {
        this.lampLightMat.color.setHex(0x06b6d4); // Neon Cyan lamps
      } else if (levelId === 5) {
        this.lampLightMat.color.setHex(0xf97316); // Amber hazard lamps
      } else {
        this.lampLightMat.color.setHex(0xfffbeb); // Warm bright daylight
      }
    }
  }

  private initChunks() {
    for (let i = 0; i < this.chunkCount; i++) {
      const zPos = -i * this.chunkLength + 20;
      const chunk = this.createChunk(zPos, i, this.currentLevel);
      this.chunks.push(chunk);
      this.scene.add(chunk.group);
    }
  }

  public rebuildAllChunks(startPlayerZ: number = 0, levelId: GameLevelId = this.currentLevel) {
    this.setLevel(levelId);
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      this.scene.remove(chunk.group);
      while (chunk.group.children.length > 0) {
        chunk.group.remove(chunk.group.children[0]);
      }
      const zPos = startPlayerZ - i * this.chunkLength + 20;
      const newChunk = this.createChunk(zPos, i, levelId);
      this.chunks[i] = newChunk;
      this.scene.add(newChunk.group);
    }
  }

  private createChunk(zPos: number, index: number, levelId: GameLevelId): WorldChunk {
    const group = new THREE.Group();
    group.position.z = zPos;
    const spectators: AnimatedSpectator[] = [];
    const garlands: OverheadGarland[] = [];

    const halfRoad = GAME_CONSTANTS.ROAD_WIDTH / 2;
    const sidewalkWidth = 6.0;
    const roadLength = this.chunkLength;

    // 1. Asphalt Road Plane
    const roadGeo = new THREE.PlaneGeometry(GAME_CONSTANTS.ROAD_WIDTH, roadLength);
    const roadMesh = new THREE.Mesh(roadGeo, this.asphaltMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.receiveShadow = true;
    roadMesh.frustumCulled = false;
    group.add(roadMesh);
    
    // Roadside Ground Planes
    const groundGeo = new THREE.PlaneGeometry(90, roadLength);
    const leftGround = new THREE.Mesh(groundGeo, this.grassMat);
    leftGround.rotation.x = -Math.PI / 2;
    leftGround.position.set(-45 - halfRoad - sidewalkWidth, -0.05, 0);
    leftGround.receiveShadow = true;
    leftGround.frustumCulled = false;
    group.add(leftGround);

    const rightGround = new THREE.Mesh(groundGeo, this.grassMat);
    rightGround.rotation.x = -Math.PI / 2;
    rightGround.position.set(45 + halfRoad + sidewalkWidth, -0.05, 0);
    rightGround.receiveShadow = true;
    rightGround.frustumCulled = false;
    group.add(rightGround);

    // 2. Road Markings
    const dashLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const dashLength = 3.2;
    const dashGap = 3.2;
    const dashCount = Math.floor(roadLength / (dashLength + dashGap));

    [-1.6, 1.6].forEach((xLine) => {
      for (let d = 0; d < dashCount; d++) {
        const dashGeo = new THREE.PlaneGeometry(0.22, dashLength);
        const dashMesh = new THREE.Mesh(dashGeo, dashLineMat);
        dashMesh.rotation.x = -Math.PI / 2;
        dashMesh.position.set(xLine, 0.015, -roadLength / 2 + d * (dashLength + dashGap) + dashLength / 2);
        group.add(dashMesh);
      }
    });

    // Solid shoulder lines (yellow)
    const shoulderColor = levelId === 3 ? 0x06b6d4 : 0xfacc15;
    const yellowLineMat = new THREE.MeshBasicMaterial({ color: shoulderColor });
    [-halfRoad + 0.35, halfRoad - 0.35].forEach((xYel) => {
      const yelGeo = new THREE.PlaneGeometry(0.24, roadLength);
      const yelMesh = new THREE.Mesh(yelGeo, yellowLineMat);
      yelMesh.rotation.x = -Math.PI / 2;
      yelMesh.position.set(xYel, 0.018, 0);
      group.add(yelMesh);
    });

    // 3. Curbs
    const curbSegments = Math.floor(roadLength / 2.0);
    for (let c = 0; c < curbSegments; c++) {
      const cZ = -roadLength / 2 + c * 2.0 + 1.0;
      const cMat = c % 2 === 0 ? this.curbMatRed : this.curbMatWhite;

      const curbGeo = new THREE.BoxGeometry(0.35, 0.22, 1.98);
      const leftCurb = new THREE.Mesh(curbGeo, cMat);
      leftCurb.position.set(-halfRoad - 0.175, 0.11, cZ);
      leftCurb.receiveShadow = true;
      group.add(leftCurb);

      const rightCurb = new THREE.Mesh(curbGeo, cMat);
      rightCurb.position.set(halfRoad + 0.175, 0.11, cZ);
      rightCurb.receiveShadow = true;
      group.add(rightCurb);
    }

    // 4. Sidewalks / Shoulders
    const sidewalkGeo = new THREE.BoxGeometry(sidewalkWidth, 0.25, roadLength);
    const leftSidewalk = new THREE.Mesh(sidewalkGeo, this.sidewalkMat);
    leftSidewalk.position.set(-halfRoad - sidewalkWidth / 2 - 0.35, 0.12, 0);
    leftSidewalk.receiveShadow = true;
    leftSidewalk.frustumCulled = false;
    group.add(leftSidewalk);

    const rightSidewalk = new THREE.Mesh(sidewalkGeo, this.sidewalkMat);
    rightSidewalk.position.set(halfRoad + sidewalkWidth / 2 + 0.35, 0.12, 0);
    rightSidewalk.receiveShadow = true;
    rightSidewalk.frustumCulled = false;
    group.add(rightSidewalk);

    // 5. Theme-specific scenery populations
    switch (levelId) {
      case 2: // Highway
        this.populateHighwayScenery(group, index, roadLength, halfRoad);
        break;
      case 3: // Night City
        this.populateNightCityScenery(group, index, roadLength, halfRoad, spectators);
        break;
      case 4: // Mountain Road
        this.populateMountainScenery(group, index, roadLength, halfRoad);
        break;
      case 5: // Extreme Traffic
        this.populateTrafficScenery(group, index, roadLength, halfRoad);
        break;
      case 1: // City Road
      default:
        this.populateCityScenery(group, index, roadLength, halfRoad, spectators, garlands);
        break;
    }

    return {
      group,
      spectators,
      garlands,
      zPos,
      levelId,
    };
  }

  // --- Scenery Builder: Level 1 City Road ---
  private populateCityScenery(
    group: THREE.Group,
    index: number,
    roadLength: number,
    halfRoad: number,
    spectators: AnimatedSpectator[],
    garlands: OverheadGarland[]
  ) {
    // Barricades & Banners
    const barricadeZStep = 10.0;
    const barricadeCount = Math.floor(roadLength / barricadeZStep);
    for (let b = 0; b < barricadeCount; b++) {
      const bZ = -roadLength / 2 + b * barricadeZStep + barricadeZStep / 2;
      const bannerTex = this.bannerTextures[(index * barricadeCount + b) % this.bannerTextures.length];
      const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.6 });

      const leftBarricade = this.createBarricadeWithBanner(bannerMat);
      leftBarricade.position.set(-halfRoad - 0.55, 0.25, bZ);
      leftBarricade.rotation.y = Math.PI / 2;
      group.add(leftBarricade);

      const rightBarricade = this.createBarricadeWithBanner(bannerMat);
      rightBarricade.position.set(halfRoad + 0.55, 0.25, bZ);
      rightBarricade.rotation.y = -Math.PI / 2;
      group.add(rightBarricade);
    }

    // Crowds
    const crowdZSpacing = 2.4;
    const crowdCount = Math.floor(roadLength / crowdZSpacing);
    for (let c = 0; c < crowdCount; c++) {
      const cz = -roadLength / 2 + c * crowdZSpacing + (Math.random() - 0.5) * 0.6;
      const leftRows = 2 + (c % 2);
      for (let r = 0; r < leftRows; r++) {
        const cx = -halfRoad - 1.4 - r * 1.1 - (Math.random() * 0.3);
        const cy = 0.25 + r * 0.22;
        const spec = this.createSpectator(cx, cy, cz, Math.PI / 2 + (Math.random() - 0.5) * 0.3);
        group.add(spec.group);
        spectators.push(spec.animated);
      }
      const rightRows = 2 + ((c + 1) % 2);
      for (let r = 0; r < rightRows; r++) {
        const cx = halfRoad + 1.4 + r * 1.1 + (Math.random() * 0.3);
        const cy = 0.25 + r * 0.22;
        const spec = this.createSpectator(cx, cy, cz, -Math.PI / 2 + (Math.random() - 0.5) * 0.3);
        group.add(spec.group);
        spectators.push(spec.animated);
      }
    }

    // Streetlamps, Trees & Garlands
    const itemZStep = 15.0;
    const itemCount = Math.floor(roadLength / itemZStep);
    for (let it = 0; it < itemCount; it++) {
      const itZ = -roadLength / 2 + it * itemZStep + itemZStep / 2;
      const leftLamp = this.createStreetLamp(true);
      leftLamp.position.set(-halfRoad - 2.8, 0.25, itZ);
      group.add(leftLamp);

      const rightLamp = this.createStreetLamp(false);
      rightLamp.position.set(halfRoad + 2.8, 0.25, itZ);
      group.add(rightLamp);

      const tree1 = this.createTree();
      tree1.position.set(-halfRoad - 4.5, 0.25, itZ + 4);
      group.add(tree1);

      const tree2 = this.createTree();
      tree2.position.set(halfRoad + 4.5, 0.25, itZ + 4);
      group.add(tree2);

      const garland = this.createFestivalGarland(itZ);
      group.add(garland.group);
      garlands.push(garland);

      const bldgLeft = this.createBuilding(-halfRoad - 14, itZ, 14 + Math.random() * 16, false);
      group.add(bldgLeft);
      const bldgRight = this.createBuilding(halfRoad + 14, itZ, 14 + Math.random() * 16, false);
      group.add(bldgRight);
    }
  }

  // --- Scenery Builder: Level 2 Highway ---
  private populateHighwayScenery(
    group: THREE.Group,
    index: number,
    roadLength: number,
    halfRoad: number
  ) {
    // Continuous Corrugated Steel Guardrail along both sides
    const guardrailGeo = new THREE.BoxGeometry(0.12, 0.45, roadLength);
    const leftGuard = new THREE.Mesh(guardrailGeo, this.guardrailMat);
    leftGuard.position.set(-halfRoad - 0.5, 0.65, 0);
    group.add(leftGuard);

    const rightGuard = new THREE.Mesh(guardrailGeo, this.guardrailMat);
    rightGuard.position.set(halfRoad + 0.5, 0.65, 0);
    group.add(rightGuard);

    // Support I-beam posts every 4m
    const postGeo = new THREE.BoxGeometry(0.1, 0.75, 0.1);
    for (let p = 0; p < roadLength; p += 4) {
      const pZ = -roadLength / 2 + p + 2;
      const leftPost = new THREE.Mesh(postGeo, this.guardrailMat);
      leftPost.position.set(-halfRoad - 0.55, 0.38, pZ);
      group.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, this.guardrailMat);
      rightPost.position.set(halfRoad + 0.55, 0.38, pZ);
      group.add(rightPost);
    }

    // Tall Highway Luminaire Poles
    for (let lp = 0; lp < 2; lp++) {
      const lpZ = -roadLength / 2 + lp * 30 + 15;
      const leftMast = this.createHighwayLightMast(true);
      leftMast.position.set(-halfRoad - 3.5, 0, lpZ);
      group.add(leftMast);

      const rightMast = this.createHighwayLightMast(false);
      rightMast.position.set(halfRoad + 3.5, 0, lpZ);
      group.add(rightMast);
    }

    // Overhead Interstate Exit Sign Gantry (every 2nd chunk)
    if (index % 2 === 0) {
      const signTex = this.highwaySignTextures[index % this.highwaySignTextures.length];
      const gantry = this.createOverheadGantry(signTex, 0);
      group.add(gantry);
    }

    // Wind turbines & highway billboards in distance
    const turbine = this.createWindTurbine();
    turbine.position.set(-halfRoad - 28, 0, (Math.random() - 0.5) * 20);
    group.add(turbine);
  }

  // --- Scenery Builder: Level 3 Night City ---
  private populateNightCityScenery(
    group: THREE.Group,
    index: number,
    roadLength: number,
    halfRoad: number,
    spectators: AnimatedSpectator[]
  ) {
    // Neon illuminated barricades
    const barricadeZStep = 12.0;
    const count = Math.floor(roadLength / barricadeZStep);
    for (let b = 0; b < count; b++) {
      const bZ = -roadLength / 2 + b * barricadeZStep + barricadeZStep / 2;
      const signTex = this.nightBillboardTextures[(index + b) % this.nightBillboardTextures.length];
      const bMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.3, emissive: 0x1e1b4b });

      const lb = this.createBarricadeWithBanner(bMat);
      lb.position.set(-halfRoad - 0.55, 0.25, bZ);
      lb.rotation.y = Math.PI / 2;
      group.add(lb);

      const rb = this.createBarricadeWithBanner(bMat);
      rb.position.set(halfRoad + 0.55, 0.25, bZ);
      rb.rotation.y = -Math.PI / 2;
      group.add(rb);
    }

    // Neon streetlamps and soaring glowing skyscrapers
    for (let s = 0; s < 3; s++) {
      const sZ = -roadLength / 2 + s * 20 + 10;
      const leftLamp = this.createStreetLamp(true);
      leftLamp.position.set(-halfRoad - 2.5, 0.25, sZ);
      group.add(leftLamp);

      const rightLamp = this.createStreetLamp(false);
      rightLamp.position.set(halfRoad + 2.5, 0.25, sZ);
      group.add(rightLamp);

      // Cyberpunk Skyscraper Towers
      const towerL = this.createBuilding(-halfRoad - 16, sZ, 28 + Math.random() * 25, true);
      group.add(towerL);
      const towerR = this.createBuilding(halfRoad + 16, sZ, 28 + Math.random() * 25, true);
      group.add(towerR);
    }

    // Overhead Neon Cyber Arch (every 2nd chunk)
    if (index % 2 === 1) {
      const signTex = this.nightBillboardTextures[index % this.nightBillboardTextures.length];
      const gantry = this.createOverheadGantry(signTex, 0);
      group.add(gantry);
    }
  }

  // --- Scenery Builder: Level 4 Mountain Road ---
  private populateMountainScenery(
    group: THREE.Group,
    index: number,
    roadLength: number,
    halfRoad: number
  ) {
    // Rustic Timber and Stone guardrails
    const railGeo = new THREE.BoxGeometry(0.18, 0.35, roadLength);
    const leftRail = new THREE.Mesh(railGeo, this.woodRailMat);
    leftRail.position.set(-halfRoad - 0.5, 0.65, 0);
    group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, this.woodRailMat);
    rightRail.position.set(halfRoad + 0.5, 0.65, 0);
    group.add(rightRail);

    // Stone posts
    const stonePostGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    for (let p = 0; p < roadLength; p += 6) {
      const pZ = -roadLength / 2 + p + 3;
      const lp = new THREE.Mesh(stonePostGeo, this.rockMat);
      lp.position.set(-halfRoad - 0.5, 0.4, pZ);
      group.add(lp);

      const rp = new THREE.Mesh(stonePostGeo, this.rockMat);
      rp.position.set(halfRoad + 0.5, 0.4, pZ);
      group.add(rp);
    }

    // Rocky Cliffs, Boulders and Pine Conifers along road
    const boulderCount = 5;
    for (let b = 0; b < boulderCount; b++) {
      const bZ = -roadLength / 2 + (b / boulderCount) * roadLength + (Math.random() - 0.5) * 4;
      
      // Giant roadside boulders
      const boulder1 = this.createMountainBoulder(2.2 + Math.random() * 2.0);
      boulder1.position.set(-halfRoad - 4.5 - Math.random() * 2, 1.2, bZ);
      group.add(boulder1);

      const boulder2 = this.createMountainBoulder(2.2 + Math.random() * 2.0);
      boulder2.position.set(halfRoad + 4.5 + Math.random() * 2, 1.2, bZ);
      group.add(boulder2);

      // Pine Trees
      const pine1 = this.createPineTree();
      pine1.position.set(-halfRoad - 8.5 - Math.random() * 3, 0, bZ + 2);
      group.add(pine1);

      const pine2 = this.createPineTree();
      pine2.position.set(halfRoad + 8.5 + Math.random() * 3, 0, bZ + 2);
      group.add(pine2);
    }

    // Distant mountain peaks
    const mountainLeft = this.createMountainPeak(45 + Math.random() * 25);
    mountainLeft.position.set(-halfRoad - 35, 0, 0);
    group.add(mountainLeft);

    const mountainRight = this.createMountainPeak(45 + Math.random() * 25);
    mountainRight.position.set(halfRoad + 35, 0, 0);
    group.add(mountainRight);
  }

  // --- Scenery Builder: Level 5 Extreme Traffic ---
  private populateTrafficScenery(
    group: THREE.Group,
    index: number,
    roadLength: number,
    halfRoad: number
  ) {
    // Concrete Jersey Barrier walls along both sides
    const barrierSegments = Math.floor(roadLength / 3.0);
    for (let b = 0; b < barrierSegments; b++) {
      const bZ = -roadLength / 2 + b * 3.0 + 1.5;
      
      const leftJ = this.createJerseyBarrier();
      leftJ.position.set(-halfRoad - 0.55, 0, bZ);
      group.add(leftJ);

      const rightJ = this.createJerseyBarrier();
      rightJ.position.set(halfRoad + 0.55, 0, bZ);
      group.add(rightJ);

      // Blinking hazard beacon on every 3rd barrier
      if (b % 3 === 0) {
        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8), this.hazardBeaconMat);
        beacon.position.set(-halfRoad - 0.55, 0.95, bZ);
        group.add(beacon);

        const beaconR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 8), this.hazardBeaconMat);
        beaconR.position.set(halfRoad + 0.55, 0.95, bZ);
        group.add(beaconR);
      }
    }

    // Overhead Variable LED Traffic Warning Sign (every 2nd chunk)
    if (index % 2 === 0) {
      const signTex = this.trafficSignTextures[index % this.trafficSignTextures.length];
      const gantry = this.createOverheadGantry(signTex, 0);
      group.add(gantry);
    }

    // Orange traffic barrels along shoulder
    for (let tb = 0; tb < 6; tb++) {
      const tbZ = -roadLength / 2 + tb * 10 + 5;
      const barrelL = this.createTrafficBarrel();
      barrelL.position.set(-halfRoad - 2.2, 0, tbZ);
      group.add(barrelL);

      const barrelR = this.createTrafficBarrel();
      barrelR.position.set(halfRoad + 2.2, 0, tbZ);
      group.add(barrelR);
    }

    // Distant rush hour city towers in orange sunset smog
    const b1 = this.createBuilding(-halfRoad - 18, 0, 20 + Math.random() * 15, false);
    group.add(b1);
    const b2 = this.createBuilding(halfRoad + 18, 0, 20 + Math.random() * 15, false);
    group.add(b2);
  }

  // --- Helper 3D Objects ---

  private createBarricadeWithBanner(bannerMat: THREE.MeshStandardMaterial): THREE.Group {
    const group = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(9.6, 0.08, 0.08);
    const topBar = new THREE.Mesh(frameGeo, this.barricadeMat);
    topBar.position.y = 1.0;
    group.add(topBar);

    const bottomBar = new THREE.Mesh(frameGeo, this.barricadeMat);
    bottomBar.position.y = 0.2;
    group.add(bottomBar);

    [-4.6, -1.5, 1.5, 4.6].forEach((lx) => {
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8);
      const leg = new THREE.Mesh(legGeo, this.barricadeMat);
      leg.position.set(lx, 0.55, 0);
      group.add(leg);
    });

    const bannerGeo = new THREE.PlaneGeometry(9.2, 0.82);
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 0.6, 0.02);
    group.add(banner);

    return group;
  }

  private createSpectator(x: number, y: number, z: number, rotationY: number): { group: THREE.Group; animated: AnimatedSpectator } {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    const skinMat = this.specSkinMats[Math.floor(Math.random() * this.specSkinMats.length)];
    const shirtMat = this.specShirtMats[Math.floor(Math.random() * this.specShirtMats.length)];
    const pantsMat = this.specPantsMat;

    const legs = new THREE.Mesh(this.specLegsGeo, pantsMat);
    legs.position.y = 0.35;
    group.add(legs);

    const body = new THREE.Mesh(this.specBodyGeo, shirtMat);
    body.position.y = 0.95;
    group.add(body);

    const head = new THREE.Mesh(this.specHeadGeo, skinMat);
    head.position.y = 1.45;
    group.add(head);

    if (Math.random() > 0.4) {
      const cap = new THREE.Mesh(this.specCapGeo, shirtMat);
      cap.position.set(0, 1.58, 0);
      group.add(cap);
    }

    const leftArm = new THREE.Mesh(this.specArmGeo, shirtMat);
    leftArm.position.set(-0.3, 1.15, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(this.specArmGeo, shirtMat);
    rightArm.position.set(0.3, 1.15, 0);
    group.add(rightArm);

    const actions: ('wave' | 'clap' | 'jump' | 'flag')[] = ['wave', 'clap', 'jump', 'flag'];
    const actionType = actions[Math.floor(Math.random() * actions.length)];

    if (actionType === 'flag') {
      const flagStickGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
      flagStickGeo.translate(0, 0.35, 0);
      const flagStick = new THREE.Mesh(flagStickGeo, this.barricadeMat);
      rightArm.add(flagStick);

      const flagClothGeo = new THREE.PlaneGeometry(0.35, 0.25);
      const flagClothMat = new THREE.MeshBasicMaterial({ color: shirtMat.color, side: THREE.DoubleSide });
      const flagCloth = new THREE.Mesh(flagClothGeo, flagClothMat);
      flagCloth.position.set(0.18, 0.6, 0);
      flagStick.add(flagCloth);
    }

    const animated: AnimatedSpectator = {
      head,
      body,
      leftArm,
      rightArm,
      actionType,
      offset: Math.random() * Math.PI * 2,
      baseY: y,
    };

    return { group, animated };
  }

  private createStreetLamp(isLeft: boolean): THREE.Group {
    const group = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 5.8, 8);
    poleGeo.translate(0, 2.9, 0);
    const pole = new THREE.Mesh(poleGeo, this.lampPostMat);
    group.add(pole);

    const armGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8);
    armGeo.rotateZ(isLeft ? -Math.PI / 4 : Math.PI / 4);
    armGeo.translate(isLeft ? 0.9 : -0.9, 5.8, 0);
    const arm = new THREE.Mesh(armGeo, this.lampPostMat);
    group.add(arm);

    const lampHeadGeo = new THREE.ConeGeometry(0.35, 0.4, 10);
    lampHeadGeo.rotateX(Math.PI);
    const lampHead = new THREE.Mesh(lampHeadGeo, this.lampPostMat);
    lampHead.position.set(isLeft ? 1.7 : -1.7, 5.2, 0);
    group.add(lampHead);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), this.lampLightMat);
    bulb.position.set(isLeft ? 1.7 : -1.7, 5.05, 0);
    group.add(bulb);

    return group;
  }

  private createHighwayLightMast(isLeft: boolean): THREE.Group {
    const group = new THREE.Group();
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.28, 9.5, 8), this.lampPostMat);
    mast.position.y = 4.75;
    group.add(mast);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), this.lampPostMat);
    arm.rotateZ(isLeft ? -Math.PI / 3 : Math.PI / 3);
    arm.position.set(isLeft ? 1.2 : -1.2, 9.2, 0);
    group.add(arm);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.4), this.lampPostMat);
    head.position.set(isLeft ? 2.4 : -2.4, 9.6, 0);
    group.add(head);

    const light = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), this.lampLightMat);
    light.rotation.x = Math.PI / 2;
    light.position.set(isLeft ? 2.4 : -2.4, 9.45, 0);
    group.add(light);

    return group;
  }

  private createOverheadGantry(signTex: THREE.CanvasTexture, zOffset: number): THREE.Group {
    const group = new THREE.Group();
    group.position.z = zOffset;
    const halfW = GAME_CONSTANTS.ROAD_WIDTH / 2 + 1.2;

    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 7.8, 10), this.lampPostMat);
    postL.position.set(-halfW, 3.9, 0);
    group.add(postL);

    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 7.8, 10), this.lampPostMat);
    postR.position.set(halfW, 3.9, 0);
    group.add(postR);

    // Cross Truss
    const truss = new THREE.Mesh(new THREE.BoxGeometry(halfW * 2 + 1.0, 0.6, 0.6), this.lampPostMat);
    truss.position.set(0, 7.2, 0);
    group.add(truss);

    // Large Sign Board
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(halfW * 1.5, 2.2),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signBoard.position.set(0, 6.2, 0.35);
    group.add(signBoard);

    return group;
  }

  private createFestivalGarland(zPos: number): OverheadGarland {
    const group = new THREE.Group();
    group.position.z = zPos;
    const spanWidth = GAME_CONSTANTS.ROAD_WIDTH + 4.0;
    const cableY = 6.2;
    const flags: THREE.Mesh[] = [];
    const flagColors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xec4899, 0x8b5cf6];

    for (let f = 0; f < 18; f++) {
      const frac = f / 17;
      const fx = -spanWidth / 2 + frac * spanWidth;
      const sag = Math.sin(frac * Math.PI) * 0.9;
      const fy = cableY - sag;

      const flagGeo = new THREE.BufferGeometry();
      const hw = 0.28;
      const hl = 0.45;
      const vertices = new Float32Array([
        -hw, 0, 0,
         hw, 0, 0,
          0, -hl, 0,
      ]);
      flagGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      flagGeo.computeVertexNormals();

      const flagMat = new THREE.MeshBasicMaterial({ color: flagColors[f % flagColors.length], side: THREE.DoubleSide });
      const flagMesh = new THREE.Mesh(flagGeo, flagMat);
      flagMesh.position.set(fx, fy, 0);
      group.add(flagMesh);
      flags.push(flagMesh);
    }

    return { group, flags };
  }

  private createTree(): THREE.Group {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 3.5, 8);
    trunkGeo.translate(0, 1.75, 0);
    const trunk = new THREE.Mesh(trunkGeo, this.treeTrunkMat);
    group.add(trunk);

    for (let t = 0; t < 3; t++) {
      const rad = 1.6 - t * 0.35;
      const folMesh = new THREE.Mesh(new THREE.ConeGeometry(rad, 2.2, 8), t % 2 === 0 ? this.foliageMat1 : this.foliageMat2);
      folMesh.position.y = 3.2 + t * 1.3;
      group.add(folMesh);
    }
    return group;
  }

  private createPineTree(): THREE.Group {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 4.5, 8), this.pineTrunkMat);
    trunk.position.y = 2.25;
    group.add(trunk);

    // Conical pine needle tiers
    for (let t = 0; t < 4; t++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.0 - t * 0.35, 2.4, 8), this.pineFoliageMat);
      cone.position.y = 3.2 + t * 1.4;
      group.add(cone);
    }
    return group;
  }

  private createMountainBoulder(scale: number): THREE.Mesh {
    const geo = new THREE.DodecahedronGeometry(scale, 1);
    const mesh = new THREE.Mesh(geo, this.rockMat);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    return mesh;
  }

  private createMountainPeak(height: number): THREE.Mesh {
    const geo = new THREE.ConeGeometry(height * 0.7, height, 6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    return mesh;
  }

  private createWindTurbine(): THREE.Group {
    const group = new THREE.Group();
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 24, 8), this.guardrailMat);
    tower.position.y = 12;
    group.add(tower);

    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 2.6), this.guardrailMat);
    nacelle.position.set(0, 24, 0);
    group.add(nacelle);

    return group;
  }

  private createJerseyBarrier(): THREE.Group {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 2.95), this.concreteBarrierMat);
    base.position.y = 0.175;
    group.add(base);

    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 2.95), this.concreteBarrierMat);
    upper.position.y = 0.6;
    group.add(upper);

    return group;
  }

  private createTrafficBarrel(): THREE.Group {
    const group = new THREE.Group();
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.1, 10), barrelMat);
    barrel.position.y = 0.55;
    group.add(barrel);

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 10), stripeMat);
    stripe.position.y = 0.65;
    group.add(stripe);

    return group;
  }

  private createBuilding(x: number, z: number, height: number, isNight: boolean): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const bldgWidth = 10 + Math.random() * 4;
    const bldgDepth = 12;
    const bColor = isNight ? 0x090d16 : 0xe2e8f0;
    const bldgMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.7 });

    const bldgGeo = new THREE.BoxGeometry(bldgWidth, height, bldgDepth);
    bldgGeo.translate(0, height / 2, 0);
    const bldg = new THREE.Mesh(bldgGeo, bldgMat);
    group.add(bldg);

    if (isNight && this.nightWindowTex) {
      const winMat = new THREE.MeshBasicMaterial({ map: this.nightWindowTex });
      const winPlane = new THREE.PlaneGeometry(bldgWidth * 0.9, height * 0.85);
      const winMesh = new THREE.Mesh(winPlane, winMat);
      winMesh.position.set(0, height / 2, x < 0 ? bldgDepth / 2 + 0.05 : -bldgDepth / 2 - 0.05);
      if (x > 0) winMesh.rotation.y = Math.PI;
      group.add(winMesh);
    }

    return group;
  }

  public update(playerZ: number, delta: number) {
    const time = Date.now() * 0.004;
    const recycleThreshold = playerZ + 40;

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];

      if (chunk.group.position.z > recycleThreshold) {
        let minZ = 0;
        for (let j = 0; j < this.chunks.length; j++) {
          if (this.chunks[j].group.position.z < minZ) {
            minZ = this.chunks[j].group.position.z;
          }
        }
        const newZ = minZ - this.chunkLength;
        chunk.group.position.z = newZ;

        // If level changed while running, repopulate recycled chunk with new level theme!
        if (chunk.levelId !== this.currentLevel) {
          this.scene.remove(chunk.group);
          while (chunk.group.children.length > 0) {
            chunk.group.remove(chunk.group.children[0]);
          }
          const rebuilt = this.createChunk(newZ, i, this.currentLevel);
          this.chunks[i] = rebuilt;
          this.scene.add(rebuilt.group);
          continue;
        }
      }

      // Animate spectators and garlands (optimized distance culling for smooth 60fps on phones)
      const distToPlayer = Math.abs(chunk.group.position.z - playerZ);
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || 'ontouchstart' in window);
      const maxAnimDist = isMobile ? 65 : 120;
      if (distToPlayer < maxAnimDist) {
        for (let s = 0; s < chunk.spectators.length; s++) {
          const spec = chunk.spectators[s];
          const phase = time * 2.2 + spec.offset;

          if (spec.actionType === 'wave') {
            spec.leftArm.rotation.x = Math.PI * 0.8 + Math.sin(phase) * 0.45;
            spec.rightArm.rotation.x = Math.PI * 0.8 + Math.cos(phase) * 0.45;
            spec.head.rotation.y = Math.sin(phase * 0.5) * 0.2;
          } else if (spec.actionType === 'clap') {
            const clap = Math.sin(phase * 2.5) * 0.4;
            spec.leftArm.rotation.x = Math.PI * 0.5;
            spec.rightArm.rotation.x = Math.PI * 0.5;
            spec.leftArm.rotation.z = -0.3 + clap;
            spec.rightArm.rotation.z = 0.3 - clap;
          } else if (spec.actionType === 'jump') {
            const jumpBounce = Math.max(0, Math.sin(phase * 1.8)) * 0.35;
            spec.body.position.y = 0.95 + jumpBounce;
            spec.head.position.y = 1.45 + jumpBounce;
            spec.leftArm.rotation.x = Math.PI * 0.9;
            spec.rightArm.rotation.x = Math.PI * 0.9;
          } else if (spec.actionType === 'flag') {
            spec.rightArm.rotation.x = Math.PI * 0.7 + Math.sin(phase * 1.5) * 0.3;
            spec.rightArm.rotation.z = Math.sin(phase * 2.0) * 0.4;
            spec.leftArm.rotation.x = Math.PI * 0.2;
          }
        }

        for (let g = 0; g < chunk.garlands.length; g++) {
          const garland = chunk.garlands[g];
          for (let fl = 0; fl < garland.flags.length; fl++) {
            garland.flags[fl].rotation.x = Math.sin(time * 3 + fl * 0.4) * 0.35;
          }
        }
      }
    }
  }

  public reset(startPlayerZ: number = 0, levelId: GameLevelId = this.currentLevel) {
    this.rebuildAllChunks(startPlayerZ, levelId);
  }
}
