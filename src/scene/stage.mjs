// The lakeside stage: renderer, world, Helsinki light, small life, hotspots and camera views.
// The page drives it through the returned API; it knows nothing about the content.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld, setSeason, setTreeStyle, updateBillboards, height, L } from './world.mjs';
import { WIND } from './trees.mjs';
import { depthTexture } from './terrain.mjs';
import { makeSky } from './sky.mjs';
import { makeWater } from './water.mjs';
import { makeClouds, makeSmoke, makeSnow, makeFireflies, makeBirds } from './fx.mjs';
import { Post } from './post.mjs';
import { createRowing } from './rowing.mjs';
import { sunPosition, moonPosition, helsinkiParts, helsinkiToUTC, seasonOf, momentWord } from '../astro.mjs';
import { paletteAt, sunDiscColor } from '../palette.mjs';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const srgb = (c, a) => c.setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace);

/** Camera framings. `m` is used on tall phone screens. */
export const VIEWS = {
  home: { pos: [17, 2.2, 64], target: [-.6, 2.85, -10], fov: 24, m: { pos: [6, 4.2, 52], target: [0, 3.2, -8], fov: 24 } },
  // Each place is seen from out on the water, still telephoto, so it stays a painting rather than a close-up.
  work: { pos: [4, 2.6, 30], target: [5.6, 3.6, -17.6], fov: 24 },
  experience: { pos: [-12, 2.4, 28], target: [-2.5, 1, 4.5], fov: 22 },
  about: { pos: [2, 2.6, 26], target: [-5.6, 1.8, -.9], fov: 20 },
  contact: { pos: [16, 2.4, 24], target: [11.2, 1.2, -2.4], fov: 18 },
};

export function createStage(canvas, { paintScale, override, onHover, onPick, onClock } = {}){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#a8c0dc', 62, 300);
  const camera = new THREE.PerspectiveCamera(24, 1, .1, 900);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .07; controls.enablePan = false; controls.enableZoom = false;
  controls.rotateSpeed = .35; controls.minPolarAngle = .9; controls.maxPolarAngle = 1.52;
  const post = new Post(renderer);
  post.paintScale = paintScale ?? (devicePixelRatio <= 1.25 && innerWidth > 1000 ? .8 : .55);
  post.setMode('paint-c');

  // ---------- world ----------
  const W = buildWorld(); scene.add(W.root);
  setTreeStyle(W, 'daub-d');
  const sky = makeSky(); scene.add(sky.mesh);
  const water = makeWater(depthTexture(), L.avanto); scene.add(water);
  const clouds = makeClouds(); scene.add(clouds.mesh);
  const smoke = makeSmoke(); scene.add(smoke.mesh);
  const snow = makeSnow(); scene.add(snow);
  const shoreAt = x => { for (let z = 5; z > -10; z -= .25) if (height(x, z) > .2) return z + .5; return 0; };
  const flies = makeFireflies([{ x: 2.6, z: shoreAt(2.6) }, { x: -1, z: -3 }, { x: 4.5, z: shoreAt(4.5) }, { x: 7, z: -8 }]); scene.add(flies);
  const birds = makeBirds(); scene.add(birds);
  const row = createRowing({ scene, W, water, height });
  const wp = (obj, v) => obj.localToWorld(v.clone());
  const cabinSmoke = smoke.emitter(wp(W.cabin, W.cabin.userData.chimney), 2.2);
  const saunaSmoke = smoke.emitter(wp(W.sauna, W.sauna.userData.flue), 2.6);

  // ---------- light ----------
  const hemi = new THREE.HemisphereLight('#bcd0ea', '#5a5040', 1.2); scene.add(hemi);
  const key = new THREE.DirectionalLight('#ffffff', 2.6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 160 });
  key.shadow.bias = -.0004; key.shadow.normalBias = .04;
  key.target.position.set(1, 0, -4); scene.add(key, key.target);
  const cabinLight = new THREE.PointLight('#ffb866', 0, 11, 1.6); cabinLight.position.copy(wp(W.cabin, new THREE.Vector3(0, 1.8, 4.2))); scene.add(cabinLight);
  const saunaLight = new THREE.PointLight('#ffa65a', 0, 7, 1.6); saunaLight.position.copy(wp(W.sauna, new THREE.Vector3(2.9, 1.0, -.35))); scene.add(saunaLight);

  const state = { override: override ?? null, view: 'home', cabinOn: true, lanternOn: null, fireOn: null, saunaHeat: 0, fireBoost: 0, gust: 0, boatKick: 0, swing: 0, vis: null, fov: 24, shift: 0, offset: 0, offsetGoal: 0, offsetY: 0, offsetYGoal: 0, soft: 1 };
  const env = { emis: 0, exposure: 1 };

  // ---------- views ----------
  let tween = null;
  const tall = () => camera.aspect < .8;
  function fitFov(){
    camera.fov = state.fov * (tall() ? 1.5 : 1);
    // Shift the picture left (or up, on phones) when the paper panel covers part of it, so the subject stays in view.
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (state.offset > .5 || state.offsetY > .5) camera.setViewOffset(w, h, state.offset, state.offsetY, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  function goView(k, instant = false){
    let v = VIEWS[k] || VIEWS.home; state.view = k;
    if (tall() && v.m) v = v.m;
    const to = { pos: new THREE.Vector3(...v.pos), target: new THREE.Vector3(...v.target), fov: v.fov || 30 };
    if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches){
      camera.position.copy(to.pos); controls.target.copy(to.target); state.fov = to.fov; fitFov(); controls.update(); tween = null; return;
    }
    tween = { from: { pos: camera.position.clone(), target: controls.target.clone(), fov: state.fov }, to, t: 0, len: 3.2 };
  }
  function stepTween(dt){
    if (!tween) return;
    tween.t = Math.min(1, tween.t + dt / tween.len);
    const k = tween.t, e = k * k * k * (k * (k * 6 - 15) + 10);
    camera.position.lerpVectors(tween.from.pos, tween.to.pos, e);
    camera.position.y += Math.sin(e * Math.PI) * 3;          // rise a little mid-way, like drifting over the trees
    controls.target.lerpVectors(tween.from.target, tween.to.target, e);
    state.fov = tween.from.fov + (tween.to.fov - tween.from.fov) * e;
    if (tween.t >= 1) tween = null;
  }

  // ---------- hotspots ----------
  const hits = [];
  const above = (obj, y) => () => obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, y, 0));
  function hotspot(obj, id, anchor, toy){ const h = { obj, id, anchor, toy }; hits.push(h); obj.traverse(o => { o.userData.hit = h; }); }
  hotspot(W.cabin, 'work', above(W.cabin, 6.8), () => { state.cabinOn = true; });
  hotspot(W.woodshed, null, above(W.woodshed, 3.2), () => { state.saunaHeat = 1; });
  hotspot(W.boat, 'row', above(W.boat, 1.6), () => { state.boatKick = 1; });
  hotspot(W.pier, 'experience', () => W.pier.userData.end.clone().add(new THREE.Vector3(0, 1.6, 0)), () => { state.boatKick = 1; });
  hotspot(W.sauna, 'about', above(W.sauna, 4.4), () => { smoke.loyly(wp(W.sauna, W.sauna.userData.stove), wp(W.sauna, W.sauna.userData.door)); state.saunaHeat = 1; });
  hotspot(W.fire, 'contact', above(W.fire, 2.2), () => { state.fireBoost = 1; state.fireOn = true; });
  hotspot(W.hammock, null, () => W.hammock.userData.holder.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .8, 0)), () => { state.swing = 1; });
  hotspot(W.flag, null, above(W.flag, 8.6), () => { state.gust = 1; });
  hotspot(W.lantern, null, above(W.lantern, 1.8), () => { state.lanternOn = !(state.lanternOn ?? env.emis > .45); });

  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let hover = null, downAt = null;
  function pick(x, y){
    const r = canvas.getBoundingClientRect();
    mouse.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(hits.map(h => h.obj), true)[0];
    return hit ? hit.object.userData.hit : null;
  }
  function setHover(h){
    if (hover === h) return;
    const glow = (hh, on) => hh && hh.obj.traverse(o => { if (o.isMesh && o.material.emissive) o.material.emissive.set(on ? '#3a2f1c' : '#000000'); });
    glow(hover, false); hover = h; glow(hover, true);
    canvas.style.cursor = h ? 'pointer' : 'grab';
    onHover && onHover(h ? { id: h.id, toy: !h.id } : null);
  }
  canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') setHover(row.S.on ? null : pick(e.clientX, e.clientY)); });
  canvas.addEventListener('pointerleave', () => setHover(null));
  canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6 || row.S.on) return;
    const h = pick(e.clientX, e.clientY);
    if (h){ h.toy && h.toy(); onPick && onPick(h.id); return; }
    const t = -ray.ray.origin.y / ray.ray.direction.y;
    if (t > 0){ const q = ray.ray.at(t, new THREE.Vector3()); if (height(q.x, q.z) < 0) water.ripple(q.x, q.z, 1, clock.elapsed); }
  });

  // ---------- time and light ----------
  const tmp = new THREE.Color(), tmp2 = new THREE.Color(), sunV = new THREE.Vector3(), moonV = new THREE.Vector3();
  const dirFrom = (v, alt, az) => { const a = THREE.MathUtils.degToRad(alt), z = THREE.MathUtils.degToRad(az); return v.set(Math.sin(z) * Math.cos(a), Math.sin(a), -Math.cos(z) * Math.cos(a)); };
  const nowMs = () => state.override ?? Date.now() + state.shift;
  let lastSeason = null, lastClock = '';
  function applyEnv(t){
    const ms = nowMs(), p = helsinkiParts(ms), sun = sunPosition(ms), moon = moonPosition(ms);
    const sKey = seasonOf(p.mo, p.d);
    if (sKey !== lastSeason){ lastSeason = sKey; state.vis = setSeason(W, sKey); }
    const vis = state.vis, pal = paletteAt(sKey, sun.alt);
    env.emis = pal.emis;
    dirFrom(sunV, sun.alt, sun.az); dirFrom(moonV, moon.alt, moon.az);
    const day = smooth(-4, 8, sun.alt), lightAvg = (pal.light[0] + pal.light[1] + pal.light[2]) / 3;
    const U = sky.u;
    [U.s0, U.s1, U.s2, U.s3, U.s4].forEach((u, i) => srgb(u.value, pal.sky[i]));
    srgb(U.glow.value, pal.glow); U.glowAmt.value = pal.glowAmt; U.glowW.value = pal.glowW;
    srgb(U.sunCol.value, sunDiscColor(sun.alt)); U.sunDir.value.copy(sunV); U.sunVis.value = smooth(-1.5, .5, sun.alt);
    U.moonDir.value.copy(moonV); U.moonVis.value = smooth(-1, 2, moon.alt) * (1 - day * .6); U.moonPhase.value = moon.phase;
    U.stars.value = pal.stars; U.aurora.value = pal.aurora * (vis === 'winter' ? 1 : .6); U.time.value = t;
    srgb(tmp, pal.haze); srgb(tmp2, pal.sky[4]); tmp.lerp(tmp2, .45);
    scene.fog.color.copy(tmp); U.haze.value.copy(tmp);
    scene.fog.far = vis === 'winter' ? 240 : 300;
    const sunUp = smooth(-3, 4, sun.alt);
    const keyDir = sun.alt > -3 ? dirFrom(new THREE.Vector3(), Math.max(sun.alt, 4), sun.az) : moon.alt > 2 ? moonV.clone() : dirFrom(new THREE.Vector3(), 40, 200);
    key.position.copy(key.target.position).addScaledVector(keyDir, 70);
    if (sun.alt > -3){ srgb(key.color, sunDiscColor(sun.alt)); key.intensity = 2.9 * sunUp; }
    else { key.color.set('#9fb4ec'); key.intensity = .45 * (moon.alt > 2 ? .5 + moon.fraction * .5 : .5); }
    srgb(hemi.color, pal.sky[1]); hemi.color.multiply(tmp2.setRGB(pal.light[0], pal.light[1], pal.light[2]).multiplyScalar(1 / Math.max(.3, lightAvg)));
    srgb(hemi.groundColor, pal.haze); hemi.groundColor.lerp(tmp2.set('#5a4a38'), .55);
    hemi.intensity = .55 + 1.05 * lightAvg;
    const WU = water.U;
    srgb(WU.deep.value, pal.deep); WU.deep.value.lerp(tmp2.set('#3c4a52'), .45); WU.shallow.value.copy(WU.deep.value).lerp(tmp2.set('#6f6a4c'), .25 + .35 * day);
    srgb(WU.skyCol.value, pal.sky[2]); WU.refl.value = pal.refl; WU.fogColor.value.copy(scene.fog.color);
    WU.fogNear.value = scene.fog.near; WU.fogFar.value = scene.fog.far;
    if (sun.alt > -2){ WU.sunDir.value.copy(sunV); srgb(WU.sunCol.value, sunDiscColor(sun.alt)); WU.sunVis.value = smooth(-2, 2, sun.alt); }
    else { WU.sunDir.value.copy(moonV); WU.sunCol.value.set('#cdd6ff').multiplyScalar(.5); WU.sunVis.value = smooth(0, 4, moon.alt) * moon.fraction; }
    WU.ice.value = vis === 'winter' ? 1 : 0;
    WU.lit.value.copy(hemi.color).multiplyScalar(hemi.intensity).add(tmp2.copy(key.color).multiplyScalar(key.intensity * Math.max(0, keyDir.y))).multiplyScalar(1.9 / Math.PI);
    WU.time.value = t;
    const CU = clouds.uniforms; srgb(CU.cShade.value, pal.cloud[0]); srgb(CU.cMid.value, pal.cloud[1]); srgb(CU.cLit.value, pal.cloud[2]);
    const SU = smoke.uniforms; srgb(SU.cMid.value, pal.smoke); SU.cShade.value.copy(SU.cMid.value).multiplyScalar(.72); SU.cLit.value.copy(SU.cMid.value).lerp(tmp2.set('#ffffff'), .35);
    SU.fogColor.value.copy(scene.fog.color); SU.fogNear.value = scene.fog.near; SU.fogFar.value = scene.fog.far;
    const warm = tmp2.set('#ffc979');
    const glass = (mat, on) => { mat.color.set('#1e2838').lerp(warm, on).multiplyScalar(1 + on * 1.6); };
    glass(W.cabin.userData.glass, state.cabinOn ? pal.emis : 0);
    cabinLight.intensity = (state.cabinOn ? pal.emis : 0) * 9;
    const heat = Math.max(state.saunaHeat, smooth(.5, .9, pal.emis) * .8);
    glass(W.sauna.userData.glass, heat * Math.max(.35, pal.emis));
    saunaLight.intensity = heat * pal.emis * 6;
    const lOn = state.lanternOn ?? env.emis > .45;
    W.lantern.userData.glass.color.set(lOn ? '#ffd28a' : '#4a4a48').multiplyScalar(lOn ? 2.4 : 1);
    W.lantern.userData.light.intensity = lOn ? 4 : 0;
    const fireOn = state.fireOn ?? (vis !== 'winter' && pal.emis > .25);
    const midsummer = p.mo === 6 && p.d >= 19 && p.d <= 26 && pal.emis > .3;
    W.kokko.visible = midsummer;
    W.kokko.userData.light.intensity = midsummer ? 22 * (.85 + .15 * Math.sin(t * 11) * Math.sin(t * 6.1)) : 0;
    W.fire.userData.flames.visible = fireOn;
    W.fire.userData.light.intensity = fireOn ? (6 + state.fireBoost * 10) * (.85 + .15 * Math.sin(t * 13) * Math.sin(t * 7.3)) : 0;
    cabinSmoke.on = vis === 'winter' || vis === 'autumn' || pal.emis > .5;
    saunaSmoke.on = state.saunaHeat > 0 || pal.emis > .55;
    snow.material.uniforms.amount.value = vis === 'winter' ? .5 : 0;
    snow.material.uniforms.color.value.copy(hemi.color).lerp(tmp2.set('#ffffff'), .6);
    flies.material.uniforms.amount.value = vis === 'summer' ? smooth(.4, .8, pal.emis) : 0;
    env.exposure = 1 + (1 - day) * .5;
    // Clock for the page, only when the minute changes.
    const pr = sunPosition(ms + 6e5), word = momentWord(p, sun.alt, pr.alt > sun.alt, sKey), stamp = `${p.h}:${p.mi}:${word}`;
    if (stamp !== lastClock){ lastClock = stamp; onClock && onClock({ h: p.h, mi: p.mi, mo: p.mo, d: p.d, word, season: sKey }); }
    return pal;
  }

  function animate(t, dt){
    state.boatKick = Math.max(0, state.boatKick - dt * .35);
    W.boat.position.y = -.18 + Math.sin(t * 1.1) * .025;
    W.boat.rotation.z = Math.sin(t * .9) * .025 + state.boatKick * Math.sin(t * 5) * .12;
    W.boat.rotation.x = Math.sin(t * .7 + 1) * .015;
    if (state.boatKick > .9) water.ripple(W.boat.position.x, W.boat.position.z, .7, t), state.boatKick = .89;
    state.fireBoost = Math.max(0, state.fireBoost - dt * .25);
    for (const F of [W.fire, W.kokko]) F.userData.flames.children.forEach((f, i) => {
      const s = 1 + (F === W.fire ? state.fireBoost * .8 : 0); f.scale.set(s, s * (1 + .25 * Math.sin(t * (9 + i * 3) + i)), s); f.rotation.y = t * (1 + i * .3);
    });
    state.gust = Math.max(0, state.gust - dt * .3);
    const fu = W.flag.userData, P = fu.cloth.geometry.attributes.position;
    for (let i = 0; i < P.count; i++){
      const x = fu.base[i * 3], y = fu.base[i * 3 + 1];
      P.setZ(i, Math.sin(x * 1.5 - t * (2.6 + state.gust * 3) + y) * x * (.07 + state.gust * .06));
      P.setY(i, y - x * x * .008 * (1 - state.gust));
    }
    P.needsUpdate = true; fu.cloth.geometry.computeVertexNormals();
    fu.cloth.rotation.y = -.6 + Math.sin(t * .23) * .3;
    state.swing = Math.max(0, state.swing - dt * .2);
    W.hammock.userData.holder.children[0].rotation.x = Math.sin(t * 1.6) * (.03 + state.swing * .3);
    state.saunaHeat = Math.max(0, state.saunaHeat - dt / 60);
  }

  // ---------- loop ----------
  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    post.setSize(s.x, s.y);
    water.getRenderTarget().setSize(Math.ceil(s.x * .6), Math.ceil(s.y * .6));
    camera.aspect = w / h; fitFov();
  }
  let wasTall = null;
  addEventListener('resize', () => { resize(); if (wasTall !== tall()){ wasTall = tall(); goView(state.view, true); } });
  const clock = { elapsed: 0, last: performance.now() };
  let running = true, rowIn = 0;
  function frame(now){
    if (!running) return;
    const dt = Math.min(.05, (now - clock.last) / 1000); clock.last = now; clock.elapsed += dt;
    const t = clock.elapsed;
    state.offset += (state.offsetGoal - state.offset) * Math.min(1, dt * 3.2);
    state.offsetY += (state.offsetYGoal - state.offsetY) * Math.min(1, dt * 3.2);
    row.update(dt, clock.elapsed);
    if (row.S.on){
      // Rowing: the camera eases in from wherever it was, then follows the boat.
      const f = row.follow(dt, tall()), k = 1 - Math.exp(-dt * (rowIn < 1 ? 1.2 : 2.2));
      rowIn = Math.min(1, rowIn + dt / 3);
      camera.position.lerp(f.pos, k); controls.target.lerp(f.target, k);
      state.fov += (22 - state.fov) * k;
      state.soft += (.45 - state.soft) * k;                          // on the water, let the far shore come through clearer
      fitFov(); camera.lookAt(controls.target);
      if (row.S.next >= row.S.n) state.lanternOn = true;           // light the pier lantern for the way home
    } else { state.soft += (1 - state.soft) * Math.min(1, dt * 1.5); stepTween(dt); fitFov(); controls.update(); }
    const pal = applyEnv(t);
    animate(t, dt);
    clouds.update(dt, pal.cloudOp);
    smoke.update(dt, new THREE.Vector2(.35 + state.gust, .12));
    WIND.uWindTime.value = t; WIND.uWind.value = 1 + state.gust * 1.5;
    if (state.vis !== 'winter'){
      birds.update(t % 45, 6, 14);
      if (Math.random() < dt / 7){ const x = -10 + Math.random() * 30, z = 4 + Math.random() * 14; if (height(x, z) < -.5) water.ripple(x, z, .6, t); }
    } else birds.visible = false;
    snow.material.uniforms.time.value = t; snow.material.uniforms.center.value.copy(controls.target);
    flies.material.uniforms.time.value = t;
    sky.mesh.position.copy(camera.position);
    updateBillboards(W, camera.position);
    post.render(scene, camera, { normalHide: [sky.mesh, water, clouds.mesh, smoke.mesh, snow, flies, birds], tint: scene.fog.color, time: t, exposure: env.exposure, bloom: .55, threshold: 1.05, tilt: 1, soft: state.soft, focus: camera.position.distanceTo(controls.target) });
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running){ running = true; clock.last = performance.now(); requestAnimationFrame(frame); }
  });
  resize(); wasTall = tall(); goView('home', true);
  requestAnimationFrame(frame);

  /** World point to page pixels; `off` is true when it is behind the camera or outside the view. */
  function screen(v){
    const a = v.clone().project(camera);
    const x = (a.x * .5 + .5) * canvas.clientWidth, y = (-a.y * .5 + .5) * canvas.clientHeight;
    return { x, y, behind: a.z > 1, off: a.z > 1 || Math.abs(a.x) > 1 || Math.abs(a.y) > 1 };
  }

  return {
    goView,
    /** Pixels of the right side (px) or the bottom (py) covered by the panel; the picture eases over to keep its subject visible. */
    setPanel(px, py = 0){ state.offsetGoal = px / 2; state.offsetYGoal = py / 2; },
    /** World anchor of a section's object projected to screen pixels, for the paper tags. */
    anchorOf(id){
      const h = hits.find(x => x.id === id); if (!h) return null;
      const a = h.anchor().project(camera);
      return a.z > 1 ? null : { x: (a.x * .5 + .5) * canvas.clientWidth, y: (-a.y * .5 + .5) * canvas.clientHeight };
    },
    screen,
    hoverAnchor(){ if (!hover) return null; const a = hover.anchor().project(camera); return { x: (a.x * .5 + .5) * canvas.clientWidth, y: (-a.y * .5 + .5) * canvas.clientHeight }; },
    setTime(ms){ state.override = ms; },
    /** Run the lake clock this many ms ahead of (or behind) real time; it keeps ticking. */
    setShift(ms){ state.override = null; state.shift = ms; },
    /** The rowing game. The page supplies the number of gates and listens for gates and the dock. */
    row: {
      start(items, cb){ tween = null; controls.enabled = false; rowIn = 0; state.lanternOn = null; row.start(items, cb); },
      stop(){ row.stop(); controls.enabled = true; state.lanternOn = null; },
      input(f, r){ row.S.input.f = f; row.S.input.r = r; },
      get active(){ return row.S.on; },
      get next(){ return row.S.next; },
      speed(){ return row.S.v; },
      anchor(i){ const v = i == null ? row.dockAnchor() : row.gateAnchor(i); return v && screen(v); },
      boat(){ return screen(row.boatPos().setY(1.2)); },
      debug: () => row.debug(),
    },
    helsinkiToUTC,
    camera, state,
  };
}
