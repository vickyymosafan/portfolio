import * as THREE from 'three';
import { addBox, addCylinder, addSphere, mergeSubtreeMeshes } from './geometry.js';
import { materials } from './materials.js';

/**
 * High-Fidelity BMW M-Series Sports Car (G82 / CSL Proportions)
 * Fully customizable paint, wheels, aero package, and orientation.
 */
export function buildSportsCar(parent, cx, cy, cz, options = {}) {
  const car = new THREE.Group();
  car.position.set(cx, cy, cz);
  if (options.rotationY) car.rotation.y = options.rotationY;
  parent.add(car);

  const paintMat = options.paintMat || materials.m4Paint;
  const carbonMat = options.carbonMat || materials.m4Carbon;
  const plateFrontMat = options.plateFrontMat || materials.m4PlateFront;
  const plateRearMat = options.plateRearMat || materials.m4PlateRear;
  const wheelLipMat = options.wheelLipMat || materials.m4WheelLip;
  const caliperMat = options.caliperMat || materials.m4CaliperGold;

  // =========================================================================
  // 1. CHASSIS & SCULPTED WIDEBODY
  // =========================================================================
  // Main lower aerodynamic tub
  addBox(car, [0, 0.30, -0.05], [1.78, 0.28, 4.30], paintMat, { shadow: true });

  // Sculpted Door Waist & Rocker Panels (Between front & rear wheels, z: -0.65 to +0.65)
  for (const sx of [-0.94, 0.94]) {
    addBox(car, [sx, 0.46, 0.02], [0.12, 0.30, 1.45], paintMat);
    addBox(car, [sx * 1.04, 0.13, 0.02], [0.12, 0.04, 1.55], carbonMat);
    addBox(car, [sx * 1.10, 0.22, -0.62], [0.04, 0.16, 0.22], carbonMat);
  }

  // Muscular Front Widebody Fenders (Arching over front wheels at z = 1.38)
  for (const fx of [-0.98, 0.98]) {
    addBox(car, [fx, 0.56, 1.38], [0.22, 0.14, 1.25], paintMat);
    addBox(car, [fx, 0.36, 1.88], [0.24, 0.36, 0.45], paintMat);
    addBox(car, [fx, 0.38, 0.88], [0.22, 0.38, 0.42], paintMat);
    addBox(car, [fx * 1.025, 0.52, 0.78], [0.02, 0.18, 0.10], materials.m4GlossBlack);
    addBox(car, [fx * 1.032, 0.54, 0.78], [0.012, 0.03, 0.07], materials.carChrome);
  }

  // Muscular Rear Widebody Haunches (Arching over rear wheels at z = -1.35)
  for (const rx of [-1.02, 1.02]) {
    addBox(car, [rx, 0.58, -1.35], [0.26, 0.16, 1.35], paintMat);
    addBox(car, [rx, 0.38, -0.85], [0.25, 0.38, 0.45], paintMat);
    addBox(car, [rx, 0.38, -1.85], [0.24, 0.38, 0.55], paintMat);
  }

  // =========================================================================
  // 2. SLOPED HOOD & FRONT NOSE
  // =========================================================================
  addBox(car, [0, 0.62, 1.48], [1.70, 0.12, 1.35], paintMat, {
    rotation: [-0.11, 0, 0],
  });

  // Carbon Hood Center Panel with Red/Black Racing Stripes
  addBox(car, [0, 0.685, 1.48], [1.36, 0.015, 1.32], materials.m4HoodStripes, {
    rotation: [-0.11, 0, 0],
  });

  // Muscular Hood Power Bulge Ridges
  for (const bx of [-0.36, 0.36]) {
    addBox(car, [bx, 0.698, 1.48], [0.05, 0.025, 1.30], paintMat, {
      rotation: [-0.11, 0, 0],
    });
  }

  // Front Nose Beak with BMW Roundel Emblem
  addBox(car, [0, 0.56, 2.18], [0.72, 0.10, 0.16], paintMat, {
    rotation: [-0.15, 0, 0],
  });
  addCylinder(car, [0, 0.625, 2.18], 0.052, 0.052, 0.012, materials.m4BmwEmblem, {
    rotation: [0.38, 0, 0],
    segments: 18,
  });

  // =========================================================================
  // 3. FRONT FASCIA: TWIN VERTICAL KIDNEY GRILLES & PLATE
  // =========================================================================
  const kidneyWidth = 0.32;
  const kidneyHeight = 0.50;
  const kidneyZ = 2.22;

  addBox(car, [-0.20, 0.36, kidneyZ], [kidneyWidth, kidneyHeight, 0.05], materials.m4GlossBlack);
  addBox(car, [0.20, 0.36, kidneyZ], [kidneyWidth, kidneyHeight, 0.05], materials.m4GlossBlack);
  addBox(car, [-0.20, 0.36, kidneyZ - 0.02], [kidneyWidth - 0.04, kidneyHeight - 0.04, 0.04], materials.metalDark);
  addBox(car, [0.20, 0.36, kidneyZ - 0.02], [kidneyWidth - 0.04, kidneyHeight - 0.04, 0.04], materials.metalDark);
  addBox(car, [0, 0.36, kidneyZ + 0.005], [0.06, kidneyHeight + 0.02, 0.04], paintMat);

  for (const bx of [-0.44, 0.44]) {
    addBox(car, [bx, 0.38, 2.19], [0.18, 0.36, 0.10], paintMat);
  }

  const slatY = [0.19, 0.29, 0.40, 0.51];
  for (const kx of [-0.20, 0.20]) {
    for (const sy of slatY) {
      addBox(car, [kx, sy, kidneyZ + 0.024], [kidneyWidth - 0.04, 0.02, 0.03], materials.m4GlossBlack);
    }
  }

  // M Grille Badge
  addBox(car, [0.21, 0.51, kidneyZ + 0.042], [0.075, 0.025, 0.012], materials.m4GlossBlack);
  addBox(car, [0.185, 0.51, kidneyZ + 0.045], [0.014, 0.022, 0.01], materials.m4LaserBlue);
  addBox(car, [0.199, 0.51, kidneyZ + 0.045], [0.014, 0.022, 0.01], materials.blueNavy);
  addBox(car, [0.213, 0.51, kidneyZ + 0.045], [0.014, 0.022, 0.01], materials.coralDark);

  // Front License Plate
  addBox(car, [0, 0.32, kidneyZ + 0.035], [0.82, 0.175, 0.015], materials.m4GlossBlack);
  addBox(car, [0, 0.32, kidneyZ + 0.044], [0.78, 0.155, 0.006], plateFrontMat);

  // Carbon Front Splitter & Corner Aero Intakes
  addBox(car, [0, 0.10, 2.26], [1.96, 0.035, 0.30], carbonMat);
  for (const wx of [-0.98, 0.98]) {
    addBox(car, [wx, 0.16, 2.24], [0.045, 0.13, 0.24], carbonMat);
  }
  for (const cx of [-0.78, 0.78]) {
    addBox(car, [cx, 0.26, 2.16], [0.26, 0.26, 0.14], materials.m4GlossBlack);
    addBox(car, [cx, 0.26, 2.17], [0.22, 0.22, 0.12], materials.metalDark);
    addBox(car, [cx + (cx > 0 ? 0.11 : -0.11), 0.26, 2.20], [0.025, 0.24, 0.10], materials.m4GlossBlack);
  }

  // =========================================================================
  // 4. M LASER HEADLIGHTS
  // =========================================================================
  for (const hx of [-0.64, 0.64]) {
    const rotY = hx > 0 ? -0.24 : 0.24;
    addBox(car, [hx, 0.50, 2.14], [0.44, 0.13, 0.06], materials.m4GlossBlack, { rotation: [-0.08, rotY, 0] });
    const dOffs = [-0.10, 0.09];
    for (const doff of dOffs) {
      const ax = hx + doff * Math.cos(rotY);
      const az = 2.18 + doff * Math.sin(-rotY);
      addBox(car, [ax, 0.46, az], [0.09, 0.024, 0.02], materials.m4DRLGlow, { rotation: [-0.08, rotY, 0], shadow: false });
      addBox(car, [ax + (hx > 0 ? -0.03 : 0.03), 0.51, az], [0.024, 0.08, 0.02], materials.m4DRLGlow, { rotation: [-0.08, rotY, 0], shadow: false });
    }
    addBox(car, [hx * 0.94, 0.555, 2.185], [0.22, 0.024, 0.02], materials.m4LaserBlue, { rotation: [-0.08, rotY, 0], shadow: false });
    addBox(car, [hx, 0.50, 2.18], [0.46, 0.14, 0.03], materials.glass, { rotation: [-0.08, rotY, 0] });
  }

  // =========================================================================
  // 5. COUPE GREENHOUSE & CARBON ROOF
  // =========================================================================
  addBox(car, [0, 0.69, 0.88], [1.46, 0.06, 0.10], paintMat);
  addBox(car, [0, 1.25, 0.08], [1.38, 0.06, 0.10], paintMat);
  addBox(car, [0, 0.97, 0.48], [1.44, 0.04, 0.94], materials.carGlass, { rotation: [0.60, 0, 0] });
  for (const ax of [-0.71, 0.71]) {
    addBox(car, [ax, 0.97, 0.48], [0.06, 0.05, 0.94], paintMat, { rotation: [0.60, 0, ax > 0 ? -0.06 : 0.06] });
  }

  addBox(car, [0, 1.25, -0.78], [1.38, 0.06, 0.10], paintMat);
  addBox(car, [0, 0.70, -1.55], [1.46, 0.06, 0.10], paintMat);
  addBox(car, [0, 0.975, -1.16], [1.42, 0.04, 0.94], materials.carGlass, { rotation: [-0.43, 0, 0] });
  for (const cx of [-0.72, 0.72]) {
    addBox(car, [cx, 0.975, -1.16], [0.07, 0.06, 0.94], paintMat, { rotation: [-0.43, 0, cx > 0 ? -0.06 : 0.06] });
  }

  for (const wx of [-0.73, 0.73]) {
    addBox(car, [wx, 0.97, -0.35], [0.03, 0.36, 0.88], materials.carGlass);
    addBox(car, [wx * 1.01, 0.97, -0.35], [0.02, 0.36, 0.06], materials.m4GlossBlack);
  }

  // Carbon Double-Bubble Roof
  addBox(car, [-0.38, 1.24, -0.35], [0.62, 0.04, 1.05], carbonMat);
  addBox(car, [0.38, 1.24, -0.35], [0.62, 0.04, 1.05], carbonMat);
  addBox(car, [0, 1.22, -0.35], [0.22, 0.025, 1.05], carbonMat);
  addBox(car, [0, 1.28, -0.76], [0.04, 0.065, 0.16], materials.m4GlossBlack);

  // Interior: Cockpit & Seats
  addBox(car, [0, 0.72, 0.45], [1.32, 0.10, 0.26], materials.m4InteriorLeather);
  addBox(car, [-0.10, 0.78, 0.40], [0.70, 0.075, 0.02], materials.screenCode);
  addCylinder(car, [-0.36, 0.76, 0.24], 0.13, 0.13, 0.025, materials.m4GlossBlack, {
    rotation: [Math.PI * 0.40, 0, 0],
    segments: 16,
  });

  for (const sx of [-0.36, 0.36]) {
    addBox(car, [sx, 0.44, -0.22], [0.42, 0.12, 0.44], materials.m4InteriorLeather);
    addBox(car, [sx, 0.70, -0.42], [0.40, 0.42, 0.08], carbonMat, { rotation: [-0.18, 0, 0] });
    addBox(car, [sx, 0.70, -0.38], [0.26, 0.36, 0.03], materials.m4BucketAccent, { rotation: [-0.18, 0, 0] });
    addBox(car, [sx, 0.96, -0.48], [0.24, 0.14, 0.07], materials.m4InteriorLeather, { rotation: [-0.18, 0, 0] });
  }

  // Carbon Side Mirrors
  for (const mx of [-0.94, 0.94]) {
    addBox(car, [mx * 0.92, 0.78, 0.54], [0.08, 0.025, 0.05], materials.m4GlossBlack);
    addBox(car, [mx * 1.04, 0.81, 0.54], [0.16, 0.09, 0.13], carbonMat);
    addBox(car, [mx * 0.97, 0.86, 0.52], [0.07, 0.03, 0.05], carbonMat);
    addBox(car, [mx * 1.03, 0.81, 0.48], [0.14, 0.075, 0.01], materials.mirror);
  }

  // =========================================================================
  // 6. REAR FASCIA: CSL SPOILER, OLED TAILS & QUAD EXHAUSTS
  // =========================================================================
  addBox(car, [0, 0.64, -1.85], [1.65, 0.14, 0.85], paintMat);
  addBox(car, [0, 0.77, -2.25], [1.62, 0.07, 0.20], carbonMat, { rotation: [-0.24, 0, 0] });
  addBox(car, [0, 0.81, -2.28], [0.55, 0.04, 0.12], carbonMat, { rotation: [-0.24, 0, 0] });

  addCylinder(car, [0, 0.63, -2.26], 0.044, 0.044, 0.01, materials.m4BmwEmblem, {
    rotation: [Math.PI * 0.5, 0, 0],
    segments: 18,
  });
  addBox(car, [0.44, 0.61, -2.26], [0.14, 0.03, 0.01], materials.carChrome);
  addBox(car, [0, 0.44, -2.25], [0.72, 0.165, 0.015], materials.m4GlossBlack);
  addBox(car, [0, 0.44, -2.258], [0.68, 0.145, 0.005], plateRearMat);

  for (const tx of [-0.64, 0.64]) {
    addBox(car, [tx, 0.58, -2.24], [0.46, 0.08, 0.05], materials.m4TaillightOLED, { shadow: false });
    addBox(car, [tx, 0.58, -2.248], [0.50, 0.10, 0.03], materials.carGlass);
    addBox(car, [tx + (tx > 0 ? 0.18 : -0.18), 0.55, -2.24], [0.07, 0.05, 0.04], materials.m4TaillightOLED, { shadow: false });
  }

  // Carbon Diffuser & Quad Exhausts
  addBox(car, [0, 0.18, -2.22], [1.82, 0.18, 0.24], carbonMat);
  for (const stX of [-0.34, -0.11, 0.11, 0.34]) {
    addBox(car, [stX, 0.17, -2.25], [0.03, 0.15, 0.20], carbonMat);
  }
  addBox(car, [0, 0.13, -2.27], [0.10, 0.04, 0.02], materials.m4TaillightOLED, { shadow: false });

  for (const ex of [-0.62, -0.45, 0.45, 0.62]) {
    addCylinder(car, [ex, 0.19, -2.31], 0.062, 0.062, 0.15, materials.carChrome, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 16,
    });
    addCylinder(car, [ex, 0.19, -2.375], 0.050, 0.050, 0.025, materials.m4GlossBlack, {
      rotation: [Math.PI * 0.5, 0, 0],
      segments: 14,
    });
  }

  // =========================================================================
  // 7. 4x M FORGED WHEELS WITH CROSS-DRILLED ROTORS & CALIPERS
  // =========================================================================
  const wheelZPositions = [1.38, -1.35];
  const wheelXPositions = [-1.02, 1.02];

  for (const wz of wheelZPositions) {
    for (const wx of wheelXPositions) {
      const isRight = wx > 0;
      const xDir = isRight ? 1 : -1;

      addCylinder(car, [wx, 0.34, wz], 0.34, 0.34, 0.26, materials.carRubber, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 24,
      });

      addCylinder(car, [wx + xDir * 0.04, 0.34, wz], 0.23, 0.23, 0.03, materials.m4RotorBrake, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 18,
      });

      const calZ = wz + (wz > 0 ? 0.09 : -0.09);
      addBox(car, [wx + xDir * 0.05, 0.43, calZ], [0.08, 0.12, 0.15], caliperMat);

      const outerX = wx + xDir * 0.132;
      addCylinder(car, [outerX, 0.34, wz], 0.265, 0.265, 0.015, materials.m4WheelRim, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 20,
      });

      addCylinder(car, [outerX + xDir * 0.005, 0.34, wz], 0.260, 0.260, 0.012, wheelLipMat, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 20,
      });

      addCylinder(car, [outerX + xDir * 0.012, 0.34, wz], 0.045, 0.045, 0.015, materials.m4BmwEmblem, {
        rotation: [0, 0, Math.PI * 0.5],
        segments: 16,
      });

      for (let s = 0; s < 5; s += 1) {
        const spokeAngle = (s / 5) * Math.PI * 2;
        const spY = 0.34 + Math.sin(spokeAngle) * 0.13;
        const spZ = wz + Math.cos(spokeAngle) * 0.13;
        addBox(car, [outerX + xDir * 0.008, spY, spZ], [0.014, 0.024, 0.16], materials.m4WheelRim, {
          rotation: [spokeAngle, 0, 0],
        });
      }
    }
  }

  mergeSubtreeMeshes(car, false);
  return car;
}

/**
 * High-Detail Stylized Motorcycle (Sepeda Motor)
 * Supports SuperSport Racing bike and HyperNaked Streetfighter.
 */
export function buildMotorcycle(parent, cx, cy, cz, options = {}) {
  const bike = new THREE.Group();
  bike.position.set(cx, cy, cz);
  if (options.rotationY) bike.rotation.y = options.rotationY;

  // Realistic parked stance: leans slightly on kickstand
  const leanZ = options.leanAngle !== undefined ? options.leanAngle : -0.12;
  bike.rotation.z = leanZ;

  parent.add(bike);

  const isNaked = options.style === 'streetfighter';
  const bodyPaint = options.bodyPaintMat || (isNaked ? materials.bikePaintCyan : materials.bikePaintTricolor);
  const frameMat = options.frameMat || (isNaked ? materials.bikeTrellisOrange : materials.metalDark);
  const rimMat = options.rimMat || (isNaked ? materials.bikePaintCyan : materials.m4WheelRim);
  const exhaustMat = options.exhaustMat || materials.bikeExhaustTitanium;

  // =========================================================================
  // 1. FRONT & REAR WHEELS WITH BRAKE DISCS
  // =========================================================================
  // Front Wheel (center at z = 0.72, y = 0.30)
  addCylinder(bike, [0, 0.30, 0.72], 0.30, 0.30, 0.11, materials.carRubber, {
    rotation: [0, 0, Math.PI * 0.5],
    segments: 20,
  });
  addCylinder(bike, [0, 0.30, 0.72], 0.22, 0.22, 0.09, rimMat, {
    rotation: [0, 0, Math.PI * 0.5],
    segments: 16,
  });
  // Dual Front Brake Rotors & Calipers
  for (const rx of [-0.07, 0.07]) {
    addCylinder(bike, [rx, 0.30, 0.72], 0.19, 0.19, 0.012, materials.m4RotorBrake, {
      rotation: [0, 0, Math.PI * 0.5],
      segments: 16,
    });
    addBox(bike, [rx * 1.15, 0.38, 0.76], [0.035, 0.07, 0.08], materials.m4CaliperGold);
  }

  // Rear Wheel (wider sport tire, center at z = -0.72, y = 0.31)
  addCylinder(bike, [0, 0.31, -0.72], 0.31, 0.31, 0.17, materials.carRubber, {
    rotation: [0, 0, Math.PI * 0.5],
    segments: 20,
  });
  addCylinder(bike, [0, 0.31, -0.72], 0.22, 0.22, 0.15, rimMat, {
    rotation: [0, 0, Math.PI * 0.5],
    segments: 16,
  });
  // Rear Brake Rotor & Sprocket
  addCylinder(bike, [0.095, 0.31, -0.72], 0.17, 0.17, 0.012, materials.m4RotorBrake, {
    rotation: [0, 0, Math.PI * 0.5],
    segments: 16,
  });
  addCylinder(bike, [-0.095, 0.31, -0.72], 0.18, 0.18, 0.014, materials.metalDark, {
    rotation: [0, 0, Math.PI * 0.5],
    segments: 16,
  });

  // =========================================================================
  // 2. SUSPENSION & REAR SWINGARM
  // =========================================================================
  // Dual Inverted Gold Telescopic Front Forks (raked back at 24 degrees)
  const forkPitch = 0.40;
  for (const fx of [-0.08, 0.08]) {
    // Upper gold stanchion
    addCylinder(bike, [fx, 0.58, 0.62], 0.024, 0.024, 0.44, materials.m4CaliperGold, {
      rotation: [-forkPitch, 0, 0],
      segments: 10,
    });
    // Lower slider tube
    addCylinder(bike, [fx, 0.38, 0.69], 0.028, 0.028, 0.28, materials.metalDark, {
      rotation: [-forkPitch, 0, 0],
      segments: 10,
    });
  }

  // Front Aerodynamic Fender / Mudguard
  addBox(bike, [0, 0.42, 0.70], [0.18, 0.05, 0.36], bodyPaint, {
    rotation: [-0.15, 0, 0],
  });

  // Aluminum Gullwing Rear Swingarm (from pivot z = -0.15 to rear axle z = -0.72)
  for (const sx of [-0.11, 0.11]) {
    addBox(bike, [sx, 0.33, -0.44], [0.04, 0.08, 0.58], materials.carChrome, {
      rotation: [0.10, 0, 0],
    });
  }
  // Central Monoshock Coilover Suspension Spring
  addCylinder(bike, [0, 0.45, -0.25], 0.038, 0.038, 0.18, materials.coralDark, {
    rotation: [0.65, 0, 0],
    segments: 10,
  });

  // =========================================================================
  // 3. ENGINE BLOCK, EXHAUST & CHASSIS
  // =========================================================================
  // 4-Cylinder Detailed Engine Block
  addBox(bike, [0, 0.38, -0.05], [0.34, 0.30, 0.42], materials.metalDark);
  // Engine Horizontal Cooling Fins
  for (let yf = 0.30; yf <= 0.46; yf += 0.05) {
    addBox(bike, [0, yf, -0.05], [0.36, 0.015, 0.40], materials.m4Carbon);
  }
  // Golden Clutch Cover on right side
  addCylinder(bike, [0.18, 0.34, -0.10], 0.09, 0.09, 0.03, materials.goldBrass, {
    rotation: [0, 0, Math.PI * 0.5],
    segments: 16,
  });

  // Tubular Trellis / Twin-Spar Main Frame Beams
  for (const fx of [-0.16, 0.16]) {
    addBox(bike, [fx, 0.60, 0.12], [0.045, 0.08, 0.52], frameMat, {
      rotation: [-0.55, 0, 0],
    });
    addBox(bike, [fx, 0.42, -0.08], [0.04, 0.22, 0.05], frameMat);
  }

  // 4-into-1 Sweeping Exhaust Headers
  for (const hx of [-0.09, -0.03, 0.03, 0.09]) {
    addCylinder(bike, [hx, 0.32, 0.18], 0.016, 0.016, 0.24, materials.carChrome, {
      rotation: [-0.35, 0, 0],
      segments: 8,
    });
  }
  // Upswept Carbon Titanium Exhaust Muffler on right side
  addCylinder(bike, [0.20, 0.38, -0.48], 0.055, 0.065, 0.45, exhaustMat, {
    rotation: [0.38, 0.14, 0],
    segments: 14,
  });
  // Exhaust carbon end cap
  addCylinder(bike, [0.23, 0.45, -0.66], 0.048, 0.048, 0.04, materials.m4Carbon, {
    rotation: [0.38, 0.14, 0],
    segments: 14,
  });

  // =========================================================================
  // 4. FUEL TANK, COCKPIT & SEAT
  // =========================================================================
  // Muscular Sculpted Fuel Tank
  addBox(bike, [0, 0.74, 0.16], [0.42, 0.24, 0.44], bodyPaint);
  addBox(bike, [0, 0.82, 0.14], [0.32, 0.06, 0.38], bodyPaint, {
    rotation: [-0.18, 0, 0],
  });
  // Billet Aluminum Fuel Filler Cap
  addCylinder(bike, [0, 0.86, 0.18], 0.042, 0.042, 0.015, materials.carChrome, {
    segments: 14,
  });
  // Rubber Knee Grip Pads on tank flanks
  for (const kx of [-0.215, 0.215]) {
    addBox(bike, [kx, 0.74, 0.12], [0.015, 0.14, 0.22], materials.metalDark);
  }

  // Triple Clamp Steering Crown & Clip-on Handlebars
  addBox(bike, [0, 0.86, 0.52], [0.22, 0.035, 0.06], materials.metalDark);
  addBox(bike, [0, 0.86, 0.50], [0.72, 0.026, 0.026], materials.metalDark);
  // Rubber Grips & Controls
  for (const hx of [-0.32, 0.32]) {
    addBox(bike, [hx, 0.86, 0.49], [0.09, 0.034, 0.034], materials.metalDark);
    addBox(bike, [hx * 0.95, 0.85, 0.48], [0.08, 0.012, 0.02], materials.carChrome); // Lever
  }
  // Bar-End Aerodynamic Mirrors
  for (const mx of [-0.38, 0.38]) {
    addBox(bike, [mx, 0.89, 0.46], [0.06, 0.035, 0.015], materials.metalDark);
    addBox(bike, [mx, 0.89, 0.45], [0.05, 0.028, 0.005], materials.mirror);
  }
  // Digital TFT Instrument Cluster
  addBox(bike, [0, 0.89, 0.48], [0.14, 0.08, 0.02], materials.m4GlossBlack, {
    rotation: [-0.60, 0, 0],
  });
  addBox(bike, [0, 0.90, 0.48], [0.12, 0.06, 0.005], materials.screenCode, {
    rotation: [-0.60, 0, 0],
  });

  // Ergonomic Sport Saddle (Driver Seat)
  addBox(bike, [0, 0.69, -0.16], [0.32, 0.09, 0.32], materials.m4InteriorLeather);
  // Aerodynamic Tail Cowl & Passenger Pillion
  addBox(bike, [0, 0.77, -0.42], [0.26, 0.12, 0.32], bodyPaint, {
    rotation: [-0.18, 0, 0],
  });
  addBox(bike, [0, 0.79, -0.34], [0.22, 0.06, 0.18], materials.m4InteriorLeather, {
    rotation: [-0.18, 0, 0],
  });
  // Sharp Aerodynamic Tail Fin with Integrated LED Taillight
  addBox(bike, [0, 0.76, -0.66], [0.14, 0.06, 0.24], bodyPaint, {
    rotation: [0.12, 0, 0],
  });
  addBox(bike, [0, 0.75, -0.78], [0.12, 0.025, 0.02], materials.m4TaillightOLED, { shadow: false });

  // Rear Tail-Tidy License Plate Bracket
  addBox(bike, [0, 0.65, -0.82], [0.03, 0.14, 0.08], materials.metalDark, {
    rotation: [0.45, 0, 0],
  });
  addBox(bike, [0, 0.58, -0.86], [0.22, 0.10, 0.015], materials.m4GlossBlack);
  addBox(bike, [0, 0.58, -0.87], [0.20, 0.08, 0.005], materials.m4PlateFront);

  // =========================================================================
  // 5. FAIRING & HEADLIGHTS (SUPERSPORT vs STREETFIGHTER)
  // =========================================================================
  if (isNaked) {
    // HyperNaked Aggressive Insectoid LED Headlight Pod
    addBox(bike, [0, 0.72, 0.64], [0.20, 0.18, 0.12], materials.m4GlossBlack, {
      rotation: [0.12, 0, 0],
    });
    // Twin Projector LED Glowing Eyes
    for (const ex of [-0.055, 0.055]) {
      addBox(bike, [ex, 0.72, 0.70], [0.045, 0.06, 0.015], materials.m4DRLGlow, { shadow: false });
    }
  } else {
    // Full SuperSport Aerodynamic Fairing with Winglets & Bubble Windscreen
    addBox(bike, [0, 0.76, 0.58], [0.38, 0.32, 0.30], bodyPaint);
    // Tinted Bubble Racing Windscreen
    addBox(bike, [0, 0.94, 0.50], [0.26, 0.18, 0.22], materials.carGlass, {
      rotation: [-0.65, 0, 0],
    });
    // Twin Squinting Aggressive LED Headlights
    for (const hx of [-0.10, 0.10]) {
      addBox(bike, [hx, 0.73, 0.72], [0.08, 0.03, 0.02], materials.m4DRLGlow, {
        rotation: [0, hx > 0 ? -0.22 : 0.22, 0],
        shadow: false,
      });
    }
    // Downforce Aerodynamic Side Winglets
    for (const wx of [-0.24, 0.24]) {
      addBox(bike, [wx, 0.70, 0.58], [0.09, 0.025, 0.16], materials.m4Carbon, {
        rotation: [-0.08, 0, wx > 0 ? 0.25 : -0.25],
      });
    }
  }

  // =========================================================================
  // 6. PARKED STANCE: SIDE KICKSTAND
  // =========================================================================
  // Deployed steel kickstand leg touching ground on left side
  addCylinder(bike, [-0.18, 0.16, -0.12], 0.016, 0.016, 0.34, materials.carChrome, {
    rotation: [0, 0, 0.48],
    segments: 8,
  });
  // Kickstand foot pad
  addBox(bike, [-0.26, 0.01, -0.12], [0.06, 0.015, 0.06], materials.metalDark);

  mergeSubtreeMeshes(bike, false);
  return bike;
}

/**
 * Creates the complete outdoor parking lot with 2 Sports Cars and 2 Motorcycles.
 * Includes marked bays, curb blocks, kickstand pads, signage, and Rapier colliders.
 */
export function createOutdoorParkingLot(scene, world, RAPIER, staticBodies) {
  const lotGroup = new THREE.Group();
  scene.add(lotGroup);

  // =========================================================================
  // 1. THERMOPLASTIC PARKING BAY GUIDE LINES
  // West Parking Zone: x in [11.4, 17.2], z in [6.0, 17.2]
  // =========================================================================
  // Outer Western Bay Boundary Line (bordering pedestrian path)
  addBox(lotGroup, [11.4, 0.045, 11.6], [0.12, 0.008, 11.2], materials.parkingLineWhite);

  // Stall 1 & 2: Car Bays (Width 3.0m, Length 5.8m along X)
  const carStallDividers = [6.0, 9.2, 12.6];
  for (const zLine of carStallDividers) {
    addBox(lotGroup, [14.3, 0.045, zLine], [5.8, 0.008, 0.12], materials.parkingLineWhite);
  }

  // Dedicated Motorcycle Zone Boundary (Safety Yellow)
  // Yellow dividing line separating car stalls from motorcycle zone at z = 12.8
  addBox(lotGroup, [13.6, 0.046, 12.8], [4.4, 0.008, 0.12], materials.parkingLineYellow);
  // Yellow south boundary at z = 17.2
  addBox(lotGroup, [13.6, 0.046, 17.2], [4.4, 0.008, 0.12], materials.parkingLineYellow);
  // Yellow divider between Motorcycle Bay 1 & 2 at z = 15.2
  addBox(lotGroup, [13.6, 0.046, 15.2], [4.4, 0.008, 0.10], materials.parkingLineYellow);
  // Yellow front stop bar at x = 15.8
  addBox(lotGroup, [15.8, 0.046, 15.0], [0.12, 0.008, 4.4], materials.parkingLineYellow);

  // =========================================================================
  // 2. PARKING WHEEL STOP BLOCKS & MOTORCYCLE KICKSTAND PADS
  // =========================================================================
  // Car Wheel Stops (Heavy-duty rubber blocks with yellow safety accents at rear of stalls)
  for (const curbZ of [7.6, 10.9]) {
    addBox(lotGroup, [11.9, 0.10, curbZ], [0.22, 0.14, 1.80], materials.parkingCurbRubber);
    for (const yellowY of [-0.60, -0.20, 0.20, 0.60]) {
      addBox(lotGroup, [11.9, 0.10, curbZ + yellowY], [0.224, 0.142, 0.10], materials.parkingLineYellow);
    }
  }

  // Stainless Steel Diamond Kickstand Plates for Motorcycles
  for (const bikeZ of [14.2, 16.2]) {
    addBox(lotGroup, [13.1, 0.042, bikeZ], [0.38, 0.016, 0.38], materials.parkingPlateSteel);
  }

  // =========================================================================
  // 3. ARCHITECTURAL PARKING SIGNPOST & SOLAR BOLLARD LIGHTS
  // =========================================================================
  // Luxury Estate Parking Signpost at x = 17.5, z = 5.8
  addCylinder(lotGroup, [17.5, 1.10, 5.8], 0.04, 0.04, 2.20, materials.metalDark, { segments: 12 });
  addBox(lotGroup, [17.5, 0.12, 5.8], [0.32, 0.24, 0.32], materials.stoneWarm);
  // Backlit Sign Header Plate
  addBox(lotGroup, [17.5, 2.05, 5.8], [0.85, 0.42, 0.08], materials.metalDark);
  addBox(lotGroup, [17.5, 2.05, 5.8], [0.88, 0.45, 0.02], materials.brass);
  addBox(lotGroup, [17.5, 2.05, 5.845], [0.76, 0.34, 0.02], materials.screenCode);

  // Low-profile solar LED curb puck lights along the pedestrian border (x = 11.2)
  for (let pz = 6.8; pz <= 16.8; pz += 2.5) {
    addCylinder(lotGroup, [11.15, 0.08, pz], 0.08, 0.08, 0.06, materials.brass, { segments: 12 });
    addCylinder(lotGroup, [11.15, 0.115, pz], 0.05, 0.05, 0.02, materials.glow, { segments: 12 });
  }

  // =========================================================================
  // 4. VEHICLE 1: SPORTS CAR 1 (ROSSO CORSA / TORONTO RED BMW M4)
  // Parked in Car Stall 1 (center x = 14.3, z = 7.6, facing east into driving lane)
  // =========================================================================
  buildSportsCar(scene, 14.3, 0.05, 7.6, {
    paintMat: materials.m4PaintRed,
    plateFrontMat: materials.m4PlateRed,
    plateRearMat: materials.m4PlateRed,
    rotationY: Math.PI * 0.5,
  });

  if (world && RAPIER) {
    const car1Body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(14.3, 0.75, 7.6)
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(2.25, 0.75, 1.10), car1Body);
    staticBodies.push(car1Body);
  }

  // =========================================================================
  // 5. VEHICLE 2: SPORTS CAR 2 (ISLE OF MAN GREEN METALLIC BMW M4 CSL)
  // Parked in Car Stall 2 (center x = 14.3, z = 10.9, facing east into driving lane)
  // =========================================================================
  buildSportsCar(scene, 14.3, 0.05, 10.9, {
    paintMat: materials.m4PaintGreen,
    plateFrontMat: materials.m4PlateGreen,
    plateRearMat: materials.m4PlateGreen,
    rotationY: Math.PI * 0.5,
  });

  if (world && RAPIER) {
    const car2Body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(14.3, 0.75, 10.9)
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(2.25, 0.75, 1.10), car2Body);
    staticBodies.push(car2Body);
  }

  // =========================================================================
  // 6. VEHICLE 3: SUPERSPORT 1000cc MOTORCYCLE (BMW S1000RR / TRICOLOR)
  // Parked in Motorcycle Bay 1 (center x = 13.5, z = 14.1, facing east)
  // =========================================================================
  buildMotorcycle(scene, 13.5, 0.04, 14.1, {
    style: 'supersport',
    bodyPaintMat: materials.bikePaintTricolor,
    rotationY: Math.PI * 0.5,
    leanAngle: -0.10,
  });

  if (world && RAPIER) {
    const bike1Body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(13.5, 0.65, 14.1)
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(1.15, 0.65, 0.40), bike1Body);
    staticBodies.push(bike1Body);
  }

  // =========================================================================
  // 7. VEHICLE 4: HYPERNAKED STREETFIGHTER MOTORCYCLE (CYBER CYAN & ORANGE)
  // Parked in Motorcycle Bay 2 (center x = 13.5, z = 16.2, facing east)
  // =========================================================================
  buildMotorcycle(scene, 13.5, 0.04, 16.2, {
    style: 'streetfighter',
    bodyPaintMat: materials.bikePaintCyan,
    frameMat: materials.bikeTrellisOrange,
    rimMat: materials.bikePaintCyan,
    rotationY: Math.PI * 0.5,
    leanAngle: -0.10,
  });

  if (world && RAPIER) {
    const bike2Body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(13.5, 0.65, 16.2)
    );
    world.createCollider(RAPIER.ColliderDesc.cuboid(1.15, 0.65, 0.40), bike2Body);
    staticBodies.push(bike2Body);
  }
}

