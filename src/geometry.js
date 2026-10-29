import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getBatchFamilyForMaterial, vertexColorFamilies } from './materials.js';

export const sharedGeometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  flatBox: new THREE.BoxGeometry(1, 1, 1),
  heroSphere: new THREE.SphereGeometry(1, 8, 6),
  sphere: new THREE.SphereGeometry(1, 6, 4),
  lowSphere: new THREE.SphereGeometry(1, 5, 3),
  tinySphere: new THREE.SphereGeometry(1, 4, 2),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 6),
  thinCylinder: new THREE.CylinderGeometry(1, 1, 1, 4, 1, true),
  smoothCylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 6),
};

const sharedGeoSet = new Set(Object.values(sharedGeometries));

const cylinderCache = new Map([
  [6, sharedGeometries.cylinder],
  [8, sharedGeometries.smoothCylinder],
]);

function getSharedCylinder(segments, avgRadius = 0.2) {
  if (avgRadius <= 0.14) return sharedGeometries.thinCylinder;
  if (avgRadius <= 0.36) return sharedGeometries.cylinder;
  const clamped = Math.min(8, Math.max(4, segments || 6));
  if (!cylinderCache.has(clamped)) {
    const cyl = new THREE.CylinderGeometry(1, 1, 1, clamped);
    cylinderCache.set(clamped, cyl);
    sharedGeoSet.add(cyl);
  }
  return cylinderCache.get(clamped);
}

const _tempVecPos = new THREE.Vector3();
const _tempVecScale = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempEuler = new THREE.Euler();
const _tempMat4 = new THREE.Matrix4();
const _defaultColor = new THREE.Color(0xffffff);

export function normalizeGeometryForMerge(geo, color = _defaultColor, preserveColors = false) {
  const posAttr = geo.attributes.position;
  if (!posAttr) return geo;
  const count = posAttr.count;

  if (!geo.index) {
    const indices = new Uint16Array(count);
    for (let i = 0; i < count; i += 1) indices[i] = i;
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
  }
  if (!geo.attributes.normal) {
    geo.computeVertexNormals();
  }
  if (!geo.attributes.uv) {
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  }

  if (!preserveColors || !geo.attributes.color) {
    const colors = new Float32Array(count * 3);
    const r = color.r;
    const g = color.g;
    const b = color.b;
    for (let i = 0; i < count * 3; i += 3) {
      colors[i] = r;
      colors[i + 1] = g;
      colors[i + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  // Remove any non-standard attributes so mergeGeometries never mismatches
  for (const key of Object.keys(geo.attributes)) {
    if (key !== 'position' && key !== 'normal' && key !== 'uv' && key !== 'color') {
      geo.deleteAttribute(key);
    }
  }
  return geo;
}

export function addBox(parent, position, size, surface, options = {}) {
  const geo = sharedGeometries.flatBox;
  const mesh = new THREE.Mesh(geo, surface);
  mesh.position.set(...position);
  mesh.scale.set(...size);
  const vol = size[0] * size[1] * size[2];
  mesh.castShadow = options.shadow !== undefined ? options.shadow : (vol > 0.25);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  parent.add(mesh);
  return mesh;
}

export function addSphere(parent, position, size, surface, options = {}) {
  const maxDim = Math.max(size[0], size[1], size[2]);
  const geo = options.lowPoly || maxDim <= 0.18 ? sharedGeometries.lowSphere : sharedGeometries.heroSphere;
  const mesh = new THREE.Mesh(geo, surface);
  mesh.position.set(...position);
  mesh.scale.set(...size);
  const vol = size[0] * size[1] * size[2];
  mesh.castShadow = options.shadow !== undefined ? options.shadow : (vol > 0.25);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  parent.add(mesh);
  return mesh;
}

export function addCylinder(parent, position, radiusTop, radiusBottom, height, surface, options = {}) {
  const avgRadius = (radiusTop + radiusBottom) * 0.5;
  const geo = getSharedCylinder(options.segments ?? 6, avgRadius);
  const mesh = new THREE.Mesh(geo, surface);
  mesh.position.set(...position);
  mesh.scale.set(avgRadius, height, avgRadius);
  const vol = Math.PI * avgRadius * avgRadius * height;
  mesh.castShadow = options.shadow !== undefined ? options.shadow : (vol > 0.25);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  parent.add(mesh);
  return mesh;
}

// High-performance BatchCollector to merge static geometries by material family with vertex colors
export class BatchCollector {
  constructor() {
    this.batches = new Map();
  }

  addBox(position, size, material, options = {}) {
    const geo = sharedGeometries.flatBox.clone();
    _tempVecPos.set(...position);
    if (options.rotation) {
      _tempEuler.set(...options.rotation);
      _tempQuat.setFromEuler(_tempEuler);
    } else {
      _tempQuat.identity();
    }
    _tempVecScale.set(...size);
    _tempMat4.compose(_tempVecPos, _tempQuat, _tempVecScale);
    geo.applyMatrix4(_tempMat4);
    this._push(material, geo);
  }

  addCylinder(position, radiusTop, radiusBottom, height, material, options = {}) {
    const avgRadius = (radiusTop + radiusBottom) * 0.5;
    const baseGeo = getSharedCylinder(options.segments ?? 6, avgRadius);
    const geo = baseGeo.clone();
    _tempVecPos.set(...position);
    if (options.rotation) {
      _tempEuler.set(...options.rotation);
      _tempQuat.setFromEuler(_tempEuler);
    } else {
      _tempQuat.identity();
    }
    _tempVecScale.set(avgRadius, height, avgRadius);
    _tempMat4.compose(_tempVecPos, _tempQuat, _tempVecScale);
    geo.applyMatrix4(_tempMat4);
    this._push(material, geo);
  }

  addSphere(position, size, material, options = {}) {
    const maxDim = Math.max(size[0], size[1], size[2]);
    const baseGeo = maxDim <= 0.22 ? sharedGeometries.tinySphere : (options.lowPoly ? sharedGeometries.lowSphere : sharedGeometries.sphere);
    const geo = baseGeo.clone();
    _tempVecPos.set(...position);
    if (options.rotation) {
      _tempEuler.set(...options.rotation);
      _tempQuat.setFromEuler(_tempEuler);
    } else {
      _tempQuat.identity();
    }
    _tempVecScale.set(...size);
    _tempMat4.compose(_tempVecPos, _tempQuat, _tempVecScale);
    geo.applyMatrix4(_tempMat4);
    this._push(material, geo);
  }

  _push(material, geo) {
    const safeMat = material || vertexColorFamilies.matte;
    const fam = getBatchFamilyForMaterial(safeMat);
    const targetMat = fam ? fam.familyMat : safeMat;
    const col = fam ? fam.color : (safeMat?.color || _defaultColor);
    normalizeGeometryForMerge(geo, col, Boolean(fam?.preserveColors));

    if (!this.batches.has(targetMat)) {
      this.batches.set(targetMat, []);
    }
    this.batches.get(targetMat).push(geo);
  }

  build(parent, defaultShadow = true) {
    const resultMeshes = [];
    for (const [material, geometries] of this.batches.entries()) {
      if (geometries.length === 0) continue;
      let mesh;
      if (geometries.length === 1) {
        mesh = new THREE.Mesh(geometries[0], material);
      } else {
        const merged = mergeGeometries(geometries, false);
        for (const g of geometries) g.dispose();
        mesh = new THREE.Mesh(merged, material);
      }
      const isCasterFamily = material === vertexColorFamilies.plaster || material === vertexColorFamilies.wood || material === vertexColorFamilies.shingles;
      mesh.castShadow = defaultShadow && isCasterFamily;
      mesh.receiveShadow = defaultShadow && !material.transparent && !material.isMeshBasicMaterial;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      parent.add(mesh);
      resultMeshes.push(mesh);
    }
    this.batches.clear();
    return resultMeshes;
  }

  /**
   * Merge all collected geometries into a single vertex-colored BufferGeometry
   * Ideal for creating a 1-draw-call THREE.InstancedMesh or single animated NPC mesh.
   */
  toMergedGeometry() {
    const allGeos = [];
    for (const geometries of this.batches.values()) {
      for (const g of geometries) allGeos.push(g);
    }
    this.batches.clear();
    if (allGeos.length === 0) return new THREE.BufferGeometry();
    if (allGeos.length === 1) return allGeos[0];
    const merged = mergeGeometries(allGeos, false);
    for (const g of allGeos) g.dispose();
    return merged;
  }
}

/**
 * Merges child meshes within a movable/rotatable Group (e.g., door panel, roofGroup, character limb)
 * into minimal vertex-colored meshes while keeping the Group's own transform dynamic.
 */
export function mergeSubtreeMeshes(rootGroup, castShadow = false, forceSingleOpaqueMat = false) {
  rootGroup.updateMatrixWorld(true);
  const invRootMatrix = new THREE.Matrix4().copy(rootGroup.matrixWorld).invert();
  const buckets = new Map();
  const toRemove = [];

  rootGroup.traverse((node) => {
    if (!node.isMesh || !node.geometry) return;
    const fam = getBatchFamilyForMaterial(node.material);
    let targetMat = fam ? fam.familyMat : node.material;
    if (forceSingleOpaqueMat && !targetMat.transparent) {
      targetMat = vertexColorFamilies.matte;
    }
    const col = fam ? fam.color : (node.material?.color || _defaultColor);

    const relMatrix = new THREE.Matrix4().multiplyMatrices(invRootMatrix, node.matrixWorld);
    const cloned = node.geometry.clone();
    cloned.applyMatrix4(relMatrix);
    normalizeGeometryForMerge(cloned, col, Boolean(fam?.preserveColors));

    if (!buckets.has(targetMat)) buckets.set(targetMat, []);
    buckets.get(targetMat).push(cloned);
    toRemove.push(node);
  });

  for (const node of toRemove) {
    if (node.parent) node.parent.remove(node);
    if (node.geometry && !sharedGeoSet.has(node.geometry)) {
      node.geometry.dispose();
    }
  }

  for (const [material, geos] of buckets.entries()) {
    if (geos.length === 0) continue;
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (geos.length > 1) {
      for (const g of geos) g.dispose();
    }
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = castShadow && !material.transparent && !material.isMeshBasicMaterial;
    mesh.receiveShadow = !material.transparent && !material.isMeshBasicMaterial;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    rootGroup.add(mesh);
  }
}

/**
 * Global Static Scene Optimizer:
 * Traverses the entire scene after creation, skips subtrees marked `userData.isDynamic = true`,
 * and merges all static meshes across all zones/rooms into shared vertex-colored family meshes.
 * Collapses ~1,900 draw calls down to < 45 draw calls for locked 60 FPS even on low-end GPUs.
 */
export function optimizeStaticScene(scene, cameraBlockers = null) {
  scene.updateMatrixWorld(true);
  const buckets = new Map();
  const toRemove = [];

  function visit(node) {
    if (node.userData?.isDynamic) return;
    if (node.isMesh && node.geometry && node.visible) {
      const fam = getBatchFamilyForMaterial(node.material);
      if (fam) {
        const cloned = node.geometry.clone();
        cloned.applyMatrix4(node.matrixWorld);
        normalizeGeometryForMerge(cloned, fam.color, Boolean(fam.preserveColors));
        if (!buckets.has(fam.familyMat)) buckets.set(fam.familyMat, []);
        buckets.get(fam.familyMat).push(cloned);
        toRemove.push(node);
      } else if (node.material) {
        // Unique canvas texture material (e.g., carpets, paintings, signs)
        const mat = node.material;
        const cloned = node.geometry.clone();
        cloned.applyMatrix4(node.matrixWorld);
        normalizeGeometryForMerge(cloned, _defaultColor, true);
        if (!buckets.has(mat)) buckets.set(mat, []);
        buckets.get(mat).push(cloned);
        toRemove.push(node);
      }
    }
    const children = node.children;
    for (let i = 0, l = children.length; i < l; i += 1) {
      visit(children[i]);
    }
  }

  visit(scene);

  for (const node of toRemove) {
    if (node.parent) node.parent.remove(node);
    if (node.geometry && !sharedGeoSet.has(node.geometry)) {
      let isCached = false;
      for (const cached of cylinderCache.values()) {
        if (cached === node.geometry) {
          isCached = true;
          break;
        }
      }
      if (!isCached) node.geometry.dispose();
    }
  }

  // Prune empty non-dynamic groups to keep scene graph shallow and fast to traverse
  const emptyGroups = [];
  scene.traverse((node) => {
    if (node !== scene && node.isGroup && !node.userData?.isDynamic && node.children.length === 0) {
      emptyGroups.push(node);
    }
  });
  for (const g of emptyGroups) {
    if (g.parent) g.parent.remove(g);
  }

  const staticRoot = new THREE.Group();
  staticRoot.name = 'OptimizedStaticWorld';
  staticRoot.matrixAutoUpdate = false;
  scene.add(staticRoot);

  let mergedWallMesh = null;

  for (const [material, geos] of buckets.entries()) {
    if (geos.length === 0) continue;
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (geos.length > 1) {
      for (const g of geos) g.dispose();
    }
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material);
    const isCasterFamily = material === vertexColorFamilies.plaster || material === vertexColorFamilies.wood || material === vertexColorFamilies.shingles;
    mesh.castShadow = isCasterFamily;
    mesh.receiveShadow = !material.transparent && !material.isMeshBasicMaterial;
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    staticRoot.add(mesh);

    if (material === vertexColorFamilies.plaster) {
      mergedWallMesh = mesh;
    }
  }

  // Point cameraBlockers to the single merged plaster/wall mesh for 1-mesh occlusion raycasting
  if (cameraBlockers && mergedWallMesh) {
    cameraBlockers.length = 0;
    cameraBlockers.push(mergedWallMesh);
  }
}
