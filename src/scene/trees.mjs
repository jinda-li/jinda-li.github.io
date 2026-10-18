// Trees, described once per species and drawn in one of several styles.
//
// A species generator returns a spec: trunks (curves), crown clumps (ellipsoids with a colour)
// and, for spruce, drooping branch tiers. A style turns the spec into geometry:
//   round   soft blobs (the first version)
//   brush   alpha-tested brush-stroke cards with spherical normals (the common "painted tree" build)
//   daub    flat oriented dabs of colour, like impressionist brushwork, no textures
//   cutout  one flat painted silhouette per tree that turns to face the camera (stage flats)
import * as THREE from 'three';
import { Batch, rng, C } from './kit.mjs';

export const TC = {
  spruce: '#24342d', spruceTop: '#30463a', spruceShade: '#1b2924', spruceTrunk: '#4a3a2e',
  pineBark: '#6b5a4a', pineOrange: '#c3713a', pine: '#3b5238', pine2: '#4f6646',
  bark: '#ece7dc', barkMark: '#2a2624', birch: ['#8a9c58', '#9aaa64', '#77894c'], birchAutumn: ['#cfa23c', '#dbb653', '#bd8a33'],
  aspenBark: '#a7ab98', aspen: ['#728d44', '#839c50'], aspenAutumn: ['#d9862e', '#c8552c', '#e0a43a'],
  alderBark: '#5a5650', alder: ['#46592f', '#536838'], alderAutumn: ['#6d6a3a', '#7b6f3e'],
  rowanBark: '#6a5f55', rowan: ['#5f7f3a', '#6c8a44'], rowanAutumn: ['#c0452b', '#d1652f'], berry: '#d4502a', flower: '#f1ece0',
  snow: '#f2f4f7',
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const col3 = v => typeof v === 'string' ? C(v) : v;

// ---------- species ----------
export function speciesSpec(kind, seed, season, opts = {}){
  const r = rng(seed), s = { kind, trunks: [], clumps: [], tiers: [], twigs: [], H: 0, season };
  const bare = season === 'winter';
  if (kind === 'spruce'){
    // Narrow spire, branches drooping like a skirt, darkest mass in the scene.
    const tiers = 7 + Math.floor(r() * 4), H = 6.5 + r() * 3, base = .7;
    s.H = H;
    s.trunks.push({ pts: [V(0, 0, 0), V(0, base + .8, 0)], r0: .2, r1: .12, col: () => TC.spruceTrunk });
    for (let i = 0; i < tiers; i++){
      const t = i / (tiers - 1), y = base + t * (H - base - 1.1);
      s.tiers.push({ y, r: (1.3 - t * 1.05) * (.88 + r() * .24), h: 1.45 - t * .55, droop: .35 + (1 - t) * .3, t,
        col: C(TC.spruceShade).lerp(C(TC.spruceTop), t * .8 + r() * .15), rot: r() * 6, seed: r() * 10 });
    }
    s.spire = { y: H - .35, h: 1.4 };
  } else if (kind === 'pine'){
    // Tall bare trunk, orange in the upper half, flat irregular crown shelves with sky between them.
    const H = 6.5 + r() * 2.5, bend = (r() - .5) * .45, lean = opts.lean || 0;
    s.H = H;
    const pts = []; for (let i = 0; i <= 6; i++){ const t = i / 6; pts.push(V(Math.sin(t * 1.5) * bend + t * t * lean * H * .35, t * H, 0)); }
    s.trunks.push({ pts, r0: .22, r1: .12, col: y => C(TC.pineBark).lerp(C(TC.pineOrange), Math.min(1, Math.max(0, (y / H - .35) * 2.2))) });
    const top = pts[6], n = 5 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++){
      const a = r() * Math.PI * 2, d = i ? .45 + r() * 1.1 : 0, y = i ? H * (.72 + r() * .22) : H * .97, k = i ? .6 + r() * .5 : .75 + r() * .2;
      const x = top.x * (y / H) + Math.cos(a) * d, z = Math.sin(a) * d;
      if (i) s.twigs.push({ a: V(top.x * (y / H), y - .3, 0), b: V(x, y - .1, z), r: .07, col: TC.pineOrange });
      s.clumps.push({ x, y, z, rx: k * 1.3, ry: k * .5, rz: k * 1.2, col: C(TC.pine).lerp(C(TC.pine2), r() * .6), flat: true, snow: bare });
    }
  } else if (kind === 'birch' || kind === 'aspen' || kind === 'alder' || kind === 'rowan'){
    const P = {
      birch: { H: 5.2 + r() * 2.2, stems: r() < .3 ? 2 : 1, r0: .14, bark: null, clumps: 4 + Math.floor(r() * 2), low: .5, weep: .55,
        cols: season === 'autumn' ? TC.birchAutumn : TC.birch },
      aspen: { H: 6 + r() * 2.5, stems: 1, r0: .16, bark: TC.aspenBark, clumps: 4 + Math.floor(r() * 3), low: .55, weep: .15,
        cols: season === 'autumn' ? TC.aspenAutumn : TC.aspen },
      alder: { H: 3.2 + r() * 1.6, stems: 2 + Math.floor(r() * 2), r0: .1, bark: TC.alderBark, clumps: 4, low: .35, weep: .1,
        cols: season === 'autumn' ? TC.alderAutumn : TC.alder },
      rowan: { H: 4.2 + r() * 1.2, stems: 1, r0: .12, bark: TC.rowanBark, clumps: 5, low: .55, weep: .1,
        cols: season === 'autumn' ? TC.rowanAutumn : TC.rowan },
    }[kind];
    s.H = P.H;
    for (let st = 0; st < P.stems; st++){
      const lean = (r() - .5) * .25 + st * .16 * (st % 2 ? 1 : -1), h = P.H * (st ? .82 + r() * .1 : 1), pts = [];
      for (let i = 0; i <= 6; i++){ const t = i / 6; pts.push(V(Math.sin(t * 2 + seed) * .22 + t * lean * h * .3 + st * .25, t * h, Math.cos(t * 1.7 + seed) * .14)); }
      const birchBark = y => {
        const notch = Math.sin(y * 7.3 + seed) > .86 || Math.sin(y * 3.1 + seed * 2) > .94;
        return C(y < .9 || notch ? TC.barkMark : TC.bark).lerp(C(TC.barkMark), y < 1.6 && y >= .9 ? .45 : 0);
      };
      s.trunks.push({ pts, r0: P.r0 - st * .03, r1: (P.r0 - st * .03) * .5, col: P.bark ? () => C(P.bark) : birchBark });
      const top = pts[6];
      if (bare){
        for (let i = 0; i < 6; i++){ const a = i * 1.1 + r(), y = h * (.5 + i * .07); s.twigs.push({ a: V(top.x * (y / h), y, top.z * (y / h)), b: V(top.x * (y / h) + Math.cos(a) * .9, y + .5, Math.sin(a) * .9), r: .03, col: P.bark || '#d9d2c4' }); }
        continue;
      }
      {
        const k = (kind === 'alder' ? .7 : .6) + r() * .15;
        s.clumps.push({ x: top.x, y: h * .96, z: top.z, rx: k, ry: k * (kind === 'aspen' ? .95 : .75), rz: k,
          col: C(P.cols[0]), weep: P.weep * .5, berries: null });
      }
      for (let i = 0; i < P.clumps; i++){
        const a = i / P.clumps * Math.PI * 2 + r() * .8, d = (kind === 'aspen' ? .35 : .5) + r() * .7, y = h * (P.low + i / P.clumps * (1 - P.low - .08) + r() * .06);
        const k = (kind === 'alder' ? .75 : kind === 'aspen' ? .7 : .62) + r() * .3;
        s.clumps.push({ x: top.x * (y / h) + Math.cos(a) * d, y, z: top.z * (y / h) + Math.sin(a) * d, rx: k * 1.1, ry: k * (kind === 'aspen' ? .95 : .7), rz: k * 1.1,
          col: C(P.cols[i % P.cols.length]), weep: P.weep, berries: kind === 'rowan' ? (season === 'summer' ? TC.flower : TC.berry) : null });
        if (kind !== 'aspen') s.twigs.push({ a: V(top.x * (y / h), y - .2, top.z * (y / h)), b: V(top.x * (y / h) + Math.cos(a) * d, y, top.z * (y / h) + Math.sin(a) * d), r: .025, col: '#5a5148' });
      }
    }
  }
  return s;
}

// ---------- shared pieces ----------
function trunkGeo(b, t){
  const curve = new THREE.CatmullRomCurve3(t.pts), tube = new THREE.TubeGeometry(curve, 12, t.r0, 7);
  const P = tube.attributes.position, y0 = t.pts[0].y, y1 = t.pts[t.pts.length - 1].y;
  for (let i = 0; i < P.count; i++){
    const k = 1 - (P.getY(i) - y0) / Math.max(.01, y1 - y0) * (1 - t.r1 / t.r0);
    const c = curve.getPoint(Math.min(1, Math.max(0, (P.getY(i) - y0) / Math.max(.01, y1 - y0))));
    P.setX(i, c.x + (P.getX(i) - c.x) * k); P.setZ(i, c.z + (P.getZ(i) - c.z) * k);
  }
  b.add(tube, (c, x, y) => c.copy(col3(t.col(y))));
}
function twigGeo(b, w){
  const d = w.b.clone().sub(w.a), len = d.length(), mid = w.a.clone().add(w.b).multiplyScalar(.5);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()), e = new THREE.Euler().setFromQuaternion(q);
  b.cyl(w.r * .6, w.r, len, w.col, [mid.x, mid.y, mid.z], [e.x, e.y, e.z], 5);
}
/** Cone whose rim droops and wobbles (stubby branch tips). */
function droopCone(r, h, droop, seed, seg = 16){
  const g = new THREE.ConeGeometry(r, h, seg, 2, false), P = g.attributes.position;
  for (let i = 0; i < P.count; i++){
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), rad = Math.hypot(x, z);
    if (rad < 1e-4) continue;
    const a = Math.atan2(z, x), k = rad / r, wob = 1 + .16 * Math.sin(a * 7 + seed) + .08 * Math.sin(a * 13 + seed * 2.3);
    P.setXYZ(i, x * wob, y - droop * k * k, z * wob);
  }
  g.computeVertexNormals();
  return g;
}
function solidParts(spec, b, { tiers = true, tierScale = 1, clumps = false } = {}){
  spec.trunks.forEach(t => trunkGeo(b, t));
  spec.twigs.forEach(w => twigGeo(b, w));
  if (tiers) for (const t of spec.tiers){
    b.add(droopCone(t.r * tierScale, t.h, t.droop * tierScale, t.seed), t.col, [0, t.y + t.h / 2, 0], [0, t.rot, 0]);
    if (spec.season === 'winter') b.add(new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), TC.snow, [0, t.y + t.h * .45, 0], [0, 0, 0], [t.r * tierScale * .72, .3, t.r * tierScale * .72]);
  }
  if (spec.spire) b.cone(.17, spec.spire.h, TC.spruceTop, [0, spec.spire.y, 0], [0, 0, 0], 6);
  if (clumps) for (const c of spec.clumps) b.add(new THREE.IcosahedronGeometry(1, 1), c.col.clone().multiplyScalar(.82), [c.x, c.y, c.z], [0, 0, 0], [c.rx * .62, c.ry * .62, c.rz * .62]);
}

// ---------- style: round ----------
function round(spec){
  const b = new Batch(), r = rng(7);
  solidParts(spec, b);
  for (const c of spec.clumps){
    b.add(new THREE.IcosahedronGeometry(1, 1), c.col, [c.x, c.y, c.z], [r(), r(), r()], [c.rx, c.ry, c.rz]);
    if (c.snow) b.add(new THREE.IcosahedronGeometry(1, 1), TC.snow, [c.x, c.y + c.ry * .5, c.z], [0, 0, 0], [c.rx * .9, c.ry * .35, c.rz * .9]);
    if (c.berries) for (let k = 0; k < 3; k++) b.sphere(.1, c.berries, [c.x + (r() - .5) * c.rx * 1.6, c.y + (r() - .3) * c.ry, c.z + (r() - .5) * c.rz * 1.6], 1, 6);
  }
  return [{ geo: b.geometry(), mat: 'solid' }];
}

// ---------- style: daub ----------
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), Z = V(0, 0, 1);
function daub(spec, o = {}){
  const { count = 1, size = 1, stretch = 1, twoTone = false, maxN = 46 } = o;
  const b = new Batch(), r = rng(11);
  solidParts(spec, b, { tiers: false, clumps: true });
  // Stroke direction per species: birch hangs, pine lies flat, aspen and alder are short round touches.
  const lean = { birch: [0, -1, .2], pine: [1, -.05, 0], aspen: [.3, .5, 0], alder: [.4, .3, 0], rowan: [.5, .2, 0] }[spec.kind] || [1, 0, 0];
  const stretchK = { birch: 2.6, pine: 2.4, aspen: 1.5, alder: 1.6, rowan: 1.8 }[spec.kind] || 2;
  const dab = (pos, n, size, col, stretch = 1) => {
    _q.setFromUnitVectors(Z, n.normalize()); _e.setFromQuaternion(_q);
    b.add(new THREE.CircleGeometry(1, 7), col, [pos.x, pos.y, pos.z], [_e.x, _e.y, _e.z], [size * stretch, size, 1]);
  };
  // A stroke facing roughly along n, with its long axis turned toward the species' stroke direction.
  const dabDir = (pos, n, size, col, stretch, dir) => {
    n.normalize();
    const want = V(...dir).normalize(), along = want.clone().sub(n.clone().multiplyScalar(want.dot(n)));
    if (along.lengthSq() < 1e-4) along.set(1, 0, 0);
    along.normalize();
    const m = new THREE.Matrix4().makeBasis(along, n.clone().cross(along).normalize(), n);
    _q.setFromRotationMatrix(m); _e.setFromQuaternion(_q);
    b.add(new THREE.CircleGeometry(1, 8), col, [pos.x, pos.y, pos.z], [_e.x, _e.y, _e.z], [size * stretch, size, 1]);
  };
  for (const c of spec.clumps){
    const n = Math.round(Math.min(maxN * count, Math.max(14, c.rx * c.ry * c.rz * 30) * count));
    for (let i = 0; i < n; i++){
      const d = V(r() - .5, (r() - .5) * .9 + .15, r() - .5).normalize();
      const p = V(c.x + d.x * c.rx * .9, c.y + d.y * c.ry * .9 - (c.weep || 0) * Math.max(0, -d.y) * .4, c.z + d.z * c.rz * .9);
      const light = d.y * .5 + .5 + (r() - .5) * .3;
      let col = c.col.clone().multiplyScalar(.72 + light * .5).lerp(C('#e9e4c8'), Math.max(0, light - .85) * .6);
      if (twoTone){
        // Broken colour: shadow side leans blue-violet, sun side leans warm yellow, like plein-air brushwork.
        col = light < .45 ? col.multiplyScalar(.8).lerp(C('#4a5a78'), .25) : col.lerp(C('#e8d48a'), Math.max(0, light - .6) * .45);
        col.offsetHSL((r() - .5) * .04, 0, (r() - .5) * .06);
      }
      if (twoTone && i % 3 === 0) p.multiplyScalar(1).sub(V(d.x * c.rx * .15, d.y * c.ry * .15, d.z * c.rz * .15));
      dabDir(p, d.clone().add(V((r() - .5) * .6, .35, (r() - .5) * .6)), (.3 + r() * .2) * size, c.snow && d.y > .3 ? C(TC.snow) : col, stretchK * stretch * (.8 + r() * .4), lean);
    }
    if (c.berries) for (let k = 0; k < 4; k++) b.sphere(.09, c.berries, [c.x + (r() - .5) * c.rx * 1.6, c.y + (r() - .3) * c.ry, c.z + (r() - .5) * c.rz * 1.6], 1, 6);
  }
  for (const t of spec.tiers){
    // A dark core cone, then a ring of long dabs hanging off the rim like drooping branches.
    b.add(droopCone(t.r * .72, t.h, t.droop * .6, t.seed, 10), t.col.clone().multiplyScalar(.8), [0, t.y + t.h / 2, 0], [0, t.rot, 0]);
    const n = Math.round((8 + t.r * 7) * count);
    for (let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2 + r() * .3, rr = t.r * (.7 + r() * .3);
      const p = V(Math.cos(a) * rr, t.y + t.h * .25 - t.droop * .55, Math.sin(a) * rr);
      const out = V(Math.cos(a), .9, Math.sin(a));
      const col = t.col.clone().multiplyScalar(.85 + r() * .35 + (Math.cos(a - 1) * .12));
      p.y += (r() - .5) * t.h * (count > 1.5 ? .6 : 0);
      dabDir(p, out, (.24 + t.r * .16) * size, spec.season === 'winter' && r() < .55 ? C(TC.snow) : col, 2.2 * stretch, [Math.cos(a), -.8, Math.sin(a)]);
    }
  }
  return [{ geo: b.geometry(), mat: 'solid2' }];
}

// ---------- style: brush cards ----------
let BRUSH = null;
/** Two brush-stroke alpha textures, painted once on a canvas: leafy dabs and drooping needle sprays. */
function brushTextures(){
  if (BRUSH) return BRUSH;
  const make = (draw) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
    draw(g, rng(5));
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; return t;
  };
  const leaf = make((g, r) => {
    for (let i = 0; i < 16; i++){
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 40, x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d * .85, s = 9 + r() * 12;
      g.beginPath(); g.ellipse(x, y, s, s * (.55 + r() * .35), r() * 3, 0, Math.PI * 2); g.fill();
    }
    for (let i = 0; i < 22; i++){ const a = r() * Math.PI * 2, d = 44 + r() * 14; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d * .85, 2 + r() * 4, 0, 7); g.fill(); }
  });
  const spray = make((g, r) => {
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++){
      const x0 = 64 + (r() - .5) * 12, len = 40 + r() * 55, a = Math.PI / 2 + (r() - .5) * 1.5;
      g.lineWidth = 3 + r() * 5; g.beginPath(); g.moveTo(x0, 10 + r() * 8);
      g.quadraticCurveTo(x0 + Math.cos(a) * len * .5, 10 + Math.sin(a) * len * .4, x0 + Math.cos(a) * len, 10 + Math.sin(a) * len); g.stroke();
    }
  });
  // Finer leaf texture: many small dabs with more holes between them.
  const leafFine = make((g, r) => {
    for (let i = 0; i < 46; i++){
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 50, s = 4 + r() * 6;
      g.beginPath(); g.ellipse(64 + Math.cos(a) * d, 64 + Math.sin(a) * d * .85, s, s * (.5 + r() * .4), r() * 3, 0, Math.PI * 2); g.fill();
    }
  });
  // Dry brush: a few fat strokes dragged sideways, broken by the paper texture.
  const dry = make((g, r) => {
    g.lineCap = 'round';
    for (let i = 0; i < 9; i++){
      const y = 22 + i * 10 + (r() - .5) * 6, x0 = 14 + r() * 20, x1 = 100 + r() * 20;
      for (let k = 0; k < 7; k++){
        g.lineWidth = 1.5 + r() * 2.5; g.globalAlpha = .75 + r() * .25;
        g.beginPath(); g.moveTo(x0 + r() * 8, y + (r() - .5) * 7); g.quadraticCurveTo(64, y - 6 + (r() - .5) * 8, x1 - r() * 14, y + (r() - .5) * 7); g.stroke();
      }
    }
    g.globalAlpha = 1;
  });
  const sprayDry = make((g, r) => {
    g.lineCap = 'round';
    for (let i = 0; i < 40; i++){
      const x0 = 64 + (r() - .5) * 8, len = 45 + r() * 60, a = Math.PI / 2 + (r() - .5) * 1.7;
      g.lineWidth = 1.5 + r() * 2.5; g.beginPath(); g.moveTo(x0, 8 + r() * 6);
      g.lineTo(x0 + Math.cos(a) * len, 8 + Math.sin(a) * len); g.stroke();
    }
  });
  return (BRUSH = { leaf, spray, leafFine, dry, sprayDry });
}
function cardGeo(cards){
  const n = cards.length, pos = new Float32Array(n * 12), nor = new Float32Array(n * 12), uv = new Float32Array(n * 8), col = new Float32Array(n * 12), idx = [];
  const corners = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], tmp = V(0, 0, 0);
  cards.forEach((c, i) => {
    corners.forEach(([u, v], k) => {
      tmp.set(u * c.w, v * c.h, 0).applyQuaternion(c.q).add(c.p);
      pos.set([tmp.x, tmp.y, tmp.z], (i * 4 + k) * 3);
      nor.set([c.n.x, c.n.y, c.n.z], (i * 4 + k) * 3);
      uv.set([u + .5, v + .5], (i * 4 + k) * 2);
      col.set([c.col.r, c.col.g, c.col.b], (i * 4 + k) * 3);
    });
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
function brush(spec, o = {}){
  const { count = 1, size = 1, tex = 'leaf', sprayTex = 'spray', flatten = 1 } = o;
  const b = new Batch(), r = rng(13), leaves = [], sprays = [];
  solidParts(spec, b, { tiers: true, tierScale: .7, clumps: true });
  const randQ = () => new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28));
  for (const c of spec.clumps){
    const n = Math.round(Math.min(26 * count, Math.max(8, c.rx * c.rz * 9) * count));
    for (let i = 0; i < n; i++){
      const d = V(r() - .5, (r() - .5) * .8 + .1, r() - .5).normalize(), k = .55 + r() * .4;
      const p = V(c.x + d.x * c.rx * k, c.y + d.y * c.ry * k - (c.weep || 0) * Math.max(0, -d.y) * .5, c.z + d.z * c.rz * k);
      const nrm = V(d.x, d.y + .35, d.z).normalize(), s = (c.rx + c.ry) * (.55 + r() * .25) * size;
      const light = d.y * .5 + .5;
      const col = c.snow && d.y > .25 ? C(TC.snow) : c.col.clone().multiplyScalar(.82 + light * .32 + (r() - .5) * .12);
      // flatten < 1 tips the cards toward horizontal, like flat sideways brush marks.
      const q = flatten < 1 ? new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 * (1 - flatten) + (r() - .5) * .6, r() * 6.28, (r() - .5) * .5)) : randQ();
      leaves.push({ p, q, n: nrm, w: s, h: s * (c.flat ? .7 : 1), col });
    }
  }
  for (const t of spec.tiers){
    const n = Math.round((9 + t.r * 6) * count);
    for (let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2 + r() * .4, rr = t.r * .5;
      const p = V(Math.cos(a) * rr, t.y + t.h * .2, Math.sin(a) * rr);
      // A card standing outward from the trunk and tipped down, so the spray hangs like a branch.
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -a + Math.PI / 2, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.35 - t.droop * .4, 0, 0)));
      const nrm = V(Math.cos(a), .8, Math.sin(a)).normalize();
      const col = spec.season === 'winter' && r() < .5 ? C(TC.snow) : t.col.clone().multiplyScalar(.9 + r() * .3);
      if (count > 1.5) p.y += (r() - .5) * t.h * .5;
      sprays.push({ p, q, n: nrm, w: t.r * 1.15 * size, h: t.r * 1.25 * size, col });
    }
  }
  const out = [{ geo: b.geometry(), mat: 'solid' }];
  if (leaves.length) out.push({ geo: cardGeo(leaves), mat: 'card', tex });
  if (sprays.length) out.push({ geo: cardGeo(sprays), mat: 'card', tex: sprayTex });
  return out;
}

// ---------- style: cutout ----------
/** Paint the spec's silhouette onto a canvas (side view), in two values per mass, and return a flat card. */
function cutout(spec){
  const r = rng(17), ppm = 48;
  let minX = -1, maxX = 1;
  for (const c of spec.clumps){ minX = Math.min(minX, c.x - c.rx); maxX = Math.max(maxX, c.x + c.rx); }
  for (const t of spec.tiers){ minX = Math.min(minX, -t.r * 1.1); maxX = Math.max(maxX, t.r * 1.1); }
  for (const t of spec.trunks) for (const p of t.pts){ minX = Math.min(minX, p.x - .3); maxX = Math.max(maxX, p.x + .3); }
  const H = spec.H + 1.2, W = maxX - minX + .4;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(W * ppm); cv.height = Math.ceil(H * ppm);
  const g = cv.getContext('2d');
  const X = x => (x - minX + .2) * ppm, Y = y => (H - y) * ppm;
  const hex = c => '#' + c.getHexString();
  // Trunks as tapered strokes.
  for (const t of spec.trunks){
    const n = t.pts.length;
    for (let i = 0; i < n - 1; i++){
      const a = t.pts[i], b = t.pts[i + 1], k = i / (n - 1);
      g.strokeStyle = hex(col3(t.col(a.y))); g.lineCap = 'round'; g.lineWidth = Math.max(2, (t.r0 * (1 - k) + t.r1 * k) * 2 * ppm);
      g.beginPath(); g.moveTo(X(a.x), Y(a.y)); g.lineTo(X(b.x), Y(b.y)); g.stroke();
    }
  }
  for (const w of spec.twigs){ g.strokeStyle = typeof w.col === 'string' ? w.col : hex(w.col); g.lineWidth = Math.max(1.5, w.r * 2 * ppm); g.beginPath(); g.moveTo(X(w.a.x), Y(w.a.y)); g.lineTo(X(w.b.x), Y(w.b.y)); g.stroke(); }
  // Spruce tiers: drooping jagged skirts, dark underneath and a lighter upper edge.
  for (const t of spec.tiers){
    const pts = [], n = 18;
    for (let i = 0; i <= n; i++){
      const u = i / n * 2 - 1, x = u * t.r * (1 + .12 * Math.sin(i * 2.7 + t.seed)), drop = t.droop * u * u + (i % 2) * .16;
      pts.push([x, t.y - drop]);
    }
    g.fillStyle = hex(t.col.clone().multiplyScalar(.8));
    g.beginPath(); g.moveTo(X(0), Y(t.y + t.h)); pts.forEach(([x, y]) => g.lineTo(X(x), Y(y))); g.closePath(); g.fill();
    g.fillStyle = hex(t.col.clone().multiplyScalar(1.15));
    g.beginPath(); g.moveTo(X(0), Y(t.y + t.h)); g.lineTo(X(t.r * .55), Y(t.y + t.h * .25)); g.lineTo(X(t.r * .1), Y(t.y + t.h * .35)); g.closePath(); g.fill();
    if (spec.season === 'winter'){
      g.fillStyle = TC.snow; g.beginPath(); g.moveTo(X(0), Y(t.y + t.h)); g.lineTo(X(t.r * .7), Y(t.y + t.h * .18));
      g.quadraticCurveTo(X(0), Y(t.y + t.h * .5), X(-t.r * .7), Y(t.y + t.h * .18)); g.closePath(); g.fill();
    }
  }
  if (spec.spire){ g.fillStyle = TC.spruceTop; g.beginPath(); g.moveTo(X(0), Y(spec.spire.y + spec.spire.h * .6)); g.lineTo(X(.2), Y(spec.spire.y - .4)); g.lineTo(X(-.2), Y(spec.spire.y - .4)); g.fill(); }
  // Crown masses: a ragged blob in the shadow value, then lighter dabs on the upper sun side.
  const blob = (cx, cy, rx, ry, col, n = 22, rag = .22) => {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i <= n; i++){ const a = i / n * Math.PI * 2, k = 1 + (r() - .5) * rag * 2; g.lineTo(X(cx + Math.cos(a) * rx * k), Y(cy + Math.sin(a) * ry * k)); }
    g.fill();
  };
  const sorted = [...spec.clumps].sort((a, b) => b.z - a.z);
  for (const c of sorted){
    blob(c.x, c.y - (c.weep || 0) * .2, c.rx, c.ry * (c.flat ? .9 : 1), hex(c.col.clone().multiplyScalar(.72)), 26, c.flat ? .18 : .3);
    for (let k = 0; k < 5; k++) blob(c.x + (r() - .3) * c.rx * .6, c.y + c.ry * (.15 + r() * .35), c.rx * (.25 + r() * .2), c.ry * (.2 + r() * .15), hex(c.col.clone().multiplyScalar(1.02 + r() * .2)), 12, .3);
    if (c.snow) blob(c.x, c.y + c.ry * .55, c.rx * .85, c.ry * .3, TC.snow, 16, .2);
    if (c.berries) for (let k = 0; k < 5; k++){ g.fillStyle = c.berries; g.beginPath(); g.arc(X(c.x + (r() - .5) * c.rx * 1.4), Y(c.y + (r() - .5) * c.ry), 3, 0, 7); g.fill(); }
    // Weeping birch: a few hanging strokes below the clump.
    if (c.weep > .3){ g.strokeStyle = hex(c.col.clone().multiplyScalar(.8)); g.lineWidth = 2; for (let k = 0; k < 6; k++){ const x = c.x + (r() - .5) * c.rx * 1.6; g.beginPath(); g.moveTo(X(x), Y(c.y - c.ry * .3)); g.lineTo(X(x + (r() - .5) * .2), Y(c.y - c.ry * (1 + r() * .8))); g.stroke(); } }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const geo = new THREE.PlaneGeometry(W, H); geo.translate((minX + maxX) / 2, H / 2 - .2, 0);
  // Normals tipped up a little, so the flats take sky light like the ground does.
  const N = geo.attributes.normal; for (let i = 0; i < N.count; i++) N.setXYZ(i, 0, .45, .89);
  return [{ geo, mat: 'cutout', tex, billboard: true }];
}

function facet(spec){
  const b = new Batch(), r = rng(19);
  spec.trunks.forEach(t => trunkGeo(b, t));
  spec.twigs.forEach(w => twigGeo(b, w));
  for (const t of spec.tiers){
    // Few-sided drooping tiers with sharp tips, like a woodcut.
    const g = droopCone(t.r * 1.05, t.h * 1.1, t.droop * 1.2, t.seed, 6 + Math.floor(r() * 2));
    b.add(g.toNonIndexed(), t.col, [0, t.y + t.h / 2, 0], [0, t.rot, 0]);
    if (spec.season === 'winter') b.add(new THREE.ConeGeometry(t.r * .8, t.h * .45, 6), TC.snow, [0, t.y + t.h * .62, 0], [0, t.rot, 0]);
  }
  if (spec.spire) b.cone(.2, spec.spire.h, TC.spruceTop, [0, spec.spire.y, 0], [0, 0, 0], 5);
  for (const c of spec.clumps){
    const g = c.flat ? new THREE.CylinderGeometry(1, .75, 1, 6) : new THREE.DodecahedronGeometry(1, 0);
    b.add(g, c.col, [c.x, c.y, c.z], [0, r() * 6, 0], [c.rx, c.flat ? c.ry * .8 : c.ry, c.rz]);
    if (c.snow) b.add(new THREE.CylinderGeometry(.95, .95, .2, 6), TC.snow, [c.x, c.y + c.ry * .45, c.z], [0, 0, 0], [c.rx, 1, c.rz]);
    if (c.berries) for (let k = 0; k < 3; k++) b.add(new THREE.OctahedronGeometry(.11), c.berries, [c.x + (r() - .5) * c.rx * 1.6, c.y + (r() - .3) * c.ry, c.z + (r() - .5) * c.rz * 1.6]);
  }
  return [{ geo: b.geometry(), mat: 'flat' }];
}

export const STYLES = {
  round, cutout, facet,
  'brush-a': s => brush(s),
  'brush-b': s => brush(s, { count: .5, size: 1.6 }),
  'brush-c': s => brush(s, { count: 2.4, size: .55, tex: 'leafFine' }),
  'brush-d': s => brush(s, { count: 1.3, size: 1.05, tex: 'dry', sprayTex: 'sprayDry', flatten: .35 }),
  'daub-a': s => daub(s),
  'daub-b': s => daub(s, { count: 3, size: .5 }),
  'daub-c': s => daub(s, { count: 5, size: .33, stretch: .45, maxN: 60 }),
  'daub-d': s => daub(s, { count: 3, size: .5, twoTone: true }),
};
STYLES.brush = STYLES['brush-a']; STYLES.daub = STYLES['daub-a'];
export const STYLE_NAMES = { 'daub-b': '粒子 B 小笔触', 'daub-d': '粒子 D 冷暖' };

// ---------- wind ----------
/** Shared uniforms: time and strength of the wind that sways trunks and flutters leaves. */
export const WIND = { uWindTime: { value: 0 }, uWind: { value: 1 } };
const STIFF = { spruce: .45, pine: .7, birch: 1.2, aspen: 1.1, alder: .9, rowan: 1 };
/** Sway the whole tree from the base (more toward the top), and flutter the crown a little faster. */
export function windify(mat, stiff = 1, leaf = 1){
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, WIND, { uStiff: { value: stiff }, uLeaf: { value: leaf } });
    sh.vertexShader = 'uniform float uWindTime, uWind, uStiff, uLeaf;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ip = vec3(instanceMatrix[3]);
      #else
        vec3 ip = vec3(0.);
      #endif
      float hgt = max(position.y - 1.0, 0.);
      float sway = sin(uWindTime * 1.25 + ip.x * .21 + ip.z * .17) * .65 + sin(uWindTime * 2.3 + ip.x * .5 + ip.z * .3) * .35;
      transformed.x += sway * hgt * hgt * .0045 * uWind * uStiff;
      transformed.z += sway * hgt * hgt * .0022 * uWind * uStiff;
      float fl = sin(uWindTime * 6.5 + position.x * 9. + position.z * 7. + position.y * 5. + ip.x);
      transformed += vec3(fl, fl * .45, -fl * .8) * .028 * uWind * uLeaf * uStiff * smoothstep(1.8, 3.5, position.y);`);
  };
  mat.customProgramCacheKey = () => 'wind' + stiff + '_' + leaf;
  return mat;
}

/** Materials for a style; textures from cutout parts get their own material. */
export function treeMaterial(kind, part){
  const st = STIFF[kind] ?? 1;
  if (part.mat === 'solid') return windify(new THREE.MeshLambertMaterial({ vertexColors: true }), st, .6);
  if (part.mat === 'solid2') return windify(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), st, 1);
  if (part.mat === 'flat') return new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const B = brushTextures();
  if (part.mat === 'card') return new THREE.MeshLambertMaterial({ vertexColors: true, alphaMap: B[part.tex], alphaTest: .5, side: THREE.DoubleSide });
  return new THREE.MeshLambertMaterial({ map: part.tex, alphaTest: .5, side: THREE.DoubleSide });
}
