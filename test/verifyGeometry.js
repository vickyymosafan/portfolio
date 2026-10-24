// Geometry-level verification using the REAL character rig, bench and door controller
// (no mocks of the objects under test; only DOM canvas + Rapier are stubbed).
class MockCanvas {
  constructor(w = 256, h = 256) { this.width = w; this.height = h; }
  getContext() {
    return new Proxy({}, {
      get: (t, prop) => {
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => ({ addColorStop: () => {} });
        return () => {};
      },
    });
  }
}
const el = (tag) => (tag === 'canvas' ? new MockCanvas() : {
  style: {}, classList: { add() {}, remove() {}, contains: () => false },
  appendChild() {}, append() {}, setAttribute() {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
});
global.document = { getElementById: (id) => el(id), createElement: (t) => el(t), querySelector: () => null, querySelectorAll: () => [] };
global.window = { innerWidth: 1920, innerHeight: 1080, devicePixelRatio: 1, matchMedia: () => ({ matches: false }) };

const THREE = await import('three');
const { createCharacter, updateCharacterRig } = await import('../src/character.js');
const { createGardenBench } = await import('../src/landscape.js');
const { createInteractiveDoors } = await import('../src/architecture.js');
const { BENCH, SIT_ROOT_OFFSET, benchSeatAnchor } = await import('../src/seatLayout.js');
const { WorldInteractionManager, InteractionMode, InteractionState } = await import('../src/worldInteractions.js');
const fs = await import('node:fs');

let passed = 0;
let total = 0;
function assert(cond, msg, extra = '') {
  total++;
  if (!cond) { console.error(`FAIL: ${msg} ${extra}`); throw new Error(msg); }
  console.log(`PASS: ${msg} ${extra}`);
  passed++;
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// ---------- Seated pose against the real rig and real bench dimensions ----------
const scene = new THREE.Scene();
const rig = createCharacter(scene);
const standY = 1.12;
rig.character.position.set(0, standY, 0);
for (let i = 0; i < 90; i++) updateCharacterRig(rig, 1 / 60, i / 60, 0, true);
rig.character.updateMatrixWorld(true);
const standingTop = new THREE.Box3().setFromObject(rig.character);
const standingHeight = standingTop.max.y - (standY - 1.0);
const soleStanding = new THREE.Box3().setFromObject(rig.leftShoe).min.y;
console.log(`character: sole at ${soleStanding.toFixed(3)} when root y=${standY}, top at ${standingTop.max.y.toFixed(3)}`);
assert(near(soleStanding, 0, 0.3), 'standing feet are near the ground (root y 1.12)', `(sole y=${soleStanding.toFixed(3)})`);

const seatY = BENCH.seatTop;
rig.setActionState('SITTING');
rig.character.position.set(0, seatY + SIT_ROOT_OFFSET, 0);
rig.character.rotation.y = 0;
for (let i = 0; i < 180; i++) updateCharacterRig(rig, 1 / 60, i / 60, 0, true);
rig.character.updateMatrixWorld(true);

const hip = rig.leftLeg.getWorldPosition(new THREE.Vector3());
const thighUnderside = hip.y - 0.155;
assert(near(thighUnderside, seatY, 0.06), 'seated thigh underside rests on seat surface', `(thigh ${thighUnderside.toFixed(3)} vs seat ${seatY})`);
const soleSeated = new THREE.Box3().setFromObject(rig.leftShoe).min.y;
assert(Math.abs(soleSeated - soleStanding) <= 0.15, 'seated feet are within 0.15 of standing ground level (no floating legs)', `(seated sole ${soleSeated.toFixed(3)}, standing sole ${soleStanding.toFixed(3)})`);
const bodyBox = new THREE.Box3().setFromObject(rig.bodyMesh);
const torsoBox = bodyBox;
const bodyBackZ = bodyBox.min.z;
const backrestFrontZ = BENCH.backZ + 0.025;
assert(bodyBackZ > backrestFrontZ - 0.02, 'torso does not clip through the backrest', `(torso back z=${bodyBackZ.toFixed(3)}, backrest front z=${backrestFrontZ.toFixed(3)})`);
const torsoHalfWidth = (torsoBox.max.x - torsoBox.min.x) / 2;
assert(torsoHalfWidth < BENCH.frameX - 0.08, 'torso fits between the armrests', `(half width ${torsoHalfWidth.toFixed(2)} < ${(BENCH.frameX - 0.08).toFixed(2)})`);
const kneeFrontZ = new THREE.Box3().setFromObject(rig.leftLowerLeg).max.z;
assert(kneeFrontZ > BENCH.seatDepth * 0.5 - 0.05, 'lower legs hang over the front edge of the seat (legs have clearance)', `(calf/foot front z=${kneeFrontZ.toFixed(2)})`);
const headCentre = rig.headGroup.getWorldPosition(new THREE.Vector3()).y;
assert(headCentre > BENCH.backTop, 'head is above the backrest top (not hidden behind it)', `(head ${headCentre.toFixed(2)} > back ${BENCH.backTop})`);
assert(BENCH.backTop > seatY + 0.5, 'backrest is tall enough to support the torso', `(back ${BENCH.backTop})`);
assert(BENCH.width > torsoHalfWidth * 2 + 0.3, 'bench is wide enough for the character', `(width ${BENCH.width})`);

// ---------- Real bench transform vs anchor ----------
const bench = createGardenBench(scene, -9.2, 0, 9.8, 0.35);
bench.updateMatrixWorld(true);
const anchorWorld = new THREE.Vector3(...bench.userData.seatAnchorLocal).applyMatrix4(bench.matrixWorld);
const wm = new WorldInteractionManager();
const seat = wm.seats.find((s) => s.id === 'bench_yard_left');
assert(near(anchorWorld.x, seat.pos[0], 1e-6) && near(anchorWorld.y, seat.pos[1], 1e-6) && near(anchorWorld.z, seat.pos[2], 1e-6),
  'seat anchor equals the rendered bench seat surface in world space', JSON.stringify(anchorWorld.toArray()));
const fwd = new THREE.Vector3(0, 0, 1).transformDirection(bench.matrixWorld);
assert(near(fwd.x, Math.sin(seat.charFacing), 1e-6) && near(fwd.z, Math.cos(seat.charFacing), 1e-6), 'character facing matches bench front direction');
const benchBox = new THREE.Box3().setFromObject(bench);
console.log('bench world bounds', benchBox.min.toArray().map((n) => +n.toFixed(2)), benchBox.max.toArray().map((n) => +n.toFixed(2)));
assert(benchBox.max.y >= BENCH.backTop - 0.05, 'bench backrest reaches expected height in the world');

// ---------- Real door controller ----------
const doorColliders = [];
const interactionPoints = [];
const fakeWorld = {
  createRigidBody: () => ({}),
  createCollider: () => ({ enabled: true, setEnabled(v) { this.enabled = v; } }),
};
const RAPIER = {
  RigidBodyDesc: { fixed: () => ({ setTranslation() { return this; } }) },
  ColliderDesc: { cuboid: () => ({}) },
};
const doorScene = new THREE.Scene();
const door = createInteractiveDoors(doorScene, fakeWorld, RAPIER, doorColliders, interactionPoints);
const hinge = door.hingeWorld();
assert(near(hinge.left.x, -1.54, 1e-6) && near(hinge.right.x, 1.54, 1e-6), 'door hinges are at the frame edges (x=-1.54 / +1.54)');

function leafTip(panel, localX) {
  panel.updateWorldMatrix(true, false);
  return new THREE.Vector3(localX, 1.65, 0).applyMatrix4(panel.matrixWorld);
}
const closedLeft = leafTip(door.panels.doorLeft, 1.54);
const closedRight = leafTip(door.panels.doorRight, -1.54);
assert(near(closedLeft.x, 0, 0.05) && near(closedRight.x, 0, 0.05), 'closed leaves meet in the middle of the doorway');

assert(door.getState() === 'closed' && door.isOpen() === false, 'door starts closed');
let completed = null;
assert(door.toggle((open) => { completed = open; }) === true, 'toggle starts opening');
assert(door.getState() === 'opening' && door.isOpen() === false, 'logical state is not "open" until the swing finishes');
assert(door.toggle() === false, 'second toggle during animation is rejected');
let prev = door.panels.doorRight.rotation.y;
door.update(0.4);
assert(door.panels.doorRight.rotation.y > prev && door.getState() === 'opening', 'door rotates progressively (mid-swing)');
door.update(0.5);
assert(door.getState() === 'open' && door.isOpen() === true && completed === true, 'door reaches open state and completion callback fires');
const openLeft = leafTip(door.panels.doorLeft, 1.54);
const openRight = leafTip(door.panels.doorRight, -1.54);
const gap = openRight.x - openLeft.x;
assert(gap > 3.0, 'open leaves clear the doorway (usable opening)', `(gap between leaf tips ${gap.toFixed(2)}m)`);
assert(openLeft.z > 3.92 + 1.0 && openRight.z > 3.92 + 1.0, 'leaves swing outward on the hinge arc, not through the wall', `(tip z ${openLeft.z.toFixed(2)})`);
assert(doorColliders.every((c) => c.enabled === false), 'door collision disabled while open');

for (let cycle = 1; cycle <= 5; cycle++) {
  completed = null;
  assert(door.toggle((o) => { completed = o; }) === true, `door cycle ${cycle}: closing starts`);
  assert(door.getState() === 'closing', `door cycle ${cycle}: state closing`);
  for (let i = 0; i < 70; i++) door.update(1 / 60);
  assert(door.getState() === 'closed' && completed === false, `door cycle ${cycle}: closed and callback fired`);
  const cl = leafTip(door.panels.doorLeft, 1.54);
  assert(near(cl.x, 0, 0.05), `door cycle ${cycle}: closed pose is exact (tip x=${cl.x.toFixed(3)})`);
  completed = null;
  door.toggle((o) => { completed = o; });
  for (let i = 0; i < 70; i++) door.update(1 / 60);
  assert(door.getState() === 'open' && completed === true, `door cycle ${cycle}: reopened`);
}
assert(interactionPoints[0].getLabel() === 'Close the garden door', 'prompt label reflects real open state');
door.toggle();
assert(interactionPoints[0].getLabel() === 'Closing the garden door...', 'prompt shows Closing only while closing');
door.settle();
assert(interactionPoints[0].getLabel() === 'Open the garden door', 'settle() leaves door fully closed with correct prompt (no stuck transition)');

// ---------- Manager + real door: E sequence completes via door callback ----------
const mgrScene = new THREE.Scene();
const mgrRig = createCharacter(mgrScene);
mgrRig.character.position.set(0, 1.12, 5.0);
const camera = new THREE.PerspectiveCamera(48, 1.7, 0.1, 140);
camera.position.set(0, 4, 9);
const mgr = new WorldInteractionManager({ camera, characterRig: mgrRig, playerBody: { setTranslation() {}, setNextKinematicTranslation() {} } });
const door2 = createInteractiveDoors(new THREE.Scene(), fakeWorld, RAPIER, [], []);
for (let i = 1; i <= 5; i++) {
  mgrRig.character.position.set(0, 1.12, 5.0);
  assert(mgr.toggleDoor(door2, { cameraDistance: 4.4, yaw: 0, pitch: 0.25 }) === true, `manager door run ${i}: started`);
  let frames = 0;
  while (mgr.mode !== InteractionMode.NONE && frames < 600) {
    mgr.update(1 / 60);
    door2.update(1 / 60);
    frames++;
  }
  assert(mgr.lifecycleState === InteractionState.IDLE && mgr.mode === InteractionMode.NONE, `manager door run ${i}: returned to IDLE`, `(${frames} frames)`);
  assert(door2.getState() === (i % 2 === 1 ? 'open' : 'closed'), `manager door run ${i}: door state matches (${door2.getState()})`);
  assert(Number.isFinite(camera.position.x) && camera.position.y > 0.5, `manager door run ${i}: camera valid`);
  assert(near(mgrRig.character.position.z, 4.9, 0.02), `manager door run ${i}: character stands at reach position, in front of door`);
}

// ---------- Manager + real rig: seat root height and stand-up position ----------
const seatMgr = new WorldInteractionManager({ camera, characterRig: mgrRig, playerBody: { setTranslation() {}, setNextKinematicTranslation() {} } });
for (let i = 1; i <= 5; i++) {
  mgrRig.character.position.set(-8.4, 1.12, 11.2);
  assert(seatMgr.toggleSit(-8.4, 11.2, { cameraDistance: 5, yaw: 0, pitch: 0.3 }) === true, `sit run ${i}: started`);
  let f = 0;
  while (seatMgr.lifecycleState !== InteractionState.PLAYING_CINEMATIC && f++ < 200) { seatMgr.update(1 / 60); updateCharacterRig(mgrRig, 1 / 60, f / 60, 0, true); }
  const s = seatMgr.seats[0];
  assert(near(mgrRig.character.position.y, s.pos[1] + SIT_ROOT_OFFSET, 1e-6), `sit run ${i}: root at seat surface + pelvis offset`, `(y=${mgrRig.character.position.y.toFixed(3)})`);
  assert(near(mgrRig.character.position.x, s.pos[0], 1e-6) && near(mgrRig.character.position.z, s.pos[2], 1e-6), `sit run ${i}: centred on seat anchor`);
  for (let k = 0; k < 90; k++) { seatMgr.update(1 / 60); updateCharacterRig(mgrRig, 1 / 60, k / 60, 0, true); }
  assert(seatMgr.toggleSit(0, 0) === true && seatMgr.lifecycleState === InteractionState.RESTORING, `sit run ${i}: C while seated stands up`);
  f = 0;
  while (seatMgr.mode !== InteractionMode.NONE && f++ < 200) { seatMgr.update(1 / 60); updateCharacterRig(mgrRig, 1 / 60, f / 60, 0, true); }
  const stand = seatMgr.getStandPosition(s);
  assert(near(mgrRig.character.position.x, stand.x, 1e-6) && near(mgrRig.character.position.y, 1.12, 1e-6), `sit run ${i}: stood up clear of the bench`);
  const dist = Math.hypot(mgrRig.character.position.x - s.pos[0], mgrRig.character.position.z - s.pos[2]);
  assert(dist >= BENCH.seatDepth * 0.5 + 0.5, `sit run ${i}: standing spot clears the seat front (${dist.toFixed(2)}m)`);
}
// Esc while seated must not leave the character inside the bench
mgrRig.character.position.set(-8.4, 1.12, 11.2);
seatMgr.toggleSit(-8.4, 11.2);
for (let k = 0; k < 60; k++) seatMgr.update(1 / 60);
seatMgr.cancelAny();
const escDist = Math.hypot(mgrRig.character.position.x - seatMgr.seats[0].pos[0], mgrRig.character.position.z - seatMgr.seats[0].pos[2]);
assert(seatMgr.mode === InteractionMode.NONE && escDist > 0.9, 'Esc while seated recovers to a clear standing spot', `(${escDist.toFixed(2)}m from anchor)`);

// ---------- Key mapping (static check of the dispatcher source) ----------
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
assert(!/activateInteraction/.test(main), 'old shared E handler (activateInteraction) is gone');
assert((main.match(/\.toggleSit\(/g) || []).length === 1, 'sitting can only be started from one call site (KeyC branch)');
const eBranch = main.slice(main.indexOf("code === 'KeyE'"), main.indexOf("code === 'KeyF'"));
assert(!/toggleSit|getNearbySeat|standUp|toggleInspect/.test(eBranch), 'KeyE branch never touches seats or standing');
const cBranch = main.slice(main.indexOf("code === 'KeyC'"), main.indexOf("code === 'KeyE'"));
assert(!/currentInteraction|toggleDoor|\.action\(/.test(cBranch), 'KeyC branch never touches doors or room actions');

console.log(`\nALL ${passed} OF ${total} GEOMETRY TESTS PASSED`);
