import * as THREE from 'three';
import { materials, palette } from './materials.js';
import { addBox, addSphere, addCylinder, mergeSubtreeMeshes } from './geometry.js';

/**
 * Creates the stylized cartoon character rig with hierarchical articulation:
 * - Root character container & dynamic contact shadow
 * - Torso (knitted tunic, white collar, ribbed hem, crossbody messenger bag)
 * - Head (stylized face, layered haircut, dynamic cowlick tuft, glinting eyes, blush, button nose, warm smile)
 * - Arms with shoulder and elbow joints (sweater sleeves, cuffs, stylized hands with thumbs)
 * - Legs with hip, knee, and ankle joints (white trousers, designer sneakers with rubber soles & toe caps)
 */
export function createCharacter(scene) {
  const character = new THREE.Group();
  character.userData.isDynamic = true;
  scene.add(character);
  character.position.set(0, 1.12, 16.8);

  // Dynamic stylized ground contact shadow blob
  const shadowGeo = new THREE.CircleGeometry(0.55, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x1b3026,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI * 0.5;
  shadow.position.y = -0.96;
  character.add(shadow);

  // Pelvis / Core base
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0, 0);
  character.add(pelvisGroup);

  // Torso / Sweater Group (swivels with walking and leans forward)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0, 0);
  pelvisGroup.add(torsoGroup);

  // ---------------------------------------------------------------------------
  // COOL DEVELOPER TECHWEAR OUTFIT MATERIALS
  // Minimalist obsidian jacket, charcoal tee, emerald tech accents,
  // dark tapered denim, designer sneakers, titanium watch, sleek headphones
  // ---------------------------------------------------------------------------
  const devMat = (color, roughness = 0.7, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04, ...extra });

  const jacketMat = devMat(0x1a202c, 0.72); // Matte obsidian tech overshirt/jacket
  const teeMat = devMat(0xe2e8f0, 0.65); // Clean light heather streetwear inner tee (sharp contrast!)
  const teeTrimMat = devMat(0x10b981, 0.45, { emissive: 0x059669, emissiveIntensity: 0.25 }); // Vibrant emerald accent
  const denimMat = devMat(0x232c3d, 0.82); // Clean dark indigo tapered denim trousers
  const beltMat = devMat(0x171923, 0.55); // Matte black tactical belt
  const hairMat = devMat(0x161311, 0.65); // Deep rich espresso hair
  const hairLockMat = devMat(0x221c18, 0.62); // Layered textured hair locks
  const phoneMat = devMat(0x2d3436, 0.35, { metalness: 0.65 }); // Space-gray aluminum headphones
  const phoneAccentMat = devMat(0x10b981, 0.35, { emissive: 0x059669, emissiveIntensity: 0.45 }); // Emerald LED ring
  const packMat = devMat(0x1f242d, 0.75); // Minimalist waterproof tech sling/backpack
  const watchMat = devMat(0x2d3748, 0.25, { metalness: 0.75 }); // Titanium smartwatch
  const braceletMat = devMat(0x141414, 0.5); // Minimalist black cord bracelet
  const sneakerMat = devMat(0xf8fafc, 0.55); // Crisp clean white leather
  const sneakerDarkMat = devMat(0x1e293b, 0.6); // Obsidian leather panels
  const sneakerAccentMat = devMat(0x10b981, 0.45); // Emerald accent detail
  const nailMat = devMat(0xffece3, 0.40); // Subtle cartoon fingernail sheen

  // 1. Sleek, natural fit torso (modern tech-wear streetwear — NOT bulky, NOT kekar)
  // Main jacket torso body (lean, tailored developer fit)
  const bodyMesh = addBox(torsoGroup, [0, 0.17, 0], [0.36, 0.34, 0.22], jacketMat, { shadow: true });
  // Natural rounded jacket side contours
  addCylinder(torsoGroup, [-0.155, 0.17, 0], 0.08, 0.08, 0.34, jacketMat, { segments: 14 });
  addCylinder(torsoGroup, [0.155, 0.17, 0], 0.08, 0.08, 0.34, jacketMat, { segments: 14 });
  // Lower jacket ribbed hem
  addBox(torsoGroup, [0, 0.0, 0], [0.35, 0.04, 0.21], devMat(0x141820, 0.85));

  // Inner streetwear tee (clean flat panel, cleanly tucked, sharp contrast!)
  addBox(torsoGroup, [0, 0.18, 0.08], [0.16, 0.28, 0.065], teeMat);
  addCylinder(torsoGroup, [0, 0.33, 0.035], 0.080, 0.084, 0.024, teeMat, { segments: 14 });

  // Symmetrical open jacket lapels framing inner tee
  addBox(torsoGroup, [-0.085, 0.18, 0.115], [0.030, 0.32, 0.018], jacketMat);
  addBox(torsoGroup, [0.085, 0.18, 0.115], [0.030, 0.32, 0.018], jacketMat);

  // Minimalist terminal prompt "< / >" on inner tee
  addBox(torsoGroup, [-0.026, 0.22, 0.120], [0.020, 0.005, 0.006], devMat(0x0f172a, 0.7), { shadow: false });
  addBox(torsoGroup, [0, 0.22, 0.120], [0.005, 0.018, 0.006], teeTrimMat, { shadow: false });
  addBox(torsoGroup, [0.026, 0.22, 0.120], [0.020, 0.005, 0.006], devMat(0x0f172a, 0.7), { shadow: false });

  // Left chest tech vertical zip pocket
  addBox(torsoGroup, [0.12, 0.21, 0.115], [0.005, 0.036, 0.005], devMat(0x475569, 0.3, { metalness: 0.7 }), { shadow: false });
  addSphere(torsoGroup, [0.128, 0.225, 0.116], [0.005, 0.005, 0.003], teeTrimMat, { shadow: false });

  // Standup jacket collar & well-proportioned athletic neck
  addCylinder(torsoGroup, [0, 0.34, 0], 0.105, 0.125, 0.05, jacketMat, { segments: 16 });
  addCylinder(torsoGroup, [0, 0.44, 0], 0.086, 0.100, 0.14, materials.skin, { segments: 14 });

  // Tactical belt with gunmetal buckle
  addBox(torsoGroup, [0, -0.045, 0], [0.34, 0.05, 0.20], beltMat);
  addBox(torsoGroup, [0, -0.045, 0.105], [0.048, 0.04, 0.015], watchMat, { shadow: false });

  // Sleek over-ear headphones resting comfortably around collar (AirPods Max style)
  const phones = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.016, 8, 20, Math.PI * 1.25), phoneMat);
  phones.position.set(0, 0.39, 0.02);
  phones.rotation.set(Math.PI * 0.5 + 0.30, 0, Math.PI * 0.875);
  torsoGroup.add(phones);
  for (const side of [-1, 1]) {
    addCylinder(torsoGroup, [side * 0.13, 0.39, 0.05], 0.050, 0.050, 0.035, phoneMat, {
      rotation: [0.35, 0, Math.PI * 0.5], segments: 16,
    });
    addCylinder(torsoGroup, [side * 0.150, 0.39, 0.05], 0.032, 0.032, 0.008, phoneAccentMat, {
      rotation: [0.35, 0, Math.PI * 0.5], segments: 16, shadow: false,
    });
  }

  // Minimalist ergonomic tech backpack (sleek contoured silhouette)
  addBox(torsoGroup, [0, 0.17, -0.14], [0.26, 0.32, 0.08], packMat);
  addCylinder(torsoGroup, [0, 0.31, -0.14], 0.11, 0.11, 0.24, packMat, { rotation: [0, 0, Math.PI * 0.5], segments: 14 });
  addBox(torsoGroup, [0, 0.06, -0.18], [0.20, 0.14, 0.025], devMat(0x161b22, 0.8));
  addBox(torsoGroup, [0, 0.35, -0.10], [0.08, 0.016, 0.03], devMat(0x141820, 0.9));
  addBox(torsoGroup, [0, 0.25, -0.18], [0.14, 0.014, 0.010], teeTrimMat, { shadow: false });
  for (const side of [-1, 1]) {
    // Slim ergonomic straps resting naturally over shoulders
    addBox(torsoGroup, [side * 0.12, 0.31, -0.01], [0.024, 0.016, 0.24], packMat);
    addBox(torsoGroup, [side * 0.12, 0.22, 0.105], [0.020, 0.16, 0.014], packMat, { rotation: [-0.04, 0, side * 0.02] });
    addBox(torsoGroup, [side * 0.12, 0.13, 0.112], [0.024, 0.016, 0.008], watchMat, { shadow: false });
  }

  mergeSubtreeMeshes(torsoGroup, false, true);
  const mergedBodyMesh = torsoGroup.children.find((c) => c.isMesh) || bodyMesh;

  // 2. Head, Face & Hair (COOL, handsome, confident — ZERO nerd glasses!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.67, 0.015);
  torsoGroup.add(headGroup);

  const headMesh = addSphere(headGroup, [0, 0.02, 0], [0.23, 0.25, 0.23], materials.skin);
  // Sleek defined jawline and clean chin (no weird stubble shadow)
  addSphere(headGroup, [0, -0.09, 0.02], [0.16, 0.12, 0.16], materials.skin);
  // Natural cheek contours & charming anime blush
  for (const side of [-1, 1]) {
    addSphere(headGroup, [side * 0.11, -0.02, 0.10], [0.075, 0.065, 0.075], materials.skin);
    addSphere(headGroup, [side * 0.10, -0.01, 0.18], [0.028, 0.016, 0.010], materials.skinBlush, { shadow: false });
    addSphere(headGroup, [side * 0.22, 0.0, -0.01], [0.035, 0.06, 0.04], materials.skin);
  }

  // Trendy layered wavy/textured modern haircut (dark espresso with dynamic locks)
  // Base volume
  addSphere(headGroup, [0, 0.11, -0.04], [0.25, 0.20, 0.24], hairMat);
  addSphere(headGroup, [0, 0.01, -0.09], [0.24, 0.21, 0.19], hairMat);
  // Volumetric top with textured separation
  addSphere(headGroup, [0, 0.21, 0.01], [0.22, 0.11, 0.19], hairMat);
  addSphere(headGroup, [-0.07, 0.20, 0.04], [0.14, 0.09, 0.15], hairLockMat);
  addSphere(headGroup, [0.07, 0.19, 0.04], [0.14, 0.09, 0.15], hairLockMat);
  // Stylish textured curtain bangs framing forehead & temples
  addSphere(headGroup, [-0.07, 0.14, 0.19], [0.08, 0.06, 0.08], hairLockMat, { rotation: [0.2, -0.15, 0.2] });
  addSphere(headGroup, [0.06, 0.14, 0.19], [0.08, 0.06, 0.08], hairMat, { rotation: [0.2, 0.15, -0.2] });
  addSphere(headGroup, [-0.15, 0.08, 0.15], [0.07, 0.11, 0.08], hairMat, { rotation: [0.1, 0, 0.25] });
  addSphere(headGroup, [0.15, 0.07, 0.14], [0.07, 0.12, 0.08], hairMat, { rotation: [0.1, 0, -0.25] });

  // Sharp, expressive Pixar/anime stylized eyes (NO clunky glasses!)
  for (const side of [-1, 1]) {
    const eyeX = side * 0.085;
    // Sclera (crisp white almond eye)
    addSphere(headGroup, [eyeX, 0.03, 0.21], [0.042, 0.048, 0.02], materials.trim, { shadow: false });
    // Iris (deep expressive dark obsidian with subtle depth)
    addSphere(headGroup, [eyeX, 0.03, 0.222], [0.028, 0.034, 0.012], materials.ink, { shadow: false });
    // Subtle emerald tint in the lower iris
    addSphere(headGroup, [eyeX, 0.024, 0.226], [0.016, 0.016, 0.007], teeTrimMat, { shadow: false });
    addSphere(headGroup, [eyeX, 0.028, 0.228], [0.012, 0.014, 0.005], materials.ink, { shadow: false });
    // Primary glossy specular catchlight
    addSphere(headGroup, [eyeX + side * 0.009, 0.044, 0.233], [0.008, 0.008, 0.005], materials.trim, { shadow: false });
    // Secondary micro catchlight
    addSphere(headGroup, [eyeX - side * 0.007, 0.018, 0.231], [0.004, 0.004, 0.003], materials.trim, { shadow: false });
    // Upper eyelid contour line
    addBox(headGroup, [eyeX, 0.060, 0.218], [0.052, 0.008, 0.014], materials.ink, { shadow: false });
    // Sleek, confident tapered eyebrows
    addBox(headGroup, [eyeX, 0.095, 0.210], [0.075, 0.015, 0.018], hairMat, {
      rotation: [0, 0, side * -0.09], shadow: false,
    });
  }

  // Subtle button nose & confident cool smirk
  addSphere(headGroup, [0, -0.02, 0.238], [0.024, 0.028, 0.024], materials.skin, { shadow: false });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.006, 6, 12, Math.PI * 0.75), materials.ink);
  smile.position.set(0.004, -0.075, 0.225);
  smile.rotation.set(0, 0, Math.PI * 1.08);
  headGroup.add(smile);

  // Dynamic animated hair lock (tuft that reacts to movement inertia)
  const hairTuft = new THREE.Group();
  hairTuft.position.set(0.02, 0.25, 0.08);
  hairTuft.rotation.set(0.15, 0, 0);
  headGroup.add(hairTuft);
  addSphere(hairTuft, [0, 0.02, 0], [0.09, 0.05, 0.08], hairLockMat);

  mergeSubtreeMeshes(headGroup, false, true);
  const mergedHeadMesh = headGroup.children.find((c) => c.isMesh) || headMesh;

  // 3. Natural, stylish arms & articulate hands (natural modern stance — NOT bulky, NOT kekar)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.225, 0.32, 0);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.225, 0.32, 0);
  torsoGroup.add(leftArm, rightArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.20, 0);
  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.20, 0);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.19, 0);
  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.19, 0);

  for (const [armGroup, forearmGroup, handGroup, side] of [
    [leftArm, leftForearm, leftHand, -1],
    [rightArm, rightForearm, rightHand, 1],
  ]) {
    // Smooth jacket sleeve shoulder cap (seamlessly integrates with torso without bulky balls)
    addSphere(armGroup, [0, 0, 0], [0.054, 0.052, 0.054], jacketMat);
    // Jacket upper sleeve
    addCylinder(armGroup, [0, -0.11, 0], 0.054, 0.048, 0.22, jacketMat, { segments: 14 });
    // Sleeve ribbed cuff detail
    addCylinder(armGroup, [0, -0.21, 0], 0.051, 0.051, 0.026, devMat(0x141820, 0.85), { segments: 14 });
    // Vibrant emerald trim line on cuff
    addCylinder(armGroup, [0, -0.20, 0], 0.052, 0.052, 0.005, teeTrimMat, { segments: 14, shadow: false });
    mergeSubtreeMeshes(armGroup, false, true);

    // Elbow back curve
    addSphere(forearmGroup, [0, 0, -0.01], [0.042, 0.042, 0.042], materials.skin);
    // Smooth tapered forearm skin
    addCylinder(forearmGroup, [0, -0.11, 0], 0.044, 0.036, 0.22, materials.skin, { segments: 14 });

    if (side === -1) {
      // Left wrist: Titanium smartwatch (Apple Watch Ultra style) with emerald UI indicator
      addCylinder(forearmGroup, [0, -0.19, 0], 0.042, 0.042, 0.024, watchMat, { segments: 14 });
      addBox(forearmGroup, [0, -0.19, 0.042], [0.030, 0.028, 0.006], devMat(0x0a0e17, 0.2, { metalness: 0.85 }), { shadow: false });
      addSphere(forearmGroup, [0, -0.19, 0.046], [0.005, 0.005, 0.003], teeTrimMat, { shadow: false });
    } else {
      // Right wrist: Minimalist black tactical cord bracelet
      addCylinder(forearmGroup, [0, -0.19, 0], 0.038, 0.038, 0.014, braceletMat, { segments: 14 });
    }
    mergeSubtreeMeshes(forearmGroup, false, true);

    // Clearly defined stylized cartoon hand (palm, distinct thumb, 4 articulated fingers)
    // Heel of palm / wrist connection
    addSphere(handGroup, [0, -0.006, 0], [0.032, 0.022, 0.024], materials.skin);
    // Sculpted palm body
    addBox(handGroup, [0, -0.032, 0], [0.060, 0.050, 0.028], materials.skin);
    addSphere(handGroup, [0, -0.032, 0.006], [0.026, 0.022, 0.010], materials.skin);
    // Fleshy thenar eminence (base of thumb)
    addSphere(handGroup, [side * 0.024, -0.024, 0.012], [0.018, 0.020, 0.016], materials.skin);

    // Distinct opposable thumb (angled forward and inward)
    addCylinder(handGroup, [side * 0.032, -0.032, 0.016], 0.0090, 0.0082, 0.026, materials.skin, {
      segments: 8,
      rotation: [0.36, side * 0.38, side * 0.20],
    });
    addSphere(handGroup, [side * 0.040, -0.044, 0.024], [0.0090, 0.010, 0.0090], materials.skin);
    addBox(handGroup, [side * 0.040, -0.044, 0.032], [0.008, 0.006, 0.002], nailMat, {
      rotation: [0.36, side * 0.38, side * 0.20],
      shadow: false,
    });

    // 4 distinct articulated cartoon fingers (index, middle, ring, pinky)
    const fingers = [
      { x: side * -0.019, len: 0.040, rad: 0.0085, curl: 0.14 },
      { x: side * -0.006, len: 0.045, rad: 0.0090, curl: 0.18 },
      { x: side * 0.006, len: 0.040, rad: 0.0085, curl: 0.20 },
      { x: side * 0.019, len: 0.032, rad: 0.0075, curl: 0.24 },
    ];
    for (const f of fingers) {
      // Knuckle base
      addSphere(handGroup, [f.x, -0.055, 0], [f.rad * 1.05, f.rad * 0.85, f.rad * 1.05], materials.skin);
      // Finger shaft with natural relaxed curl
      addCylinder(handGroup, [f.x, -0.058 - f.len * 0.45, f.len * 0.09], f.rad, f.rad * 0.88, f.len, materials.skin, {
        segments: 8,
        rotation: [f.curl, 0, 0],
      });
      // Rounded fingertip
      addSphere(handGroup, [f.x, -0.058 - f.len, f.len * 0.18], [f.rad * 0.95, f.rad * 1.05, f.rad * 0.95], materials.skin);
      // Subtle clean fingernail accent on dorsal side
      addBox(handGroup, [f.x, -0.058 - f.len + 0.002, f.len * 0.18 - f.rad * 0.88], [f.rad * 1.3, 0.006, 0.002], nailMat, {
        rotation: [f.curl, 0, 0],
        shadow: false,
      });
    }

    mergeSubtreeMeshes(handGroup, false, true);
    forearmGroup.add(handGroup);
    armGroup.add(forearmGroup);
  }

  // 4. Slim-straight tapered dark denim & designer modern sneakers
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.15, -0.10, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.15, -0.10, 0);
  pelvisGroup.add(leftLeg, rightLeg);

  const leftLowerLeg = new THREE.Group();
  leftLowerLeg.position.set(0, -0.36, 0);
  const rightLowerLeg = new THREE.Group();
  rightLowerLeg.position.set(0, -0.36, 0);

  const leftShoe = new THREE.Group();
  leftShoe.position.set(0, -0.36, 0.03);
  const rightShoe = new THREE.Group();
  rightShoe.position.set(0, -0.36, 0.03);

  // Lean, tapered hip & pelvis block (clean silhouette, NO bulky diaper bulge!)
  addBox(pelvisGroup, [0, -0.09, 0], [0.30, 0.10, 0.18], denimMat);
  addCylinder(pelvisGroup, [-0.11, -0.09, 0], 0.072, 0.072, 0.10, denimMat, { segments: 12 });
  addCylinder(pelvisGroup, [0.11, -0.09, 0], 0.072, 0.072, 0.10, denimMat, { segments: 12 });

  for (const [thighGroup, calfGroup, shoeGroup] of [
    [leftLeg, leftLowerLeg, leftShoe],
    [rightLeg, rightLowerLeg, rightShoe],
  ]) {
    // Slim-straight denim thighs (modern tailored fit)
    addCylinder(thighGroup, [0, -0.18, 0], 0.088, 0.080, 0.36, denimMat);
    addSphere(thighGroup, [0, -0.06, 0.01], [0.088, 0.10, 0.088], denimMat);
    mergeSubtreeMeshes(thighGroup, false, true);
    thighGroup.add(calfGroup);

    // Tapered calves with clean trouser cuff
    addCylinder(calfGroup, [0, -0.18, 0], 0.080, 0.072, 0.34, denimMat);
    addCylinder(calfGroup, [0, -0.34, 0], 0.076, 0.076, 0.04, devMat(0x1e2430, 0.8));
    mergeSubtreeMeshes(calfGroup, false, true);
    calfGroup.add(shoeGroup);

    // High-end designer street sneakers (clean white leather + obsidian panels + emerald accents)
    addBox(shoeGroup, [0, 0.04, 0.03], [0.17, 0.11, 0.33], sneakerMat);
    addSphere(shoeGroup, [0, 0.02, 0.17], [0.085, 0.065, 0.08], sneakerMat);
    addSphere(shoeGroup, [0, 0.015, 0.18], [0.088, 0.055, 0.065], sneakerDarkMat);
    addBox(shoeGroup, [0, 0.05, 0.03], [0.175, 0.03, 0.20], sneakerAccentMat, { shadow: false });
    addBox(shoeGroup, [0, 0.095, 0.05], [0.10, 0.02, 0.12], sneakerMat);
    addBox(shoeGroup, [0, -0.035, 0.03], [0.185, 0.045, 0.35], materials.sneakerSole);
    addBox(shoeGroup, [0, -0.062, 0.03], [0.19, 0.018, 0.36], beltMat);
    mergeSubtreeMeshes(shoeGroup, false, true);
  }

  const rig = {
    character,
    shadow,
    bodyMesh: mergedBodyMesh,
    torsoGroup,
    pelvisGroup,
    headGroup,
    headMesh: mergedHeadMesh,
    hairTuft,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    leftLeg,
    rightLeg,
    leftLowerLeg,
    rightLowerLeg,
    leftShoe,
    rightShoe,
    state: {
      smoothedSpeed: 0,
      walkPhase: 0,
      idlePhase: 0,
      bankAngle: 0,
      squash: 1.0,
      lastGrounded: true,
      lastYaw: 0,
      actionState: 'IDLE',
      actionWeight: 0,
      targetActionWeight: 0,
      targetHeadPitch: 0,
      targetHeadYaw: 0,
    },
    setActionState: (action, options = {}) => {
      const s = rig.state;
      s.actionState = action;
      s.targetActionWeight = action === 'IDLE' ? 0 : 1;
      if (options.headPitch !== undefined) s.targetHeadPitch = options.headPitch;
      if (options.headYaw !== undefined) s.targetHeadYaw = options.headYaw;
    },
  };
  return rig;
}

/**
 * Procedural animation engine for stylized locomotion:
 * - Seamless blended states: Idle, Walk, Sprint
 * - Velocity-synchronized walk phase: feet never slide regardless of framerate
 * - Dual-joint kinematics: knee flexion lifts feet above ground; elbows pump naturally
 * - Torso lean, pelvis counter-rotation, vertical stride bob
 * - Dynamic hair tuft inertia and banking into turns
 * - Soft landing squash & contact shadow scaling
 */
export function updateCharacterRig(rig, dt, elapsed, moveAmount, grounded) {
  const {
    character,
    shadow,
    torsoGroup,
    pelvisGroup,
    headGroup,
    hairTuft,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    leftLeg,
    rightLeg,
    leftLowerLeg,
    rightLowerLeg,
    leftShoe,
    rightShoe,
    state,
  } = rig;

  // 1. Smooth locomotion speed parameter (accelerates & decelerates naturally)
  state.smoothedSpeed = THREE.MathUtils.damp(state.smoothedSpeed, moveAmount, 10.5, dt);
  const isMoving = state.smoothedSpeed > 0.04;
  const isSprinting = state.smoothedSpeed > 1.15;

  // 2. Continuous time-based walk phase accumulation
  // Frequency scales with speed so feet stay synchronized with world translation
  const baseCadence = isSprinting ? 14.8 : 10.2;
  const stepSpeedFactor = THREE.MathUtils.clamp(state.smoothedSpeed, 0.35, 1.6);
  if (isMoving) {
    state.walkPhase += dt * baseCadence * stepSpeedFactor;
  }

  const phase = state.walkPhase;
  const walkWeight = THREE.MathUtils.clamp(state.smoothedSpeed / 1.0, 0, 1);
  const sprintWeight = THREE.MathUtils.clamp((state.smoothedSpeed - 1.0) / 0.5, 0, 1);

  // 3. Grounded vs Air/Jump Detection & Squash Feedback
  if (!state.lastGrounded && grounded) {
    // Just landed: trigger landing squash
    state.squash = 0.90;
  }
  state.lastGrounded = grounded;
  state.squash = THREE.MathUtils.damp(state.squash, 1.0, 9.0, dt);

  // Apply squash & stretch to pelvis
  pelvisGroup.scale.set(
    1 / Math.sqrt(state.squash),
    state.squash,
    1 / Math.sqrt(state.squash)
  );

  // 4. Ground Contact Shadow Dynamic Scaling
  if (grounded) {
    shadow.scale.setScalar(1.0 + (1.0 - state.squash) * 0.5);
    shadow.material.opacity = 0.32;
  } else {
    // In air: shadow shrinks and softens
    shadow.scale.setScalar(0.72);
    shadow.material.opacity = 0.16;
  }

  // 5. Locomotion Logic
  if (isMoving && grounded) {
    const swingSin = Math.sin(phase);
    const swingCos = Math.cos(phase);

    // Stride amplitude
    const strideAmp = THREE.MathUtils.lerp(0.58, 0.88, sprintWeight) * walkWeight;

    // --- LEGS ---
    // Hip rotation (thigh forward/backward swing)
    leftLeg.rotation.x = swingSin * strideAmp;
    rightLeg.rotation.x = -swingSin * strideAmp;

    // Knee flexion: when leg swings forward, knee bends backward to lift foot cleanly over ground
    const leftForwardSwing = -swingSin;
    const rightForwardSwing = swingSin;
    leftLowerLeg.rotation.x = Math.max(0, leftForwardSwing) * (0.85 * walkWeight + 0.35 * sprintWeight);
    rightLowerLeg.rotation.x = Math.max(0, rightForwardSwing) * (0.85 * walkWeight + 0.35 * sprintWeight);

    // Ankle flexion: heel strike to toe push-off
    leftShoe.rotation.x = swingSin * -0.22 * walkWeight;
    rightShoe.rotation.x = -swingSin * -0.22 * walkWeight;

    // --- ARMS ---
    // Arm counter-swing (opposite to leg)
    const armAmp = THREE.MathUtils.lerp(0.52, 0.82, sprintWeight) * walkWeight;
    leftArm.rotation.x = -swingSin * armAmp;
    rightArm.rotation.x = swingSin * armAmp;

    // Elbow flexion: bends forward on upswing and during sprint pump
    const leftArmForward = -swingSin;
    const rightArmForward = swingSin;
    leftForearm.rotation.x = THREE.MathUtils.lerp(0.12, 0.45, sprintWeight) + Math.max(0, leftArmForward) * 0.42 * walkWeight;
    rightForearm.rotation.x = THREE.MathUtils.lerp(0.12, 0.45, sprintWeight) + Math.max(0, rightArmForward) * 0.42 * walkWeight;

    // Natural resting outward arm flare
    leftArm.rotation.z = -0.14 - sprintWeight * 0.08;
    rightArm.rotation.z = 0.14 + sprintWeight * 0.08;

    // --- TORSO ---
    // Forward lean into movement
    const forwardLean = THREE.MathUtils.lerp(0.08, 0.22, sprintWeight) * walkWeight;
    torsoGroup.rotation.x = forwardLean;

    // Pelvis counter-rotation (hip swivel)
    torsoGroup.rotation.y = swingSin * 0.08 * walkWeight;

    // Vertical step bounce (2 bobs per full stride cycle)
    const stepBob = Math.abs(swingSin) * 0.045 * walkWeight;
    torsoGroup.position.y = stepBob;

    // --- HEAD & HAIR ---
    // Head stabilizes against bounce and keeps focus forward
    headGroup.position.y = 0.67 - stepBob * 0.5;
    headGroup.rotation.x = -forwardLean * 0.65;
    headGroup.rotation.z = Math.sin(phase * 0.5) * 0.035 * walkWeight;

    // Hair tuft responds to inertia (bends back with speed, bobs with steps)
    hairTuft.rotation.x = 0.15 - state.smoothedSpeed * 0.16 + Math.sin(phase * 2 - 0.5) * 0.06;
  } else if (!grounded) {
    // --- AIR / JUMPING STATE ---
    // Legs tuck slightly
    leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0.22, 6.0, dt);
    rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0.28, 6.0, dt);
    leftLowerLeg.rotation.x = THREE.MathUtils.damp(leftLowerLeg.rotation.x, 0.35, 6.0, dt);
    rightLowerLeg.rotation.x = THREE.MathUtils.damp(rightLowerLeg.rotation.x, 0.42, 6.0, dt);
    leftShoe.rotation.x = THREE.MathUtils.damp(leftShoe.rotation.x, -0.2, 6.0, dt);
    rightShoe.rotation.x = THREE.MathUtils.damp(rightShoe.rotation.x, -0.2, 6.0, dt);

    // Arms spread out for balance
    leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, -0.25, 6.0, dt);
    rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, -0.25, 6.0, dt);
    leftArm.rotation.z = THREE.MathUtils.damp(leftArm.rotation.z, -0.38, 6.0, dt);
    rightArm.rotation.z = THREE.MathUtils.damp(rightArm.rotation.z, 0.38, 6.0, dt);

    torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, -0.06, 6.0, dt);
    torsoGroup.position.y = THREE.MathUtils.damp(torsoGroup.position.y, 0, 6.0, dt);
  } else {
    // --- IDLE STATE (Smooth Breathing, Relaxed Stance & Micro-Gaze) ---
    state.idlePhase += dt * 2.2;
    const idleSin = Math.sin(state.idlePhase);
    const idleSlowSin = Math.sin(state.idlePhase * 0.35);

    // Return legs cleanly to upright grounded stance
    leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10.0, dt);
    rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10.0, dt);
    leftLowerLeg.rotation.x = THREE.MathUtils.damp(leftLowerLeg.rotation.x, 0, 10.0, dt);
    rightLowerLeg.rotation.x = THREE.MathUtils.damp(rightLowerLeg.rotation.x, 0, 10.0, dt);
    leftShoe.rotation.x = THREE.MathUtils.damp(leftShoe.rotation.x, 0, 10.0, dt);
    rightShoe.rotation.x = THREE.MathUtils.damp(rightShoe.rotation.x, 0, 10.0, dt);

    // Arms relax at sides with gentle breathing sway
    leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, idleSin * 0.03, 7.0, dt);
    rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, -idleSin * 0.03, 7.0, dt);
    leftArm.rotation.z = THREE.MathUtils.damp(leftArm.rotation.z, -0.15, 7.0, dt);
    rightArm.rotation.z = THREE.MathUtils.damp(rightArm.rotation.z, 0.15, 7.0, dt);
    leftForearm.rotation.x = THREE.MathUtils.damp(leftForearm.rotation.x, 0.06, 7.0, dt);
    rightForearm.rotation.x = THREE.MathUtils.damp(rightForearm.rotation.x, 0.06, 7.0, dt);

    // Torso breathing rise/fall
    torsoGroup.rotation.x = THREE.MathUtils.damp(torsoGroup.rotation.x, idleSin * 0.015, 6.0, dt);
    torsoGroup.rotation.y = THREE.MathUtils.damp(torsoGroup.rotation.y, 0, 8.0, dt);
    torsoGroup.position.y = THREE.MathUtils.damp(torsoGroup.position.y, idleSin * 0.012, 6.0, dt);

    // Head subtle natural breathing nod and occasional look-around scanning
    headGroup.position.y = 0.67 + idleSin * 0.01;
    headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, idleSin * 0.02, 6.0, dt);
    headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, idleSlowSin * 0.06, 3.0, dt);
    headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, 0, 6.0, dt);

    // Hair tuft gentle breeze sway
    hairTuft.rotation.x = THREE.MathUtils.damp(hairTuft.rotation.x, 0.15 + idleSin * 0.04, 5.0, dt);
  }

  // 6. Action Pose Layer (Sitting, Inspecting, Desk Typing, Door Reaching, Presenting)
  state.actionWeight = THREE.MathUtils.damp(state.actionWeight, state.targetActionWeight, 8.5, dt);
  const aw = state.actionWeight;

  if (aw > 0.005) {
    if (state.actionState === 'SITTING') {
      // Pelvis lowers to chair seat height
      pelvisGroup.position.y = THREE.MathUtils.lerp(pelvisGroup.position.y, -0.42, aw);
      // Thighs rotate forward with relaxed outward hip splay (abduction)
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, -1.50, aw);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, -1.50, aw);
      leftLeg.rotation.z = THREE.MathUtils.lerp(leftLeg.rotation.z, 0.08, aw);
      rightLeg.rotation.z = THREE.MathUtils.lerp(rightLeg.rotation.z, -0.08, aw);
      // Knees bend with natural forward calf slant (~4.5 deg forward) so calves clear furniture frames
      leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, 1.42, aw);
      rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, 1.42, aw);
      // Sneaker soles level with floor
      leftShoe.rotation.x = THREE.MathUtils.lerp(leftShoe.rotation.x, 0.08, aw);
      rightShoe.rotation.x = THREE.MathUtils.lerp(rightShoe.rotation.x, 0.08, aw);
      leftShoe.rotation.z = THREE.MathUtils.lerp(leftShoe.rotation.z, -0.08, aw);
      rightShoe.rotation.z = THREE.MathUtils.lerp(rightShoe.rotation.z, 0.08, aw);
      // Hands rest gently on thighs, clearing armrests
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.24, aw);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.24, aw);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -0.12, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.12, aw);
      leftForearm.rotation.x = THREE.MathUtils.lerp(leftForearm.rotation.x, 0.65, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 0.65, aw);
      leftForearm.rotation.y = THREE.MathUtils.lerp(leftForearm.rotation.y, -0.16, aw);
      rightForearm.rotation.y = THREE.MathUtils.lerp(rightForearm.rotation.y, 0.16, aw);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, -0.04, aw);
    } else if (state.actionState === 'INSPECTING') {
      // Hand near chin / thinking pose
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.65, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 1.25, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.25, aw);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0.1, aw);
      // Head tilts up/down or turns toward object
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, state.targetHeadPitch, aw);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, state.targetHeadYaw, aw);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.08, aw);
    } else if (state.actionState === 'WORKING_DESK') {
      // Complete seated pose at desk (pelvis lowered, thighs forward, calves clearing chair base)
      pelvisGroup.position.y = THREE.MathUtils.lerp(pelvisGroup.position.y, -0.42, aw);
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, -1.50, aw);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, -1.50, aw);
      leftLeg.rotation.z = THREE.MathUtils.lerp(leftLeg.rotation.z, 0.08, aw);
      rightLeg.rotation.z = THREE.MathUtils.lerp(rightLeg.rotation.z, -0.08, aw);
      leftLowerLeg.rotation.x = THREE.MathUtils.lerp(leftLowerLeg.rotation.x, 1.42, aw);
      rightLowerLeg.rotation.x = THREE.MathUtils.lerp(rightLowerLeg.rotation.x, 1.42, aw);
      leftShoe.rotation.x = THREE.MathUtils.lerp(leftShoe.rotation.x, 0.08, aw);
      rightShoe.rotation.x = THREE.MathUtils.lerp(rightShoe.rotation.x, 0.08, aw);
      leftShoe.rotation.z = THREE.MathUtils.lerp(leftShoe.rotation.z, -0.08, aw);
      rightShoe.rotation.z = THREE.MathUtils.lerp(rightShoe.rotation.z, 0.08, aw);

      // Upper body: Arms forward over keyboard, typing animation, focused head tilt
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, -0.72, aw);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.72, aw);
      leftForearm.rotation.x = THREE.MathUtils.lerp(leftForearm.rotation.x, 0.58, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 0.58, aw);
      leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, -0.14, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, 0.14, aw);
      leftHand.rotation.x = THREE.MathUtils.lerp(leftHand.rotation.x, Math.sin(elapsed * 12) * 0.12, aw);
      rightHand.rotation.x = THREE.MathUtils.lerp(rightHand.rotation.x, Math.sin(elapsed * 12 + Math.PI) * 0.12, aw);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.08, aw);
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.14, aw);
    } else if (state.actionState === 'DOOR_REACH') {
      // Right hand extends to door handle
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -1.05, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 0.32, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.18, aw);
      torsoGroup.rotation.x = THREE.MathUtils.lerp(torsoGroup.rotation.x, 0.08, aw);
    } else if (state.actionState === 'PRESENTING') {
      // Open hand gesture towards display
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -0.58, aw);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -0.52, aw);
      rightForearm.rotation.x = THREE.MathUtils.lerp(rightForearm.rotation.x, 0.38, aw);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0.15, aw);
    }
  } else if (state.targetActionWeight === 0) {
    pelvisGroup.position.y = THREE.MathUtils.damp(pelvisGroup.position.y, 0, 10.0, dt);
  }

  // 7. Turning & Banking (Leaning into sharp turns)
  const currentYaw = character.rotation.y;
  let yawDelta = currentYaw - state.lastYaw;
  // Normalize delta to [-PI, PI]
  yawDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
  state.lastYaw = currentYaw;

  const targetBank = isMoving ? THREE.MathUtils.clamp(-yawDelta * 3.5, -0.14, 0.14) : 0;
  state.bankAngle = THREE.MathUtils.damp(state.bankAngle, targetBank, 8.0, dt);
  character.rotation.z = state.bankAngle;
}
