// Ground: the lakeside slope, the granite whaleback under the sauna, the reed bay,
// a rocky east point, a pine islet, and far ridges. North is -z, 1 unit = 1 m.
import * as THREE from 'three';
import { Batch, vcMat, fbm2, noise2, smooth } from './kit.mjs';

// ---------- layout ----------
export const L = {
  sauna: { x: -5.6, z: -.9, yaw: .12 },
  pier: { x: -2.5, z0: .2, z1: 8.6, w: 1.2, y: .42 },
  cabin: { x: 5.6, z: -17.6, yaw: -.16 },
  woodshed: { x: -10.2, z: -6.2, yaw: .55 },
  bay: { x: 2.6, z: -1.2 },
  eastPoint: { x: 11.5, z: -1.6 },
  islet: { x: 28, z: 20, r: 3.2 },
  // More islands for the rowing route, all outside the view from the hero camera so the home
  // picture is unchanged: a pine island with a boathouse to the east, granite skerries to the
  // west, and a long low island far out to the south, behind the camera.
  isles: [
    { x: 42, z: 50, r: 5.6, k: .72, h: 2.1, key: 'boathouse' },
    { x: -25, z: 31, r: 1.5, k: .8, h: .7 },
    { x: -29.5, z: 37.5, r: 2.7, k: .75, h: 1.3, key: 'skerry' },
    { x: -21, z: 41.5, r: 1.1, k: .9, h: .5 },
    { x: 6, z: 74, r: 9, k: .42, h: 2.5, key: 'long' },
  ],
  avanto: { x: -1.2, z: 10.2, r: .95 },
  fire: { x: 11.2, z: -2.4 },
  kokko: { x: 13.6, z: 1.6 },
};
export const PATH = [[-3.2, -1.2], [-2.0, -4.0], [-.4, -7.2], [1.2, -10.4], [3.0, -13.0], [4.6, -14.4]];

/** z of the shoreline at x: land where z < shoreZ(x). */
export function shoreZ(x){
  return -2.6 + 1.0 * Math.sin(x * .12 + 1.1) + .5 * Math.sin(x * .41 + .3)
    + 6.2 * Math.exp(-((x + 5.2) ** 2) / 16)        // the sauna point
    - 1.8 * Math.exp(-((x - 2.8) ** 2) / 9)         // the reed bay
    + 2.4 * Math.exp(-((x - 11.5) ** 2) / 7);       // the east rocky point
}

/** 0..1: how much a spot is bare granite (sauna whaleback, east point, islet rim). */
export function rockMask(x, z){
  const a = 1 - Math.hypot((x + 5.4) / 6.8, (z - .4) / 4.6);          // whaleback under the sauna
  const b = 1 - Math.hypot((x - 11.6) / 3.4, (z + 1.6) / 2.6);        // east point
  const c = 1 - Math.hypot((x - L.islet.x) / L.islet.r, (z - L.islet.z) / (L.islet.r * .8));
  const e = noise2(x * .35, z * .35) * .25;
  let isle = 0;
  for (const I of L.isles){
    const q = 1 - Math.hypot((x - I.x) / I.r, (z - I.z) / (I.r * I.k));
    if (q > -.3) isle = Math.max(isle, smooth(0, .35, q + e) * (I.r < 3 ? 1 : smooth(.6, .25, q)));
  }
  return Math.max(smooth(0, .25, a + e - .05), smooth(0, .3, b + e - .1), smooth(.0, .35, c + e) * smooth(.75, .3, c), isle);
}

export function distToPath(x, z){
  let best = 1e9;
  for (let i = 0; i < PATH.length - 1; i++){
    const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}

function rawHeight(x, z){
  const d = shoreZ(x) - z;                                             // metres inland
  const bay = Math.exp(-((x - 2.8) ** 2) / 14);
  let h;
  if (d >= 0) h = .22 + Math.min(d, 14) * .17 + Math.max(0, Math.min(d, 40) - 14) * .04 + .8 * smooth(24, 50, d)
    + (fbm2(x * .12, z * .12) - .5) * .7 * smooth(2, 8, d);
  else h = .22 + d * (.32 - .2 * bay) - Math.max(0, -d - 4) * .25;
  // Granite: smooth domes, a little higher than the soil around them.
  const r = rockMask(x, z);
  if (r > 0){
    const dome = d >= 0 ? .25 + d * .2 : .22 + d * .22;
    h += (Math.max(h, dome) + .12 * r - h) * r;
  }
  // Pine islet: a rocky dome rising out of the lake.
  const di = Math.hypot((x - L.islet.x) / L.islet.r, (z - L.islet.z) / (L.islet.r * .8));
  if (di < 1.6) h = Math.max(h, 1.5 * (1 - di * di) - .1 + (noise2(x * .6, z * .6) - .5) * .25);
  for (const I of L.isles){
    const q = Math.hypot((x - I.x) / I.r, (z - I.z) / (I.r * I.k));
    // A low dome with a firm shoreline: flat-ish on top, dropping steeply into the water at the edge.
    if (q < 1.6) h = Math.max(h, I.h * (1 - q * q * q) - .15 + (noise2(x * .5 + I.x, z * .5) - .5) * .3 * Math.max(0, 1 - q) - smooth(.95, 1.25, q) * 1.6);
  }
  return Math.max(h, -3.4);
}

const PADS = [
  { x: L.cabin.x, z: L.cabin.z, r0: 5.2, r1: 8.5 },
  { x: L.woodshed.x, z: L.woodshed.z, r0: 1.6, r1: 2.8 },
  { x: L.sauna.x, z: L.sauna.z, r0: 2.4, r1: 3.8 },
  { x: 9.5, z: -19, r0: 1, r1: 2 }, { x: 12, z: -24, r0: 1, r1: 2 },
  { x: 8.6, z: -12.4, r0: 2, r1: 3.4 },
];
for (const p of PADS) p.h = rawHeight(p.x, p.z);
export function height(x, z){
  let h = rawHeight(x, z);
  for (const p of PADS){ const k = smooth(p.r1, p.r0, Math.hypot(x - p.x, z - p.z)); h += (p.h - h) * k; }
  const pd = distToPath(x, z);
  if (pd < 1 && h > .3) h -= .06 * smooth(1, .3, pd);
  return h;
}

// ---------- colours ----------
const K = s => new THREE.Color(s);
const CS = {
  granite: K('#7b726c'), graniteWarm: K('#8a7e76'), lichen: K('#949180'), wet: K('#5f5751'), bedTea: K('#6e5a3e'), bedDeep: K('#2f3b37'),
  moss: K('#69784a'), mossLight: K('#8e9463'), bilberry: K('#4c5d35'), needles: K('#8a7352'), lawn: K('#82925a'), lawn2: K('#9c9d6a'),
  path: K('#9a8160'), sand: K('#cdbd98'),
  autumnFloor: K('#8a6a3c'), autumnLawn: K('#a39a58'), autumnRed: K('#9a4a2c'),
  snow: K('#eef1f5'), snowShade: K('#d9e0ec'), snowPath: K('#cfd5df'),
};

function groundColor(c, season, x, z, h){
  const d = shoreZ(x) - z, r = rockMask(x, z), n = fbm2(x * .25, z * .25), n2 = noise2(x * .9, z * .9);
  const lawn = smooth(9, 6, Math.hypot(x - L.cabin.x, z - (L.cabin.z + 5))) * (h > .5 ? 1 : 0);
  const pd = distToPath(x, z);
  if (h < -.03){                                                       // lake bed, tea brown in the shallows
    c.copy(CS.bedTea).lerp(CS.bedDeep, smooth(.1, 2, -h));
    if (season === 'winter') return c;
    return c;
  }
  if (season === 'winter'){
    c.copy(CS.snow).lerp(CS.snowShade, n * .7);
    if (pd < .7) c.lerp(CS.snowPath, smooth(.7, .3, pd));
    if (r > .5 && d < .5) c.lerp(CS.granite, .25);
    return c;
  }
  // Forest floor: moss and bilberry, needles under pines; lawn by the cabin.
  c.copy(CS.moss).lerp(CS.bilberry, smooth(.45, .7, n2) * smooth(3, 8, d)).lerp(CS.mossLight, smooth(.55, .8, n) * .6);
  if (season === 'autumn') c.lerp(CS.autumnFloor, .45).lerp(CS.autumnRed, smooth(.6, .78, n2) * smooth(3, 8, d) * .7);
  if (lawn > 0) c.lerp(season === 'autumn' ? CS.autumnLawn : CS.lawn, lawn).lerp(CS.lawn2, lawn * n * .5);
  if (d < 1.4 && r < .3) c.lerp(CS.sand, smooth(1.4, .2, d) * .7);   // a little sand and gravel at the waterline
  if (pd < .8) c.lerp(CS.path, smooth(.8, .35, pd) * .9);
  if (r > 0){                                                          // granite with lichen and a dark wet band
    const g = c.clone().copy(CS.granite).lerp(CS.graniteWarm, n).lerp(CS.lichen, smooth(.55, .75, n2) * .5);
    c.lerp(g, smooth(.1, .5, r));
  }
  if (h < .14 && h > -.03) c.lerp(CS.wet, smooth(.14, .02, h) * .8);
  return c;
}

export function buildTerrain(){
  const size = 160, seg = 260;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const P = g.attributes.position, n = P.count;
  const cols = { summer: new Float32Array(n * 3), autumn: new Float32Array(n * 3), winter: new Float32Array(n * 3) };
  const c = new THREE.Color();
  for (let i = 0; i < n; i++){
    const x = P.getX(i), z = P.getZ(i), h = height(x, z);
    P.setY(i, h);
    for (const s of ['summer', 'autumn', 'winter']){ groundColor(c, s, x, z, h); cols[s].set([c.r, c.g, c.b], i * 3); }
  }
  g.computeVertexNormals();
  g.setAttribute('color', new THREE.BufferAttribute(cols.summer.slice(), 3));
  const mesh = new THREE.Mesh(g, vcMat());
  mesh.receiveShadow = true;
  mesh.userData.cols = cols;
  return mesh;
}

/** Water depth over [-80, 80]^2 for the lake shader (R = depth / 3.4). */
export function depthTexture(){
  const N = 256, data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){
    const x = -80 + 160 * (i + .5) / N, z = -80 + 160 * (j + .5) / N, h = height(x, z), k = (j * N + i) * 4;
    data[k] = Math.round(255 * Math.min(1, Math.max(0, -h / 3.4)));
    data[k + 1] = h > 0 ? 255 : 0; data[k + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, N, N);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
  return tex;
}

/** Headlands and ridges that step back into the haze: each layer paler in the fog. */
export function farLand(){
  const b = new Batch();
  // Two headlands reaching into the lake left and right, then low ridges behind the hill.
  const strip = (x0, z0, w, d, amp, col, seed) => {
    const g = new THREE.PlaneGeometry(w, d, Math.ceil(w / 3), Math.ceil(d / 3)); g.rotateX(-Math.PI / 2);
    const P = g.attributes.position;
    for (let i = 0; i < P.count; i++){
      const x = P.getX(i), z = P.getZ(i), e = 1 - Math.abs(z) / (d / 2), ex = 1 - Math.abs(x) / (w / 2);
      P.setY(i, -1.2 + amp * Math.min(1, e * 2.5) * Math.min(1, ex * 3) * (.6 + fbm2(x * .03 + seed, z * .03) * .8));
    }
    g.computeVertexNormals();
    b.add(g, col, [x0, 0, z0]);
  };
  strip(-78, 18, 70, 26, 9, '#2f4535', 1);       // west headland, nearer
  strip(84, 40, 80, 24, 7, '#3a5040', 5);        // east headland
  strip(-10, -82, 300, 30, 5, '#24342c', 3);     // dark forest band behind the hill
  strip(0, 128, 380, 40, 6, '#34483a', 17);      // the far southern shore, seen only when rowing
  strip(-20, -125, 380, 60, 7, '#3f5546', 9);    // first ridge, low as Finnish lake country is
  strip(10, -185, 460, 60, 10, '#506656', 13);   // far ridge
  const m = b.mesh(vcMat()); m.castShadow = false; m.receiveShadow = false;
  return m;
}
