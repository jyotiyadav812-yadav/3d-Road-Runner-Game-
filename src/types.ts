/**
 * Game types and configuration constants for 3D Road Runner
 */

export type GameState = 'cover' | 'menu' | 'interface' | 'countdown' | 'playing' | 'paused' | 'gameover';

export type CameraMode = 'follow' | 'front' | 'angled';

export type LaneIndex = -1 | 0 | 1;

export type GameLevelId = 1 | 2 | 3 | 4 | 5;

export interface GameLevelInfo {
  id: GameLevelId;
  name: string;
  subtitle: string;
  theme: 'city' | 'highway' | 'night' | 'mountain' | 'traffic';
  distanceThreshold: number; // distance in meters to advance
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  sunColor: number;
  sunIntensity: number;
  ambientColor: number;
  ambientIntensity: number;
  asphaltColor: number;
  curbColor1: number;
  curbColor2: number;
  groundColor: number;
  sidewalkColor: number;
  description: string;
  tagline: string;
  badgeClass: string;
  accentColor: string;
  trafficDensity: number;
}

export const GAME_LEVELS: Record<GameLevelId, GameLevelInfo> = {
  1: {
    id: 1,
    name: 'Level 1: City Road',
    subtitle: 'City Road',
    theme: 'city',
    distanceThreshold: 0,
    skyColor: 0x60a5fa,
    fogColor: 0x93c5fd,
    fogDensity: 0.0035,
    sunColor: 0xffffff,
    sunIntensity: 1.4,
    ambientColor: 0xfffaed,
    ambientIntensity: 0.65,
    asphaltColor: 0x334155,
    curbColor1: 0xef4444, // Red
    curbColor2: 0xf1f5f9, // White
    groundColor: 0x4ade80, // Lush grass
    sidewalkColor: 0xc8d0d8,
    description: 'Festival city street lined with cheering spectators, banners, and colorful buildings.',
    tagline: 'Sunny Festival City',
    badgeClass: 'from-amber-500 via-rose-500 to-pink-500',
    accentColor: '#f43f5e',
    trafficDensity: 0.25,
  },
  2: {
    id: 2,
    name: 'Level 2: Highway',
    subtitle: 'Highway',
    theme: 'highway',
    distanceThreshold: 400,
    skyColor: 0x38bdf8,
    fogColor: 0xbae6fd,
    fogDensity: 0.0028,
    sunColor: 0xffedd5,
    sunIntensity: 1.5,
    ambientColor: 0xf8fafc,
    ambientIntensity: 0.7,
    asphaltColor: 0x1e293b,
    curbColor1: 0xfacc15, // Yellow
    curbColor2: 0x0284c7, // Highway blue
    groundColor: 0x6ee7b7, // Open highway verge
    sidewalkColor: 0x94a3b8,
    description: 'High-speed open interstate expressway with overhead exit signs and steel guardrails.',
    tagline: 'Open Interstate Speedway',
    badgeClass: 'from-blue-500 via-cyan-400 to-teal-400',
    accentColor: '#0ea5e9',
    trafficDensity: 0.5,
  },
  3: {
    id: 3,
    name: 'Level 3: Night City',
    subtitle: 'Night City',
    theme: 'night',
    distanceThreshold: 900,
    skyColor: 0x090d16,
    fogColor: 0x171435,
    fogDensity: 0.004,
    sunColor: 0x818cf8,
    sunIntensity: 0.55,
    ambientColor: 0x312e81,
    ambientIntensity: 0.85,
    asphaltColor: 0x0f172a,
    curbColor1: 0xec4899, // Neon Pink
    curbColor2: 0x06b6d4, // Neon Cyan
    groundColor: 0x090f1d, // Dark metropolis turf
    sidewalkColor: 0x1e293b,
    description: 'Nocturnal metropolis glowing with neon skyscrapers, illuminated posts, and midnight traffic.',
    tagline: 'Electric Neon Metropolis',
    badgeClass: 'from-fuchsia-600 via-purple-500 to-indigo-600',
    accentColor: '#d946ef',
    trafficDensity: 0.6,
  },
  4: {
    id: 4,
    name: 'Level 4: Mountain Road',
    subtitle: 'Mountain Road',
    theme: 'mountain',
    distanceThreshold: 1500,
    skyColor: 0x7dd3fc,
    fogColor: 0xdbeafe,
    fogDensity: 0.0045,
    sunColor: 0xfef08a,
    sunIntensity: 1.35,
    ambientColor: 0xf1f5f9,
    ambientIntensity: 0.65,
    asphaltColor: 0x475569,
    curbColor1: 0xa8a29e, // Natural granite stone
    curbColor2: 0x78716c, // Dark slate
    groundColor: 0x57534e, // Rocky pine earth
    sidewalkColor: 0x78716c,
    description: 'Challenging alpine mountain canyon pass with rugged rock cliffs, pine trees, and stone barriers.',
    tagline: 'Alpine Canyon Pass',
    badgeClass: 'from-emerald-600 via-teal-600 to-cyan-700',
    accentColor: '#059669',
    trafficDensity: 0.45,
  },
  5: {
    id: 5,
    name: 'Level 5: Extreme Traffic',
    subtitle: 'Extreme Traffic',
    theme: 'traffic',
    distanceThreshold: 2200,
    skyColor: 0xea580c,
    fogColor: 0xfdba74,
    fogDensity: 0.0038,
    sunColor: 0xf97316,
    sunIntensity: 1.45,
    ambientColor: 0xffedd5,
    ambientIntensity: 0.7,
    asphaltColor: 0x1c1917,
    curbColor1: 0xf97316, // Hazard Orange
    curbColor2: 0x1c1917, // Heavy tire black
    groundColor: 0x737373, // Concrete highway barriers
    sidewalkColor: 0x525252,
    description: 'Intense rush-hour gridlock! Packed multi-lane highway with moving vehicles, buses, and hazards.',
    tagline: 'Rush-Hour Gridlock Rush',
    badgeClass: 'from-red-600 via-orange-500 to-amber-500',
    accentColor: '#ea580c',
    trafficDensity: 1.0,
  },
};

export type ObstacleType = 
  | 'cone' 
  | 'barrier_low' 
  | 'barrier_high' 
  | 'vehicle' 
  | 'roadblock'
  | 'boulder';

export interface GameStats {
  score: number;
  coins: number;
  distance: number; // in meters
  speed: number; // current speed
  combo: number;
  multiplier: number;
  highScore: number;
  totalCoins: number;
  currentLevel: GameLevelId;
  levelName: string;
  levelProgress: number; // 0 to 1 progress toward next level
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
}

export interface RunnerCustomization {
  outfitColor: string;
  hairColor: string;
}

export const GAME_CONSTANTS = {
  LANE_WIDTH: 3.2,
  LANES: [-3.2, 0, 3.2] as const,
  INITIAL_SPEED: 34, // units per second
  MAX_SPEED: 60,
  SPEED_INCREMENT: 0.8, // acceleration per 100m
  JUMP_FORCE: 12.0,
  GRAVITY: 42.0,
  SLIDE_DURATION: 0.55, // seconds
  ROAD_WIDTH: 13.0,
  CHUNK_LENGTH: 60.0,
  VISIBLE_CHUNKS: 6,
  COIN_VALUE: 10,
};
