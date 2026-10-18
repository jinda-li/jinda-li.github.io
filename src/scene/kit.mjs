// Small helpers for building the scene out of primitives: a geometry batch with
// vertex colours, value noise, and colour utilities.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const C = s => new THREE.Color(s);

// ---------- deterministic randomness ----------
export function rng(seed = 1){
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
export function noise2(x, y){
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm2 = (x, y) => noise2(x, y) * .55 + noise2(x * 2.1, y * 2.1) * .3 + noise2(x * 4.3, y * 4.3) * .15;
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- batch: many primitives merged into one mesh with vertex colours ----------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

export class Batch {
  constructor(){ this.parts = []; }
  /** Add a geometry, coloured `color` (or a per-vertex function), placed by pos/rot/scale. */
  add(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]){
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    _e.set(rot[0], rot[1], rot[2]); _q.setFromEuler(_e);
    _m.compose(_p.set(...pos), _q, _s.set(...(typeof scale === 'number' ? [scale, scale, scale] : scale)));
    g.applyMatrix4(_m);
    const n = g.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color();
    const P = g.attributes.position;
    for (let i = 0; i < n; i++){
      if (typeof color === 'function') color(c, P.getX(i), P.getY(i), P.getZ(i), i); else c.set(color);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.parts.push(g);
    return this;
  }
  box(w, h, d, color, pos, rot, r = 0){
    const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d);
    return this.add(g, color, pos, rot);
  }
  cyl(rt, rb, h, color, pos, rot, seg = 10){ return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), color, pos, rot); }
  sphere(r, color, pos, scale = 1, seg = 12){ return this.add(new THREE.SphereGeometry(r, seg, Math.ceil(seg * .75)), color, pos, [0, 0, 0], scale); }
  cone(r, h, color, pos, rot, seg = 9){ return this.add(new THREE.ConeGeometry(r, h, seg), color, pos, rot); }
  capsule(r, len, color, pos, rot, scale = 1){ return this.add(new THREE.CapsuleGeometry(r, len, 4, 10), color, pos, rot, scale); }
  geometry(){ const g = mergeGeometries(this.parts); g.computeBoundingSphere(); return g; }
  mesh(material){ const m = new THREE.Mesh(this.geometry(), material); m.castShadow = m.receiveShadow = true; return m; }
}

/** A Lambert material that reads vertex colours; each interactive object gets its own so it can glow on hover. */
export const vcMat = (opts = {}) => new THREE.MeshLambertMaterial({ vertexColors: true, ...opts });

/** Jitter a colour a little in lightness, for hand-made variety. */
export function vary(c, rand, amt = .06){
  const o = new THREE.Color(c), hsl = {}; o.getHSL(hsl);
  o.setHSL(hsl.h + (rand() - .5) * amt * .3, hsl.s, Math.min(1, Math.max(0, hsl.l + (rand() - .5) * amt)));
  return o;
}
