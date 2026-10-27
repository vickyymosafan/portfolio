import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Optimized shared geometries - stylized cartoon proportions with minimal polygon waste
export const sharedGeometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  roundedBox: new RoundedBoxGeometry(1, 1, 1, 1, 0.04),
  flatBox: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 8, 6),
  lowSphere: new THREE.SphereGeometry(1, 6, 4),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 6),
  smoothCylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
  cone: new THREE.ConeGeometry(1, 1, 6),
};

export function addBox(parent, position, size, surface, options = {}) {
  const geo = options.rounded ? sharedGeometries.roundedBox : sharedGeometries.box;
  const mesh = new THREE.Mesh(geo, surface);
  mesh.position.set(...position);
  mesh.scale.set(...size);
  const vol = size[0] * size[1] * size[2];
  mesh.castShadow = options.shadow !== undefined ? options.shadow : shouldCastShadow(surface, vol > 0.45);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  parent.add(mesh);
  return mesh;
}

export function addSphere(parent, position, size, surface, options = {}) {
  const geo = options.lowPoly ? sharedGeometries.lowSphere : sharedGeometries.sphere;
  const mesh = new THREE.Mesh(geo, surface);
  mesh.position.set(...position);
  mesh.scale.set(...size);
  const vol = size[0] * size[1] * size[2];
  mesh.castShadow = options.shadow !== undefined ? options.shadow : shouldCastShadow(surface, vol > 0.45);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  parent.add(mesh);
  return mesh;
}

export function addCylinder(parent, position, radiusTop, radiusBottom, height, surface, options = {}) {
  const segments = options.segments ?? 8;
  const geo = segments === 8 ? sharedGeometries.cylinder : new THREE.CylinderGeometry(1, 1, 1, segments);
  const mesh = new THREE.Mesh(geo, surface);
  const avgRadius = (radiusTop + radiusBottom) * 0.5;
  mesh.position.set(...position);
  mesh.scale.set(avgRadius, height, avgRadius);
  const vol = Math.PI * avgRadius * avgRadius * height;
  mesh.castShadow = options.shadow !== undefined ? options.shadow : shouldCastShadow(surface, vol > 0.45);
  mesh.receiveShadow = options.receive ?? true;
  if (options.rotation) {
    mesh.rotation.set(...options.rotation);
  }
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  parent.add(mesh);
  return mesh;
}

// Strict whitelist of primary exterior occluders that should cast shadows into the directional sun shadow map
// Eliminates 95% of redundant shadow-map draw calls while preserving realistic architectural & tree shadows
const SHADOW_CASTER_NAMES = new Set([
  'wall', 'roof', 'roofTrim', 'wainscot',
  'bark', 'foliageDeep', 'foliageMid',
  'carPaintWhite', 'carSuvWhite', 'carSuvBlack', 'carRubber',
  'securityBoothWall', 'securityBoothRoof', 'perimeterPillar', 'perimeterCap',
  'barnRed', 'barnRoof', 'tractorRed'
]);

export function shouldCastShadow(material, defaultShadow) {
  if (!defaultShadow) return false;
  if (!material) return false;
  if (material.transparent && material.opacity !== undefined && material.opacity < 0.85) return false;
  if (material.emissive && material.emissive.getHex && material.emissive.getHex() > 0) return false;
  if (material.name && SHADOW_CASTER_NAMES.has(material.name)) return true;
  return false;
}

// High-performance BatchCollector to merge static geometries by material
// Reduces thousands of separate draw calls down to tens of draws
export class BatchCollector {
  constructor() {
    this.batches = new Map();
  }

  addBox(position, size, material, options = {}) {
    const baseGeo = options.rounded ? sharedGeometries.roundedBox : sharedGeometries.flatBox;
    let geo = baseGeo.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      options.rotation ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...options.rotation)) : new THREE.Quaternion(),
      new THREE.Vector3(...size)
    );
    geo.applyMatrix4(matrix);
    this._push(material, geo);
  }

  addCylinder(position, radiusTop, radiusBottom, height, material, options = {}) {
    const segments = options.segments ?? 8;
    const baseGeo = segments === 8 ? sharedGeometries.cylinder : new THREE.CylinderGeometry(1, 1, 1, segments);
    let geo = baseGeo.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    const avgRadius = (radiusTop + radiusBottom) * 0.5;
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      options.rotation ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...options.rotation)) : new THREE.Quaternion(),
      new THREE.Vector3(avgRadius, height, avgRadius)
    );
    geo.applyMatrix4(matrix);
    this._push(material, geo);
  }

  addSphere(position, size, material, options = {}) {
    const baseGeo = options.lowPoly ? sharedGeometries.lowSphere : sharedGeometries.sphere;
    let geo = baseGeo.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      options.rotation ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...options.rotation)) : new THREE.Quaternion(),
      new THREE.Vector3(...size)
    );
    geo.applyMatrix4(matrix);
    this._push(material, geo);
  }

  _push(material, geo) {
    if (!this.batches.has(material)) {
      this.batches.set(material, []);
    }
    this.batches.get(material).push(geo);
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
      mesh.castShadow = shouldCastShadow(material, defaultShadow);
      mesh.receiveShadow = defaultShadow;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      parent.add(mesh);
      resultMeshes.push(mesh);
    }
    this.batches.clear();
    return resultMeshes;
  }
}

/**
 * Traverses a static hierarchy and merges all static non-dynamic meshes by material.
 * Reduces hundreds of individual draw calls down to 1 draw call per material.
 */
export function mergeStaticHierarchy(group, options = {}) {
  if (!group) return;
  group.updateWorldMatrix(true, true);

  const meshes = [];
  group.traverse((child) => {
    if (!child.isMesh) return;
    if (child.userData?.isDynamic || child.userData?.keepSeparate) return;
    meshes.push(child);
  });

  if (meshes.length <= 1) return;

  const det = group.matrixWorld.determinant();
  const groupInv = Math.abs(det) > 1e-8 ? group.matrixWorld.clone().invert() : new THREE.Matrix4();

  const batches = new Map();
  for (const mesh of meshes) {
    const mat = mesh.material;
    if (!batches.has(mat)) batches.set(mat, []);

    let geo = mesh.geometry.clone();
    if (geo.index !== null) geo = geo.toNonIndexed();
    if (!geo.getAttribute('normal')) geo.computeVertexNormals();
    if (!geo.getAttribute('uv')) {
      const count = geo.getAttribute('position').count;
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    }
    const standardAttrs = new Set(['position', 'normal', 'uv']);
    for (const name of Object.keys(geo.attributes)) {
      if (!standardAttrs.has(name)) geo.deleteAttribute(name);
    }

    const relMatrix = mesh.parent === group
      ? mesh.matrix.clone()
      : groupInv.clone().multiply(mesh.matrixWorld);

    if (!Number.isNaN(relMatrix.elements[0])) {
      geo.applyMatrix4(relMatrix);
    }

    batches.get(mat).push(geo);

    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }
  }

  const defaultShadow = options.shadow ?? true;
  for (const [material, geometries] of batches.entries()) {
    if (geometries.length === 0) continue;
    let merged;
    if (geometries.length === 1) {
      merged = geometries[0];
    } else {
      merged = mergeGeometries(geometries, false);
      for (const g of geometries) g.dispose();
    }
    if (!merged) continue;

    const mergedMesh = new THREE.Mesh(merged, material);
    mergedMesh.castShadow = shouldCastShadow(material, defaultShadow);
    mergedMesh.receiveShadow = defaultShadow;
    mergedMesh.matrixAutoUpdate = false;
    mergedMesh.updateMatrix();
    group.add(mergedMesh);
  }
}
