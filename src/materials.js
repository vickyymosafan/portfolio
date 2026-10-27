import * as THREE from 'three';
import {
  createSurfaceTexture,
  createCarpetTexture,
  createScreenCodeTexture,
  createTerminalTexture,
  createCadScreenTexture,
  createWhiteboardTexture,
  createMusicTrackTexture,
  createWallArtTexture,
  createPoolMosaicTexture,
  createWaterRipplesTexture,
  createAsphaltTexture,
  createCobbleCircleTexture,
  createStripedAwningTexture,
  createMonumentSignTexture,
  createGermanPlateTexture,
  createBmwEmblemTexture,
  createCarbonFiberTexture,
  createM4CSLStripeTexture,
} from './textures.js';

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
  bathroomTiles: createSurfaceTexture('bathroomTiles', 256, 256),
};

// Texture repeat settings for appropriate scale
textures.plaster.repeat.set(3, 3);
textures.wood.repeat.set(1.5, 2.5);
textures.stone.repeat.set(2.5, 2.5);
textures.fabric.repeat.set(3, 3);
textures.tiles.repeat.set(2, 2);
textures.shingles.repeat.set(4, 2);
textures.bathroomTiles.repeat.set(4, 4);

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
  trim: std(palette.trimCream, 0.60),
  column: std(0xfbf6ee, 0.52),
  foundation: std(palette.foundationStone, 0.82, { map: textures.stone }),
  roof: std(palette.roofSlate, 0.65, { map: textures.shingles, metalness: 0.06 }),
  roofTrim: std(palette.roofRidge, 0.58),
  wood: std(palette.woodWarm, 0.54, { map: textures.wood, metalness: 0.04 }),
  woodLight: std(palette.woodLight, 0.52, { map: textures.wood, metalness: 0.04 }),
  woodDark: std(palette.woodDark, 0.56, { map: textures.wood, metalness: 0.05 }),
  woodFloor: std(palette.woodWarm, 0.44, { map: textures.wood, metalness: 0.04 }),
  stone: std(palette.stoneCream, 0.80, { map: textures.stone }),
  terraceTiles: std(palette.terracotta, 0.68, { map: textures.tiles }),

  // Glass & Metal with stylized Pixar/Ghibli lighting highlights
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xc6eeea,
    transparent: true,
    opacity: 0.35,
    roughness: 0.08,
    metalness: 0.04,
    clearcoat: 0.95,
    clearcoatRoughness: 0.06,
    depthWrite: false,
  }),
  garageGlass: new THREE.MeshPhysicalMaterial({
    color: 0x90bbb2,
    transparent: true,
    opacity: 0.40,
    roughness: 0.12,
    metalness: 0.10,
    clearcoat: 0.85,
    depthWrite: false,
  }),
  windowFrame: std(0x23312b, 0.35, { metalness: 0.55 }),
  brass: std(palette.goldBrass, 0.22, { metalness: 0.85 }),
  metalDark: std(palette.inkDark, 0.38, { metalness: 0.65 }),

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

  // Luxury Mansion Interiors with refined physical specular response
  epoxyFloor: std(0x282c30, 0.22, { metalness: 0.22 }),
  bathroomTile: std(0xf2f8f9, 0.16, { map: textures.bathroomTiles, roughness: 0.18, metalness: 0.04 }),
  bedLinen: std(0xfbf8f2, 0.72, { map: textures.fabric }),
  bedLinenDark: std(0x2d3a44, 0.70, { map: textures.fabric }),
  acousticFoam: std(0x222629, 0.90, { roughness: 0.92 }),

  // Automotive & Luxury Garage Materials (BMW M-Series)
  carPaintWhite: new THREE.MeshPhysicalMaterial({
    color: 0xfdfdfd,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  }),
  carGlass: new THREE.MeshPhysicalMaterial({
    color: 0x182632,
    transparent: true,
    opacity: 0.62,
    roughness: 0.05,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  }),
  carChrome: std(0xeef2f6, 0.15, { metalness: 0.92 }),
  carRubber: std(0x181a1c, 0.88, { metalness: 0.02 }),

  // High-Fidelity BMW M4 Competition G82 / CSL Dedicated Materials
  m4Paint: new THREE.MeshPhysicalMaterial({
    color: 0xecf0f2,
    roughness: 0.13,
    metalness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  }),
  m4Carbon: new THREE.MeshPhysicalMaterial({
    map: createCarbonFiberTexture(),
    roughness: 0.22,
    metalness: 0.35,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  }),
  m4HoodStripes: new THREE.MeshStandardMaterial({
    map: createM4CSLStripeTexture(),
    roughness: 0.16,
    metalness: 0.16,
  }),
  m4GlossBlack: new THREE.MeshPhysicalMaterial({
    color: 0x090a0d,
    roughness: 0.08,
    metalness: 0.40,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  }),
  m4PlateFront: new THREE.MeshStandardMaterial({
    map: createGermanPlateTexture('M DI 4015'),
    roughness: 0.28,
    metalness: 0.08,
  }),
  m4PlateRear: new THREE.MeshStandardMaterial({
    map: createGermanPlateTexture('M DI 4015'),
    roughness: 0.28,
    metalness: 0.08,
  }),
  m4BmwEmblem: new THREE.MeshStandardMaterial({
    map: createBmwEmblemTexture(),
    roughness: 0.22,
    metalness: 0.35,
  }),
  m4LaserBlue: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.2,
    roughness: 0.1,
  }),
  m4DRLGlow: new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe2e8f0,
    emissiveIntensity: 2.4,
    roughness: 0.08,
  }),
  m4TaillightOLED: new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 2.5,
    roughness: 0.12,
  }),
  m4CaliperGold: std(0xd4af37, 0.25, { metalness: 0.88 }),
  m4RotorBrake: std(0x788088, 0.30, { metalness: 0.85 }),
  m4WheelRim: std(0x181a1d, 0.22, { metalness: 0.82 }),
  m4WheelLip: std(0xe2e8f0, 0.12, { metalness: 0.95 }),
  m4InteriorLeather: std(0x1a1c1e, 0.72, { roughness: 0.78 }),
  m4BucketAccent: std(0xf59e0b, 0.48),

  // Leisure & Water
  poolWater: new THREE.MeshPhysicalMaterial({
    color: 0x48b8c8,
    transparent: true,
    opacity: 0.65,
    roughness: 0.12,
    metalness: 0.04,
    transmission: 0.6,
  }),

  // Lighting & Screens
  screen: new THREE.MeshBasicMaterial({ color: palette.screenDark }),
  screenGlow: new THREE.MeshBasicMaterial({ color: 0x60c5ba }),
  screenCode: new THREE.MeshBasicMaterial({ map: createScreenCodeTexture() }),
  screenTerminal: new THREE.MeshBasicMaterial({ map: createTerminalTexture() }),
  screenCad: new THREE.MeshBasicMaterial({ map: createCadScreenTexture() }),
  whiteboardDiagram: new THREE.MeshStandardMaterial({ map: createWhiteboardTexture(), roughness: 0.32, metalness: 0.02 }),
  screenDAW: new THREE.MeshBasicMaterial({ map: createMusicTrackTexture() }),
  glow: new THREE.MeshBasicMaterial({ color: palette.glowWarm }),
  fire: new THREE.MeshBasicMaterial({ color: 0xffaa33 }),
  fireEmber: new THREE.MeshBasicMaterial({ color: 0xff3b10 }),

  // Decorative Carpets & Fine Arts
  carpetPersian: std(0xffffff, 0.82, { map: createCarpetTexture('persian') }),
  carpetBauhaus: std(0xffffff, 0.82, { map: createCarpetTexture('bauhaus') }),
  artModern: new THREE.MeshStandardMaterial({ map: createWallArtTexture('modern'), roughness: 0.58 }),
  artLandscape: new THREE.MeshStandardMaterial({ map: createWallArtTexture('landscape'), roughness: 0.58 }),
  mirror: new THREE.MeshStandardMaterial({ color: 0xd8edf0, roughness: 0.04, metalness: 0.95 }),
  woodSlats: std(0x281c15, 0.62),
  velvetBlue: std(0x192e47, 0.72, { map: textures.fabric }),
  velvetGold: std(0xba8c2e, 0.55),
  carPaintBlue: new THREE.MeshPhysicalMaterial({ color: 0x1b4b8a, roughness: 0.12, metalness: 0.25, clearcoat: 1.0, clearcoatRoughness: 0.05 }),

  // Woods & Stones
  woodWarm: std(palette.woodWarm, 0.68, { map: textures.wood }),
  woodEspresso: std(palette.woodEspresso, 0.65, { map: textures.wood }),
  stoneWarm: std(palette.stoneWarm, 0.84, { map: textures.stone }),
  stoneDark: std(palette.stoneDark, 0.86, { map: textures.stone }),
  coralDark: std(palette.coralDark, 0.72, { map: textures.fabric }),
  pinkRose: std(palette.pinkRose, 0.75, { map: textures.fabric }),
  blueSky: std(palette.blueSky, 0.72, { map: textures.fabric }),
  yellowSun: std(palette.yellowSun, 0.74, { map: textures.fabric }),

  // Phase 3: Exterior Estate, Pool, Driveway & Zen Garden
  poolTile: std(0xffffff, 0.22, { map: createPoolMosaicTexture(), roughness: 0.18 }),
  poolWaterShimmer: new THREE.MeshPhysicalMaterial({
    map: createWaterRipplesTexture(),
    color: 0x48b8c8,
    transparent: true,
    opacity: 0.72,
    roughness: 0.1,
    metalness: 0.05,
    transmission: 0.5,
  }),
  asphaltRoad: std(0xffffff, 0.88, { map: createAsphaltTexture(), roughness: 0.9 }),
  cobbleCircle: std(0xffffff, 0.75, { map: createCobbleCircleTexture(), roughness: 0.8 }),
  sakuraBlossom: std(0xffb7c5, 0.78),
  waterfallPond: new THREE.MeshPhysicalMaterial({
    color: 0x2299aa,
    transparent: true,
    opacity: 0.75,
    roughness: 0.14,
    transmission: 0.4,
  }),
  graniteRock: std(0x6e7278, 0.85, { roughness: 0.92 }),
  umbrellaStriped: std(0xffffff, 0.68, { map: createStripedAwningTexture('#2b5876', '#fefaf0') }),
  umbrellaYellowStriped: std(0xffffff, 0.68, { map: createStripedAwningTexture('#e69530', '#fffbf2') }),
  gazeboRoof: std(0x2d221c, 0.75, { map: textures.shingles }),

  // Phase 4: Agricultural Environment (Barn, Silo, Hay, Cattle, Chickens, Fish, Rice Paddies & Machinery)
  barnRed: std(0xa82e28, 0.72, { map: textures.wood }),
  barnWhite: std(0xfaf7f2, 0.65),
  barnRoof: std(0x323a42, 0.7),
  siloMetal: std(0xb4bcc4, 0.32, { metalness: 0.55 }),
  siloDome: std(0x8e98a2, 0.28, { metalness: 0.65 }),
  hayGolden: std(0xdfaf32, 0.88),
  cowWhite: std(0xfdfdfd, 0.68),
  cowBlack: std(0x18181a, 0.75),
  cowPink: std(0xf7a8a8, 0.52),
  chickenFeather: std(0xfdf8ec, 0.72),
  chickenBrown: std(0xa66038, 0.75),
  chickenComb: std(0xd42626, 0.45),
  chickenBeak: std(0xf59e0b, 0.35),
  ricePaddyWater: new THREE.MeshPhysicalMaterial({
    color: 0x48968a,
    transparent: true,
    opacity: 0.68,
    roughness: 0.12,
    transmission: 0.5,
  }),
  ricePlantGreen: std(0x5cb828, 0.78),
  ricePlantGold: std(0xd8a424, 0.82),
  paddySoil: std(0x543b2a, 0.92),
  tractorYellow: std(0xf5b324, 0.32, { metalness: 0.28 }),
  tractorTire: std(0x1a1a1c, 0.85),
  strawHat: std(0xdcb662, 0.82),
  farmerOveralls: std(0x2b4c7e, 0.78),
  farmerShirt: std(0xe06042, 0.75),

  // Phase 3/4: Zone I Security Checkpoint, Monument Wall & Public Highway
  monumentWall: std(0xded8cb, 0.82, { map: textures.stone }),
  monumentPlaque: std(0x1a2624, 0.35, { metalness: 0.4 }),
  monumentGold: std(0xdfab38, 0.25, { metalness: 0.75 }),
  monumentSignMain: new THREE.MeshStandardMaterial({ map: createMonumentSignTexture('main'), roughness: 0.35, metalness: 0.25 }),
  monumentSignWelcome: new THREE.MeshStandardMaterial({ map: createMonumentSignTexture('welcome'), roughness: 0.35, metalness: 0.25 }),
  monumentSignSecurity: new THREE.MeshStandardMaterial({ map: createMonumentSignTexture('security'), roughness: 0.35, metalness: 0.25 }),
  perimeterPillar: std(0xf4eee2, 0.75, { map: textures.plaster }),
  perimeterPanel: std(0xede6d6, 0.78, { map: textures.plaster }),
  perimeterCap: std(0xf9f5ec, 0.65),
  carriageLanternMetal: std(0x181a1d, 0.32, { metalness: 0.85 }),
  carriageLanternGlass: new THREE.MeshStandardMaterial({ color: 0xfff2cc, roughness: 0.12, emissive: 0xffae34, emissiveIntensity: 0.48 }),
  estateGateDark: std(0x1a1c20, 0.26, { metalness: 0.88 }),
  estateGateGold: std(0xe0b238, 0.2, { metalness: 0.9 }),
  guardUniform: std(0x182432, 0.7, { map: textures.fabric }),
  guardCap: std(0x121b24, 0.4, { metalness: 0.25 }),
  guardBadge: std(0xf0be42, 0.18, { metalness: 0.88 }),
  guardWhite: std(0xf8fafc, 0.55),
  barrierOrange: std(0xf97316, 0.42, { metalness: 0.1 }),
  barrierWhite: std(0xf8fafc, 0.45),
  hedgeGreen: std(0x48b868, 0.72),
  flowerYellow: std(0xfbbf24, 0.52),
  flowerCoral: std(0xf87171, 0.52),
  flowerPurple: std(0xc084fc, 0.52),
  flowerWhite: std(0xffffff, 0.55),
  curbConcrete: std(0xd2cec2, 0.88),
  asphaltMarkingWhite: std(0xfcfcfa, 0.75),
  asphaltMarkingYellow: std(0xf2b528, 0.72),
  securityBoothWall: std(0xf8f4ec, 0.74, { map: textures.plaster }),
  securityBoothRoof: std(0x222b31, 0.6),
  carSuvBlack: new THREE.MeshPhysicalMaterial({ color: 0x16181b, roughness: 0.14, metalness: 0.35, clearcoat: 0.95, clearcoatRoughness: 0.05 }),
  carSuvWhite: new THREE.MeshPhysicalMaterial({ color: 0xf6f6f8, roughness: 0.12, metalness: 0.05, clearcoat: 1.0, clearcoatRoughness: 0.04 }),
};

