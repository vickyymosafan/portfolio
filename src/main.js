import * as THREE from 'three';
import { portfolio } from './portfolio.js';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder } from './geometry.js';
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
import { createCharacter, updateCharacterRig } from './character.js';
import { CinematicDirector, CinematicState } from './cinematic.js';
import { QuestSystem } from './quest.js';
import { WorldInteractionManager, InteractionMode, InteractionState } from './worldInteractions.js';
import { BENCH } from './seatLayout.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const sceneHost = $('scene');
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
const doorColliders = [];
const interactionPoints = [];
const cameraBlockers = [];
const staticBodies = [];

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
let physZ = 13.0;
let lastRoomVisited = '';

const keys = new Set();
const raycaster = new THREE.Raycaster();
const cameraOrigin = new THREE.Vector3();
const cameraDesired = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const dampVector = new THREE.Vector3();
const lookPoint = new THREE.Vector3();
const physicsDisplacement = { x: 0, y: 0, z: 0 };
const nextPhysicsPosition = { x: 0, y: 0, z: 0 };
const rayHits = [];
const touch = { x: 0, y: 0, active: false, pointer: null };

const qualityPresets = {
  high: { pixelRatio: 1.5, shadows: true, shadowSize: 1536 },
  medium: { pixelRatio: 1.15, shadows: true, shadowSize: 1024 },
  low: { pixelRatio: 0.85, shadows: false, shadowSize: 0 },
  mobile: { pixelRatio: 0.75, shadows: false, shadowSize: 0 },
};

function createRenderer() {
  if (!('WebGL2RenderingContext' in window)) {
    throw new Error('This browser does not support WebGL2.');
  }
  renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap; // Clean filtered shadows in Three.js r186
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '3D cartoon portfolio world. Use WASD to walk, mouse to look, and E to explore.');
  sceneHost.appendChild(renderer.domElement);

  const initialAspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(initialAspect < 1.0 ? 64 : 48, initialAspect, 0.1, 140);
  return renderer;
}

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe0d5);
  scene.fog = new THREE.Fog(0xbfe0d5, 42, 100);

  // Soft warm ambient hemisphere light for vibrant natural cartoon fill
  const hemi = new THREE.HemisphereLight(0xfff8ea, 0x769e74, 2.0);
  scene.add(hemi);

  // Warm golden directional sunlight with soft contact penumbra
  const sun = new THREE.DirectionalLight(0xfffae8, 2.5);
  sun.position.set(-18, 26, 20);
  sun.castShadow = !mobile;
  sun.shadow.mapSize.set(mobile ? 512 : 1536, mobile ? 512 : 1536);
  sun.shadow.camera.left = -26;
  sun.shadow.camera.right = 26;
  sun.shadow.camera.top = 28;
  sun.shadow.camera.bottom = -28;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 68;
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 2.8;
  scene.add(sun);
  scene.userData.sun = sun;

  // Strategic warm interior point lights centered in wide room bays with high ceiling fixtures
  const interiorLights = [
    { pos: [-8.5, 3.8, -0.2], color: 0xffb566, intensity: 1.8, distance: 12, shade: materials.terracotta }, // Living room
    { pos: [8.5, 3.8, -0.2], color: 0xffebad, intensity: 1.6, distance: 11, shade: materials.ceramicTeal },  // Office
    { pos: [-8.5, 3.8, -8.3], color: 0xffe299, intensity: 1.6, distance: 11, shade: materials.brass },       // Library
    { pos: [8.5, 3.8, -8.3], color: 0xfff0d0, intensity: 1.5, distance: 11, shade: materials.ceramic },     // Gallery
    { pos: [-8.5, 3.8, -16.1], color: 0xffe6b0, intensity: 1.5, distance: 11, shade: materials.metalDark }, // Studio
    { pos: [8.5, 3.8, -16.1], color: 0xffd588, intensity: 1.6, distance: 11, shade: materials.terracotta }, // Terrace
  ];
  for (const l of interiorLights) {
    const pLight = new THREE.PointLight(l.color, l.intensity, l.distance, 1.5);
    pLight.position.set(...l.pos);
    scene.add(pLight);

    // Visible physical ceiling pendant fixture near ceiling level (height 5.2m)
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8), materials.metalDark);
    cord.position.set(l.pos[0], 4.88, l.pos[2]);
    scene.add(cord);

    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.18, 16), l.shade);
    shade.position.set(l.pos[0], 4.65, l.pos[2]);
    scene.add(shade);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), materials.glow);
    bulb.position.set(l.pos[0], 4.55, l.pos[2]);
    scene.add(bulb);
  }

  // 1. Landscape Foundation & Lawns
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), materials.grass);
  ground.rotation.x = -Math.PI * 0.5;
  ground.position.set(0, -0.08, -6.0);
  ground.receiveShadow = true;
  scene.add(ground);

  // Raised garden lawn spanning whole 28m house and gardens
  const lawn = addBox(scene, [0, -0.16, -6.0], [46, 0.24, 52], materials.lawnRaised, { receive: true, shadow: true });
  lawn.receiveShadow = true;

  // Rapier ground collider
  const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.2, -6.0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(23, 0.15, 26), groundBody);
  staticBodies.push(groundBody);

  // Garden paths, stepping stones, fences
  createGardenPath(scene);
  createGardenFence(scene);
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

  // Boundary picket fences (x = ±16.8)
  for (const side of [-1, 1]) {
    const fenceBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(side * 16.8, 0.75, -6.0));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.22, 0.75, 16.5), fenceBody);
    staticBodies.push(fenceBody);
  }

  // Front Entrance Gate Posts with Carriage Lanterns (x = ±3.4 at z = 16.5)
  for (const side of [-1, 1]) {
    const gateBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(side * 3.4, 1.1, 16.5));
    world.createCollider(RAPIER.ColliderDesc.cuboid(0.42, 1.1, 0.42), gateBody);
    staticBodies.push(gateBody);
  }

  // Rich flower beds framing the 28m wide house
  const flowerBedSpecs = [
    [-9.5, 5.2, 7.5, 1.4, 21],
    [9.5, 5.2, 7.5, 1.4, 47],
    [-15.5, -3.5, 1.4, 7.5, 63],
    [15.5, -3.5, 1.4, 7.5, 85],
    [-15.5, -12.5, 1.4, 7.5, 101],
    [15.5, -12.5, 1.4, 7.5, 127],
  ];
  for (const [fbx, fbz, fbw, fbd, seed] of flowerBedSpecs) {
    createFlowerBed(scene, fbx, fbz, fbw, fbd, seed);
    const bedBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(fbx, 0.35, fbz));
    world.createCollider(RAPIER.ColliderDesc.cuboid(fbw * 0.5, 0.35, fbd * 0.5), bedBody);
    staticBodies.push(bedBody);
  }

  // Tiered Cartoon Trees outside house perimeter (multi-tier fluffy canopies, batched)
  const treeCoords = [
    [-19.5, 9.5, 1.2, 12],
    [19.5, 9.2, 1.2, 24],
    [-19.8, -1.0, 1.1, 36],
    [19.8, -1.0, 1.1, 48],
    [-19.5, -9.5, 1.15, 60],
    [19.5, -9.5, 1.15, 72],
    [-19.2, -17.5, 1.05, 84],
    [19.2, -17.5, 1.05, 96],
    [-12.2, 14.5, 0.98, 108],
    [12.2, 14.5, 0.98, 120],
    [-18.5, 15.0, 0.9, 132],
    [18.5, 15.0, 0.9, 144],
  ];
  for (const [tx, tz, ts, seed] of treeCoords) {
    const tree = createCartoonTree(tx, tz, ts, seed);
    scene.add(tree);
    const trunkBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(tx, 1.2 * ts, tz));
    world.createCollider(RAPIER.ColliderDesc.cylinder(1.2 * ts, 0.46 * ts), trunkBody);
    staticBodies.push(trunkBody);
  }

  // Sculpted Cartoon Bushes framing pathways and perimeter
  const bushCoords = [
    [-5.2, 5.2, 1.15, 11],
    [5.2, 5.2, 1.15, 22],
    [-13.5, 5.0, 1.05, 33],
    [13.5, 5.0, 1.05, 44],
    [-16.2, 4.8, 0.95, 55],
    [16.2, 4.8, 0.95, 66],
    [-7.5, 13.0, 0.88, 77],
    [7.5, 13.0, 0.88, 88],
    [-14.5, 11.2, 0.9, 99],
    [14.5, 11.2, 0.9, 110],
    [-16.5, -6.5, 0.95, 121],
    [16.5, -6.5, 0.95, 132],
    [-16.5, -15.5, 0.9, 143],
    [16.5, -15.5, 0.9, 154],
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

  // 2. Architecture & Interactive Doors
  const arch = createArchitecture(scene, world, RAPIER, staticBodies, cameraBlockers);
  roofGroup = arch.roofGroup;
  doorControls = createInteractiveDoors(scene, world, RAPIER, doorColliders, interactionPoints);

  // 3. Room Interiors & Furnishings
  createRoomInteriors(scene, interactionPoints, handleRoomInteraction, world, RAPIER, staticBodies);

  // 4. Character
  characterRig = createCharacter(scene);

  // 5. Decorative Backdrop
  addDecorativeBackdrop(scene);

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
  const hills = [
    [-24, -14, 12, materials.foliageBright],
    [25, -22, 14, materials.foliageDeep],
    [-32, 2, 13, materials.foliageMid],
    [32, 9, 11, materials.foliageBright],
  ];
  for (const [hx, hz, hs, hMat] of hills) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), hMat);
    hill.position.set(hx, -2.5, hz);
    hill.scale.set(hs, hs * 0.58, hs * 0.88);
    scene.add(hill);
  }

  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const clouds = [
    [-18, 11, -26, 1.6],
    [18, 13, -32, 2.0],
    [-32, 14, -9, 1.4],
    [28, 12, 12, 1.7],
  ];
  for (const [cx, cy, cz, cs] of clouds) {
    const cloud = new THREE.Group();
    cloud.position.set(cx, cy, cz);
    scene.add(cloud);
    addSphere(cloud, [0, 0, 0], [cs, cs * 0.55, cs * 0.55], cloudMat, { lowPoly: true });
    addSphere(cloud, [-cs * 0.72, -0.1, 0.02], [cs * 0.65, cs * 0.42, cs * 0.42], cloudMat, { lowPoly: true });
    addSphere(cloud, [cs * 0.68, -0.08, -0.02], [cs * 0.68, cs * 0.45, cs * 0.42], cloudMat, { lowPoly: true });
  }

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(85, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xbfe0d5, side: THREE.BackSide })
  );
  scene.add(sky);
}

function applyQuality(sceneRef, nextQuality, autoUpdate = true) {
  const selected = nextQuality === 'auto' ? (mobile ? 'mobile' : 'medium') : nextQuality;
  const preset = qualityPresets[selected] || qualityPresets.medium;
  const dprLimit = Math.min(window.devicePixelRatio || 1, preset.pixelRatio, renderScale);
  renderer.setPixelRatio(dprLimit);
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const shadowsOn = preset.shadows && !mobile;
  renderer.shadowMap.enabled = shadowsOn;
  if (sceneRef?.userData?.sun) {
    sceneRef.userData.sun.castShadow = shadowsOn;
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

  if (content.intro) {
    const intro = document.createElement('p');
    intro.className = 'lead';
    intro.textContent = content.intro;
    ui.panelContent.append(intro);
  }
  if (content.detail) {
    const paragraph = document.createElement('p');
    paragraph.textContent = content.detail;
    ui.panelContent.append(paragraph);
  }
  if (content.groups) {
    for (const [heading, ...skills] of content.groups) {
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
    for (const [date, text] of content.milestones) {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      const marker = document.createElement('b');
      marker.textContent = date;
      const copy = document.createElement('p');
      copy.textContent = text;
      item.append(marker, copy);
      list.append(item);
    }
    ui.panelContent.append(list);
  }
  if (content.projects) {
    const list = document.createElement('div');
    list.className = 'project-list';
    for (const project of content.projects) {
      const item = document.createElement('article');
      item.className = 'project-item';
      const heading = document.createElement('div');
      heading.className = 'project-heading';
      const name = document.createElement('h3');
      name.textContent = project.title;
      const year = document.createElement('span');
      year.textContent = project.year;
      heading.append(name, year);
      const kind = document.createElement('span');
      kind.className = 'project-kind';
      kind.textContent = project.kind;
      const description = document.createElement('p');
      description.textContent = project.description;
      const tags = document.createElement('div');
      tags.className = 'skill-list';
      for (const tag of project.tags) tags.append(makeTag(tag));
      item.append(heading, kind, description, tags);
      list.append(item);
    }
    ui.panelContent.append(list);
  }
  if (content.steps) {
    for (const [number, title, text] of content.steps) {
      const step = document.createElement('div');
      step.className = 'process-step';
      const strong = document.createElement('strong');
      strong.textContent = `${number} · ${title}`;
      const detail = document.createElement('small');
      detail.textContent = text;
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
    const note = document.createElement('p');
    note.className = 'contact-note';
    note.textContent = content.note;
    ui.panelContent.append(note);
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
  ui.roomName.textContent = room.label;
  ui.roomCount.textContent = room.count;
  for (const button of document.querySelectorAll('.room-link')) {
    const isActive = button.dataset.room === room.id;
    button.classList.toggle('is-active', isActive);
    if (isActive) button.setAttribute('aria-current', 'location');
    else button.removeAttribute('aria-current');
  }
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

function findInteraction() {
  if (cinematicDirector && cinematicDirector.isActive()) {
    ui.prompt.classList.remove('is-visible');
    return;
  }

  const promptKey = $('interact-key');

  // 1. If currently interacting, display active interaction lifecycle status
  if (worldInteractions && worldInteractions.isActive()) {
    ui.prompt.classList.add('is-visible');

    if (worldInteractions.mode === InteractionMode.SITTING) {
      if (promptKey) promptKey.textContent = 'C';
      if (worldInteractions.lifecycleState === InteractionState.APPROACHING) {
        ui.promptLabel.textContent = 'Sitting down...';
        $('touch-interact').textContent = '...';
      } else if (worldInteractions.lifecycleState === InteractionState.RESTORING) {
        ui.promptLabel.textContent = 'Standing up...';
        $('touch-interact').textContent = '...';
      } else {
        ui.promptLabel.textContent = 'Stand up';
        $('touch-interact').textContent = 'Stand';
      }
      return;
    }

    if (worldInteractions.mode === InteractionMode.DOOR) {
      if (promptKey) promptKey.textContent = 'E';
      const doorState = doorControls?.getState?.();
      ui.promptLabel.textContent = doorState === 'closing' ? 'Closing the garden door...' : 'Opening the garden door...';
      $('touch-interact').textContent = '...';
      return;
    }

    if (worldInteractions.mode === InteractionMode.INSPECTING) {
      if (promptKey) promptKey.textContent = 'F';
      ui.promptLabel.textContent = 'Resume walking';
      $('touch-interact').textContent = 'Resume';
      return;
    }
  }

  // 2. We are in normal locomotion: evaluate available targets
  const nearbySeat = worldInteractions ? worldInteractions.getNearbySeat(physX, physZ) : null;
  const nearbyInspectable = worldInteractions ? worldInteractions.getNearbyInspectable(physX, physZ) : null;

  // Door interaction candidate (E)
  const doorPoint = interactionPoints.find((item) => item.id === 'door');
  let doorCandidate = null;
  if (doorPoint) {
    const dist = Math.hypot(physX - doorPoint.position.x, physZ - doorPoint.position.z);
    if (dist < doorPoint.radius) {
      doorCandidate = { point: doorPoint, dist };
    }
  }

  // Room exhibit beacons (E)
  let bestRoom = null;
  let bestRoomDist = Infinity;
  for (let i = 0; i < interactionPoints.length; i += 1) {
    const item = interactionPoints[i];
    if (item.id === 'door') continue;
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
    chosen = {
      key: 'E',
      label: doorPoint.getLabel ? doorPoint.getLabel() : (doorControls?.isOpen() ? 'Close the garden door' : 'Open the garden door'),
      touch: doorControls?.isOpen() ? 'Close' : 'Open',
      target: doorPoint,
    };
    currentInteraction = doorPoint;
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

  if (chosen) {
    ui.prompt.classList.toggle('is-visible', canShowPrompt);
    if (promptKey) promptKey.textContent = chosen.key;
    ui.promptLabel.textContent = chosen.label;
    $('touch-interact').textContent = chosen.touch;
  } else {
    ui.prompt.classList.remove('is-visible');
    $('touch-interact').textContent = 'Interact';
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
      const seat = w.getNearbySeat(physX, physZ);
      if (!seat) return reject('no_seat_in_range');
      if (import.meta.env.DEV) console.log('[Interaction] KeyC -> sit on seat:', seat.id);
      result = w.toggleSit(physX, physZ, { cameraDistance, yaw, pitch });
    }
  } else if (code === 'KeyE') {
    // KeyE: ONLY doors and room exhibits. NEVER triggers sitting!
    if (w.mode !== InteractionMode.NONE) return reject('other_interaction_active');

    // Priority 1: Check door
    const doorPoint = interactionPoints.find((item) => item.id === 'door');
    let doorTarget = null;
    if (doorPoint) {
      const dist = Math.hypot(physX - doorPoint.position.x, physZ - doorPoint.position.z);
      if (dist < doorPoint.radius) doorTarget = doorPoint;
    }

    if (doorTarget) {
      if (import.meta.env.DEV) console.log('[Interaction] KeyE -> door toggle');
      result = doorTarget.action() !== false;
    } else {
      // Priority 2: Check nearest room exhibit
      let bestRoom = null;
      let bestDist = Infinity;
      for (const item of interactionPoints) {
        if (item.id === 'door') continue;
        const dist = Math.hypot(physX - item.position.x, physZ - item.position.z);
        if (dist < item.radius && dist < bestDist) {
          bestRoom = item;
          bestDist = dist;
        }
      }
      if (!bestRoom) return reject('no_e_target_in_range');
      if (import.meta.env.DEV) console.log('[Interaction] KeyE -> room beacon:', bestRoom.id);
      result = bestRoom.action() !== false;
    }
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
    step: '01 / 07',
    name: 'Front Yard & Garden Gate',
    subtitle: 'A LITTLE WORLD, BUILT BY HAND',
    intro: 'Welcome to Vicky’s 3D portfolio! Stroll along the sandstone pathway through the blooming cartoon garden.',
    position: [0, 1.12, 12.0],
    archX: 0,
    facing: Math.PI,
    cameraYaw: 0,
    cameraPitch: 0.2,
  },
  {
    id: 'about',
    step: '02 / 07',
    name: 'Living Room · About Me',
    subtitle: 'THE PERSON BEHIND THE PIXELS',
    intro: 'Creative developer blending software engineering, 3D graphics, and practical AI to make tech feel warm and human.',
    position: [-6.8, 1.12, -0.6],
    archX: -3.4,
    facing: 0.15,
    cameraYaw: 0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'skills',
    step: '03 / 07',
    name: 'Home Office · Skills & Tools',
    subtitle: 'TOOLS I REACH FOR EVERY DAY',
    intro: 'TypeScript, JavaScript, Three.js, Python, and applied agentic workflows built for reliable modern production.',
    position: [6.8, 1.12, -0.6],
    archX: 3.4,
    facing: -0.15,
    cameraYaw: -0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'experience',
    step: '04 / 07',
    name: 'Library Nook · My Story',
    subtitle: 'ALWAYS CURIOUS, ALWAYS LEARNING',
    intro: 'Learning by shipping real products, studying system design, and constantly refining interactive craft.',
    position: [-6.8, 1.12, -8.7],
    archX: -3.4,
    facing: 0.15,
    cameraYaw: 0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'projects',
    step: '05 / 07',
    name: 'Project Gallery · Works',
    subtitle: 'SELECTED HIGHLIGHTS',
    intro: 'IntelliChat AI workspace, Smart Kost SaaS, 3D interactive graphics, and agentic automation pipelines.',
    position: [6.8, 1.12, -8.7],
    archX: 3.4,
    facing: -0.15,
    cameraYaw: -0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'process',
    step: '06 / 07',
    name: 'Creative Studio · Process',
    subtitle: 'FROM FIRST SKETCH TO LAST DETAIL',
    intro: 'Three deliberate passes: listen closely to find the real need, build to learn, then polish what counts.',
    position: [-6.8, 1.12, -16.5],
    archX: -3.4,
    facing: 0.15,
    cameraYaw: 0.1,
    cameraPitch: 0.22,
  },
  {
    id: 'contact',
    step: '07 / 07',
    name: 'Garden Terrace · Let’s Connect',
    subtitle: 'THERE’S ROOM FOR ONE MORE IDEA',
    intro: 'Open for thoughtful projects, applied AI products, and ambitious collaborations. Let’s make something great!',
    position: [6.8, 1.12, -16.5],
    archX: 3.4,
    facing: -0.15,
    cameraYaw: -0.1,
    cameraPitch: 0.22,
  },
];

function planTourWaypoints(startX, startZ, targetStop) {
  const points = [];
  const targetX = targetStop.position[0];
  const targetZ = targetStop.position[2];
  const targetArchX = targetStop.archX;

  const isOutdoor = startZ > 4.0;
  const targetIsOutdoor = targetZ > 4.0;

  if (isOutdoor && targetIsOutdoor) {
    points.push([targetX, 1.12, targetZ]);
  } else if (isOutdoor && !targetIsOutdoor) {
    if (startZ > 7.0) points.push([0, 1.12, 6.2]);
    points.push([0, 1.12, 3.8]);
    points.push([0, 1.12, targetZ]);
    if (Math.abs(targetArchX) > 0.5) points.push([targetArchX, 1.12, targetZ]);
    points.push([targetX, 1.12, targetZ]);
  } else if (!isOutdoor && targetIsOutdoor) {
    if (Math.abs(startX) > 2.0) {
      const exitArchX = startX < 0 ? -3.4 : 3.4;
      points.push([exitArchX, 1.12, startZ]);
    }
    points.push([0, 1.12, startZ]);
    points.push([0, 1.12, 3.8]);
    points.push([0, 1.12, 6.2]);
    points.push([targetX, 1.12, targetZ]);
  } else {
    // Indoor room to room:
    // Exit current room bay to center promenade
    if (Math.abs(startX) > 2.0) {
      const exitArchX = startX < 0 ? -3.4 : 3.4;
      points.push([exitArchX, 1.12, startZ]);
    }
    points.push([0, 1.12, startZ]);
    // Walk down the 6.8m promenade centerline
    points.push([0, 1.12, targetZ]);
    // Enter target room archway
    if (Math.abs(targetArchX) > 0.5) {
      points.push([targetArchX, 1.12, targetZ]);
    }
    // Arrive at beacon
    points.push([targetX, 1.12, targetZ]);
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
  const inHouse = physZ <= 4.0;
  if (roofGroup) {
    roofGroup.visible = !inHouse;
  }

  if (cinematicDirector && cinematicDirector.isActive()) {
    cinematicDirector.update(dt);
    return;
  }

  if (worldInteractions && worldInteractions.isActive()) {
    worldInteractions.update(dt);
    return;
  }

  // Camera goal distance & height with responsive mobile compensation
  const isPortrait = camera.aspect < 1.0;
  const baseDistance = inHouse ? (isPortrait ? 4.2 : 4.4) : (isPortrait ? 7.6 : 6.8);
  cameraDistanceGoal = baseDistance * userZoom;

  const targetY = physY + (isPortrait ? 1.35 : 1.25);
  cameraTarget.set(physX, targetY, physZ);

  // Clamp pitch safely: indoors we clamp higher pitch to prevent hitting ceiling (ceiling at 5.2m)
  const maxPitch = inHouse ? 0.48 : 0.72;
  const minPitch = inHouse ? 0.04 : -0.06;
  pitch = THREE.MathUtils.clamp(pitch, minPitch, maxPitch);

  // Over-the-shoulder offset for depth and framing
  const horizontal = cameraDistance * Math.cos(pitch);
  const shoulderOffset = isPortrait ? 0 : 0.22;
  const shoulderX = Math.cos(yaw) * shoulderOffset;
  const shoulderZ = -Math.sin(yaw) * shoulderOffset;

  cameraDesired.set(
    physX + Math.sin(yaw) * horizontal + shoulderX,
    physY + (inHouse ? 1.38 : 1.52) + Math.sin(pitch) * cameraDistance,
    physZ + Math.cos(yaw) * horizontal + shoulderZ
  );

  // Ceiling height clamp: indoor camera height never exceeds 4.75m
  if (inHouse) {
    cameraDesired.y = THREE.MathUtils.clamp(cameraDesired.y, 1.3, 4.75);
  }

  const dx = cameraDesired.x - cameraTarget.x;
  const dy = cameraDesired.y - cameraTarget.y;
  const dz = cameraDesired.z - cameraTarget.z;
  const desiredDistance = Math.hypot(dx, dy, dz);
  dampVector.set(dx, dy, dz).normalize();

  if (timestamp - lastCameraCollisionCheck > 32) {
    lastCameraCollisionCheck = timestamp;
    cameraOrigin.copy(cameraTarget);
    raycaster.set(cameraTarget, dampVector);
    raycaster.far = desiredDistance;
    raycaster.intersectObjects(cameraBlockers, false, rayHits);
    cameraSafeDistance = rayHits.length ? Math.max(1.8, rayHits[0].distance - 0.35) : desiredDistance;
    rayHits.length = 0;
  }

  const effectiveDistance = Math.min(cameraSafeDistance, desiredDistance);
  // Fast contraction if hitting a wall, smooth damping when unobstructed
  const dampSpeed = cameraSafeDistance < cameraDistance ? 16.0 : 5.0;
  cameraDistance = THREE.MathUtils.damp(cameraDistance, effectiveDistance, dampSpeed, dt);

  cameraDesired.copy(cameraTarget).addScaledVector(dampVector, cameraDistance);
  camera.position.x = THREE.MathUtils.damp(camera.position.x, cameraDesired.x, 9.0, dt);
  camera.position.y = THREE.MathUtils.damp(camera.position.y, cameraDesired.y, 9.0, dt);
  camera.position.z = THREE.MathUtils.damp(camera.position.z, cameraDesired.z, 9.0, dt);

  lookPoint.copy(cameraTarget);
  lookPoint.y += 0.22;
  camera.lookAt(lookPoint);
}

function updateRoomFromPosition() {
  let nearest = portfolio.rooms[0];
  let nearestDistance = Infinity;
  for (const room of portfolio.rooms) {
    const dx = room.position[0] - physX;
    const dz = room.position[2] - physZ;
    const distance = dx * dx + dz * dz;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = room;
    }
  }
  if (nearest.id !== lastRoomVisited && nearestDistance < 20) {
    lastRoomVisited = nearest.id;
    currentRoom = nearest;
    updateRoomLabel(nearest);
  }
}

function updatePerformance(dt, timestamp, activeScene) {
  frameAverage += (dt * 1000 - frameAverage) * (1 - Math.exp(-dt * 1.7));
  qualityCooldown -= dt;
  if (adaptive && quality === 'auto' && qualityCooldown <= 0) {
    if (frameAverage > (mobile ? 35 : 23) && renderScale > 0.52) {
      renderScale = Math.max(0.52, renderScale - 0.08);
      qualityCooldown = 2.8;
      applyQuality(activeScene, 'auto', false);
    } else if (frameAverage < (mobile ? 21 : 14.8) && renderScale < 1) {
      renderScale = Math.min(1, renderScale + 0.06);
      qualityCooldown = 4.5;
      applyQuality(activeScene, 'auto', false);
    }
  }
  if (timestamp - lastHudUpdate > 800) {
    lastHudUpdate = timestamp;
    const fps = Math.round(1000 / Math.max(1, frameAverage));
    ui.perfText.textContent = `${fps} FPS`;
    ui.drawText.textContent = `${renderer.info.render.calls} draws`;
    $('perf-pill').title = `Smoothed frame time: ${frameAverage.toFixed(1)} ms · Render resolution scale: ${renderScale.toFixed(2)}`;
  }
}

let eventsBound = false;
function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  $('enter-button')?.addEventListener('click', startExperience);
  $('welcome-close')?.addEventListener('click', startExperience);
  $('welcome-tour-button')?.addEventListener('click', beginTour);
  $('tour-button').addEventListener('click', beginTour);
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

  window.addEventListener('keydown', (event) => {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === 'Escape') {
      if (cinematicDirector && cinematicDirector.isActive()) {
        cinematicDirector.exitScene();
        return;
      }
      if (worldInteractions && worldInteractions.cancelAny()) {
        findInteraction();
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
      return;
    }
    if (event.code === 'KeyC' && !event.repeat) {
      if (!renderer || !started) return;
      dispatchInteraction('KeyC');
      return;
    }
    if (event.code === 'KeyE' && !event.repeat) {
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
      return;
    }
    if (cinematicDirector && cinematicDirector.isActive() && cinematicDirector.activeSection === 'projects') {
      if (event.code === 'ArrowRight' && !event.repeat) {
        const nextBtn = document.querySelector('.project-carousel-nav .carousel-nav-btn:last-child');
        if (nextBtn) nextBtn.click();
        return;
      }
      if (event.code === 'ArrowLeft' && !event.repeat) {
        const prevBtn = document.querySelector('.project-carousel-nav .carousel-nav-btn:first-child');
        if (prevBtn) prevBtn.click();
        return;
      }
    }
    if (event.code === 'KeyF' && !event.repeat) {
      if (!renderer) { startExperience(); return; }
      if (!started) { startExperience(); return; }
      if (cinematicDirector && cinematicDirector.isActive()) return;
      if (dispatchInteraction('KeyF')) return;
      // F keeps its original fallback (start the tour) only when nothing else is active
      if (!worldInteractions || worldInteractions.mode === InteractionMode.NONE) beginTour();
      return;
    }
    if (event.code === 'Space' && !event.repeat) {
      if (tourActive && tourWaitingAtStop) {
        advanceTourStop();
        return;
      }
    }
    if (event.code === 'Space' && event.repeat) return;
    keys.add(event.code);
  });

  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => {
    keys.clear();
    pointerHeld = false;
    touch.active = false;
    touch.x = 0;
    touch.y = 0;
    $('joystick').style.setProperty('--joy-x', '0px');
    $('joystick').style.setProperty('--joy-y', '0px');
  });
  window.addEventListener('resize', onResize, { passive: true });

  if (renderer) {
    renderer.domElement.addEventListener('pointerdown', (event) => {
      if (event.target !== renderer.domElement || panelOpen || settingsOpen || (cinematicDirector && cinematicDirector.isActive()) || (worldInteractions && worldInteractions.isActive())) return;
      if (mobile && event.pointerType === 'touch' && event.clientX < window.innerWidth * 0.38 && event.clientY > window.innerHeight * 0.55) return;
      pointerHeld = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    });
    renderer.domElement.addEventListener('pointermove', (event) => {
      if (!pointerHeld || paused || panelOpen || settingsOpen || (cinematicDirector && cinematicDirector.isActive()) || (worldInteractions && worldInteractions.isActive())) return;
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      const sensitivity = mobile ? 0.006 : 0.004;
      yaw -= dx * sensitivity;
      pitch = THREE.MathUtils.clamp(pitch + dy * sensitivity, -0.05, 0.72);
    });
    const releasePointer = () => { pointerHeld = false; };
    renderer.domElement.addEventListener('pointerup', releasePointer);
    renderer.domElement.addEventListener('pointercancel', releasePointer);
    renderer.domElement.addEventListener('lostpointercapture', releasePointer);
    renderer.domElement.addEventListener('wheel', (event) => {
      if ((cinematicDirector && cinematicDirector.isActive()) || (worldInteractions && worldInteractions.isActive())) return;
      event.preventDefault();
      userZoom = THREE.MathUtils.clamp(userZoom + Math.sign(event.deltaY) * 0.08, 0.65, 1.45);
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
  const dt = Math.min(0.05, Math.max(0.001, (timestamp - (animate.lastTimestamp || timestamp)) / 1000));
  animate.lastTimestamp = timestamp;
  elapsed += dt;
  accumulator += Math.min(dt, 0.06);

  const fixedStep = 1 / 60;
  let substeps = 0;
  while (accumulator >= fixedStep && substeps < 3) {
    updatePhysics(fixedStep);
    accumulator -= fixedStep;
    substeps += 1;
  }
  if (substeps === 3 && accumulator > fixedStep) accumulator = fixedStep;

  updateCharacterRig(characterRig, dt, elapsed, moveAmount, grounded);
  if (doorControls?.update) doorControls.update(dt);
  updateRoomFromPosition();
  findInteraction();
  if (questSystem) questSystem.update(dt, elapsed, characterRig ? characterRig.character.position : null);

  if (tourActive && tourWaitingAtStop) {
    tourWaitTimer -= dt;
    const progress = Math.min(100, Math.max(0, ((4.8 - tourWaitTimer) / 4.8) * 100));
    ui.tourProgress.style.width = `${progress}%`;
    if (tourWaitTimer <= 0) {
      advanceTourStop();
    }
  }

  updateCamera(dt, timestamp);
  updatePerformance(dt, timestamp, scene);
  renderer.render(scene, camera);
}

async function init() {
  bindEvents();
  try {
    createRenderer();
    RAPIER = (await import('@dimforge/rapier3d-compat')).default;
    await RAPIER.init();
    world = new RAPIER.World({ x: 0, y: -13.5, z: 0 });
    world.timestep = 1 / 60;
    world.numSolverIterations = 4;

    const initialScene = createScene();
    window.portfolioScene = initialScene;

    playerBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 1.12, 13.0)
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

    camera.position.set(0, 4.8, 22.5);
    camera.lookAt(0, 2.0, 13.0);
    setRoom('yard');

    document.documentElement.classList.add('webgl-ready');
    $('loading-screen').classList.add('is-hidden');
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
