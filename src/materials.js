import * as THREE from 'three';
import { createSurfaceTexture } from './textures.js';

export const palette = {
  // Architectural surfaces
  wallIvory: 0xfff9ef,
  wallCream: 0xfbf4e6,
  wallPeach: 0xf3a88a,
  terracotta: 0xd77a5b,
  coral: 0xe8654d,
  coralDark: 0xc44f39,

  // Wood & Structure
  woodLight: 0xb5825a,
  woodWarm: 0x9e6b47,
  woodDark: 0x67442d,
  woodEspresso: 0x482f21,

  // Stone & Masonry
  stoneCream: 0xded8c8,
  stoneWarm: 0xc8c0ae,
  stoneDark: 0x9e9684,
  foundationStone: 0xd4cdbd,

  // Roof & Architecture trim
  roofSlate: 0x426b54,
  roofRidge: 0x335542,
  trimCream: 0xfffcf5,

  // Landscaping & Vegetation
  grassLight: 0x93cb77,
  grassMid: 0x7ca868,
  grassDeep: 0x588c4d,
  soil: 0x6e4a32,
  pathSandstone: 0xe8c98e,
  leafBright: 0x9edb74,
  leafMid: 0x6ba859,
  leafDeep: 0x437c3b,
  leafForest: 0x32622c,

  // Accent & Furnishing Colors
  blueSky: 0x7ba8b8,
  bluePastel: 0x9cc5d3,
  blueNavy: 0x2b444b,
  yellowSun: 0xf0c458,
  yellowCream: 0xfdeda8,
  pinkRose: 0xe4969a,
  mintSage: 0x98c9ad,
  purpleLavender: 0xa88bc2,
  inkDark: 0x223830,
  goldBrass: 0xd89c47,
  screenDark: 0x1b3633,
  glowWarm: 0xffe6a3,
};

// Procedural texture instances
export const textures = {
  plaster: createSurfaceTexture('plaster', 256, 256),
  wood: createSurfaceTexture('wood', 256, 256),
  stone: createSurfaceTexture('stone', 256, 256),
  fabric: createSurfaceTexture('fabric', 256, 256),
  tiles: createSurfaceTexture('tiles', 256, 256),
  shingles: createSurfaceTexture('shingles', 256, 256),
};

// Texture repeat settings for appropriate scale
textures.plaster.repeat.set(3, 3);
textures.wood.repeat.set(1.5, 2.5);
textures.stone.repeat.set(2.5, 2.5);
textures.fabric.repeat.set(3, 3);
textures.tiles.repeat.set(2, 2);
textures.shingles.repeat.set(4, 2);

const std = (color, roughness = 0.76, options = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: options.metalness ?? 0.04,
    flatShading: options.flatShading ?? false,
    ...options,
  });

export const materials = {
  // Architecture
  wall: std(palette.wallIvory, 0.82, { map: textures.plaster }),
  wallAccent: std(palette.wallPeach, 0.82, { map: textures.plaster }),
  wainscot: std(palette.terracotta, 0.78, { map: textures.plaster }),
  trim: std(palette.trimCream, 0.65),
  column: std(0xfbf6ee, 0.58),
  foundation: std(palette.foundationStone, 0.85, { map: textures.stone }),
  roof: std(palette.roofSlate, 0.72, { map: textures.shingles }),
  roofTrim: std(palette.roofRidge, 0.65),
  wood: std(palette.woodWarm, 0.68, { map: textures.wood }),
  woodLight: std(palette.woodLight, 0.65, { map: textures.wood }),
  woodDark: std(palette.woodDark, 0.7, { map: textures.wood }),
  woodFloor: std(palette.woodWarm, 0.58, { map: textures.wood }),
  stone: std(palette.stoneCream, 0.84, { map: textures.stone }),
  terraceTiles: std(palette.terracotta, 0.74, { map: textures.tiles }),

  // Glass & Metal
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xb5e2dc,
    transparent: true,
    opacity: 0.38,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    depthWrite: false,
  }),
  brass: std(palette.goldBrass, 0.32, { metalness: 0.7 }),
  metalDark: std(palette.inkDark, 0.45, { metalness: 0.4 }),

  // Landscape
  grass: std(palette.grassMid, 0.88, { map: textures.plaster }),
  lawnRaised: std(palette.grassLight, 0.85, { map: textures.plaster }),
  deepGrass: std(palette.grassDeep, 0.88, { map: textures.plaster }),
  soil: std(palette.soil, 0.95),
  path: std(palette.pathSandstone, 0.85, { map: textures.stone }),
  steppingStone: std(palette.stoneCream, 0.82, { map: textures.stone }),

  // Foliage - guaranteed vibrant cartoon tones, never black
  foliageBright: std(palette.leafBright, 0.72),
  foliageMid: std(palette.leafMid, 0.75),
  foliageDeep: std(palette.leafDeep, 0.78),
  foliageForest: std(palette.leafForest, 0.8),
  bark: std(palette.woodDark, 0.8, { map: textures.wood }),

  // Accents & Furnishings
  coral: std(palette.coral, 0.74, { map: textures.fabric }),
  blue: std(palette.blueSky, 0.72, { map: textures.fabric }),
  bluePastel: std(palette.bluePastel, 0.72, { map: textures.fabric }),
  yellow: std(palette.yellowSun, 0.74, { map: textures.fabric }),
  yellowCream: std(palette.yellowCream, 0.78),
  pink: std(palette.pinkRose, 0.75, { map: textures.fabric }),
  mint: std(palette.mintSage, 0.76, { map: textures.fabric }),
  purple: std(palette.purpleLavender, 0.75),
  cream: std(palette.wallCream, 0.78, { map: textures.fabric }),
  ink: std(palette.inkDark, 0.5),

  // Character Presets (Dedicated non-plaster materials)
  skin: new THREE.MeshStandardMaterial({
    color: 0xf7c4af,
    roughness: 0.52,
    metalness: 0.0,
  }),
  skinBlush: new THREE.MeshStandardMaterial({
    color: 0xf09f88,
    roughness: 0.55,
    metalness: 0.0,
  }),
  hair: new THREE.MeshStandardMaterial({
    color: 0x422a1b,
    roughness: 0.42,
    metalness: 0.08,
  }),
  tunic: std(0x4c7a8d, 0.68, { map: textures.fabric }),
  trousers: std(0xffffff, 0.72, { map: textures.fabric }),
  leather: std(0x8a4b2a, 0.46, { metalness: 0.12 }),
  leatherDark: std(0x562f1a, 0.44, { metalness: 0.12 }),
  iris: new THREE.MeshStandardMaterial({
    color: 0x2e666a,
    roughness: 0.32,
    metalness: 0.08,
  }),
  sneakerCoral: std(palette.coral, 0.62),
  sneakerSole: std(palette.trimCream, 0.58),

  // Ceramic & Fine Materials
  ceramic: new THREE.MeshPhysicalMaterial({
    color: 0xfffdf7,
    roughness: 0.15,
    metalness: 0.02,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
  }),
  ceramicTeal: new THREE.MeshPhysicalMaterial({
    color: 0x68a898,
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
  }),
  ceramicTerracotta: std(0xca6245, 0.72),
  chrome: std(0xe4ecf0, 0.18, { metalness: 0.88 }),

  // Cushions & Soft Furnishings
  cushionCoral: std(palette.coral, 0.68, { map: textures.fabric }),
  cushionMint: std(palette.mintSage, 0.68, { map: textures.fabric }),
  cushionYellow: std(palette.yellowSun, 0.68, { map: textures.fabric }),
  cushionBlue: std(palette.bluePastel, 0.68, { map: textures.fabric }),

  // Lighting & Screens
  screen: new THREE.MeshBasicMaterial({ color: palette.screenDark }),
  screenGlow: new THREE.MeshBasicMaterial({ color: 0x60c5ba }),
  glow: new THREE.MeshBasicMaterial({ color: palette.glowWarm }),
  fire: new THREE.MeshBasicMaterial({ color: 0xffaa33 }),
};
