import * as THREE from 'three';
import { portfolio } from './portfolio.js';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder, optimizeStaticScene } from './geometry.js';
import {
  createCartoonTree,
  createCartoonBush,
  createFlowerBed,
  createGardenPath,
  createGardenFence,
  createGardenBench,
} from './landscape.js';
import { createArchitecture, createInteractiveDoors } from './architecture.js';
import { createRoomInteriors } from './furniture.js';
import { createPoolArea } from './poolArea.js';
import { createDriveway } from './driveway.js';
import { createZenGarden } from './zenGarden.js';
import { createSecurityArea } from './securityArea.js';
import { createFarmArea } from './farmArea.js';
import { createRiceFields } from './riceFields.js';
import { createCharacter, updateCharacterRig } from './character.js';
import { CinematicDirector, CinematicState } from './cinematic.js';
import { QuestSystem } from './quest.js';
import { WorldInteractionManager, InteractionMode, InteractionState } from './worldInteractions.js';
import { BENCH } from './seatLayout.js';
import { InputManager } from './systems/inputManager.js';
import { CameraController } from './systems/cameraController.js';
import { UIManager } from './ui/uiManager.js';
import './style.css';

const $ = (id) => document.getElementById(id);

/**
 * Optimizes INP by yielding to the main thread during heavy initialization tasks.
 * Uses scheduler.yield() when supported, with setTimeout(0) fallback.
 */
export const yieldToMain = () => {
  if (typeof window !== 'undefined' && 'scheduler' in window && typeof window.scheduler?.yield === 'function') {
    return window.scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
};

const sceneHost = $('scene');
const uiManager = new UIManager();
const ui = {
  welcome: $('welcome'),
  loading: $('loading-screen'),
  roomName: $('room-name'),
  roomCount: $('room-count'),
  prompt: $('interaction-prompt'),
  promptLabel: $('prompt-label'),
  detail: $('detail-panel'),
  panelTitle: $('panel-title'),
  panelEyebrow: $('panel-eyebrow'),
  panelContent: $('panel-content'),
  panelFooter: $('panel-footer'),
  quality: $('quality-label'),
  perf: $('perf-pill'),
  perfText: $('perf-text'),
  drawText: $('draw-text'),
  tourToast: $('tour-toast'),
  tourStepBadge: $('tour-step-badge'),
  tourTitle: $('tour-title'),
  tourCaption: $('tour-caption'),
  tourProgress: $('tour-progress-fill'),
  tourExploreBtn: $('tour-explore-btn'),
  tourNextBtn: $('tour-next-btn'),
  mapBtn: $('map-button'),
  mapPill: $('map-status-pill'),
  mapCloseBtn: $('map-close-btn'),
  markersContainer: $('world-markers'),
};

let renderer;
let camera;
let scene;
let roofGroup;
let RAPIER;
let world;
let playerBody;
let playerCollider;
let characterController;
let characterRig;
let doorControls;
let cinematicDirector;
let questSystem;
let worldInteractions;
let securityZone;
let farmZone;
let riceZone;
const doorColliders = [];
const interactionPoints = [];
const cameraBlockers = [];
let cameraController = null;
const staticBodies = [];

const WORLD_MARKERS = [
  { id: 'farm', label: 'Peternakan', sub: 'Sapi, Ayam, Ikan', icon: '🐮', pos: [-28.0, 3.8, -32.0], targetRoom: 'farm' },
  { id: 'rice', label: 'Sawah', sub: 'Pertanian Modern', icon: '🌾', pos: [14.0, 3.8, -32.0], targetRoom: 'rice' },
  { id: 'road', label: 'Jalan Utama', sub: 'Akses Menuju Rumah', icon: '🚗', pos: [32.0, 3.5, 32.0], targetRoom: 'road' },
  { id: 'pool', label: 'Kolam Renang', sub: 'Swim & Relax', icon: '🏊', pos: [-25.0, 3.5, -5.0], targetRoom: 'pool' },
  { id: 'security', label: 'Security', sub: '24/7 Guard', icon: '🛡️', pos: [-18.0, 3.5, 24.0], targetRoom: 'security' },
  { id: 'living', label: '01 · About Me', sub: 'Grand Living Room', icon: '🛋️', pos: [0.0, 4.4, 2.0], targetRoom: 'about' },
  { id: 'library', label: '02 · Work Experience', sub: 'Library Nook · 5 Roles', icon: '💼', pos: [10.75, 10.2, 2.0], targetRoom: 'experience' },
  { id: 'bedroom', label: '03 · Education', sub: 'UNMUH Jember · GPA 3.75', icon: '🎓', pos: [-11.0, 10.2, 2.0], targetRoom: 'bedroom' },
  { id: 'bathroom', label: '04 · Volunteering', sub: 'Humanitarian & Tech Ed', icon: '🤝', pos: [0.0, 10.2, 2.0], targetRoom: 'bathroom' },
  { id: 'garage', label: '05 · Licenses & Certs', sub: 'Garasi BMW · 7 Credentials', icon: '📜', pos: [21.0, 3.5, 2.0], targetRoom: 'garage' },
  { id: 'gallery', label: '06 · Projects', sub: 'Project Gallery · 6 Works', icon: '🖼️', pos: [-11.0, 4.4, 2.0], targetRoom: 'projects' },
  { id: 'office', label: '07 · Tech & Tooling', sub: 'Architectural Domain', icon: '💻', pos: [10.75, 4.4, 2.0], targetRoom: 'skills' },
  { id: 'studio', label: '08 · GitHub Contribs', sub: '1,039 Contributions', icon: '🐙', pos: [21.0, 10.2, 2.0], targetRoom: 'process' },
  { id: 'zen', label: '09 · Contact', sub: 'Garden Terrace & Links', icon: '🌲', pos: [35.0, 3.5, -8.0], targetRoom: 'zen' },
];

let overviewMode = false;
const overviewCamPos = new THREE.Vector3(4.5, 58.0, 36.0);
const overviewTarget = new THREE.Vector3(4.5, 0.0, -8.0);
const markerProjectVec = new THREE.Vector3();
let markerElements = [];

let started = false;
let paused = false;
let panelOpen = false;
let settingsOpen = false;
let tourActive = false;
let adaptive = true;
let quality = 'auto';
let renderScale = 1;
let frameAverage = 16.7;
let qualityCooldown = 0;
let lastHudUpdate = 0;
let lastCameraCollisionCheck = 0;
let currentInteraction = null;
let currentRoom = portfolio.rooms[0];
let currentVelX = 0;
let currentVelZ = 0;
let tourStopIndex = 0;
let tourWaypoints = [];
let tourWaypointIndex = 0;
let tourWaitTimer = 0;
let tourWaitingAtStop = false;
let tourClock = 0;
let grounded = false;
let jumpVelocity = 0;
let moveAmount = 0;
let pointerHeld = false;
let lastPointerX = 0;
let lastPointerY = 0;
let yaw = 0;
let pitch = 0.35;
let userZoom = 1.0;
let cameraDistance = 7.2;
let cameraDistanceGoal = 7.2;
let cameraSafeDistance = 7.2;
let panelReturnFocus = null;
let mobile = matchMedia('(pointer: coarse)').matches;
let elapsed = 0;
let accumulator = 0;
let physX = 0;
let physY = 1.12;
let physZ = 16.8;
let lastRoomVisited = '';

const inputManager = new InputManager({
  onEscape: () => {
    if (cinematicDirector && cinematicDirector.isActive()) {
      cinematicDirector.exitScene();
      return;
    }
    if (worldInteractions && worldInteractions.cancelAny()) {
      findInteraction();
      return;
    }
    if (overviewMode) {
      toggleOverviewMode(false);
      return;
    }
    if (!renderer) {
      if (!started) $('loading-screen').classList.add('is-hidden');
      return;
    }
    if (panelOpen) closeDetails();
    else if (settingsOpen) closeSettings();
    else if (tourActive) endTour();
    else if (!started) return;
    else setPaused(!paused);
  },
  onToggleMap: () => {
    if (!panelOpen && !settingsOpen) {
      toggleOverviewMode();
    }
  },
  onSit: () => {
    if (!renderer || !started) return;
    dispatchInteraction('KeyC');
  },
  onInteract: () => {
    if (!renderer) { startExperience(); return; }
    if (!started) startExperience();
    else if (cinematicDirector && cinematicDirector.isActive()) {
      return;
    } else if (tourActive) {
      const stop = tourStops[tourStopIndex];
      if (stop) startCinematic(stop.id);
    } else {
      dispatchInteraction('KeyE');
    }
  },
  onInspect: () => {
    if (!renderer || !started) { startExperience(); return; }
    if (cinematicDirector && cinematicDirector.isActive()) return;
    if (dispatchInteraction('KeyF')) return;
    if (!worldInteractions || worldInteractions.mode === InteractionMode.NONE) beginTour();
  },
  onJump: () => {
    if (tourActive && tourWaitingAtStop) {
      advanceTourStop();
      return true;
    }
    return false;
  },
  onCarouselNext: () => {
    if (cinematicDirector && cinematicDirector.isActive() && cinematicDirector.activeSection === 'projects') {
      const nextBtn = document.querySelector('.project-carousel-nav .carousel-nav-btn:last-child');
      if (nextBtn) {
        nextBtn.click();
        return true;
      }
    }
    return false;
  },
  onCarouselPrev: () => {
    if (cinematicDirector && cinematicDirector.isActive() && cinematicDirector.activeSection === 'projects') {
      const prevBtn = document.querySelector('.project-carousel-nav .carousel-nav-btn:first-child');
      if (prevBtn) {
        prevBtn.click();
        return true;
      }
    }
    return false;
  },
  isSuspended: () => {
    return panelOpen || settingsOpen || tourActive ||
      (cinematicDirector && cinematicDirector.isInputLocked()) ||
      (worldInteractions && worldInteractions.isActive());
  }
});
const keys = inputManager.keys;
const touch = inputManager.touch;
const raycaster = new THREE.Raycaster();
const cameraOrigin = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const dampVector = new THREE.Vector3();
const lookPoint = new THREE.Vector3();
const physicsDisplacement = { x: 0, y: 0, z: 0 };
const nextPhysicsPosition = { x: 0, y: 0, z: 0 };
const rayHits = [];

const qualityPresets = {
  high: {
    pixelRatio: 1.25,
    shadows: true,
    shadowSize: 1024,
    shadowType: THREE.PCFShadowMap,
    shadowUpdateInterval: 2,
    npcUpdateInterval: 1,
    physicsSubsteps: 3,
    cullDistance: 250,
    fogNear: 95,
    fogFar: 265,
  },
  medium: {
    pixelRatio: 1.0,
    shadows: true,
    shadowSize: 512,
    shadowType: THREE.BasicShadowMap,
    shadowUpdateInterval: 4,
    npcUpdateInterval: 2,
    physicsSubsteps: 2,
    cullDistance: 215,
    fogNear: 85,
    fogFar: 225,
  },
  low: {
    pixelRatio: 0.8,
    shadows: false,
    shadowSize: 0,
    shadowType: THREE.BasicShadowMap,
    shadowUpdateInterval: 0,
    npcUpdateInterval: 3,
    physicsSubsteps: 2,
    cullDistance: 180,
    fogNear: 75,
    fogFar: 185,
  },
  mobile: {
    pixelRatio: 0.7,
    shadows: false,
    shadowSize: 0,
    shadowType: THREE.BasicShadowMap,
    shadowUpdateInterval: 0,
    npcUpdateInterval: 3,
    physicsSubsteps: 1,
    cullDistance: 165,
    fogNear: 68,
    fogFar: 168,
  },
};
let activeQualityKey = mobile ? 'mobile' : 'medium';
let activePreset = qualityPresets[activeQualityKey];
let frameCounter = 0;

function createRenderer() {
  if (!('WebGL2RenderingContext' in window)) {
    throw new Error('This browser does not support WebGL2.');
  }
  renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.0));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '3D cartoon portfolio world. Use WASD to walk, mouse to look, and E to explore.');
  sceneHost.appendChild(renderer.domElement);

  const initialAspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(initialAspect < 1.0 ? 64 : 48, initialAspect, 0.4, 215);
  cameraController = new CameraController(camera, { cameraBlockers, yaw, pitch });
  return renderer;
}

async function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe0d5);
  scene.fog = new THREE.Fog(0xbfe0d5, 95, 275);

  // Soft warm ambient hemisphere light for vibrant natural cartoon fill
  const hemi = new THREE.HemisphereLight(0xfffaee, 0x78ab70, 1.95);
  scene.add(hemi);

  // Warm golden directional sunlight with soft contact penumbra
  const sun = new THREE.DirectionalLight(0xfff9e6, 2.5);
  sun.position.set(-18, 26, 20);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.camera.left = -26;
  sun.shadow.camera.right = 26;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 68;
  sun.shadow.bias = -0.00005;
  sun.shadow.normalBias = 0.08;
  sun.shadow.radius = 1.0;
  scene.add(sun);
  scene.userData.sun = sun;

  // Pixar-style subtle sky rim / kicker light from high rear-angle to sculpt silhouettes
  const rimLight = new THREE.DirectionalLight(0xc6e4ff, 0.75);
  rimLight.position.set(18, 24, -22);
  rimLight.castShadow = false;
  scene.add(rimLight);

  // Visible physical ceiling pendant fixtures in wide room bays (height 5.2m)
  const interiorLights = [
    { pos: [-8.5, 3.8, -0.2], shade: materials.terracotta }, // Living room
    { pos: [8.5, 3.8, -0.2], shade: materials.ceramicTeal },  // Office
    { pos: [-8.5, 3.8, -8.3], shade: materials.brass },       // Library
    { pos: [8.5, 3.8, -8.3], shade: materials.ceramic },     // Gallery
    { pos: [-8.5, 3.8, -16.1], shade: materials.metalDark }, // Studio
    { pos: [8.5, 3.8, -16.1], shade: materials.terracotta }, // Terrace
  ];
  for (const l of interiorLights) {
    addCylinder(scene, [l.pos[0], 4.88, l.pos[2]], 0.015, 0.015, 0.45, materials.metalDark, { shadow: false });
    addCylinder(scene, [l.pos[0], 4.65, l.pos[2]], 0.04, 0.28, 0.18, l.shade, { shadow: false });
    addSphere(scene, [l.pos[0], 4.55, l.pos[2]], [0.08, 0.08, 0.08], materials.glow, { shadow: false });
  }

  // 1. Landscape Foundation & Lawns
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), materials.grass);
  ground.rotation.x = -Math.PI * 0.5;
  ground.position.set(1.0, -0.08, -2.5);
  ground.receiveShadow = true;
  scene.add(ground);

  // Raised garden lawn spanning whole estate grounds (Pool, Mansion, Gardens, Farm & Rice Fields)
  const lawn = addBox(scene, [1.0, -0.16, -2.5], [104, 0.24, 92], materials.lawnRaised, { receive: true, shadow: true });
  lawn.receiveShadow = true;

  // Rapier ground collider spanning whole estate
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(1.0, -0.2, -2.5));
  world.createCollider(RAPIER.ColliderDesc.cuboid(54, 0.15, 48), groundBody);
  staticBodies.push(groundBody);

  // Garden paths, stepping stones, fences
  createGardenPath(scene);
  createGardenFence(scene);
  await yieldToMain();

  // Phase 3 & 4: Exterior Estate Zones (Pool Deck, Driveway & Roundabout, Zen Garden, Security Area, Farm & Rice Fields)
  createPoolArea(scene, world, RAPIER, staticBodies);
  createDriveway(scene, world, RAPIER, staticBodies);
  await yieldToMain();

  createZenGarden(scene, world, RAPIER, staticBodies);
  securityZone = createSecurityArea(scene, world, RAPIER, staticBodies);
  await yieldToMain();

  farmZone = createFarmArea(scene, world, RAPIER, staticBodies);
  riceZone = createRiceFields(scene, world, RAPIER, staticBodies);
  await yieldToMain();

  for (const [bx, bz, brot] of [[-9.2, 9.8, 0.35], [9.2, 9.8, -0.35]]) {
    createGardenBench(scene, bx, 0, bz, brot);
    const benchBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(bx, BENCH.backTop * 0.5, bz)
        .setRotation({ x: 0, y: Math.sin(brot / 2), z: 0, w: Math.cos(brot / 2) })
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(BENCH.width * 0.5, BENCH.backTop * 0.5, BENCH.seatDepth * 0.5), benchBody);
    staticBodies.push(benchBody);
  }

  // Outer boundary picket fence colliders along east and west edges (x = [-45.5, 48.5])
  for (const fx of [-45.5, 48.5]) {
    const fenceBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(fx, 0.75, -10.0));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.22, 0.75, 34.0), fenceBody);
    staticBodies.push(fenceBody);
  }

  // Rich flower beds framing the expanded estate grounds
  const flowerBedSpecs = [
    [-9.5, 5.2, 7.5, 1.4, 21],
    [9.5, 5.2, 7.5, 1.4, 47],
    [-17.5, -3.5, 1.4, 7.5, 63],
    [27.0, -3.5, 1.4, 7.5, 85],
    [-17.5, -12.5, 1.4, 7.5, 101],
    [27.0, -12.5, 1.4, 7.5, 127],
  ];
  for (const [fbx, fbz, fbw, fbd, seed] of flowerBedSpecs) {
    createFlowerBed(scene, fbx, fbz, fbw, fbd, seed);
    const bedBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(fbx, 0.35, fbz));
    world.createCollider(RAPIER.ColliderDesc.cuboid(fbw * 0.5, 0.35, fbd * 0.5), bedBody);
    staticBodies.push(bedBody);
  }

  // Tiered Cartoon Trees outside expanded estate perimeter (x: -38.5 to 44.5)
  const treeCoords = [
    [-38.5, 9.5, 1.2, 12],
    [44.5, 9.2, 1.2, 24],
    [-38.5, -1.0, 1.1, 36],
    [44.5, -1.0, 1.1, 48],
    [-38.5, -9.5, 1.15, 60],
    [44.5, -9.5, 1.15, 72],
    [-38.5, -17.5, 1.05, 84],
    [44.5, -17.5, 1.05, 96],
    [-14.2, 17.5, 0.98, 108],
    [14.2, 17.5, 0.98, 120],
    [-38.5, 16.0, 0.9, 132],
    [44.5, 16.0, 0.9, 144],
  ];
  for (const [tx, tz, ts, seed] of treeCoords) {
    const tree = createCartoonTree(tx, tz, ts, seed);
    scene.add(tree);
    const trunkBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(tx, 1.2 * ts, tz));
    world.createCollider(RAPIER.ColliderDesc.cylinder(1.2 * ts, 0.46 * ts), trunkBody);
    staticBodies.push(trunkBody);
  }

  // Sculpted Cartoon Bushes framing pathways and expanded estate boundary
  const bushCoords = [
    [-5.2, 5.2, 1.15, 11],
    [5.2, 5.2, 1.15, 22],
    [-13.5, 5.0, 1.05, 33],
    [13.5, 5.0, 1.05, 44],
    [-34.5, 4.8, 0.95, 55],
    [40.5, 4.8, 0.95, 66],
    [-7.5, 17.0, 0.88, 77],
    [7.5, 17.0, 0.88, 88],
    [-14.5, 14.2, 0.9, 99],
    [14.5, 14.2, 0.9, 110],
    [-35.0, -6.5, 0.95, 121],
    [41.0, -6.5, 0.95, 132],
    [-35.0, -15.5, 0.9, 143],
    [41.0, -15.5, 0.9, 154],
    [-6.5, -22.5, 1.05, 165],
    [6.5, -22.5, 1.05, 176],
  ];
  for (const [bx, bz, bs, seed] of bushCoords) {
    const bush = createCartoonBush(bx, bz, bs, seed);
    scene.add(bush);
    const bushBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(bx, 0.55 * bs, bz));
    world.createCollider(RAPIER.ColliderDesc.cylinder(0.55 * bs, 0.70 * bs), bushBody);
    staticBodies.push(bushBody);
  }
  await yieldToMain();

  // 2. Architecture & Interactive Doors
  const arch = createArchitecture(scene, world, RAPIER, staticBodies, cameraBlockers);
  roofGroup = arch.roofGroup;
  if (cameraController) cameraController.setRoofGroup(roofGroup);
  doorControls = createInteractiveDoors(scene, world, RAPIER, doorColliders, interactionPoints);
  await yieldToMain();

  // 3. Room Interiors & Furnishings
  createRoomInteriors(scene, interactionPoints, handleRoomInteraction, world, RAPIER, staticBodies);
  await yieldToMain();

  // 4. Character
  characterRig = createCharacter(scene);

  // 5. Decorative Backdrop
  addDecorativeBackdrop(scene);
  await yieldToMain();

  // 6. Global Static Scene Batching & Matrix Freeze
  optimizeStaticScene(scene, cameraBlockers);
  await yieldToMain();

  // Expose statistics for testing & harness
  window.__cv = {
    stats: () => ({
      fps: Math.round(1000 / Math.max(1, frameAverage)),
      draws: renderer ? renderer.info.render.calls : 0,
      triangles: renderer ? renderer.info.render.triangles : 0,
    }),
  };

  return scene;
}

function addDecorativeBackdrop(scene) {
  // Distant Horizon Rolling Hills (85m - 120m far out on the horizon)
  const hills = [
    // North Horizon (far behind Sawah & Farm)
    [-38, -108, 56, materials.foliageMid],
    [6, -114, 64, materials.foliageDeep],
    [48, -106, 54, materials.foliageBright],
    // East Horizon (far behind Zen Garden / Taman)
    [108, -25, 52, materials.foliageDeep],
    [114, 22, 48, materials.foliageMid],
    // West Horizon (far behind Animal Farm & Pool)
    [-108, -25, 52, materials.foliageDeep],
    [-114, 22, 48, materials.foliageBright],
    // South Horizon (far beyond entrance driveway)
    [-32, 108, 48, materials.foliageBright],
    [36, 108, 48, materials.foliageMid],
  ];
  for (const [hx, hz, hs, hMat] of hills) {
    addSphere(scene, [hx, -hs * 0.32, hz], [hs, hs * 0.36, hs * 0.65], hMat, {
      shadow: false,
      receive: false,
      lowPoly: true,
    });
  }

  // High-altitude cartoon cumulus clouds floating gracefully well above roofs, trees, and gazebos
  const clouds = [
    [-24, 26, -36, 2.8],
    [24, 28, -42, 3.2],
    [-42, 27, -12, 2.4],
    [38, 26, 18, 2.6],
    [0, 32, -64, 3.4],
  ];
  for (const [cx, cy, cz, cs] of clouds) {
    const cloud = new THREE.Group();
    cloud.position.set(cx, cy, cz);
    scene.add(cloud);
    addSphere(cloud, [0, 0, 0], [cs, cs * 0.55, cs * 0.55], materials.trim, { shadow: false, receive: false, lowPoly: true });
    addSphere(cloud, [-cs * 0.72, -0.1, 0.02], [cs * 0.65, cs * 0.42, cs * 0.42], materials.trim, { shadow: false, receive: false, lowPoly: true });
    addSphere(cloud, [cs * 0.68, -0.08, -0.02], [cs * 0.68, cs * 0.45, cs * 0.42], materials.trim, { shadow: false, receive: false, lowPoly: true });
  }

  // Expanded sky hemisphere encompassing the distant horizon
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(175, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xbfe0d5, side: THREE.BackSide })
  );
  sky.userData.isDynamic = true;
  sky.matrixAutoUpdate = false;
  sky.updateMatrix();
  scene.add(sky);
}

function applyQuality(sceneRef, nextQuality, autoUpdate = true) {
  const selected = nextQuality === 'auto' ? (mobile ? 'mobile' : 'medium') : nextQuality;
  const preset = qualityPresets[selected] || qualityPresets.medium;
  activeQualityKey = selected;
  activePreset = preset;

  const dprLimit = Math.min(window.devicePixelRatio || 1, preset.pixelRatio, renderScale);
  renderer.setPixelRatio(dprLimit);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const shadowsOn = Boolean(preset.shadows) && !mobile;
  renderer.shadowMap.enabled = shadowsOn;
  renderer.shadowMap.autoUpdate = false;
  if (shadowsOn && renderer.shadowMap.type !== preset.shadowType) {
    renderer.shadowMap.type = preset.shadowType;
  }

  const sun = sceneRef?.userData?.sun;
  if (sun) {
    sun.castShadow = shadowsOn;
    if (shadowsOn && preset.shadowSize > 0) {
      if (sun.shadow.mapSize.x !== preset.shadowSize) {
        sun.shadow.mapSize.set(preset.shadowSize, preset.shadowSize);
        if (sun.shadow.map) {
          sun.shadow.map.dispose();
          sun.shadow.map = null;
        }
      }
      renderer.shadowMap.needsUpdate = true;
    }
  }

  if (camera && preset.cullDistance) {
    camera.far = preset.cullDistance;
    camera.updateProjectionMatrix();
  }
  if (sceneRef?.fog && preset.fogNear && preset.fogFar) {
    sceneRef.fog.near = preset.fogNear;
    sceneRef.fog.far = preset.fogFar;
  }

  $('quality-label').textContent = `${nextQuality.toUpperCase()} · ${selected.toUpperCase()}`;
  $('quality-select').value = quality;
  if (autoUpdate) {
    qualityCooldown = 0;
  }
}

function openDetails(id) {
  const content = portfolio.content[id];
  const room = portfolio.rooms.find((entry) => entry.id === id);
  if (!content || !room) return;
  panelReturnFocus = document.activeElement;
  keys.clear();
  currentRoom = room;
  updateRoomLabel(room);
  ui.panelTitle.textContent = room.title;
  ui.panelEyebrow.textContent = room.eyebrow;
  ui.panelContent.replaceChildren();
  ui.panelFooter.replaceChildren();

  const leadText = content.lead || content.intro;
  if (leadText) {
    const intro = document.createElement('p');
    intro.className = 'lead';
    intro.textContent = leadText;
    ui.panelContent.append(intro);
  }
  if (content.subtitle) {
    const sub = document.createElement('p');
    sub.className = 'subtitle';
    sub.style.cssText = 'color:#db553c;font-weight:700;font-size:12px;margin:-6px 0 10px;text-transform:uppercase;';
    sub.textContent = content.subtitle;
    ui.panelContent.append(sub);
  }
  if (content.detail || content.body) {
    const paragraph = document.createElement('p');
    paragraph.textContent = content.detail || content.body;
    ui.panelContent.append(paragraph);
  }
  if (content.quote) {
    const quote = document.createElement('blockquote');
    quote.className = 'cinematic-quote';
    quote.textContent = content.quote;
    ui.panelContent.append(quote);
  }

  const categories = content.categories || content.groups;
  if (categories) {
    for (const group of categories) {
      const heading = group.name || (Array.isArray(group) ? group[0] : '');
      const skills = group.items || (Array.isArray(group) ? group.slice(1) : []);
      const section = document.createElement('section');
      section.className = 'skill-group';
      const title = document.createElement('strong');
      title.textContent = heading;
      const list = document.createElement('div');
      list.className = 'skill-list';
      for (const skill of skills) list.append(makeTag(skill));
      section.append(title, list);
      ui.panelContent.append(section);
    }
  }

  if (content.milestones) {
    const list = document.createElement('div');
    list.className = 'timeline';
    for (const item of content.milestones) {
      const date = item.period || (Array.isArray(item) ? item[0] : '');
      const role = item.role ? `${item.role} · ${item.org}` : (Array.isArray(item) ? item[1] : '');
      const desc = item.desc || (Array.isArray(item) ? item[2] : '');
      const row = document.createElement('div');
      row.className = 'timeline-item';
      const marker = document.createElement('b');
      marker.textContent = date;
      const copy = document.createElement('p');
      copy.innerHTML = `<strong>${role}</strong><br>${desc}`;
      row.append(marker, copy);
      list.append(row);
    }
    ui.panelContent.append(list);
  }

  if (content.educationItems) {
    const list = document.createElement('div');
    list.className = 'timeline';
    for (const ed of content.educationItems) {
      const row = document.createElement('div');
      row.className = 'timeline-item';
      const marker = document.createElement('b');
      marker.textContent = `${ed.period} · ${ed.grade}`;
      const copy = document.createElement('p');
      copy.innerHTML = `<strong>${ed.institution} — ${ed.degree}</strong><br>${ed.desc}`;
      row.append(marker, copy);
      list.append(row);
    }
    ui.panelContent.append(list);
  }

  if (content.volunteeringItems) {
    const list = document.createElement('div');
    list.className = 'timeline';
    for (const vol of content.volunteeringItems) {
      const row = document.createElement('div');
      row.className = 'timeline-item';
      const marker = document.createElement('b');
      marker.textContent = `${vol.period} · ${vol.cause}`;
      const copy = document.createElement('p');
      copy.innerHTML = `<strong>${vol.role} · ${vol.org}</strong><br>${vol.desc}`;
      row.append(marker, copy);
      list.append(row);
    }
    ui.panelContent.append(list);
  }

  if (content.certifications) {
    const list = document.createElement('div');
    list.className = 'timeline';
    for (const cert of content.certifications) {
      const row = document.createElement('div');
      row.className = 'timeline-item';
      const marker = document.createElement('b');
      marker.textContent = `${cert.issued} · ${cert.issuer}`;
      const copy = document.createElement('p');
      copy.innerHTML = `<strong>${cert.name}</strong><br>Credential ID: ${cert.credentialId}`;
      row.append(marker, copy);
      list.append(row);
    }
    ui.panelContent.append(list);
  }

  if (content.githubStats) {
    const ghNote = document.createElement('p');
    ghNote.innerHTML = `<strong>${content.githubStats.totalContributions} contributions in the last year</strong> — <a href="${content.githubStats.profileUrl}" target="_blank" rel="noreferrer">${content.githubStats.displayName} ↗</a>`;
    ui.panelContent.append(ghNote);
  }

  const projectItems = content.items || content.projects;
  if (projectItems) {
    const list = document.createElement('div');
    list.className = 'project-list';
    for (const project of projectItems) {
      const item = document.createElement('article');
      item.className = 'project-item';
      const heading = document.createElement('div');
      heading.className = 'project-heading';
      const name = document.createElement('h3');
      name.textContent = project.title;
      const kind = document.createElement('span');
      kind.className = 'project-kind';
      kind.textContent = project.badge || project.category || project.kind || '';
      heading.append(name, kind);

      if (project.challenge) {
        const chal = document.createElement('p');
        chal.innerHTML = `<strong>Challenge:</strong> ${project.challenge}`;
        item.append(chal);
      } else if (project.description) {
        const desc = document.createElement('p');
        desc.textContent = project.description;
        item.append(desc);
      }

      if (project.engineering) {
        const eng = document.createElement('p');
        eng.innerHTML = `<strong>Architecture:</strong> ${project.engineering}`;
        item.append(eng);
      }

      const tags = document.createElement('div');
      tags.className = 'skill-list';
      const stackList = project.stack || project.tags || [];
      for (const tag of stackList) tags.append(makeTag(tag));
      item.append(heading, tags);

      if (project.github || project.demo) {
        const actions = document.createElement('div');
        actions.className = 'project-actions';
        actions.style.cssText = 'margin-top:8px;display:flex;gap:8px;';
        if (project.github) {
          const gh = document.createElement('a');
          gh.className = 'project-btn project-btn-primary';
          gh.href = project.github;
          gh.target = '_blank';
          gh.rel = 'noreferrer';
          gh.textContent = 'View Code ↗';
          actions.append(gh);
        }
        if (project.demo) {
          const dm = document.createElement('a');
          dm.className = 'project-btn project-btn-secondary';
          dm.href = project.demo;
          dm.target = '_blank';
          dm.rel = 'noreferrer';
          dm.textContent = 'Live Demo ↗';
          actions.append(dm);
        }
        item.append(actions);
      }

      list.append(item);
    }
    ui.panelContent.append(list);
  }

  const stages = content.stages || content.disciplines || content.steps;
  if (stages) {
    for (const s of stages) {
      const step = document.createElement('div');
      step.className = 'process-step';
      const strong = document.createElement('strong');
      strong.textContent = s.step ? `${s.step} · ${s.name}` : (s.title || (Array.isArray(s) ? `${s[0]} · ${s[1]}` : ''));
      const detail = document.createElement('small');
      detail.textContent = s.desc || s.text || (Array.isArray(s) ? s[2] : '');
      step.append(strong, detail);
      ui.panelContent.append(step);
    }
  }

  if (content.email) {
    const link = document.createElement('a');
    link.className = 'contact-mail';
    link.href = `mailto:${content.email}`;
    link.textContent = content.email;
    ui.panelContent.append(link);
    if (content.links) {
      const links = document.createElement('div');
      links.className = 'contact-links';
      for (const profile of content.links) {
        const anchor = document.createElement('a');
        anchor.href = profile.href;
        anchor.target = '_blank';
        anchor.rel = 'noreferrer';
        anchor.textContent = profile.label;
        links.append(anchor);
      }
      ui.panelContent.append(links);
    }
    if (content.note) {
      const note = document.createElement('p');
      note.className = 'contact-note';
      note.textContent = content.note;
      ui.panelContent.append(note);
    }
  }
  if (content.tags) for (const tag of content.tags) ui.panelFooter.append(makeTag(tag));

  ui.detail.classList.add('is-visible');
  ui.detail.setAttribute('aria-hidden', 'false');
  panelOpen = true;
  paused = false;
  $('pause-button').classList.add('is-visible');
  requestAnimationFrame(() => $('panel-close').focus());
}

function makeTag(value) {
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = value;
  return tag;
}

function closeDetails() {
  ui.detail.classList.remove('is-visible');
  ui.detail.setAttribute('aria-hidden', 'true');
  panelOpen = false;
  keys.clear();
  if (!settingsOpen && !paused) $('pause-button').classList.remove('is-visible');
  if (panelReturnFocus instanceof HTMLElement && panelReturnFocus.isConnected && !panelReturnFocus.closest('[aria-hidden="true"]')) {
    panelReturnFocus.focus({ preventScroll: true });
  } else {
    $('room-name').focus({ preventScroll: true });
  }
}

function openSettings() {
  if (!renderer) {
    openDetails('skills');
    return;
  }
  panelReturnFocus = document.activeElement;
  keys.clear();
  settingsOpen = true;
  $('settings-panel').classList.add('is-visible');
  $('settings-panel').setAttribute('aria-hidden', 'false');
  $('pause-button').classList.add('is-visible');
  requestAnimationFrame(() => $('settings-close').focus());
}

function closeSettings() {
  settingsOpen = false;
  $('settings-panel').classList.remove('is-visible');
  $('settings-panel').setAttribute('aria-hidden', 'true');
  if (!panelOpen && !paused) $('pause-button').classList.remove('is-visible');
  if (panelReturnFocus instanceof HTMLElement && panelReturnFocus.isConnected) {
    panelReturnFocus.focus({ preventScroll: true });
  } else {
    $('settings-button').focus({ preventScroll: true });
  }
}

function updateRoomLabel(room) {
  uiManager.updateRoom(room);
}

function handleRoomInteraction(id) {
  startCinematic(id);
}

function startCinematic(id) {
  if (!renderer || !started) {
    openDetails(id);
    return;
  }
  if (tourActive) endTour();
  if (panelOpen) closeDetails();
  if (settingsOpen) closeSettings();

  const startedOk = cinematicDirector?.startScene(id, {
    cameraDistance,
    yaw,
    pitch,
  });

  if (startedOk) {
    keys.clear();
    const room = portfolio.rooms.find((r) => r.id === id);
    if (room) {
      currentRoom = room;
      updateRoomLabel(room);
    }
    ui.prompt.classList.remove('is-visible');
    $('pause-button').classList.add('is-visible');
  }
}

function setRoom(id, options = {}) {
  const room = portfolio.rooms.find((entry) => entry.id === id);
  if (!room) return;
  if (options.teleport && playerBody) {
    physX = room.position[0];
    physY = room.position[1];
    physZ = room.position[2];
    if (roofGroup) roofGroup.visible = physZ > 4.0;
    playerBody.setTranslation({ x: physX, y: physY, z: physZ }, true);
    playerBody.setNextKinematicTranslation({ x: physX, y: physY, z: physZ });
    // Note: Rapier CharacterController does NOT have a reset() method, do not call it
    grounded = true;
    jumpVelocity = 0;
    cameraSafeDistance = cameraDistanceGoal;
    lastRoomVisited = room.id;
    characterRig.character.position.set(physX, physY, physZ);
    characterRig.character.rotation.y = room.facing;
    yaw = room.yaw !== undefined ? room.yaw : room.facing;
    pitch = room.pitch !== undefined ? room.pitch : 0.22;
  }
  currentRoom = room;
  updateRoomLabel(room);
  if (options.open) {
    if (renderer && started) startCinematic(id);
    else openDetails(id);
  }
}

let teleportCameraOverride = null;

if (typeof window !== 'undefined') {
  window.__teleport = (x, y, z, facing = 0, camYaw = 0, camPitch = 0.22, options = {}) => {
    physX = x;
    physY = y;
    physZ = z;
    if (playerBody) {
      playerBody.setTranslation({ x, y, z }, true);
      playerBody.setNextKinematicTranslation({ x, y, z });
    }
    if (characterRig?.character) {
      if (options.charOffset) {
        characterRig.character.position.set(x + options.charOffset[0], y + options.charOffset[1], z + options.charOffset[2]);
      } else {
        characterRig.character.position.set(x, y, z);
      }
      characterRig.character.rotation.y = facing;
      if (options.charVisible !== undefined) {
        characterRig.character.visible = Boolean(options.charVisible);
      } else {
        characterRig.character.visible = true;
      }
    }
    yaw = camYaw;
    pitch = camPitch;

    if (options.camPos && options.targetPos) {
      teleportCameraOverride = {
        cam: options.camPos,
        target: options.targetPos,
      };
      camera.position.set(options.camPos[0], options.camPos[1], options.camPos[2]);
      camera.lookAt(options.targetPos[0], options.targetPos[1], options.targetPos[2]);
      return;
    } else {
      teleportCameraOverride = null;
    }

    const isHouse = Math.abs(x) < 22 && z > -21 && z < 5;
    cameraDistance = options.camDistance !== undefined ? options.camDistance : (isHouse ? 3.4 : 4.5);
    const offsetY = options.camOffsetY !== undefined ? options.camOffsetY : 0.95;
    cameraTarget.set(x, y + offsetY, z);
    const horizontal = cameraDistance * Math.cos(pitch);
    camera.position.set(
      x + Math.sin(yaw) * horizontal,
      y + offsetY + 0.5 + Math.sin(pitch) * cameraDistance,
      z + Math.cos(yaw) * horizontal
    );
    lookPoint.copy(cameraTarget);
    lookPoint.y += 0.22;
    camera.lookAt(lookPoint);
  };
}

function initWorldMarkers() {
  if (!ui.markersContainer) return;
  ui.markersContainer.innerHTML = '';
  ui.markersContainer.style.display = 'none';
  markerElements = WORLD_MARKERS.map((m) => {
    const el = document.createElement('div');
    el.className = 'world-marker';
    el.setAttribute('data-target', m.id);
    el.innerHTML = `
      <div class="marker-icon-box">${m.icon}</div>
      <div class="marker-text">
        <strong class="marker-title">${m.label}</strong>
        <span class="marker-sub">${m.sub}</span>
      </div>
    `;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onMarkerClick(m);
    });
    ui.markersContainer.appendChild(el);
    return { ...m, el, vPos: new THREE.Vector3(...m.pos) };
  });
}

function onMarkerClick(marker) {
  if (overviewMode) {
    toggleOverviewMode(false);
  }
  if (marker.targetRoom) {
    if (portfolio.rooms.some((r) => r.id === marker.targetRoom)) {
      setRoom(marker.targetRoom, { teleport: true });
    } else if (marker.targetRoom === 'pool') {
      teleportToZone(-24.5, 1.12, -4.0, 0);
    } else if (marker.targetRoom === 'farm') {
      teleportToZone(-30.0, 1.12, -28.0, Math.PI);
    } else if (marker.targetRoom === 'rice') {
      teleportToZone(18.0, 1.12, -26.0, Math.PI);
    } else if (marker.targetRoom === 'zen') {
      teleportToZone(33.0, 1.12, -4.5, -0.45);
    } else if (marker.targetRoom === 'security') {
      teleportToZone(0.0, 1.12, 26.0, 0);
    } else if (marker.targetRoom === 'road') {
      teleportToZone(0.0, 1.12, 33.0, 0);
    }
  }
}

function teleportToZone(x, y, z, facing = 0) {
  physX = x;
  physY = y;
  physZ = z;
  if (playerBody) {
    playerBody.setTranslation({ x, y, z }, true);
    playerBody.setNextKinematicTranslation({ x, y, z });
  }
  if (characterRig?.character) {
    characterRig.character.position.set(x, y, z);
    characterRig.character.rotation.y = facing;
  }
  yaw = facing;
  pitch = 0.22;
  if (roofGroup) roofGroup.visible = physZ > 4.0;
}

function updateWorldMarkers() {
  if (!markerElements.length || !camera || !ui.markersContainer) return;
  // World map markers only display when World Map is explicitly toggled active
  const showMarkers = overviewMode;
  if (!showMarkers) {
    if (ui.markersContainer.style.display !== 'none') {
      ui.markersContainer.style.display = 'none';
    }
    return;
  }
  if (ui.markersContainer.style.display !== 'block') {
    ui.markersContainer.style.display = 'block';
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  for (let i = 0; i < markerElements.length; i += 1) {
    const item = markerElements[i];
    markerProjectVec.copy(item.vPos);
    markerProjectVec.project(camera);

    if (markerProjectVec.z > 1.0 || markerProjectVec.z < -1.0) {
      item.el.style.display = 'none';
      continue;
    }

    const screenX = (markerProjectVec.x * 0.5 + 0.5) * w;
    const screenY = (-markerProjectVec.y * 0.5 + 0.5) * h;

    if (screenX < -60 || screenX > w + 60 || screenY < -40 || screenY > h + 40) {
      item.el.style.display = 'none';
      continue;
    }

    item.el.style.display = 'flex';
    item.el.style.transform = `translate(-50%, -50%) translate3d(${Math.round(screenX)}px, ${Math.round(screenY)}px, 0)`;
  }
}

function toggleOverviewMode(force) {
  overviewMode = typeof force === 'boolean' ? force : !overviewMode;
  if (ui.mapBtn) {
    ui.mapBtn.classList.toggle('is-active', overviewMode);
    ui.mapBtn.setAttribute('title', overviewMode ? 'Hide World Map [M]' : 'World Map Overview [M]');
    ui.mapBtn.setAttribute('aria-label', overviewMode ? 'Hide World Map [M]' : 'World Map Overview [M]');
  }
  if (ui.mapPill) {
    ui.mapPill.classList.toggle('is-visible', overviewMode);
  }
  const settingToggle = $('worldmap-setting-toggle');
  if (settingToggle && settingToggle.checked !== overviewMode) {
    settingToggle.checked = overviewMode;
  }
  if (!overviewMode && ui.markersContainer) {
    ui.markersContainer.style.display = 'none';
  }
  if (roofGroup) {
    roofGroup.visible = true;
  }
}

function setPromptUI(visible, key = '', label = '', touch = 'Interact') {
  uiManager.setPrompt(visible, key, label, touch);
}

function findInteraction() {
  if (cinematicDirector && cinematicDirector.isActive()) {
    setPromptUI(false);
    return;
  }

  // 1. If currently interacting, display active interaction lifecycle status
  if (worldInteractions && worldInteractions.isActive()) {
    if (worldInteractions.mode === InteractionMode.SITTING) {
      if (worldInteractions.lifecycleState === InteractionState.APPROACHING) {
        setPromptUI(true, 'C', 'Sitting down...', '...');
      } else if (worldInteractions.lifecycleState === InteractionState.RESTORING) {
        setPromptUI(true, 'C', 'Standing up...', '...');
      } else {
        setPromptUI(true, 'C', 'Stand up', 'Stand');
      }
      return;
    }

    if (worldInteractions.mode === InteractionMode.DOOR) {
      const doorState = doorControls?.getState?.();
      setPromptUI(true, 'E', doorState === 'closing' ? 'Closing the garden door...' : 'Opening the garden door...', '...');
      return;
    }

    if (worldInteractions.mode === InteractionMode.INSPECTING) {
      setPromptUI(true, 'F', 'Resume walking', 'Resume');
      return;
    }
  }

  // 2. We are in normal locomotion: evaluate available targets
  const nearbySeat = worldInteractions ? worldInteractions.getNearbySeat(physX, physZ, physY) : null;
  const nearbyInspectable = worldInteractions ? worldInteractions.getNearbyInspectable(physX, physZ) : null;

  // Door interaction candidate (E) - front entrance, rear terrace, or second floor balcony glass doors
  let doorCandidate = null;
  let bestDoorDist = Infinity;
  for (const item of interactionPoints) {
    if (item.type !== 'door') continue;
    if (item.position?.y !== undefined && Math.abs(physY - item.position.y) > 2.5) continue;
    const dist = Math.hypot(physX - item.position.x, physZ - item.position.z);
    if (dist < item.radius && dist < bestDoorDist) {
      bestDoorDist = dist;
      doorCandidate = { point: item, dist };
    }
  }

  // Room exhibit beacons (E)
  let bestRoom = null;
  let bestRoomDist = Infinity;
  for (let i = 0; i < interactionPoints.length; i += 1) {
    const item = interactionPoints[i];
    if (item.type === 'door') continue;
    if (item.position?.y !== undefined && Math.abs(physY - item.position.y) > 2.8) continue;
    const dist = Math.hypot(physX - item.position.x, physZ - item.position.z);
    if (dist < item.radius && dist < bestRoomDist) {
      bestRoom = item;
      bestRoomDist = dist;
    }
  }

  // Distance to seat
  const seatDist = nearbySeat ? Math.hypot(physX - nearbySeat.pos[0], physZ - nearbySeat.pos[2]) : Infinity;

  // Clear single-target prompt priority:
  // 1. Door (E) takes top priority when in doorway clearance
  // 2. Bench/Seat (C) takes priority over room beacons if closer or in garden/lounge
  // 3. Room Exhibit (E)
  // 4. Environmental Inspection (F)
  let chosen = null;
  if (doorCandidate) {
    const pt = doorCandidate.point;
    const isDoorOpen = pt.controls?.isOpen?.() ?? false;
    chosen = {
      key: 'E',
      label: pt.getLabel ? pt.getLabel() : (isDoorOpen ? 'Close door' : 'Open door'),
      touch: isDoorOpen ? 'Close' : 'Open',
      target: pt,
    };
    currentInteraction = pt;
  } else if (nearbySeat && (seatDist <= bestRoomDist)) {
    chosen = {
      key: 'C',
      label: `Sit down (${nearbySeat.label})`,
      touch: 'Sit',
      target: nearbySeat,
    };
    currentInteraction = null;
  } else if (bestRoom) {
    chosen = {
      key: 'E',
      label: bestRoom.getLabel ? bestRoom.getLabel() : `Explore ${bestRoom.title}`,
      touch: 'Explore',
      target: bestRoom,
    };
    currentInteraction = bestRoom;
  } else if (nearbySeat) {
    chosen = {
      key: 'C',
      label: `Sit down (${nearbySeat.label})`,
      touch: 'Sit',
      target: nearbySeat,
    };
    currentInteraction = null;
  } else if (nearbyInspectable) {
    chosen = {
      key: 'F',
      label: `Inspect ${nearbyInspectable.label}`,
      touch: 'Inspect',
      target: nearbyInspectable,
    };
    currentInteraction = null;
  } else {
    currentInteraction = null;
  }

  const canShowPrompt = Boolean(started && !panelOpen && !settingsOpen && !tourActive && (!cinematicDirector || !cinematicDirector.isActive()));

  if (chosen && canShowPrompt) {
    setPromptUI(true, chosen.key, chosen.label, chosen.touch);
  } else {
    setPromptUI(false);
  }
}

/**
 * Single source of truth for key -> interaction. Each key owns exactly one interaction type:
 *   KeyC: sit / stand (seats only). NEVER touches doors or room exhibits.
 *   KeyE: doors and room exhibits (interactionPoints only). NEVER triggers sitting.
 *   KeyF: inspect (inspectables only).
 * A key never executes another key's interaction, so the prompt and the action cannot diverge.
 */
function dispatchInteraction(code) {
  const w = worldInteractions;
  const reject = (reason) => {
    if (import.meta.env.DEV) console.log('[Interaction] rejected', { code, reason, mode: w?.mode, state: w?.lifecycleState });
    return false;
  };
  if (panelOpen || settingsOpen) return reject('ui_open');
  if (cinematicDirector && cinematicDirector.isActive()) return reject('cinematic_active');
  if (!w) return reject('no_manager');
  if (w.isTransitioning()) return reject('transitioning');

  let result = false;
  if (code === 'KeyC') {
    // KeyC: ONLY seat sitting & standing. NEVER triggers door or exhibits!
    if (w.mode === InteractionMode.SITTING) {
      result = w.standUp();
    } else if (w.mode !== InteractionMode.NONE) {
      return reject('other_interaction_active');
    } else {
      const seat = w.getNearbySeat(physX, physZ, physY);
      if (!seat) return reject('no_seat_in_range');
      if (import.meta.env.DEV) console.log('[Interaction] KeyC -> sit on seat:', seat.id);
      result = w.toggleSit(physX, physZ, { cameraDistance, yaw, pitch }, physY);
    }
  } else if (code === 'KeyE') {
    // KeyE: ONLY doors and room exhibits. NEVER triggers sitting!
    if (w.mode !== InteractionMode.NONE) return reject('other_interaction_active');

    // 1. If findInteraction() already selected an active door or room exhibit for KeyE, execute it directly!
    let target = null;
    if (currentInteraction && (currentInteraction.type === 'door' || currentInteraction.type === 'room' || typeof currentInteraction.action === 'function')) {
      target = currentInteraction;
    }

    if (!target) {
      // Priority 1: Check nearest door (filtering by vertical height / floor elevation!)
      let bestDoorDist = Infinity;
      for (const item of interactionPoints) {
        if (item.type !== 'door') continue;
        if (item.position?.y !== undefined && Math.abs(physY - item.position.y) > 2.5) continue;
        const dist = Math.hypot(physX - item.position.x, physZ - item.position.z);
        if (dist < item.radius && dist < bestDoorDist) {
          bestDoorDist = dist;
          target = item;
        }
      }
    }

    if (!target) {
      // Priority 2: Check nearest room exhibit
      let bestDist = Infinity;
      for (const item of interactionPoints) {
        if (item.type === 'door') continue;
        if (item.position?.y !== undefined && Math.abs(physY - item.position.y) > 2.8) continue;
        const dist = Math.hypot(physX - item.position.x, physZ - item.position.z);
        if (dist < item.radius && dist < bestDist) {
          bestDist = dist;
          target = item;
        }
      }
    }

    if (!target) return reject('no_e_target_in_range');
    if (import.meta.env.DEV) console.log('[Interaction] KeyE -> execute target:', target.id);
    result = target.action() !== false;
  } else if (code === 'KeyF') {
    // KeyF: ONLY environmental inspectables.
    if (w.mode === InteractionMode.INSPECTING) {
      result = w.cancelInspect();
    } else if (w.mode !== InteractionMode.NONE) {
      return reject('other_interaction_active');
    } else {
      const inspectable = w.getNearbyInspectable(physX, physZ);
      if (!inspectable) return reject('no_inspectable_in_range');
      if (import.meta.env.DEV) console.log('[Interaction] KeyF -> inspect:', inspectable.id);
      result = w.toggleInspect(physX, physZ, { cameraDistance, yaw, pitch });
    }
  }

  findInteraction();
  return Boolean(result);
}


function setPaused(value) {
  paused = value;
  $('pause-button').textContent = paused ? '▶' : 'Ⅱ';
  $('pause-button').setAttribute('aria-label', paused ? 'Resume exploration' : 'Pause exploration');
  $('pause-button').classList.toggle('is-visible', paused || panelOpen || settingsOpen);
  if (paused) ui.prompt.classList.remove('is-visible');
  if (!paused && currentInteraction) findInteraction();
}

const tourStops = [
  {
    id: 'yard',
    step: '01 / 10',
    name: 'Front Yard & Garden Gate',
    subtitle: 'WELCOME TO VICKY’S DEVELOPER ESTATE',
    intro: 'Welcome to M. Vicky Mosafan’s 3D interactive portfolio! Follow the guided tour in the exact sequence of my LinkedIn & GitHub profile.',
    position: [0, 1.12, 16.8],
    archX: 0,
    facing: Math.PI,
    cameraYaw: 0,
    cameraPitch: 0.2,
  },
  {
    id: 'about',
    step: '02 / 10',
    name: '01 · About Me (Living Room)',
    subtitle: 'AI ENGINEER · FULL-STACK DEVELOPER · SYSTEM ARCHITECT',
    intro: 'Full-Stack Web Developer & AI Engineer with GPA 3.75/4.00 and 1,039+ GitHub contributions in the last year.',
    position: [-1.0, 1.12, 2.0],
    archX: 0,
    facing: -Math.PI * 0.5,
    cameraYaw: -Math.PI * 0.5,
    cameraPitch: 0.16,
  },
  {
    id: 'experience',
    step: '03 / 10',
    name: '02 · Work Experience (Library Nook)',
    subtitle: 'DESTINO COPYTRADE · MQL5 · POSYandu · ANTOSA · MANDIRI',
    intro: '5 verified LinkedIn roles across FinTech copytrading, MQL5 algorithmic trading, clinical health SaaS, and mobile banking.',
    position: [10.0, 6.32, -1.5],
    archX: 5.5,
    facing: -0.25,
    cameraYaw: -0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'bedroom',
    step: '04 / 10',
    name: '03 · Education (Master Suite)',
    subtitle: 'UNIVERSITAS MUHAMMADIYAH JEMBER · GPA 3.75 / 4.00',
    intro: 'Bachelor of Computer Science (Informatics Engineering, 2023–2027) and MAN 2 Banyuwangi Science Track.',
    position: [-10.0, 6.32, -1.5],
    archX: -5.5,
    facing: 0.25,
    cameraYaw: 0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'bathroom',
    step: '05 / 10',
    name: '04 · Volunteering (Wellness Sanctuary)',
    subtitle: 'ELDERLY HEALTH DIGITIZATION & STUDENT MENTORSHIP',
    intro: 'Community volunteering for Posyandu lansia clinical digitization and open-source web/AI workshops.',
    position: [0.0, 6.32, -1.5],
    archX: 0,
    facing: 0.0,
    cameraYaw: 0.0,
    cameraPitch: 0.22,
  },
  {
    id: 'garage',
    step: '06 / 10',
    name: '05 · Licenses & Certifications (BMW Garage)',
    subtitle: 'MANDIRI · ALIBABA CLOUD · CODEPOLITAN · DICODING',
    intro: '7 verified industry credentials across mobile banking, cloud architecture, full-stack engineering, and applied AI.',
    position: [20.5, 1.12, 2.0],
    archX: 16.0,
    facing: -0.35,
    cameraYaw: -0.2,
    cameraPitch: 0.2,
  },
  {
    id: 'projects',
    step: '07 / 10',
    name: '06 · Projects (Project Gallery)',
    subtitle: 'DESTINO CT · INTELLICHAT · POSYANDU · MQL5 · SMART KOST',
    intro: '6 production case studies with live demos and open-source repositories.',
    position: [-10.0, 1.12, -1.5],
    archX: -5.5,
    facing: 0.25,
    cameraYaw: 0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'skills',
    step: '08 / 10',
    name: '07 · Architectural Domain & Core Technologies & Tooling',
    subtitle: 'LANGUAGES · FRONTEND · BACKEND · DB · AI TOOLING · DEVOPS',
    intro: 'Full matrix of languages, React 19 / Next.js 15, Node.js / NestJS / Laravel, PostgreSQL / Supabase Vector, and AI Augmented Tooling.',
    position: [10.0, 1.12, -1.5],
    archX: 5.5,
    facing: -0.25,
    cameraYaw: -0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'process',
    step: '09 / 10',
    name: '08 · GitHub Contributions (Creative Studio)',
    subtitle: '1,039 CONTRIBUTIONS · VICKYYMOSAFAN (M. VICKY MOSAFAN)',
    intro: '1,039 contributions in the last year on github.com/vickyymosafan powered by a 6-stage deterministic engineering workflow.',
    position: [20.5, 6.32, -1.5],
    archX: 16.0,
    facing: -0.25,
    cameraYaw: -0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'contact',
    step: '10 / 10',
    name: '09 · Contact & Links (Garden Terrace)',
    subtitle: 'LINKEDIN · GITHUB · EMAIL · INSTAGRAM',
    intro: 'Connect directly via linkedin.com/in/vickymosafan or github.com/vickyymosafan.',
    position: [0.0, 1.12, -22.5],
    archX: 0,
    facing: Math.PI,
    cameraYaw: 0.0,
    cameraPitch: 0.22,
  },
];

function planTourWaypoints(startX, startZ, targetStop) {
  const points = [];
  const targetX = targetStop.position[0];
  const targetY = targetStop.position[1] !== undefined ? targetStop.position[1] : 1.12;
  const targetZ = targetStop.position[2];
  const targetArchX = targetStop.archX;

  const startIsUpper = physY > 3.0;
  const targetIsUpper = targetY > 3.0;

  const isOutdoor = startZ > 4.2 || startZ < -18.0;
  const targetIsOutdoor = targetZ > 4.2 || targetZ < -18.0;

  // Handle cross-floor traversal between Ground Floor and Second Floor
  if (!startIsUpper && targetIsUpper) {
    // Ground to Upper: Navigate to foot of side staircase (x = 4.05, z = 1.0), ascend to landing (x = 4.05, z = -6.0)
    if (isOutdoor) {
      points.push([0, 1.12, 3.8]);
    }
    points.push([4.05, 1.12, 1.0]); // Foot of grand architectural side staircase
    points.push([4.05, 6.32, -6.0]); // Top mezzanine landing
    if (targetX > 4.5) {
      // East side (Library / Studio)
      points.push([5.5, 6.32, -6.8]);
      if (targetArchX === 16.0) points.push([16.0, 6.32, -2.7]);
    } else {
      // West side (Bathroom / Bedroom)
      points.push([2.0, 6.32, -6.5]);
      if (targetArchX === -5.5) points.push([-5.5, 6.32, -2.7]);
    }
    points.push([targetX, targetY, targetZ]);
    return points;
  }

  if (startIsUpper && !targetIsUpper) {
    // Upper to Ground: Walk along landing, descend staircase to ground
    if (startX > 4.5) {
      points.push([5.5, 6.32, -6.8]);
    } else {
      points.push([2.0, 6.32, -6.5]);
    }
    points.push([4.05, 6.32, -6.0]); // Top of staircase
    points.push([4.05, 1.12, 1.0]); // Foot of staircase on ground floor
    if (targetIsOutdoor) {
      if (targetZ > 4.2) {
        points.push([0, 1.12, 3.8]);
        points.push([0, 1.12, 6.2]);
      } else {
        points.push([0, 1.12, -18.5]);
      }
    } else {
      points.push([0, 1.12, targetZ]);
      if (Math.abs(targetArchX) > 0.5) {
        const enterArchZ = targetArchX === 5.5 ? 2.0 : targetZ;
        points.push([targetArchX, 1.12, enterArchZ]);
      }
    }
    points.push([targetX, targetY, targetZ]);
    return points;
  }

  if (startIsUpper && targetIsUpper) {
    // Upper floor room to room
    if (startX > 4.5 && targetX <= 4.5) {
      // East to West
      points.push([5.5, 6.32, -6.8]);
      points.push([4.05, 6.32, -6.0]);
      points.push([2.0, 6.32, -6.5]);
      if (targetArchX === -5.5) points.push([-5.5, 6.32, -2.7]);
    } else if (startX <= 4.5 && targetX > 4.5) {
      // West to East
      points.push([2.0, 6.32, -6.5]);
      points.push([4.05, 6.32, -6.0]);
      points.push([5.5, 6.32, -6.8]);
      if (targetArchX === 16.0) points.push([16.0, 6.32, -2.7]);
    } else if (Math.abs(targetArchX) > 0.5) {
      points.push([targetArchX, 6.32, -2.7]);
    }
    points.push([targetX, targetY, targetZ]);
    return points;
  }

  // Ground floor movement
  if (isOutdoor && targetIsOutdoor) {
    points.push([targetX, targetY, targetZ]);
  } else if (isOutdoor && !targetIsOutdoor) {
    if (startZ > 7.0) points.push([0, 1.12, 6.2]);
    points.push([0, 1.12, 3.8]);
    points.push([0, 1.12, targetZ]);
    if (Math.abs(targetArchX) > 0.5) {
      const enterArchZ = targetArchX === 5.5 ? 2.0 : targetZ;
      points.push([targetArchX, 1.12, enterArchZ]);
    }
    points.push([targetX, targetY, targetZ]);
  } else if (!isOutdoor && targetIsOutdoor) {
    if (Math.abs(startX) > 2.0) {
      const exitArchX = startX < 0 ? -5.5 : 5.5;
      const archZ = exitArchX === 5.5 ? 2.0 : startZ;
      points.push([exitArchX, 1.12, archZ]);
    }
    points.push([0, 1.12, startZ]);
    if (targetZ > 4.2) {
      points.push([0, 1.12, 3.8]);
      points.push([0, 1.12, 6.2]);
    } else {
      points.push([0, 1.12, -18.5]);
    }
    points.push([targetX, targetY, targetZ]);
  } else {
    // Indoor ground room to room
    if (Math.abs(startX) > 2.0) {
      const exitArchX = startX < 0 ? -5.5 : 5.5;
      const archZ = exitArchX === 5.5 ? 2.0 : startZ;
      points.push([exitArchX, 1.12, archZ]);
    }
    const midZ = (targetArchX === 5.5 || startX > 2.0) ? 2.0 : targetZ;
    points.push([0, 1.12, midZ]);
    if (Math.abs(targetArchX) > 0.5) {
      const enterArchZ = targetArchX === 5.5 ? 2.0 : targetZ;
      points.push([targetArchX, 1.12, enterArchZ]);
    }
    points.push([targetX, targetY, targetZ]);
  }
  return points;
}

function beginTour() {
  if (!renderer) {
    startExperience();
    openDetails('about');
    return;
  }
  if (!started) startExperience();
  if (panelOpen) closeDetails();
  if (settingsOpen) closeSettings();

  tourActive = true;
  paused = false;
  $('pause-button').classList.add('is-visible');
  ui.tourToast.classList.add('is-visible');

  startTourLeg(0);
}

function startTourLeg(index) {
  tourStopIndex = index;
  tourWaitingAtStop = false;
  tourWaitTimer = 0;
  const stop = tourStops[tourStopIndex];
  if (!stop) {
    endTour('Tour complete! Enjoy exploring the house.');
    return;
  }

  ui.tourStepBadge.textContent = `TOUR · ${stop.step}`;
  ui.tourTitle.textContent = stop.name;
  ui.tourCaption.textContent = `Walking towards ${stop.name}…`;
  ui.tourProgress.style.width = '0%';

  tourWaypoints = planTourWaypoints(physX, physZ, stop);
  tourWaypointIndex = 0;
}

function advanceTourStop() {
  if (!tourActive) return;
  if (tourStopIndex < tourStops.length - 1) {
    startTourLeg(tourStopIndex + 1);
  } else {
    endTour('Tour complete! Wander anywhere.');
  }
}

function endTour(message = 'Tour stopped. Take a look around.') {
  tourActive = false;
  tourWaitingAtStop = false;
  tourWaitTimer = 0;
  tourWaypoints = [];
  tourWaypointIndex = 0;
  ui.tourCaption.textContent = message;
  ui.tourProgress.style.width = '100%';
  setTimeout(() => {
    if (!tourActive) ui.tourToast.classList.remove('is-visible');
  }, 1600);
  $('pause-button').classList.remove('is-visible');
}

function startExperience() {
  if (started) return;
  started = true;
  document.getElementById('experience')?.classList.add('is-started');
  ui.welcome.classList.add('is-gone');
  ui.welcome.setAttribute('aria-hidden', 'true');
  ui.welcome.inert = true;
  if (renderer) ui.perf.classList.add('is-visible');
  $('pause-button').classList.add('is-visible');
  $('controls-note').hidden = mobile;
  if (renderer) renderer.domElement.focus({ preventScroll: true });
  else document.querySelector('.room-link')?.focus({ preventScroll: true });
}

function getInputVector(dt) {
  let x = 0;
  let z = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) z += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) z -= 1;
  x += touch.x;
  z -= touch.y;
  const length = Math.hypot(x, z);
  if (length > 1) {
    x /= length;
    z /= length;
  }

  if (tourActive) {
    if (tourWaitingAtStop) {
      // Paused at the tour stop
      x = 0;
      z = 0;
      const stop = tourStops[tourStopIndex];
      if (stop) {
        // Smoothly rotate character to face the display board
        let charDiff = stop.facing - characterRig.character.rotation.y;
        charDiff = Math.atan2(Math.sin(charDiff), Math.cos(charDiff));
        characterRig.character.rotation.y += charDiff * Math.min(1.0, dt * 6.0);

        // Smoothly align camera to stop camera yaw & pitch
        let camDiff = stop.cameraYaw - yaw;
        camDiff = Math.atan2(Math.sin(camDiff), Math.cos(camDiff));
        yaw += camDiff * Math.min(1.0, dt * 4.5);
        pitch = THREE.MathUtils.damp(pitch, stop.cameraPitch, 4.5, dt);
      }
      return { x: 0, z: 0 };
    }

    if (tourWaypoints && tourWaypointIndex < tourWaypoints.length) {
      const target = tourWaypoints[tourWaypointIndex];
      const dx = target[0] - physX;
      const dz = target[2] - physZ;
      const distance = Math.hypot(dx, dz);
      const isFinalWaypoint = tourWaypointIndex === tourWaypoints.length - 1;
      const threshold = isFinalWaypoint ? 0.32 : 0.45;

      if (distance < threshold) {
        tourWaypointIndex += 1;
        if (tourWaypointIndex >= tourWaypoints.length) {
          // Arrived at the room beacon stop
          tourWaitingAtStop = true;
          tourWaitTimer = 4.8;
          const stop = tourStops[tourStopIndex];
          if (stop) {
            ui.tourStepBadge.textContent = `STOP · ${stop.step}`;
            ui.tourTitle.textContent = stop.name;
            ui.tourCaption.textContent = stop.intro;
            ui.tourProgress.style.width = '0%';
            const roomObj = portfolio.rooms.find((r) => r.id === stop.id);
            if (roomObj) {
              currentRoom = roomObj;
              updateRoomLabel(roomObj);
            }
          }
          return { x: 0, z: 0 };
        }
      }

      const activeTarget = tourWaypoints[tourWaypointIndex];
      if (activeTarget) {
        const routeX = activeTarget[0] - physX;
        const routeZ = activeTarget[2] - physZ;
        const routeDist = Math.hypot(routeX, routeZ) || 1;

        // Smoothly steer camera towards navigation path
        const targetYaw = Math.atan2(-routeX, -routeZ);
        let diff = targetYaw - yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        yaw += diff * Math.min(1.0, dt * 5.0);

        x = 0;
        z = isFinalWaypoint && routeDist < 0.9 ? Math.max(0.4, routeDist / 0.9) : 1.0;
      }
    }
  }

  return { x, z };
}

function updatePhysics(dt) {
  if (
    worldInteractions &&
    (worldInteractions.isTransitioning() ||
      (worldInteractions.mode === InteractionMode.SITTING &&
        worldInteractions.lifecycleState === InteractionState.PLAYING_CINEMATIC))
  ) {
    currentVelX = 0;
    currentVelZ = 0;
    jumpVelocity = 0;
    moveAmount = 0;
    return;
  }
  const isSuspended = panelOpen || settingsOpen || paused || !started ||
    (cinematicDirector && cinematicDirector.isInputLocked()) ||
    (worldInteractions && worldInteractions.isInputLocked());
  const input = isSuspended ? { x: 0, z: 0 } : getInputVector(dt);
  const { x, z } = input;
  const hasInput = Math.hypot(x, z) > 0.05;
  const sprint = (keys.has('ShiftLeft') || keys.has('ShiftRight')) && hasInput && !tourActive;
  const targetSpeed = hasInput ? (sprint ? 5.2 : 3.3) : 0;

  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const targetMoveX = (rightX * x + forwardX * z) * targetSpeed;
  const targetMoveZ = (rightZ * x + forwardZ * z) * targetSpeed;

  if (hasInput && overviewMode) toggleOverviewMode(false);

  // Smooth physical acceleration & deceleration
  const accel = hasInput ? 13.0 : 18.0;
  currentVelX = THREE.MathUtils.damp(currentVelX, targetMoveX, accel, dt);
  currentVelZ = THREE.MathUtils.damp(currentVelZ, targetMoveZ, accel, dt);

  if (keys.has('Space') && grounded && !panelOpen && !settingsOpen && !tourActive && (!cinematicDirector || !cinematicDirector.isInputLocked())) {
    jumpVelocity = 5.2;
    grounded = false;
    keys.delete('Space');
  }
  jumpVelocity = Math.max(-19, jumpVelocity - 14.0 * dt);
  physicsDisplacement.x = currentVelX * dt;
  physicsDisplacement.y = jumpVelocity * dt;
  physicsDisplacement.z = currentVelZ * dt;

  characterController.computeColliderMovement(playerCollider, physicsDisplacement);
  const actual = characterController.computedMovement();
  const position = playerBody.translation();
  nextPhysicsPosition.x = position.x + actual.x;
  nextPhysicsPosition.y = position.y + actual.y;
  nextPhysicsPosition.z = position.z + actual.z;
  playerBody.setNextKinematicTranslation(nextPhysicsPosition);
  grounded = characterController.computedGrounded();
  if (grounded && jumpVelocity < 0) jumpVelocity = 0;

  world.step();
  const resolved = playerBody.translation();
  physX = resolved.x;
  physY = resolved.y;
  physZ = resolved.z;

  characterRig.character.position.set(physX, physY, physZ);

  const currentSpeed = Math.hypot(currentVelX, currentVelZ);
  moveAmount = currentSpeed > 0.08 ? (sprint ? 1.5 : Math.min(1.0, currentSpeed / 3.0)) : 0;

  if (currentSpeed > 0.15 && !tourWaitingAtStop && (!cinematicDirector || !cinematicDirector.isActive())) {
    const targetCharYaw = Math.atan2(currentVelX, currentVelZ);
    let angle = targetCharYaw - characterRig.character.rotation.y;
    angle = Math.atan2(Math.sin(angle), Math.cos(angle));
    characterRig.character.rotation.y += angle * Math.min(1, dt * 12);
  }
}

function updateCamera(dt, timestamp) {
  if (cinematicDirector && cinematicDirector.isActive()) {
    cinematicDirector.update(dt);
    return;
  }

  if (worldInteractions && worldInteractions.isActive()) {
    worldInteractions.update(dt);
    return;
  }

  if (cameraController) {
    cameraController.yaw = yaw;
    cameraController.pitch = pitch;
    cameraController.userZoom = userZoom;
    cameraController.overviewMode = overviewMode;
    cameraController.teleportOverride = teleportCameraOverride;

    cameraController.update(
      dt,
      timestamp,
      { x: physX, y: physY, z: physZ },
      {
        panelOpen,
        settingsOpen,
        tourActive,
        cinematicActive: false,
        interactionActive: false,
      },
      keys
    );

    yaw = cameraController.yaw;
    pitch = cameraController.pitch;
    cameraDistance = cameraController.cameraDistance;
    return;
  }
}

let lastRoomCheck = 0;
function updateRoomFromPosition(timestamp = 0) {
  if (timestamp && timestamp - lastRoomCheck < 120) return;
  lastRoomCheck = timestamp || performance.now();
  let nearest = portfolio.rooms[0];
  let nearestDistance = Infinity;
  for (const room of portfolio.rooms) {
    const dx = room.position[0] - physX;
    const dy = (room.position[1] !== undefined ? room.position[1] : 1.12) - physY;
    const dz = room.position[2] - physZ;
    const distance = dx * dx + dy * dy * 1.8 + dz * dz;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = room;
    }
  }
  if (nearest.id !== lastRoomVisited && nearestDistance < 25) {
    lastRoomVisited = nearest.id;
    currentRoom = nearest;
    updateRoomLabel(nearest);
  }
}

function updatePerformance(dt, timestamp, activeScene) {
  frameAverage += (dt * 1000 - frameAverage) * (1 - Math.exp(-dt * 2.2));
  qualityCooldown -= dt;
  if (adaptive && quality === 'auto' && qualityCooldown <= 0) {
    if (frameAverage > (mobile ? 34 : 20.0) && renderScale > 0.65) {
      renderScale = Math.max(0.65, renderScale - 0.05);
      qualityCooldown = 3.0;
      applyQuality(activeScene, 'auto', false);
    } else if (frameAverage < (mobile ? 22 : 16.8) && renderScale < 1) {
      renderScale = Math.min(1, renderScale + 0.05);
      qualityCooldown = 3.5;
      applyQuality(activeScene, 'auto', false);
    }
  }
  if (timestamp - lastHudUpdate > 500) {
    lastHudUpdate = timestamp;
    const rawFps = Math.round(1000 / Math.max(16.66, frameAverage));
    const fps = Math.min(60, rawFps);
    ui.perfText.textContent = `${fps} FPS`;
    ui.drawText.textContent = `${renderer.info.render.calls} draws`;
    $('perf-pill').title = `Smoothed frame time: ${frameAverage.toFixed(1)} ms · Render resolution scale: ${renderScale.toFixed(2)}`;
  }
}

let eventsBound = false;
function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;
  uiManager.init();

  $('enter-button')?.addEventListener('click', startExperience);
  $('welcome-close')?.addEventListener('click', startExperience);
  $('welcome-tour-button')?.addEventListener('click', beginTour);
  $('tour-button').addEventListener('click', beginTour);
  ui.mapBtn?.addEventListener('click', () => toggleOverviewMode());
  ui.mapCloseBtn?.addEventListener('click', () => toggleOverviewMode(false));
  $('worldmap-setting-toggle')?.addEventListener('change', (event) => {
    toggleOverviewMode(event.currentTarget.checked);
  });
  $('tour-stop')?.addEventListener('click', () => endTour());
  ui.tourExploreBtn?.addEventListener('click', () => {
    if (tourActive) {
      const stop = tourStops[tourStopIndex];
      if (stop) startCinematic(stop.id);
    }
  });
  ui.tourNextBtn?.addEventListener('click', () => {
    if (tourActive) {
      advanceTourStop();
    }
  });
  $('panel-close').addEventListener('click', closeDetails);
  $('settings-button').addEventListener('click', openSettings);
  $('settings-close').addEventListener('click', closeSettings);
  $('adaptive-toggle').addEventListener('change', (event) => {
    adaptive = event.currentTarget.checked;
  });
  $('quality-select').addEventListener('change', (event) => {
    quality = event.currentTarget.value;
    renderScale = 1;
    if (scene) {
      if (quality === 'auto') applyQuality(scene, 'auto');
      else applyQuality(scene, quality);
    }
  });
  $('pause-button').addEventListener('click', () => setPaused(!paused));
  // The touch button runs exactly the action advertised by the visible prompt key.
  $('touch-interact').addEventListener('click', () => {
    const shown = $('interact-key')?.textContent;
    const code = { C: 'KeyC', E: 'KeyE', F: 'KeyF' }[shown] || 'KeyE';
    dispatchInteraction(code);
  });
  $('touch-jump').addEventListener('click', () => {
    if (grounded) keys.add('Space');
  });

  for (const button of document.querySelectorAll('.room-link')) {
    button.addEventListener('click', () => {
      const room = portfolio.rooms.find((item) => item.id === button.dataset.room);
      if (!room) return;
      if (renderer) endTour('Tour paused. Choose your own path.');
      if (panelOpen) closeDetails();
      if (playerBody) {
        setRoom(room.id, { teleport: true, open: room.id !== 'yard' });
      } else {
        currentRoom = room;
        updateRoomLabel(room);
        if (room.id !== 'yard' && portfolio.content[room.id]) openDetails(room.id);
      }
      if (room.id === 'yard') {
        if (!started) {
          ui.welcome.classList.remove('is-gone');
          ui.welcome.removeAttribute('aria-hidden');
          ui.welcome.inert = false;
        }
      } else {
        ui.welcome.classList.add('is-gone');
        ui.welcome.setAttribute('aria-hidden', 'true');
        ui.welcome.inert = true;
      }
    });
  }

  inputManager.attachListeners();
  inputManager.setReady(true);
  window.addEventListener('resize', onResize, { passive: true });

  if (renderer) {
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.addEventListener('pointerdown', (event) => {
      if (panelOpen || settingsOpen || (cinematicDirector && cinematicDirector.isActive()) || (worldInteractions && worldInteractions.isActive())) return;
      if (mobile && event.pointerType === 'touch' && event.clientX < window.innerWidth * 0.38 && event.clientY > window.innerHeight * 0.55) return;
      pointerHeld = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      renderer.domElement.style.cursor = 'grabbing';
      try { renderer.domElement.setPointerCapture(event.pointerId); } catch (_) {}
    });
    renderer.domElement.addEventListener('pointermove', (event) => {
      if (!pointerHeld || paused || panelOpen || settingsOpen || (cinematicDirector && cinematicDirector.isActive()) || (worldInteractions && worldInteractions.isActive())) return;
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      const sensitivity = mobile ? 0.006 : 0.0045;
      yaw -= dx * sensitivity;
      pitch = THREE.MathUtils.clamp(pitch + dy * sensitivity, -0.42, 0.88);
    });
    const releasePointer = () => {
      pointerHeld = false;
      if (renderer) renderer.domElement.style.cursor = 'grab';
    };
    renderer.domElement.addEventListener('pointerup', releasePointer);
    renderer.domElement.addEventListener('pointercancel', releasePointer);
    renderer.domElement.addEventListener('lostpointercapture', releasePointer);
    renderer.domElement.addEventListener('wheel', (event) => {
      if ((cinematicDirector && cinematicDirector.isActive()) || (worldInteractions && worldInteractions.isActive())) return;
      event.preventDefault();
      userZoom = THREE.MathUtils.clamp(userZoom + Math.sign(event.deltaY) * 0.07, 0.45, 2.2);
    }, { passive: false });
  }

  const joystick = $('joystick');
  const knob = $('joystick-knob');
  joystick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    touch.active = true;
    touch.pointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    updateJoystick(event);
  });
  joystick.addEventListener('pointermove', (event) => {
    if (touch.active && touch.pointer === event.pointerId) updateJoystick(event);
  });
  const releaseJoystick = (event) => {
    if (!touch.active || (event?.pointerId !== undefined && touch.pointer !== event.pointerId)) return;
    touch.active = false;
    touch.pointer = null;
    touch.x = 0;
    touch.y = 0;
    knob.style.setProperty('--joy-x', '0px');
    knob.style.setProperty('--joy-y', '0px');
  };
  joystick.addEventListener('pointerup', releaseJoystick);
  joystick.addEventListener('pointercancel', releaseJoystick);
  joystick.addEventListener('lostpointercapture', releaseJoystick);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      keys.clear();
      pointerHeld = false;
    }
  });
}

function updateJoystick(event) {
  const bounds = $('joystick').getBoundingClientRect();
  const radius = bounds.width * 0.32;
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;
  const length = Math.hypot(dx, dy);
  if (length > radius) {
    dx = (dx / length) * radius;
    dy = (dy / length) * radius;
  }
  touch.x = dx / radius;
  touch.y = dy / radius;
  $('joystick-knob').style.setProperty('--joy-x', `${dx}px`);
  $('joystick-knob').style.setProperty('--joy-y', `${dy}px`);
}

function onResize() {
  if (!renderer || !camera || !scene) return;
  const aspect = window.innerWidth / window.innerHeight;
  camera.aspect = aspect;
  camera.fov = aspect < 1.0 ? 64 : 48;
  camera.updateProjectionMatrix();
  applyQuality(scene, quality, false);
}

function dispose() {
  inputManager.detachListeners();
  window.removeEventListener('resize', onResize);
  if (world) {
    if (characterController) world.removeCharacterController(characterController);
    world.free();
  }
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer.domElement.remove();
  }
  for (const surface of Object.values(materials)) {
    if (surface?.dispose) surface.dispose();
  }
}

function animate(timestamp) {
  if (!started || paused || document.hidden) {
    renderer.render(scene, camera);
    return;
  }
  frameCounter += 1;
  const dt = Math.min(0.05, Math.max(0.001, (timestamp - (animate.lastTimestamp || timestamp)) / 1000));
  animate.lastTimestamp = timestamp;
  elapsed += dt;
  accumulator += Math.min(dt, 0.06);

  const fixedStep = 1 / 60;
  const maxSubsteps = activePreset?.physicsSubsteps || 2;
  let substeps = 0;
  while (accumulator >= fixedStep && substeps < maxSubsteps) {
    updatePhysics(fixedStep);
    accumulator -= fixedStep;
    substeps += 1;
  }
  if (substeps === maxSubsteps && accumulator > fixedStep) accumulator = fixedStep;

  updateCharacterRig(characterRig, dt, elapsed, moveAmount, grounded);
  if (doorControls?.update) doorControls.update(dt);
  updateRoomFromPosition(timestamp);
  findInteraction();
  if (questSystem) questSystem.update(dt, elapsed, characterRig ? characterRig.character.position : null);

  const npcInterval = activePreset?.npcUpdateInterval || 1;
  if (frameCounter % npcInterval === 0) {
    const npcDt = dt * npcInterval;
    const isLowSpec = activeQualityKey === 'low' || activeQualityKey === 'mobile';
    if (securityZone?.update && (!isLowSpec || overviewMode || physZ > -2.0)) {
      securityZone.update(npcDt);
    }
    if (farmZone?.update && (!isLowSpec || overviewMode || (physX < -4.0 && physZ < 0.0))) {
      farmZone.update(npcDt);
    }
    if (riceZone?.update && (!isLowSpec || overviewMode || (physX > -12.0 && physZ < 0.0))) {
      riceZone.update(npcDt);
    }
  }

  if (
    renderer.shadowMap.enabled &&
    activePreset?.shadowUpdateInterval > 0 &&
    frameCounter % activePreset.shadowUpdateInterval === 0 &&
    (moveAmount > 0.01 || doorControls?.isBusy())
  ) {
    renderer.shadowMap.needsUpdate = true;
  }

  if (tourActive && tourWaitingAtStop) {
    tourWaitTimer -= dt;
    const progress = Math.min(100, Math.max(0, ((4.8 - tourWaitTimer) / 4.8) * 100));
    ui.tourProgress.style.width = `${progress}%`;
    if (tourWaitTimer <= 0) {
      advanceTourStop();
    }
  }

  updateCamera(dt, timestamp);
  updateWorldMarkers();
  updatePerformance(dt, timestamp, scene);
  renderer.render(scene, camera);
}

async function init() {
  try {
    createRenderer();
    await yieldToMain();

    RAPIER = (await import('@dimforge/rapier3d-compat')).default;
    await RAPIER.init();
    await yieldToMain();

    world = new RAPIER.World({ x: 0, y: -13.5, z: 0 });
    world.timestep = 1 / 60;
    world.numSolverIterations = 4;

    const initialScene = await createScene();
    window.portfolioScene = initialScene;
    await yieldToMain();

    playerBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 1.12, 16.8)
    );
    playerCollider = world.createCollider(
      RAPIER.ColliderDesc.capsule(0.96, 0.32).setFriction(0),
      playerBody
    );
    characterController = world.createCharacterController(0.035);
    characterController.setUp({ x: 0, y: 1, z: 0 });
    characterController.setSlideEnabled(true);
    characterController.enableAutostep(0.32, 0.22, true);
    characterController.enableSnapToGround(0.35);
    characterController.setMaxSlopeClimbAngle(Math.PI / 3.0);

    scene = initialScene;
    applyQuality(scene, quality);

    cinematicDirector = new CinematicDirector();
    cinematicDirector.setSceneContext({
      scene,
      camera,
      characterRig,
      cameraBlockers,
    });
    cinematicDirector.onStateChange = (state) => {
      const isCinematicActive = cinematicDirector.isActive();
      $('pause-button').classList.toggle('is-visible', isCinematicActive || paused || panelOpen || settingsOpen);
      if (state === CinematicState.IDLE) {
        keys.clear();
        currentVelX = 0;
        currentVelZ = 0;
        findInteraction();
      }
    };
    window.__cinematic = cinematicDirector;

    questSystem = new QuestSystem(scene, characterRig);
    window.__quest = questSystem;

    worldInteractions = new WorldInteractionManager({
      scene,
      camera,
      characterRig,
      playerBody,
      cameraBlockers,
      onPositionUpdate: (x, y, z, charYaw) => {
        physX = x;
        physY = y;
        physZ = z;
        if (playerBody) {
          playerBody.setTranslation({ x, y, z }, true);
          if (playerBody.setNextKinematicTranslation) {
            playerBody.setNextKinematicTranslation({ x, y, z });
          }
        }
        if (characterRig?.character) {
          characterRig.character.position.set(x, y, z);
          if (charYaw !== undefined && Number.isFinite(charYaw)) {
            characterRig.character.rotation.y = charYaw;
          }
        }
      },
      onCameraSync: (newYaw, newPitch, newDist) => {
        if (Number.isFinite(newYaw)) yaw = newYaw;
        if (Number.isFinite(newPitch)) pitch = newPitch;
        if (Number.isFinite(newDist)) {
          cameraDistance = newDist;
          cameraDistanceGoal = newDist;
          cameraSafeDistance = newDist;
        }
      },
      onStateChange: () => {
        findInteraction();
      },
    });
    window.__worldInteractions = worldInteractions;
    worldInteractions.setDebug(import.meta.env.DEV);
    window.__playerCameraState = () => ({ cameraDistance, yaw, pitch });

    camera.position.set(0, 4.2, 22.8);
    camera.lookAt(0, 2.0, 16.8);
    setRoom('yard');
    initWorldMarkers();

    window.__THREE__ = THREE;
    window.__SCENE__ = scene;
    window.__RENDERER__ = renderer;
    window.__CAMERA__ = camera;
    window.scene = scene;
    window.renderer = renderer;
    window.camera = camera;
    window.__camera = camera;
    window.__setCameraOverride = (cam, target) => {
      teleportCameraOverride = cam && target ? { cam, target } : null;
    };
    window.__teleport = (x, y, z, facing = 0) => teleportToZone(x, y, z, facing);
    window.__toggleOverviewMode = toggleOverviewMode;
    window.__playerBody = playerBody;
    window.__characterRig = characterRig;
    window.__characterController = characterController;
    window.__setPlayerPos = (x, y, z) => {
      physX = x;
      physY = y;
      physZ = z;
      if (playerBody) {
        playerBody.setTranslation({ x, y, z }, true);
        if (playerBody.setNextKinematicTranslation) {
          playerBody.setNextKinematicTranslation({ x, y, z });
        }
      }
      if (characterRig?.character) {
        characterRig.character.position.set(x, y, z);
      }
    };
    window.__getPlayerPos = () => ({ x: physX, y: physY, z: physZ });
    window.__setRoom = setRoom;
    window.__startExperience = startExperience;
    window.__dispatchInteraction = dispatchInteraction;
    window.__interactionPoints = interactionPoints;
    window.__findInteraction = findInteraction;
    window.__setQualityPreset = (nextQ) => {
      quality = nextQ;
      renderScale = 1;
      applyQuality(scene, quality);
      renderer.render(scene, camera);
      renderer.render(scene, camera);
      return window.__getQualityState();
    };
    window.__getQualityState = () => ({
      quality,
      activeQualityKey,
      renderScale,
      pixelRatio: renderer.getPixelRatio(),
      shadowsEnabled: renderer.shadowMap.enabled,
      shadowMapSize: scene.userData.sun?.shadow?.mapSize?.x || 0,
      cullDistance: camera.far,
      draws: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    });
    // Pre-warm initial WebGL shader compilation + shadow map pass, then settle steady-state frame
    renderer.render(scene, camera);
    renderer.render(scene, camera);
    await yieldToMain();

    window.__SCENE_READY__ = true;
    document.documentElement.classList.add('webgl-ready');
    $('loading-screen').classList.add('is-hidden');

    bindEvents();
    const urlParams = new URLSearchParams(window.location.search);
    const qParam = urlParams.get('quality');
    if (qParam && (qParam === 'auto' || qualityPresets[qParam])) {
      quality = qParam;
      renderScale = 1;
      applyQuality(scene, quality);
    }
    if (urlParams.get('start') === '1') {
      startExperience();
    }
    const sectionParam = urlParams.get('section');
    if (sectionParam && portfolio.content[sectionParam]) {
      if (!started) startExperience();
      setRoom(sectionParam, { teleport: true, open: true });
      if (cinematicDirector && cinematicDirector.isActive()) {
        cinematicDirector.skipToContent();
      }
    }
    const camParam = urlParams.get('cam');
    const targetParam = urlParams.get('target');
    if (camParam && targetParam) {
      const cCoords = camParam.split(',').map(Number);
      const tCoords = targetParam.split(',').map(Number);
      if (cCoords.length === 3 && tCoords.length === 3) {
        teleportCameraOverride = { cam: cCoords, target: tCoords };
        camera.position.set(cCoords[0], cCoords[1], cCoords[2]);
        camera.lookAt(tCoords[0], tCoords[1], tCoords[2]);
      }
    }
    renderer.render(scene, camera);
    renderer.render(scene, camera);
    renderer.setAnimationLoop(animate);
    window.addEventListener('beforeunload', dispose, { once: true });
  } catch (error) {
    console.error('Cartoonverse could not start', error);
    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
      renderer = null;
    }
    $('loading-screen').innerHTML = `<div class="loading-mark">!</div><p>${
      error.message.includes('WebGL2')
        ? 'WebGL2 is unavailable on this device.'
        : 'The world could not be opened.'
    }</p><p>Use the room directory for a lighter portfolio visit.</p><button class="primary-button" type="button" id="fallback-explore">Open the portfolio directory</button>`;
    $('fallback-explore').addEventListener('click', () => {
      document.documentElement.classList.remove('webgl-ready');
      $('loading-screen').classList.add('is-hidden');
      startExperience();
    });
  }
}

init();
