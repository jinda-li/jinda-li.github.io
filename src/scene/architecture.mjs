// Buildings: lakeside sauna, cottage, woodshed, outhouse and well.
// Each is built in local space with the roof ridge along x and the front facing +z, then placed.
// Meshes of man-made things carry userData.ink so the watercolour pass draws ink lines only on them.
import * as THREE from 'three';
import { Batch, vcMat, rng, vary } from './kit.mjs';

export const AC = {
  log: '#918778', log2: '#857b6e', logEnd: '#b3a690', logDark: '#5d564e',
  felt: '#3f3c3a', feltRib: '#2f2d2c', stone: '#8e8781', stone2: '#a29a92',
  red: '#8f2c22', redBatten: '#7a251d', trim: '#f0ece2', metalRed: '#6e2a24', metalSeam: '#5a2220',
  brick: '#9a5040', door: '#4c3a2c', doorBlue: '#3e5d6c', plank: '#9a9184', plankDark: '#6f675d',
  steel: '#c9ccd0', wood: '#b08a5c', woodEnd: '#d7b98c', glassDark: '#1e2838',
  snow: '#f3f5f8',
};

const ink = m => { m.userData.ink = true; return m; };

/** Gable roof with the ridge along x. Returns the rise. */
function gableRoof(b, { span, len, h, pitch, side = .35, end0 = .3, end1 = .3, thick = .12, color, rib, ribEvery = .5, snow }){
  const rise = (span / 2) * Math.tan(pitch), half = span / 2 + side;
  const slope = half / Math.cos(pitch), L = len + end0 + end1, cx = (end1 - end0) / 2;
  for (const s of [-1, 1]){
    const cz = s * half / 2, cy = h + rise - (half / 2) * Math.tan(pitch) + thick / 2 / Math.cos(pitch);
    b.box(L, thick, slope, color, [cx, cy, cz], [s * pitch, 0, 0], .02);
    if (rib) for (let x = -L / 2 + ribEvery / 2; x < L / 2; x += ribEvery)
      b.box(.05, .05, slope - .02, rib, [cx + x, cy + thick / 2 + .02, cz], [s * pitch, 0, 0]);
    if (snow) snow.box(L + .06, .32, slope + .08, AC.snow, [cx, cy + .2, cz], [s * pitch, 0, 0], .14);
  }
  b.box(L + .02, .1, .22, rib || color, [cx, h + rise + thick, 0], [0, 0, 0], .03);
  return rise;
}
/** Triangular gable wall at local x, facing +-x. */
function gableWall(b, { span, h, rise, x, color, depth = .1 }){
  const shape = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  b.add(g, color, [x - depth / 2, h, 0], [0, Math.PI / 2, 0]);
}
/** Window on a wall. axis 'z': wall facing +z/-z (s); axis 'x': facing +x/-x. Cross muntins by default. */
function windowAt(b, glass, { x, y, z, w = .9, h = 1.2, axis = 'z', s = 1, frame = AC.trim, cross = true, sill = true }){
  const t = .08, out = .04;
  const P = (u, v, o = 0) => axis === 'z' ? [x + u, y + v, z + s * (out + o)] : [x + s * (out + o), y + v, z + u];
  const R = axis === 'z' ? [0, 0, 0] : [0, Math.PI / 2, 0];
  b.box(w + t * 2, t, .07, frame, P(0, h / 2 + t / 2), R);
  b.box(t, h, .07, frame, P(-w / 2 - t / 2, 0), R);
  b.box(t, h, .07, frame, P(w / 2 + t / 2, 0), R);
  if (sill) b.box(w + t * 2 + .1, t, .16, frame, P(0, -h / 2 - t / 2, .04), R);
  else b.box(w + t * 2, t, .07, frame, P(0, -h / 2 - t / 2), R);
  if (cross){ b.box(.05, h, .05, frame, P(0, 0, .01), R); b.box(w, .05, .05, frame, P(0, 0, .01), R); }
  glass.box(w, h, .02, '#ffffff', P(0, 0, -.025), R);
}

// ---------- sauna ----------
export function sauna(){
  const g = new THREE.Group(), b = new Batch(), glass = new Batch(), snow = new Batch(), r = rng(17);
  const LEN = 4.4, SPAN = 3.0, H = 2.0, R = .11, base = .26, step = R * 1.86;
  // Stone piers under the corners and the middle.
  // Each pier is a stack of two or three stones, the lowest sunk into the rock, so the house sits rather than floats.
  for (const [x, z] of [[-2.1, -1.4], [2.1, -1.4], [-2.1, 1.4], [2.1, 1.4], [0, -1.4], [0, 1.4]]){
    b.sphere(.3, vary(AC.stone, r, .12), [x, .02, z], [1.2, .75, 1.1], 7);
    b.sphere(.38, vary(AC.stone, r, .14), [x + .04, -.36, z - .03], [1.25, .8, 1.15], 7);
    b.sphere(.46, vary(AC.stone, r, .16), [x - .05, -.8, z + .04], [1.3, .85, 1.2], 7);
  }
  // A dark crawl space between the piers instead of daylight.
  b.box(LEN - .5, .5, SPAN - .5, '#3a3631', [0, -.12, 0]);
  // Silver log walls; long walls and end walls alternate by half a log so the saddle notches interlock.
  const n = Math.floor((H - base) / step);
  for (let i = 0; i < n; i++){
    const y = base + R + i * step, col = () => vary(i % 2 ? AC.log : AC.log2, r, .1);
    for (const s of [-1, 1]){
      b.cyl(R, R, LEN + .55, col(), [0, y, s * SPAN / 2], [0, 0, Math.PI / 2], 9);
      b.cyl(R, R, SPAN + .55, col(), [s * LEN / 2, y + step / 2, 0], [Math.PI / 2, 0, 0], 9);
      for (const e of [-1, 1]){
        b.cyl(R * .92, R * .92, .02, vary(AC.logEnd, r, .1), [e * (LEN / 2 + .275), y, s * SPAN / 2], [0, 0, Math.PI / 2], 9);
        b.cyl(R * .92, R * .92, .02, vary(AC.logEnd, r, .1), [s * LEN / 2, y + step / 2, e * (SPAN / 2 + .275)], [Math.PI / 2, 0, 0], 9);
      }
    }
  }
  b.box(LEN - .1, H - base, SPAN - .1, AC.log2, [0, base + (H - base) / 2, 0]);
  const rise = gableRoof(b, { span: SPAN, len: LEN, h: H, pitch: .6, side: .4, end0: .35, end1: .85, color: AC.felt, rib: AC.feltRib, ribEvery: .55, snow });
  // Gables: weathered vertical boards.
  for (const x of [-LEN / 2, LEN / 2]){
    gableWall(b, { span: SPAN + .1, h: H, rise, x, color: AC.log2 });
    for (let u = -SPAN / 2 + .2; u < SPAN / 2; u += .2){
      const top = rise * (1 - Math.abs(u) / (SPAN / 2));
      if (top > .1) b.box(.03, top - .05, .03, AC.logDark, [x + Math.sign(x) * .06, H + top / 2, u]);
    }
  }
  // Lake gable (+x): a small low horizontal window.
  windowAt(b, glass, { x: LEN / 2 + .1, y: 1.05, z: -.35, w: .7, h: .42, axis: 'x', s: 1, frame: '#6b5a48', cross: false, sill: false });
  // East side (+z): open porch under an extended roof, low plank door, bench, bucket and ladle, towel rail.
  b.box(1.9, .1, 1.5, AC.plank, [-.9, base - .02, SPAN / 2 + .78], [0, 0, 0], .02);
  for (let i = 0; i < 6; i++) b.box(.02, .012, 1.5, AC.plankDark, [-1.8 + i * .32, base + .035, SPAN / 2 + .78]);
  for (const x of [-1.8, .0]) b.box(.12, 1.9, .12, AC.log2, [x, base + .95, SPAN / 2 + 1.42]);
  const prise = .55;
  b.box(2.2, .1, 1.75, AC.felt, [-.9, H + .02 + prise / 2, SPAN / 2 + .85], [-.3, 0, 0], .02);
  b.box(.74, 1.66, .08, AC.door, [-.45, base + .85, SPAN / 2 + .1]);
  for (let i = 0; i < 4; i++) b.box(.02, 1.62, .03, '#3d2e23', [-.72 + i * .18, base + .85, SPAN / 2 + .15]);
  b.box(.62, .07, .03, '#3d2e23', [-.45, base + .4, SPAN / 2 + .16]); b.box(.62, .07, .03, '#3d2e23', [-.45, base + 1.3, SPAN / 2 + .16]);
  b.box(.08, .04, .05, AC.steel, [-.15, base + .85, SPAN / 2 + .19]);
  b.box(1.0, .07, .36, AC.wood, [-1.45, base + .48, SPAN / 2 + .4]);
  for (const x of [-1.85, -1.05]) b.box(.07, .44, .3, AC.wood, [x, base + .24, SPAN / 2 + .4]);
  b.cyl(.15, .12, .24, '#a87c4f', [-1.2, base + .64, SPAN / 2 + .42], [0, 0, 0], 12);
  b.cyl(.155, .155, .03, AC.steel, [-1.2, base + .76, SPAN / 2 + .42], [0, 0, 0], 12);
  b.cyl(.012, .012, .55, '#a87c4f', [-1.0, base + .8, SPAN / 2 + .42], [0, 0, .7], 5);
  b.box(1.1, .03, .03, AC.wood, [-.9, base + 1.6, SPAN / 2 + 1.35]);
  b.box(.42, .55, .02, '#d9604c', [-1.3, base + 1.33, SPAN / 2 + 1.36]); b.box(.36, .48, .02, '#e8c45a', [-.75, base + 1.36, SPAN / 2 + 1.36]);
  // Lifebuoy on the lake-facing corner.
  b.add(new THREE.TorusGeometry(.26, .07, 8, 20), (c, x, y) => c.set(Math.floor((Math.atan2(y - 1.25, x - 1.4) + Math.PI) / (Math.PI / 2)) % 2 ? '#f0ece4' : '#e0573a'), [1.4, 1.25, SPAN / 2 + .14]);
  // Slim metal flue with a spark cap on the back slope.
  b.cyl(.08, .08, 1.5, '#4a4d52', [-1.2, H + rise * .4 + .55, -.6], [0, 0, 0], 8);
  b.cyl(.15, .12, .14, '#4a4d52', [-1.2, H + rise * .4 + 1.35, -.6], [0, 0, 0], 8);
  // Firewood stacked against the back wall.
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++)
    b.cyl(.075, .075, .5, vary(AC.woodEnd, r, .12), [-1.6 + i * .16 + (row % 2) * .08, base + .08 + row * .14, -SPAN / 2 - .4], [Math.PI / 2, 0, 0], 6);
  const body = ink(b.mesh(vcMat())); g.add(body);
  const gm = new THREE.MeshBasicMaterial({ color: AC.glassDark }), gl = glass.mesh(gm); gl.castShadow = false; g.add(gl);
  const sn = snow.mesh(vcMat()); sn.visible = false; g.add(sn);
  g.userData = { body, glass: gm, snow: sn, flue: new THREE.Vector3(-1.2, H + rise * .4 + 1.45, -.6), door: new THREE.Vector3(-.45, 1.4, SPAN / 2 + .6), stove: new THREE.Vector3(.4, H + .5, 0) };
  return g;
}

// ---------- cottage ----------
export function cottage(){
  const g = new THREE.Group(), b = new Batch(), glass = new Batch(), snow = new Batch(), r = rng(23);
  const LEN = 7.0, SPAN = 5.5, H = 2.7, base = .48;
  // Fieldstone plinth.
  b.box(LEN + .2, base, SPAN + .2, '#7d7670', [0, base / 2 - .05, 0], [0, 0, 0], .04);
  for (let i = 0; i < 26; i++){ const u = (i / 26) * 2 - 1, side = i % 2 ? 1 : -1; b.sphere(.16, vary(AC.stone2, r, .15), [u * LEN / 2, .2 + r() * .15, side * (SPAN / 2 + .1)], [1.4, .8, .5], 6); }
  // Red board-and-batten walls.
  b.box(LEN, H - base, SPAN, AC.red, [0, base + (H - base) / 2, 0]);
  for (let x = -LEN / 2 + .3; x < LEN / 2 - .1; x += .32){
    b.box(.06, H - base - .05, .03, vary(AC.redBatten, r, .06), [x, base + (H - base) / 2, SPAN / 2 + .015]);
    b.box(.06, H - base - .05, .03, vary(AC.redBatten, r, .06), [x, base + (H - base) / 2, -SPAN / 2 - .015]);
  }
  for (let z = -SPAN / 2 + .3; z < SPAN / 2 - .1; z += .32) for (const s of [-1, 1])
    b.box(.03, H - base - .05, .06, vary(AC.redBatten, r, .06), [s * (LEN / 2 + .015), base + (H - base) / 2, z]);
  // White trim: corner boards and fascia.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.16, H - base + .02, .16, AC.trim, [sx * LEN / 2, base + (H - base) / 2, sz * SPAN / 2]);
  for (const sz of [-1, 1]) b.box(LEN + .1, .14, .06, AC.trim, [0, H - .05, sz * (SPAN / 2 + .04)]);
  const rise = gableRoof(b, { span: SPAN, len: LEN, h: H, pitch: .56, side: .45, end0: .35, end1: .35, color: AC.metalRed, rib: AC.metalSeam, ribEvery: .45, snow });
  for (const x of [-LEN / 2, LEN / 2]){
    gableWall(b, { span: SPAN, h: H, rise, x, color: AC.red });
    for (const s of [-1, 1]){                                         // white bargeboards
      const half = SPAN / 2 + .45, L = half / Math.cos(.56);
      b.box(.06, .16, L, AC.trim, [x + Math.sign(x) * .4, H + rise - half / 2 * Math.tan(.56) + .1, s * half / 2], [s * .56, 0, 0]);
    }
    windowAt(b, glass, { x: x + Math.sign(x) * .05, y: H + rise * .42, z: 0, w: .55, h: .55, axis: 'x', s: Math.sign(x) });
  }
  // Windows: two on the lake side, one on each gable end, one at the back.
  windowAt(b, glass, { x: -2.25, y: 1.55, z: SPAN / 2, w: .95, h: 1.25 });
  windowAt(b, glass, { x: 2.25, y: 1.55, z: SPAN / 2, w: .95, h: 1.25 });
  windowAt(b, glass, { x: LEN / 2, y: 1.55, z: -1.0, w: .9, h: 1.15, axis: 'x', s: 1 });
  windowAt(b, glass, { x: -LEN / 2, y: 1.55, z: .8, w: .9, h: 1.15, axis: 'x', s: -1 });
  windowAt(b, glass, { x: 1.2, y: 1.55, z: -SPAN / 2, w: .9, h: 1.15, s: -1 });
  // Door and porch (kuisti) with a slatted railing, steps and its own small gable roof.
  b.box(1.0, 2.0, .08, AC.trim, [0, base + 1.0, SPAN / 2 + .03]);
  b.box(.84, 1.88, .06, AC.doorBlue, [0, base + .95, SPAN / 2 + .07]);
  windowAt(b, glass, { x: 0, y: base + 1.45, z: SPAN / 2 + .06, w: .5, h: .5, cross: false, sill: false, frame: AC.trim });
  b.sphere(.04, '#d8c08a', [.3, base + .95, SPAN / 2 + .12], 1, 6);
  const PW = 3.2, PD = 1.9, PZ = SPAN / 2 + PD / 2;
  b.box(PW, .12, PD, AC.plank, [0, base - .02, PZ], [0, 0, 0], .02);
  for (let i = 0; i < 10; i++) b.box(.02, .01, PD, AC.plankDark, [-PW / 2 + .16 + i * .32, base + .045, PZ]);
  for (const sx of [-1, 1]){
    b.box(.13, 2.15, .13, AC.trim, [sx * (PW / 2 - .1), base + 1.07, SPAN / 2 + PD - .1]);
    b.box(.07, .07, PD - .2, AC.trim, [sx * (PW / 2 - .1), base + .92, SPAN / 2 + PD / 2]);
    for (let i = 0; i < 9; i++) b.box(.05, .8, .05, AC.trim, [sx * (PW / 2 - .1), base + .5, SPAN / 2 + .15 + i * .2]);
  }
  for (const sx of [-1, 1]){
    b.box(.95, .07, .07, AC.trim, [sx * 1.1, base + .92, SPAN / 2 + PD - .1]);
    for (let i = 0; i < 6; i++) b.box(.05, .8, .05, AC.trim, [sx * (.7 + i * .15), base + .5, SPAN / 2 + PD - .1]);
  }
  for (let i = 0; i < 3; i++) b.box(1.2, .12, .34, AC.plank, [0, base - .14 - i * .14, SPAN / 2 + PD + .17 + i * .3], [0, 0, 0], .02);
  const porch = new Batch();
  const porchSnow = new Batch();
  gableRoof(porch, { span: PW, len: PD + .3, h: base + 2.2, pitch: .5, side: .2, end0: 0, end1: .25, color: AC.metalRed, rib: AC.metalSeam, ribEvery: .45, snow: porchSnow });
  porch.parts.forEach(p => { p.rotateY(Math.PI / 2); p.translate(0, 0, PZ); });
  porchSnow.parts.forEach(p => { p.rotateY(Math.PI / 2); p.translate(0, 0, PZ); }); snow.parts.push(...porchSnow.parts);
  b.parts.push(...porch.parts);
  gableWall(b, { span: PW, h: base + 2.2, rise: (PW / 2) * Math.tan(.5), x: 0, color: AC.trim, depth: .06 });
  b.parts[b.parts.length - 1].rotateY(Math.PI / 2); b.parts[b.parts.length - 1].translate(0, 0, SPAN / 2 + PD + .02);
  // Pots of red geraniums by the steps.
  for (const sx of [-1, 1]){ b.cyl(.14, .1, .22, '#b4643c', [sx * .85, base + .17, SPAN / 2 + PD - .25], [0, 0, 0], 10); b.sphere(.17, '#c8323a', [sx * .85, base + .38, SPAN / 2 + PD - .25], [1, .7, 1], 8); }
  // Brick chimney near the ridge with a metal cap.
  b.box(.55, 1.5, .55, AC.brick, [-1.3, H + rise - .1, -.4], [0, 0, 0], .02);
  b.box(.66, .07, .66, '#5e5f62', [-1.3, H + rise + .7, -.4]);
  b.box(.5, .2, .5, '#5e5f62', [-1.3, H + rise + .82, -.4]);
  const body = ink(b.mesh(vcMat())); g.add(body);
  const gm = new THREE.MeshBasicMaterial({ color: AC.glassDark }), gl = glass.mesh(gm); gl.castShadow = false; g.add(gl);
  const sn = snow.mesh(vcMat()); sn.visible = false; g.add(sn);
  g.userData = { body, glass: gm, snow: sn, chimney: new THREE.Vector3(-1.3, H + rise + 1.0, -.4), front: new THREE.Vector3(0, 1.6, SPAN / 2 + PD + .8) };
  return g;
}

// ---------- small buildings ----------
export function woodshed(){
  const g = new THREE.Group(), b = new Batch(), snow = new Batch(), r = rng(29);
  const LEN = 2.6, SPAN = 1.8, H = 1.9;
  for (const [x, z] of [[-1.2, -.8], [1.2, -.8], [-1.2, .8], [1.2, .8]]) b.sphere(.2, vary(AC.stone, r, .1), [x, .02, z], [1.1, .7, 1.1], 6);
  // Back and end walls of horizontal grey boards; the front (+z) is open.
  for (let y = .2; y < H; y += .18){
    b.box(LEN, .16, .05, vary(AC.log2, r, .1), [0, y, -SPAN / 2]);
    for (const s of [-1, 1]) b.box(.05, .16, SPAN, vary(AC.log, r, .1), [s * LEN / 2, y, 0]);
  }
  for (const s of [-1, 1]) b.box(.12, H, .12, AC.logDark, [s * LEN / 2, H / 2, SPAN / 2]);
  b.box(LEN, .08, SPAN, AC.plankDark, [0, .16, 0]);
  const rise = gableRoof(b, { span: SPAN, len: LEN, h: H, pitch: .5, side: .25, end0: .2, end1: .2, color: AC.felt, rib: AC.feltRib, snow });
  for (const x of [-LEN / 2, LEN / 2]) gableWall(b, { span: SPAN, h: H, rise, x, color: AC.log2 });
  // Split logs with the end grain facing out.
  for (let row = 0; row < 11; row++) for (let i = 0; i < 15; i++){
    const y = .3 + row * .145, x = -1.1 + i * .155 + (row % 2) * .07;
    if (x > 1.15) continue;
    b.cyl(.07, .07, 1.3, vary(AC.wood, r, .12), [x, y, -.1], [Math.PI / 2, 0, 0], 6);
    b.cyl(.062, .062, .02, vary(AC.woodEnd, r, .1), [x, y, .56], [Math.PI / 2, 0, 0], 6);
  }
  // Chopping block with an axe.
  b.cyl(.26, .28, .5, '#8a6a4c', [.6, .25, 1.3], [0, 0, 0], 12);
  b.cyl(.255, .255, .02, AC.woodEnd, [.6, .5, 1.3], [0, 0, 0], 12);
  b.box(.05, .65, .05, '#7a5a3c', [.66, .82, 1.32], [0, 0, .35]);
  b.box(.24, .12, .04, AC.steel, [.54, .53, 1.32], [0, 0, .35]);
  g.add(ink(b.mesh(vcMat())));
  const sn = snow.mesh(vcMat()); sn.visible = false; g.add(sn);
  g.userData = { snow: sn };
  return g;
}

export function outhouse(){
  const g = new THREE.Group(), b = new Batch(), snow = new Batch();
  b.box(1.15, 2.0, 1.2, AC.red, [0, 1.15, 0]);
  for (let x = -.45; x <= .45; x += .3) b.box(.05, 1.95, .03, AC.redBatten, [x, 1.15, .615]);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(.08, 2.0, .08, AC.trim, [sx * .575, 1.15, sz * .6]);
  b.box(.7, 1.7, .06, '#e8dcc0', [0, 1.0, .64]);
  b.box(.12, .1, .02, '#7a251d', [0, 1.62, .68]);
  b.box(1.5, .1, 1.6, AC.felt, [0, 2.25, 0], [.18, 0, 0], .02);
  snow.box(1.52, .2, 1.62, AC.snow, [0, 2.38, 0], [.18, 0, 0], .08);
  b.box(.8, .12, .4, AC.plank, [0, .08, .85]);
  g.add(ink(b.mesh(vcMat())));
  const sn = snow.mesh(vcMat()); sn.visible = false; g.add(sn);
  g.userData = { snow: sn };
  return g;
}

export function well(){
  const g = new THREE.Group(), b = new Batch();
  b.box(1.0, .85, 1.0, AC.log2, [0, .42, 0], [0, 0, 0], .03);
  for (let y = .1; y < .85; y += .16) for (const s of [-1, 1]) b.box(1.04, .03, .03, AC.logDark, [0, y, s * .51]);
  b.box(1.08, .06, 1.08, AC.plank, [0, .88, 0]);
  for (const s of [-1, 1]) b.box(.08, 1.0, .08, AC.logDark, [s * .45, 1.35, 0]);
  b.cyl(.07, .07, .9, AC.wood, [0, 1.7, 0], [0, 0, Math.PI / 2], 8);
  b.box(.05, .3, .05, AC.logDark, [.52, 1.58, 0]);
  b.cyl(.13, .11, .22, '#7d8288', [-.25, 1.02, .25], [0, 0, 0], 10);
  g.add(ink(b.mesh(vcMat())));
  return g;
}
