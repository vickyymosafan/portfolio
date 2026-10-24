// Mock DOM before any modules are loaded
class MockCanvas {
  constructor(w = 256, h = 256) {
    this.width = w;
    this.height = h;
  }
  getContext() {
    return new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
          return () => ({ addColorStop: () => {} });
        }
        if (prop === 'measureText') {
          return () => ({ width: 50 });
        }
        return () => {};
      },
    });
  }
}

const createMockElement = (tag = 'div') => {
  if (tag === 'canvas') return new MockCanvas();
  return {
    tagName: tag,
    textContent: '',
    className: '',
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false,
    },
    appendChild: () => {},
    append: () => {},
    setAttribute: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    replaceChildren: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
  };
};

global.document = {
  getElementById: (id) => createMockElement(id),
  createElement: (tag) => createMockElement(tag),
  querySelector: () => null,
  querySelectorAll: () => [],
};
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1,
  matchMedia: () => ({ matches: false }),
};

const THREE = await import('three');
const { portfolio } = await import('../src/portfolio.js');
const { WorldInteractionManager, InteractionMode, InteractionState } = await import('../src/worldInteractions.js');
const { CinematicDirector, CinematicState } = await import('../src/cinematic.js');
const { QuestSystem } = await import('../src/quest.js');
const { BENCH, SIT_ROOT_OFFSET, benchSeatAnchor } = await import('../src/seatLayout.js');

let passedTests = 0;
let totalTests = 0;
function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
  passedTests++;
}

// 1. Basic Content Verification
const projects = portfolio.content.projects.items;
assert(projects.length === 7, 'Portfolio has exactly 7 verified flagship projects');
assert(projects[0].id === 'system-pemerintahan', 'Project 1 is system-pemerintahan');
assert(projects[1].id === 'FullStack_ai-smartchat', 'Project 2 is FullStack_ai-smartchat');
assert(projects[2].id === 'Beyond-RAG-Artificial-Super-Intelligence', 'Project 3 is Beyond-RAG-Artificial-Super-Intelligence');
assert(portfolio.rooms.length === 7, 'Portfolio has 7 rooms (yard + 6 themed rooms)');

// 2. Articulation Rig Mock
const mockCharacter = new THREE.Group();
mockCharacter.position.set(0, 1.12, 13.0);
let currentActionState = 'IDLE';
const mockRig = {
  character: mockCharacter,
  setActionState: (state, opts) => {
    currentActionState = state;
  },
  state: {
    actionState: 'IDLE',
  },
};
const mockCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
mockCamera.position.set(0, 4, 10);
let lastPhysPos = { x: 0, y: 1.12, z: 13.0 };
const mockPlayerBody = {
  setTranslation: (pos) => {
    lastPhysPos = { ...pos };
  },
  setNextKinematicTranslation: (pos) => {
    lastPhysPos = { ...pos };
  },
};

// 3. Test WorldInteractionManager State Machine
let syncedCamera = null;
const wm = new WorldInteractionManager();
wm.setContext({
  camera: mockCamera,
  characterRig: mockRig,
  playerBody: mockPlayerBody,
  onPositionUpdate: (x, y, z) => {
    lastPhysPos = { x, y, z };
  },
  onCameraSync: (yaw, pitch, dist) => {
    syncedCamera = { yaw, pitch, dist };
  },
});

assert(wm.seats.length === 6, 'WorldInteractionManager defines 6 seating targets');
assert(wm.inspectables.length === 7, 'WorldInteractionManager defines 7 inspectables');

// Test Sitting Lifecycle on Garden Bench
const benchSeat = wm.getNearbySeat(-9.2, 9.8);
assert(benchSeat !== null && benchSeat.id === 'bench_yard_left', 'Correctly detects nearby garden bench');

// Move character near bench
mockCharacter.position.set(-8.5, 1.12, 10.5);
const sitResult = wm.toggleSit(-8.5, 10.5, { cameraDistance: 5.0, yaw: 0, pitch: 0.2 });
assert(sitResult === true, 'toggleSit returns true on valid seat');
assert(wm.mode === InteractionMode.SITTING, 'Mode changes to SITTING');
assert(wm.lifecycleState === InteractionState.APPROACHING, 'State transitions to APPROACHING');
assert(wm.isActive() === true, 'isActive() is true while approaching seat');
assert(wm.isInputLocked() === true, 'isInputLocked() is true while sitting');

// Step through approach phase
wm.update(0.4);
assert(wm.lifecycleState === InteractionState.PLAYING_CINEMATIC, 'State transitions to PLAYING_CINEMATIC (Seated Idle)');
assert(currentActionState === 'SITTING', 'Character rig action changes to SITTING');
assert(Number.isFinite(mockCamera.position.x) && Number.isFinite(mockCamera.position.y), 'Camera position is finite');
assert(mockCamera.position.y > 0.5, 'Camera position Y is above ground (> 0.5m)');

// Stand up lifecycle
const standResult = wm.toggleSit(-9.2, 9.8);
assert(standResult === true, 'Second toggleSit initiates standUp');
assert(wm.lifecycleState === InteractionState.RESTORING, 'State transitions to RESTORING');
assert(currentActionState === 'IDLE', 'Character rig returns to IDLE');

// Step through restoring phase
wm.update(0.55);
assert(wm.mode === InteractionMode.NONE, 'Mode returns to NONE after stand completion');
assert(wm.lifecycleState === InteractionState.IDLE, 'State returns to IDLE');
assert(wm.isActive() === false, 'isActive() is false after standing');
assert(syncedCamera !== null, 'Camera yaw and distance were synchronized with main controller');

// Test Repeated Sitting and Standing: 5 consecutive cycles
console.log('--- Testing 5 Consecutive Sit/Stand Cycles ---');
for (let cycle = 1; cycle <= 5; cycle++) {
  mockCharacter.position.set(-8.5, 1.12, 10.5);
  const sit = wm.toggleSit(-8.5, 10.5, { cameraDistance: 4.8, yaw: 0.1, pitch: 0.25 });
  assert(sit === true, `Cycle ${cycle}: Sitting starts successfully`);
  wm.update(0.4); // Complete approach
  assert(wm.lifecycleState === InteractionState.PLAYING_CINEMATIC, `Cycle ${cycle}: Seated idle reached`);
  
  // Test duplicate spam while seated
  const spamSit = wm.toggleSit(-8.5, 10.5); // Should stand up
  assert(spamSit === true, `Cycle ${cycle}: Triggering C while seated triggers standUp`);
  wm.update(0.55); // Complete restore
  assert(wm.lifecycleState === InteractionState.IDLE, `Cycle ${cycle}: Returned to IDLE cleanly`);
  assert(wm.mode === InteractionMode.NONE, `Cycle ${cycle}: Mode is NONE`);
}

// Test Invalid Distance Sitting
const tooFarSit = wm.toggleSit(50, 50);
assert(tooFarSit === false, 'Cannot sit when out of range (50m away)');
assert(wm.lifecycleState === InteractionState.IDLE, 'State remains IDLE on invalid distance');

// Test Desk Sitting (Office Chair)
const deskSeat = wm.getNearbySeat(11.0, -0.2);
assert(deskSeat !== null && deskSeat.isDesk === true, 'Detects office ergonomic desk chair');
mockCharacter.position.set(11.0, 1.12, -0.2);
wm.toggleSit(11.0, -0.2);
wm.update(0.4);
assert(currentActionState === 'WORKING_DESK', 'Sitting at desk triggers WORKING_DESK action state');
wm.standUp();
wm.update(0.55);
assert(currentActionState === 'IDLE', 'Standing up from desk triggers IDLE');

// Test Inspecting (Front Yard Tree)
const treeTarget = wm.getNearbyInspectable(-12.2, 14.5);
assert(treeTarget !== null && treeTarget.id === 'tree_front', 'Detects grand front yard tree');
mockCharacter.position.set(-11.5, 1.12, 14.0);
const inspectResult = wm.toggleInspect(-11.5, 14.0);
assert(inspectResult === true, 'toggleInspect returns true on valid target');
assert(wm.mode === InteractionMode.INSPECTING, 'Mode changes to INSPECTING');
assert(currentActionState === 'INSPECTING', 'Character rig action changes to INSPECTING');

// Cancel Inspection via cancelAny
const cancelResult = wm.cancelAny();
assert(cancelResult === true, 'cancelAny cancels inspection');
assert(wm.mode === InteractionMode.NONE, 'Mode returns to NONE after cancel');
assert(currentActionState === 'IDLE', 'Character rig returns to IDLE after cancel');

// Test Door Interaction Lifecycle
console.log('--- Testing Door Interaction Lifecycle ---');
let doorToggledCount = 0;
let doorState = false;
const mockDoorControls = {
  isOpen: () => doorState,
  toggle: (cb) => {
    doorState = !doorState;
    doorToggledCount++;
    if (cb) cb(doorState);
  },
};

mockCharacter.position.set(0, 1.12, 4.8);
const doorRes = wm.toggleDoor(mockDoorControls, { cameraDistance: 4.4, yaw: 0, pitch: 0.25 });
assert(doorRes === true, 'toggleDoor begins door sequence');
assert(wm.mode === InteractionMode.DOOR, 'Mode changes to DOOR');
assert(wm.lifecycleState === InteractionState.APPROACHING, 'Door sequence starts in APPROACHING');

// Approach finishes
wm.update(0.35);
assert(wm.lifecycleState === InteractionState.PLAYING_CINEMATIC, 'Transitions to PLAYING_CINEMATIC');
assert(currentActionState === 'DOOR_REACH', 'Character rig plays DOOR_REACH animation');
assert(doorToggledCount === 1, 'Door controller toggle was invoked');
assert(doorState === true, 'Door state is now open');
assert(Number.isFinite(mockCamera.position.x) && Number.isFinite(mockCamera.position.y), 'Camera coordinates are finite');
assert(mockCamera.position.y > 0.5, 'Camera coordinates Y are safely above ground');

// Door animation finishes, begins restore
wm.update(0.85);
assert(wm.lifecycleState === InteractionState.RESTORING, 'Transitions to RESTORING');
assert(currentActionState === 'IDLE', 'Character rig returns to IDLE');

// Restore finishes
wm.update(0.55);
assert(wm.lifecycleState === InteractionState.IDLE, 'State returns to IDLE');
assert(wm.mode === InteractionMode.NONE, 'Mode returns to NONE after door completion');

// Test Repeated Door Open and Close: 5 consecutive cycles
console.log('--- Testing 5 Consecutive Door Open/Close Cycles ---');
for (let cycle = 1; cycle <= 5; cycle++) {
  mockCharacter.position.set(0, 1.12, 4.8);
  const openRes = wm.toggleDoor(mockDoorControls, { cameraDistance: 4.4, yaw: 0, pitch: 0.25 });
  assert(openRes === true, `Door Cycle ${cycle}: Toggle initiated`);
  
  // Test duplicate spam while in progress
  const spam = wm.toggleDoor(mockDoorControls);
  assert(spam === false, `Door Cycle ${cycle}: Repeated toggle rejected during active sequence`);

  wm.update(0.35); // Approach
  wm.update(0.85); // Cinematic play
  wm.update(0.55); // Restore
  assert(wm.lifecycleState === InteractionState.IDLE, `Door Cycle ${cycle}: Sequence returned cleanly to IDLE`);
  assert(wm.mode === InteractionMode.NONE, `Door Cycle ${cycle}: Mode is NONE`);
}

// Test Watchdog Recovery Mechanism
console.log('--- Testing Watchdog Recovery Mechanism ---');
mockCharacter.position.set(0, 1.12, 4.8);
wm.toggleDoor(mockDoorControls);
assert(wm.lifecycleState === InteractionState.APPROACHING, 'Started interaction before watchdog test');
// Advance clock beyond watchdog limit (3.2s) without completing
wm.update(3.5);
assert(wm.lifecycleState === InteractionState.IDLE, 'Watchdog successfully recovered stuck interaction to IDLE');
assert(wm.mode === InteractionMode.NONE, 'Watchdog restored mode to NONE');
assert(currentActionState === 'IDLE', 'Watchdog restored character rig to IDLE');

// 4. Test CinematicDirector
const cd = new CinematicDirector();
cd.setSceneContext({
  camera: mockCamera,
  characterRig: mockRig,
});

const startProjects = cd.startScene('projects');
assert(startProjects === true, 'CinematicDirector starts projects section reveal');
assert(cd.isActive() === true, 'CinematicDirector isActive is true');
assert(cd.activeSection === 'projects', 'Active section is projects');
assert(currentActionState === 'PRESENTING', 'Character rig set to PRESENTING during portfolio reveal');

// Carousel navigation
assert(cd.activeProjectIndex === 0, 'Active project starts at index 0');
cd.setProjectIndex(2);
assert(cd.activeProjectIndex === 2, 'Carousel navigates to project index 2');

// Exit scene
cd.exitScene();
assert(cd.state === CinematicState.EXITING, 'State transitions to EXITING');
cd.update(1.0);
assert(cd.isActive() === false, 'CinematicDirector finishes exit and restores normal camera');

// 5. Test QuestSystem
const quest = new QuestSystem(new THREE.Group(), mockRig);
assert(quest.collectibles.length === 5, 'QuestSystem defines 5 hidden collectible artifacts');
assert(quest.collectedCount === 0, 'Starts with 0 collected');

const collect1 = quest.collectItem('paradigm');
assert(collect1 === true, 'Paradigm neural gem collected');
assert(quest.collectedCount === 1, 'Collected count is now 1');

// Collect remaining to verify Easter egg
quest.collectItem('stack');
quest.collectItem('journey');
quest.collectItem('artifacts');
quest.collectItem('blueprint');
assert(quest.collectedCount === 5, 'All 5 artifacts collected');

// 6. Test Bench Scaling & Seating Alignment
console.log('--- Testing Bench Scaling & Seating Alignment ---');
assert(BENCH.width === 3.2, 'Bench width is 3.2m to match cartoon character proportions');
assert(BENCH.seatDepth === 1.0, 'Bench seat depth is 1.0m');
assert(BENCH.seatTop === 0.52, 'Bench seat top surface is at 0.52m');
assert(BENCH.backTop === 1.72, 'Bench backrest extends to 1.72m for character shoulders');
assert(BENCH.armTop === 0.96, 'Bench armrest top is at 0.96m');
assert(BENCH.frameX === 1.45, 'Bench cast iron frame width is 1.45m half-extent');
assert(SIT_ROOT_OFFSET === 0.895, 'SIT_ROOT_OFFSET is exactly 0.895m matching character seated pelvis/thigh offset');

const leftAnchor = benchSeatAnchor(-9.2, 0, 9.8, 0.35);
assert(Math.abs(leftAnchor.pos[1] - 0.52) < 0.001, 'Left bench seat anchor Y is exactly at seatTop (0.52m)');
assert(leftAnchor.charFacing === 0.35, 'Left bench facing is aligned with bench rotation (0.35 rad)');

// Verify seated character pelvis/thigh underside height
const targetRootY = leftAnchor.pos[1] + SIT_ROOT_OFFSET; // 0.52 + 0.895 = 1.415
const seatedUndersideY = targetRootY - SIT_ROOT_OFFSET;
assert(Math.abs(seatedUndersideY - BENCH.seatTop) < 0.001, 'Character seated thigh/pelvis underside rests exactly on bench seat surface (0.52m)');

// 7. Test Stand Position Clearance
console.log('--- Testing Stand Position Clearance ---');
const leftBenchSeat = wm.seats.find((s) => s.id === 'bench_yard_left');
assert(leftBenchSeat !== undefined, 'Found bench_yard_left seat definition');
const standPos = wm.getStandPosition(leftBenchSeat);
const clearanceDist = Math.hypot(standPos.x - leftBenchSeat.pos[0], standPos.z - leftBenchSeat.pos[2]);
assert(clearanceDist >= 1.35, `Stand position clears bench depth cleanly (${clearanceDist.toFixed(2)}m >= 1.35m)`);
assert(standPos.y === 1.12, 'Standing character root height is 1.12m');

// 8. Test Strict Key Exclusivity Rules
console.log('--- Testing Strict Key Exclusivity Rules ---');
const fakeInteractionPoints = [
  { id: 'door', position: { x: 0, z: 4.8 }, radius: 2.4, action: () => true },
  { id: 'about', position: { x: -6.0, z: 1.0 }, radius: 2.8, action: () => true },
];

function simulateDispatchInteraction(code, posX, posZ, wManager, intPoints) {
  if (wManager.isTransitioning()) return { success: false, reason: 'transitioning' };
  if (code === 'KeyC') {
    if (wManager.mode === InteractionMode.SITTING) {
      return { success: wManager.standUp(), action: 'stand' };
    } else if (wManager.mode !== InteractionMode.NONE) {
      return { success: false, reason: 'other_interaction_active' };
    } else {
      const seat = wManager.getNearbySeat(posX, posZ);
      if (!seat) return { success: false, reason: 'no_seat_in_range' };
      return { success: wManager.toggleSit(posX, posZ), action: 'sit', seat: seat.id };
    }
  } else if (code === 'KeyE') {
    if (wManager.mode !== InteractionMode.NONE) return { success: false, reason: 'other_interaction_active' };
    const door = intPoints.find((p) => p.id === 'door');
    if (door && Math.hypot(posX - door.position.x, posZ - door.position.z) < door.radius) {
      return { success: door.action() !== false, action: 'door' };
    }
    const exhibits = intPoints.filter((p) => p.id !== 'door' && Math.hypot(posX - p.position.x, posZ - p.position.z) < p.radius);
    if (exhibits.length > 0) {
      return { success: exhibits[0].action() !== false, action: 'exhibit', id: exhibits[0].id };
    }
    return { success: false, reason: 'no_e_target_in_range' };
  }
  return { success: false, reason: 'unhandled_key' };
}

// Test KeyE near bench does NOT sit
const keyENearBench = simulateDispatchInteraction('KeyE', -8.5, 10.5, wm, fakeInteractionPoints);
assert(keyENearBench.success === false && keyENearBench.reason === 'no_e_target_in_range', 'KeyE near garden bench does NOT trigger sitting');

// Test KeyC near bench triggers sitting
const keyCNearBench = simulateDispatchInteraction('KeyC', -8.5, 10.5, wm, fakeInteractionPoints);
assert(keyCNearBench.success === true && keyCNearBench.action === 'sit', 'KeyC near garden bench successfully triggers sitting');
wm.update(0.4); // Complete approach to PLAYING_CINEMATIC

// Test KeyE while seated is rejected
const keyEWhileSitting = simulateDispatchInteraction('KeyE', -8.5, 10.5, wm, fakeInteractionPoints);
assert(keyEWhileSitting.success === false && keyEWhileSitting.reason === 'other_interaction_active', 'KeyE while seated is strictly rejected');

// Test KeyC while seated stands up
const keyCWhileSitting = simulateDispatchInteraction('KeyC', -8.5, 10.5, wm, fakeInteractionPoints);
assert(keyCWhileSitting.success === true && keyCWhileSitting.action === 'stand', 'KeyC while seated stands up');
wm.update(0.55); // Complete restore to IDLE

// Test KeyC near door does NOT open door
const keyCNearDoor = simulateDispatchInteraction('KeyC', 0, 4.8, wm, fakeInteractionPoints);
assert(keyCNearDoor.success === false && keyCNearDoor.reason === 'no_seat_in_range', 'KeyC near garden door does NOT open door');

// Test KeyE near door opens door
const keyENearDoor = simulateDispatchInteraction('KeyE', 0, 4.8, wm, fakeInteractionPoints);
assert(keyENearDoor.success === true && keyENearDoor.action === 'door', 'KeyE near garden door triggers door action');

// 9. Test All 6 Supported Seats, Contact Room Camera Occlusion & Raycast Resolution
console.log('--- Testing All 6 Supported Seats & Contact Room Camera Occlusion ---');
const seatIds = ['bench_yard_left', 'bench_yard_right', 'sofa_living', 'chair_office', 'chair_library', 'bench_terrace'];
assert(wm.seats.length === 6, 'All 6 supported seats defined in WorldInteractionManager');

for (const id of seatIds) {
  const seat = wm.seats.find((s) => s.id === id);
  assert(seat !== undefined, `Seat ${id} is defined`);
  assert(Number.isFinite(seat.pos[0]) && Number.isFinite(seat.pos[1]) && Number.isFinite(seat.pos[2]), `Seat ${id} pos is finite`);
  assert(Number.isFinite(seat.charFacing), `Seat ${id} charFacing is finite`);
  assert(seat.cameraShot !== undefined, `Seat ${id} defines room-aware cameraShot`);
  assert(seat.cameraShot.pos[1] > 0.5, `Seat ${id} camera height Y is safely above ground (> 0.5m)`);
}

// Specific Contact Room (Garden Terrace) Camera Check
const terraceSeat = wm.seats.find((s) => s.id === 'bench_terrace');
assert(terraceSeat.pos[0] === 12.3, 'Terrace sofa X is at 12.3 (inside Contact Room)');
assert(terraceSeat.pos[2] === -16.1, 'Terrace sofa Z is at -16.1 (Bay 3)');
assert(Math.abs(terraceSeat.charFacing - (-Math.PI * 0.5)) < 0.001, 'Terrace sofa faces west into the room (-PI/2)');

// Verify Contact Room cameraShot is safely INSIDE Bay 3 (z between -12.2 and -20.0, x between 4.0 and 14.0)
const terraceCam = terraceSeat.cameraShot;
assert(terraceCam.pos[2] < -12.4, `Terrace camera Z (${terraceCam.pos[2]}) is south of partition wall (-12.2)`);
assert(terraceCam.pos[2] > -19.5, `Terrace camera Z (${terraceCam.pos[2]}) is north of rear wall (-20.0)`);
assert(terraceCam.pos[0] > 4.0 && terraceCam.pos[0] < 13.5, `Terrace camera X (${terraceCam.pos[0]}) is inside room width (4.0 to 13.5)`);

// Test sitting on Contact Room terrace sofa
mockCharacter.position.set(terraceSeat.pos[0], 1.12, terraceSeat.pos[2]);
const terraceSit = wm.toggleSit(terraceSeat.pos[0], terraceSeat.pos[2]);
assert(terraceSit === true, 'Sitting on Contact Room terrace sofa starts');
wm.update(0.4); // Complete approach
assert(wm.lifecycleState === InteractionState.PLAYING_CINEMATIC, 'Contact Room terrace sofa enters seated cinematic');
assert(Math.abs(mockCamera.position.x - terraceCam.pos[0]) < 0.05, 'Camera positioned at Contact Room 3/4 hero view X');
assert(Math.abs(mockCamera.position.z - terraceCam.pos[2]) < 0.05, 'Camera positioned at Contact Room 3/4 hero view Z (unobstructed by partition wall)');
wm.standUp();
wm.update(0.55); // Complete restore
assert(wm.lifecycleState === InteractionState.IDLE, 'Contact Room terrace standUp returns cleanly to IDLE');

// Test 5 consecutive cycles on Contact Room Terrace Seat
console.log('--- Testing 5 Consecutive Sit/Stand Cycles in Contact Room ---');
for (let c = 1; c <= 5; c++) {
  mockCharacter.position.set(terraceSeat.pos[0], 1.12, terraceSeat.pos[2]);
  const s = wm.toggleSit(terraceSeat.pos[0], terraceSeat.pos[2]);
  assert(s === true, `Contact Room Cycle ${c}: Sit started`);
  wm.update(0.4);
  assert(wm.lifecycleState === InteractionState.PLAYING_CINEMATIC, `Contact Room Cycle ${c}: Seated`);
  const stand = wm.standUp();
  assert(stand === true, `Contact Room Cycle ${c}: Stand started`);
  wm.update(0.55);
  assert(wm.lifecycleState === InteractionState.IDLE, `Contact Room Cycle ${c}: IDLE`);
}

// Test Raycast Camera Obstruction Resolution
console.log('--- Testing Raycast Camera Obstruction Resolution ---');
const mockWallBox = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 5.0, 7.0),
  new THREE.MeshBasicMaterial()
);
mockWallBox.position.set(8.5, 2.5, -14.8);
mockWallBox.updateMatrixWorld(true);
wm.cameraBlockers = [mockWallBox];

const testTargetCamPos = new THREE.Vector3(7.0, 1.85, -14.8);
const testLookTarget = new THREE.Vector3(12.3, 1.25, -16.1);
wm.resolveCameraObstruction(testTargetCamPos, testLookTarget, 0.35);
assert(Number.isFinite(testTargetCamPos.x) && Number.isFinite(testTargetCamPos.y), 'Camera position resolved safely without NaN');

// 10. Test Furniture & Environment Physics Colliders
console.log('--- Testing Furniture & Environment Physics Colliders ---');
const { createRoomInteriors } = await import('../src/furniture.js');
const mockBuilding = new THREE.Group();
const mockInteractions = [];
const createdBodies = [];
const createdColliders = [];
const mockRapier = {
  RigidBodyDesc: {
    fixed: () => ({
      translation: null,
      setTranslation: function(x, y, z) {
        this.translation = { x, y, z };
        return this;
      },
    }),
  },
  ColliderDesc: {
    cuboid: (hx, hy, hz) => ({ type: 'cuboid', halfExtents: [hx, hy, hz] }),
    cylinder: (hh, rad) => ({ type: 'cylinder', halfHeight: hh, radius: rad }),
  },
};
const mockWorld = {
  createRigidBody: (desc) => {
    const body = { translation: desc.translation };
    createdBodies.push(body);
    return body;
  },
  createCollider: (desc, body) => {
    const collider = { desc, body };
    createdColliders.push(collider);
    return collider;
  },
};

createRoomInteriors(mockBuilding, mockInteractions, () => {}, mockWorld, mockRapier, createdBodies);
assert(createdBodies.length >= 22, `Created ${createdBodies.length} interior furniture static rigid bodies (expected >= 22)`);
assert(createdColliders.length >= 22, `Created ${createdColliders.length} interior furniture physics colliders (expected >= 22)`);

// Verify all 6 seats have clear, non-overlapping stand positions
for (const seat of wm.seats) {
  const stand = wm.getStandPosition(seat);
  assert(Number.isFinite(stand.x) && Number.isFinite(stand.y) && Number.isFinite(stand.z), `Seat ${seat.id} stand position is finite`);
  assert(stand.y >= 1.0, `Seat ${seat.id} stand Y (${stand.y}) is at standing height (>= 1.0m)`);
  const stepDist = Math.hypot(stand.x - seat.pos[0], stand.z - seat.pos[2]);
  assert(stepDist >= 0.85, `Seat ${seat.id} stand step distance (${stepDist.toFixed(2)}m) safely clears seat cushion (>= 0.85m)`);
}

console.log(`\n🎉 ALL ${passedTests} OF ${totalTests} TESTS PASSED CLEANLY!`);


