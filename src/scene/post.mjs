// Finishes over the same scene, from the style research:
//   pixel a  low-res + depth outline + ordered dither (A Short Hike)
//   pixel b  low-res + dark outer outline + light crease highlights + banded light (t3ssel8r)
//   pixel c  low-res + OKLab posterise with dither, colour fields like Proteus
//   pixel d  low-res, no lines, soft dither and pastel haze (Cloud Gardens)
//   pixel e  two-tone ordered dither, ink on paper, windows keep their warm light (TOEM / Obra Dinn)
//   paint a  generalised Kuwahara + paper + pigment at edges + fine ink (Susurrus)
//   paint b  anisotropic Kuwahara: strokes follow the shapes (Kyprianidis 2009)
//   paint c  watercolour after Bousseau 2006: pigment density from turbulence and paper, edge darkening, white reserve
//   paint d  ink line and light wash with hatching in the shadows (Tove Jansson, v1)
//   clean    full resolution, soft bloom, gentle tilt-shift
import * as THREE from 'three';

const TRI = new THREE.BufferGeometry();
TRI.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
const ORTHO = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }`;

const COMMON = /* glsl */`
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
vec3 toSRGB(vec3 c){ c = max(c, 0.); return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.) * .27 + vn(p * 4.1 + 3.) * .15 + vn(p * 8.3 + 1.) * .08; }
float luma(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
float bayer4(vec2 p){ int x = int(mod(p.x, 4.)), y = int(mod(p.y, 4.));
  float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); return (m[x + y * 4] + .5) / 16.; }
uniform float near, far;
float viewZ(float d){ return (near * far) / ((far - near) * d - far); }   // negative view-space z
// OKLab, for posterising in perceptual steps.
vec3 lin2oklab(vec3 c){
  vec3 l = vec3(.4122214708 * c.r + .5363325363 * c.g + .0514459929 * c.b, .2119034982 * c.r + .6806995451 * c.g + .1073969566 * c.b, .0883024619 * c.r + .2817188376 * c.g + .6299787005 * c.b);
  l = pow(max(l, 0.), vec3(1. / 3.));
  return vec3(.2104542553 * l.x + .7936177850 * l.y - .0040720468 * l.z, 1.9779984951 * l.x - 2.4285922050 * l.y + .4505937099 * l.z, .0259040371 * l.x + .7827717662 * l.y - .8086757660 * l.z);
}
vec3 oklab2lin(vec3 c){
  vec3 l = vec3(c.x + .3963377774 * c.y + .2158037573 * c.z, c.x - .1055613458 * c.y - .0638541728 * c.z, c.x - .0894841775 * c.y - 1.2914855480 * c.z);
  l = l * l * l;
  return vec3(4.0767416621 * l.x - 3.3077115913 * l.y + .2309699292 * l.z, -1.2684380046 * l.x + 2.6097574011 * l.y - .3413193965 * l.z, -.0041960863 * l.x - .7034186147 * l.y + 1.7076147010 * l.z);
}
`;

function pass(frag, uniforms = {}){
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: frag, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(TRI, mat); mesh.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(mesh);
  return { mat, u: uniforms, run(renderer, target){ renderer.setRenderTarget(target); renderer.render(scene, ORTHO); } };
}
const rt = (w, h, o = {}) => new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), { type: THREE.HalfFloatType, ...o });

/** Every finish: which buffer it renders into, which helpers it needs, and the final style number. */
export const FINISHES = {
  'pixel-a': { name: '像素 A', base: 'low', final: 'pixel', style: 1 },
  'pixel-b': { name: '像素 B', base: 'low', final: 'pixel', style: 2, normals: true },
  'pixel-c': { name: '像素 C', base: 'low', final: 'pixel', style: 3 },
  'pixel-d': { name: '像素 D', base: 'low', final: 'pixel', style: 4, lowScale: .85 },
  'pixel-e': { name: '像素 E', base: 'low', final: 'pixel', style: 5, lowScale: .95 },
  'paint-a': { name: '绘画 A', base: 'half', final: 'paint', style: 1, kuwahara: 'gen', R: 6 },
  'paint-b': { name: '绘画 B', base: 'half', final: 'paint', style: 2, kuwahara: 'aniso', R: 9 },
  'paint-c': { name: '绘画 C', base: 'half', final: 'paint', style: 3, kuwahara: 'gen', R: 3.4, blur: true, normals: true },
  'paint-d': { name: '绘画 D', base: 'full', final: 'paint', style: 4, normals: true },
  clean: { name: '平涂', base: 'full', final: 'clean', blur: true },
};
// Older names from the first prototype.
FINISHES.pixel = FINISHES['pixel-a']; FINISHES.paint = FINISHES['paint-a'];

export class Post {
  constructor(renderer){
    this.r = renderer; this.mode = 'clean'; this.W = 1; this.H = 1;
    const depth = () => { const d = new THREE.DepthTexture(1, 1); d.type = THREE.UnsignedIntType; return d; };
    this.fullRT = rt(1, 1, { depthTexture: depth(), samples: 4 });
    this.lowRT = rt(1, 1, { depthTexture: depth(), minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.halfRT = rt(1, 1, { depthTexture: depth(), samples: 4 });
    this.paintScale = .55;   // resolution of the painted image relative to the screen; 1 for the film
    this.normalRT = rt(1, 1, { depthTexture: depth(), minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    this.kuwRT = rt(1, 1); this.tfm = [rt(1, 1), rt(1, 1)];
    this.b = [rt(1, 1), rt(1, 1), rt(1, 1), rt(1, 1)];          // bloom: quarter A/B, eighth A/B
    this.d = [rt(1, 1), rt(1, 1)];                              // soft blur of the image, quarter A/B
    // Normal pass: alpha 1 on man-made things (userData.ink), 0 elsewhere, so ink can be limited to them.
    // Marked transparent (with blending off) so three does not force alpha to 1 for opaque materials.
    this.normalInk = new THREE.MeshNormalMaterial({ opacity: 1, transparent: true, blending: THREE.NoBlending });
    this.normalPlain = new THREE.MeshNormalMaterial({ opacity: 0, transparent: true, blending: THREE.NoBlending });

    this.bright = pass(/* glsl */`
      uniform sampler2D src; uniform float threshold; varying vec2 vUv;
      void main(){ vec3 c = texture2D(src, vUv).rgb; float l = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c * smoothstep(threshold, threshold + .6, l), 1.); }`, { src: { value: null }, threshold: { value: 1. } });
    this.copy = pass(/* glsl */`uniform sampler2D src; varying vec2 vUv; void main(){ gl_FragColor = texture2D(src, vUv); }`, { src: { value: null } });
    this.blur = pass(/* glsl */`
      uniform sampler2D src; uniform vec2 dir; varying vec2 vUv;
      void main(){
        vec4 c = texture2D(src, vUv) * .227;
        c += (texture2D(src, vUv + dir * 1.385) + texture2D(src, vUv - dir * 1.385)) * .316;
        c += (texture2D(src, vUv + dir * 3.231) + texture2D(src, vUv - dir * 3.231)) * .070;
        gl_FragColor = c; }`, { src: { value: null }, dir: { value: new THREE.Vector2() } });

    // ---------- Kuwahara filters (run on the tone-mapped image, output sRGB) ----------
    const KU = () => ({ src: { value: null }, tfm: { value: null }, srcRes: { value: new THREE.Vector2() }, exposure: { value: 1 }, R: { value: 6 } });
    const WEIGHTS = /* glsl */`
      // Polynomial sector weights (Kyprianidis et al. 2010), v inside the unit disk.
      void sectorWeights(vec2 v, out float w[8]){
        const float zeta = .33, eta = 8.56;
        float z, vxx = zeta - eta * v.x * v.x, vyy = zeta - eta * v.y * v.y;
        z = max(0., v.y + vxx); w[0] = z * z; z = max(0., -v.x + vyy); w[2] = z * z;
        z = max(0., -v.y + vxx); w[4] = z * z; z = max(0., v.x + vyy); w[6] = z * z;
        vec2 r = .70710678 * vec2(v.x - v.y, v.x + v.y);
        vxx = zeta - eta * r.x * r.x; vyy = zeta - eta * r.y * r.y;
        z = max(0., r.y + vxx); w[1] = z * z; z = max(0., -r.x + vyy); w[3] = z * z;
        z = max(0., -r.y + vxx); w[5] = z * z; z = max(0., r.x + vyy); w[7] = z * z;
      }
      vec3 resolve(vec4 m[8], vec3 s[8]){
        vec4 o = vec4(0);
        for (int k = 0; k < 8; k++){
          vec3 mu = m[k].rgb / max(m[k].w, 1e-5);
          vec3 sg = abs(s[k] / max(m[k].w, 1e-5) - mu * mu);
          float w = 1. / (1. + pow(255. * (sg.r + sg.g + sg.b), 4.));
          o += vec4(mu * w, w);
        }
        return o.rgb / max(o.w, 1e-5);
      }`;
    this.kuwahara = pass(COMMON + WEIGHTS + /* glsl */`
      uniform sampler2D src; uniform vec2 srcRes; uniform float exposure; uniform int R; varying vec2 vUv;
      vec3 S(vec2 o){ return toSRGB(aces(texture2D(src, vUv + o / srcRes).rgb * exposure)); }
      void main(){
        vec4 m[8]; vec3 s[8]; float w[8];
        for (int k = 0; k < 8; k++){ m[k] = vec4(0); s[k] = vec3(0); }
        for (int y = -R; y <= R; y++) for (int x = -R; x <= R; x++){
          vec2 v = vec2(x, y) / float(R);
          if (dot(v, v) > 1.) continue;
          vec3 c = S(vec2(x, y));
          sectorWeights(v, w);
          float sw = 0.; for (int k = 0; k < 8; k++) sw += w[k];
          float g = exp(-3.125 * dot(v, v)) / max(sw, 1e-5);
          for (int k = 0; k < 8; k++){ float wk = w[k] * g; m[k] += vec4(c * wk, wk); s[k] += c * c * wk; }
        }
        gl_FragColor = vec4(resolve(m, s), 1.);
      }`, KU());
    // Structure tensor of the image, smoothed afterwards with the blur pass.
    this.tensor = pass(COMMON + /* glsl */`
      uniform sampler2D src; uniform vec2 srcRes; uniform float exposure; varying vec2 vUv;
      vec3 S(vec2 o){ return toSRGB(aces(texture2D(src, vUv + o / srcRes).rgb * exposure)); }
      void main(){
        vec3 gx = (-S(vec2(-1, -1)) - 2. * S(vec2(-1, 0)) - S(vec2(-1, 1)) + S(vec2(1, -1)) + 2. * S(vec2(1, 0)) + S(vec2(1, 1))) / 4.;
        vec3 gy = (-S(vec2(-1, -1)) - 2. * S(vec2(0, -1)) - S(vec2(1, -1)) + S(vec2(-1, 1)) + 2. * S(vec2(0, 1)) + S(vec2(1, 1))) / 4.;
        gl_FragColor = vec4(dot(gx, gx), dot(gx, gy), dot(gy, gy), 1.);
      }`, KU());
    this.anisoKuwahara = pass(COMMON + WEIGHTS + /* glsl */`
      uniform sampler2D src, tfm; uniform vec2 srcRes; uniform float exposure; uniform int R; varying vec2 vUv;
      vec3 S(vec2 o){ return toSRGB(aces(texture2D(src, vUv + o / srcRes).rgb * exposure)); }
      void main(){
        vec3 g = texture2D(tfm, vUv).xyz;
        float lam1 = .5 * (g.x + g.z + sqrt(max(0., (g.x - g.z) * (g.x - g.z) + 4. * g.y * g.y)));
        float lam2 = .5 * (g.x + g.z - sqrt(max(0., (g.x - g.z) * (g.x - g.z) + 4. * g.y * g.y)));
        vec2 d = vec2(lam1 - g.x, -g.y);
        vec2 t = length(d) > 1e-6 ? normalize(d) : vec2(0, 1);
        float phi = -atan(t.y, t.x);
        float A = lam1 + lam2 > 1e-6 ? (lam1 - lam2) / (lam1 + lam2) : 0.;
        float rad = float(R), alpha = 1.;
        float a = rad * clamp((alpha + A) / alpha, .1, 2.), b = rad * clamp(alpha / (alpha + A), .1, 2.);
        float cp = cos(phi), sp = sin(phi);
        mat2 SR = mat2(1. / a, 0., 0., 1. / b) * mat2(cp, -sp, sp, cp);
        int mx = int(sqrt(a * a * cp * cp + b * b * sp * sp)), my = int(sqrt(a * a * sp * sp + b * b * cp * cp));
        vec4 m[8]; vec3 s[8]; float w[8];
        for (int k = 0; k < 8; k++){ m[k] = vec4(0); s[k] = vec3(0); }
        for (int y = -my; y <= my; y++) for (int x = -mx; x <= mx; x++){
          vec2 v = SR * vec2(x, y);
          if (dot(v, v) > 1.) continue;
          vec3 c = S(vec2(x, y));
          sectorWeights(v, w);
          float sw = 0.; for (int k = 0; k < 8; k++) sw += w[k];
          float gg = exp(-3.125 * dot(v, v)) / max(sw, 1e-5);
          for (int k = 0; k < 8; k++){ float wk = w[k] * gg; m[k] += vec4(c * wk, wk); s[k] += c * c * wk; }
        }
        gl_FragColor = vec4(resolve(m, s), 1.);
      }`, KU());

    const finalU = () => ({
      src: { value: null }, raw: { value: null }, depthTex: { value: null }, normalTex: { value: null }, bloom1: { value: null }, bloom2: { value: null }, blurTex: { value: null },
      res: { value: new THREE.Vector2() }, srcRes: { value: new THREE.Vector2() }, time: { value: 0 }, exposure: { value: 1 },
      near: { value: .1 }, far: { value: 800 }, bloomAmt: { value: .6 }, ink: { value: new THREE.Color('#1f2430') }, tilt: { value: 1 },
      paper: { value: new THREE.Color('#f3ecdf') }, tint: { value: new THREE.Color('#c8d2e0') }, style: { value: 1 }, inkAmt: { value: 1 }, focus: { value: 60 }, soft: { value: 0 },
    });

    this.finalPixel = pass(COMMON + /* glsl */`
      uniform sampler2D src, depthTex, normalTex, bloom1, bloom2; uniform vec2 res, srcRes; uniform float exposure, bloomAmt;
      uniform vec3 ink, paper, tint; uniform int style;
      varying vec2 vUv;
      float Z(vec2 uv){ return -viewZ(texture2D(depthTex, uv).r); }
      void main(){
        vec2 px = floor(vUv * srcRes) + .5, uv = px / srcRes, t = 1. / srcRes;
        vec3 hdr = texture2D(src, uv).rgb + (texture2D(bloom1, uv).rgb + texture2D(bloom2, uv).rgb) * bloomAmt;
        float z = Z(uv);
        vec2 off[4] = vec2[4](vec2(t.x, 0), vec2(-t.x, 0), vec2(0, t.y), vec2(0, -t.y));
        float outline = 0., crease = 0.;
        vec3 n = texture2D(normalTex, uv).xyz * 2. - 1.;
        for (int i = 0; i < 4; i++){
          float zn = Z(uv + off[i]);
          outline = max(outline, smoothstep(.06, .14, (z - zn) / z));               // a nearer neighbour: we are just outside a shape
          if (style == 2 && abs(z - zn) / z < .05){                                // same surface region: a crease if the normals turn
            vec3 nn = texture2D(normalTex, uv + off[i]).xyz * 2. - 1.;
            crease = max(crease, smoothstep(.25, .6, 1. - dot(n, nn)) * step(dot((n - nn).xy, off[i] / t), 0.));   // convex edges only
          }
        }
        outline *= step(z, 140.);
        vec3 c = aces(hdr * exposure);
        float l = luma(c);
        if (style == 1){
          c = mix(c, c * ink * 2.2, outline * .55);
          c = toSRGB(c);
          c = floor(c * 30. + bayer4(px) - .5 + .5) / 30.;
        } else if (style == 2){
          float lb = (floor(l * 6.) + smoothstep(.35, .65, fract(l * 6.))) / 6.;    // banded light, soft steps
          c *= mix(1., lb / max(l, 1e-3), .7);
          c = toSRGB(c);
          c = mix(c, c * 1.32 + .05, crease * (1. - outline) * .85);
          c = mix(c, toSRGB(ink) * .8 + c * .2, outline * .75);
        } else if (style == 3){
          vec3 o = lin2oklab(c);
          float d = bayer4(px) - .5;
          o.x = floor(o.x * 11. + d * .9 + .5) / 11.;
          o.yz = floor(o.yz * 22. + d * .7 + .5) / 22.;
          c = toSRGB(clamp(oklab2lin(o), 0., 1.));
          c = mix(c, c * .55, outline * .5);
        } else if (style == 4){
          c = toSRGB(c);
          c = mix(c, toSRGB(tint), .07 + .1 * smoothstep(20., 90., z));
          c = floor(c * 44. + h21(px) - .5 + .5) / 44.;
        } else {
          float sl = smoothstep(.08, .8, luma(toSRGB(c)));
          // Three tones (ink, a tint taken from the sky, paper) with an ordered dither between neighbours.
          vec3 inkC = toSRGB(ink) * .85 + toSRGB(tint) * .15, paperC = paper, midC = mix(toSRGB(tint), inkC, .35);
          float k = sl * 2., f = smoothstep(.3, .7, fract(k)), on = step(bayer4(px), f);   // flat tones, dither only in the steps
          c = k < 1. ? mix(inkC, midC, on) : mix(midC, paperC, on);
          float warm = smoothstep(1.2, 2.2, luma(hdr * exposure));                 // windows, fire and lamps keep their glow
          c = mix(c, vec3(1., .78, .45), warm);
          c = mix(c, inkC, outline * .8);
        }
        vec2 q = vUv - .5; c *= 1. - dot(q, q) * .3;
        gl_FragColor = vec4(c, 1.);
      }`, finalU());

    this.finalClean = pass(COMMON + /* glsl */`
      uniform sampler2D src, bloom1, bloom2, blurTex; uniform vec2 res; uniform float exposure, bloomAmt, time, tilt;
      varying vec2 vUv;
      void main(){
        vec3 c = texture2D(src, vUv).rgb;
        float band = smoothstep(.2, .55, abs(vUv.y - .44)) * tilt;
        c = mix(c, texture2D(blurTex, vUv).rgb, band * .7);
        c += (texture2D(bloom1, vUv).rgb + texture2D(bloom2, vUv).rgb) * bloomAmt;
        c = aces(c * exposure);
        c = toSRGB(c);
        vec2 q = vUv - .5; c *= 1. - dot(q, q) * .3;
        c += (h21(vUv * res + fract(time) * 31.) - .5) * .018;
        gl_FragColor = vec4(c, 1.);
      }`, finalU());

    this.finalPaint = pass(COMMON + /* glsl */`
      uniform sampler2D src, raw, depthTex, normalTex, bloom1, bloom2, blurTex; uniform vec2 res, srcRes; uniform float time, bloomAmt, exposure;
      uniform vec3 ink, paper, tint; uniform int style; uniform float inkAmt, focus, soft;
      varying vec2 vUv;
      vec3 K(vec2 uv){ return style == 4 ? toSRGB(aces(texture2D(raw, uv).rgb * exposure)) : texture2D(src, uv).rgb; }
      float Z(vec2 uv){ return -viewZ(texture2D(depthTex, uv).r); }
      float inkLines(vec2 uv, vec2 dt, float w){
        float z = Z(uv), zn = 1e9;
        zn = min(zn, Z(uv + vec2(dt.x * w, 0))); zn = min(zn, Z(uv - vec2(dt.x * w, 0)));
        zn = min(zn, Z(uv + vec2(0, dt.y * w))); zn = min(zn, Z(uv - vec2(0, dt.y * w)));
        return smoothstep(.05, .12, (z - zn) / z) * step(z, 90.);
      }
      void main(){
        vec2 p = vUv * res, dt = 1. / res;
        vec2 wob = (vec2(vn(p * .01 + 3.), vn(p * .01 + 9.)) - .5) * 4. / res + (vec2(vn(p * .06), vn(p * .06 + 5.)) - .5) * 1.2 / res;
        vec2 uv = vUv + wob;
        vec3 c = K(uv);
        vec3 glow = toSRGB(min((texture2D(bloom1, vUv).rgb + texture2D(bloom2, vUv).rgb) * bloomAmt * .7, vec3(1.)));
        float paperG = fbm(p * .35), fib = vn(vec2(p.x * .9, p.y * .09)) * .5 + vn(vec2(p.x * .07, p.y * .8)) * .5;

        if (style <= 2){
          vec2 t = 1.5 / srcRes;
          float gx = luma(K(uv + vec2(t.x, 0))) - luma(K(uv - vec2(t.x, 0))), gy = luma(K(uv + vec2(0, t.y))) - luma(K(uv - vec2(0, t.y)));
          float edge = clamp(length(vec2(gx, gy)) * 4., 0., 1.);
          c *= 1. - edge * (style == 1 ? .3 : .18);
          float wash = fbm(p * .006 + 4.) - .5;
          c *= 1. + (paperG - .5) * (style == 1 ? .14 : .08) + wash * .16;
          c = mix(c, vec3(luma(c)), -.08);
          float line = inkLines(uv, dt, 1.5) * (.55 + .45 * vn(p * .08));
          c = mix(c, toSRGB(ink), line * (style == 1 ? .5 : .28));
          c += glow * .35;
          c = mix(c, paper, smoothstep(.7, 1., luma(c)) * .45);
          c = mix(c, c * paper, .18);
          c *= .965 + fib * .05;
        } else if (style == 3){
          // Bousseau et al. 2006: modify colour by pigment density d, C' = C - (C - C^2)(d - 1).
          vec3 blurred = texture2D(blurTex, uv).rgb;
          // Grade: mute greens toward olive, and give the darks a cool violet tint instead of grey.
          float gk = smoothstep(.0, .12, c.g - max(c.r, c.b));
          c = mix(c, vec3(luma(c)) * vec3(1.02, 1., .9), gk * .32);
          float lc = luma(c);
          c = mix(c, c * vec3(.86, .84, 1.08) + vec3(.02, .015, .04), (1. - lc) * (1. - lc) * .5);
          float turb = fbm(p * .0045 + 2.) * .6 + fbm(p * .02 + 8.) * .4;
          // Wet-in-wet: the paint bleeds in patches, and more the further a thing is from where the eye rests.
          float zf = Z(uv), away = abs(zf - focus) / focus;
          float bleed = smoothstep(.55, .8, fbm(p * .008 + 6.)) * (.16 + .22 * soft);
          float wet = max(bleed, smoothstep(.06, .5, away) * .85 * soft);
          c = mix(c, blurred, wet);
          c = mix(c, paper, .08);
          // Glow: the soft copy screened over the sharp one (an Orton glaze), so light seems to spill into the air.
          vec3 orton = 1. - (1. - c) * (1. - blurred * .55);
          c = mix(c, orton, .4 * soft);
          c = mix(vec3(luma(c)), c, 1. + .1 * soft);
          // Air: a pale, light veil thickening with distance, so the far shore melts and the darks never go hard.
          vec3 haze = mix(paper, toSRGB(tint), .3) * 1.03;
          c = mix(c, haze, soft * (.04 + .22 * smoothstep(.5, 2.4, zf / focus)));
          // Washes laid in layers: values settle into a few glazes with soft-but-visible steps.
          float lw = luma(c), steps = 6.;
          float lq = (floor(lw * steps + (turb - .5) * .5) + smoothstep(.25, .75, fract(lw * steps + (turb - .5) * .5))) / steps;
          c *= mix(1., clamp(lq / max(lw, .02), .6, 1.5), .35);
          // Cold-pressed paper: pigment settles in the pits of the grain, a few pixels across.
          float grain = vn(p * .55) * .5 + vn(p * 1.1 + 3.) * .3 + vn(p * 2.3 + 7.) * .2;
          float edge = clamp(length(c - blurred) * 1.6, 0., 1.) * (1. - wet * .8);
          float d = 1. + (turb - .5) * .7 + (paperG - .5) * .25 + (grain - .5) * .55 * (1. - lw) + edge * .5;
          c = c - (c - c * c) * (d - 1.);
          // Dried edges: where one wash meets another the pigment leaves a thin darker rim.
          vec2 e1 = vec2(1.5 / res.x, 0), e2 = vec2(0, 1.5 / res.y);
          float rim = abs(luma(K(uv + e1)) - luma(K(uv - e1))) + abs(luma(K(uv + e2)) - luma(K(uv - e2)));
          c *= 1. - smoothstep(.05, .16, rim) * .16 * (1. - wet);      // no hard rims where the paint has run
          c += glow * (.4 + .35 * soft);
          // Leave the paper white where the wash is lightest, with a soft wet edge.
          float l = luma(c);
          c = mix(c, paper, smoothstep(.78, .95, l + (turb - .5) * .15));
          // Ink, only on man-made things: outline where the depth steps, and creases where the normals turn.
          float mask = 0.; vec4 nc = texture2D(normalTex, uv);
          for (int i = 0; i < 9; i++){ vec2 o = vec2(float(i % 3) - 1., float(i / 3) - 1.) * dt * 1.6; mask = max(mask, texture2D(normalTex, uv + o).a); }
          float crease = 0.;
          for (int i = 0; i < 4; i++){
            vec2 o = (i == 0 ? vec2(1, 0) : i == 1 ? vec2(-1, 0) : i == 2 ? vec2(0, 1) : vec2(0, -1)) * dt * 1.2;
            vec4 nn = texture2D(normalTex, uv + o);
            crease = max(crease, smoothstep(.3, .65, 1. - dot(nc.xyz * 2. - 1., nn.xyz * 2. - 1.)) * nc.a * nn.a);
          }
          float z = Z(uv);
          float line = max(inkLines(uv, dt, 1.4) * mask, crease * .65) * step(z, 70.) * (.55 + .45 * vn(p * .09));
          c = mix(c, toSRGB(ink), line * .62 * inkAmt * (1. - .35 * soft) * (1. - wet));
          c *= .97 + fib * .04;
        } else {
          // Ink line and light wash: flatten light into soft bands, wash toward paper, ink outlines and hatching.
          float l = luma(c);
          float lb = (floor(l * 4.) + smoothstep(.3, .7, fract(l * 4.))) / 4.;
          c *= mix(1., lb / max(l, 1e-3), .8);
          c = mix(c, vec3(luma(c)), -.15);
          c = mix(c, paper, .3) * mix(vec3(1.), paper, .45) + .03;
          c += glow * .5;
          vec3 n = texture2D(normalTex, uv).xyz * 2. - 1.;
          float crease = 0.;
          for (int i = 0; i < 4; i++){
            vec2 o = (i == 0 ? vec2(1, 0) : i == 1 ? vec2(-1, 0) : i == 2 ? vec2(0, 1) : vec2(0, -1)) * dt * 1.2;
            crease = max(crease, smoothstep(.35, .7, 1. - dot(n, texture2D(normalTex, uv + o).xyz * 2. - 1.)));
          }
          float z = Z(uv);
          float line = max(inkLines(uv, dt, 1.4), crease * step(z, 60.) * .7) * (.6 + .4 * vn(p * .1));
          float sl = luma(c);
          vec2 hp = p + (vec2(vn(p * .02), vn(p * .02 + 3.)) - .5) * 6.;
          float h1 = smoothstep(.32, .22, sl) * step(fract((hp.x + hp.y) / 5.5), .22);
          float h2 = smoothstep(.2, .12, sl) * step(fract((hp.x - hp.y) / 5.5), .22);
          float inkAmt = clamp(line + (h1 + h2) * .55, 0., 1.) * step(z, 120.);
          c = mix(c, toSRGB(ink), inkAmt * .85);
          c *= .965 + fib * .05;
        }
        vec2 q = vUv - .5;
        if (style == 3) c = mix(c, paper * .96, smoothstep(.16, .5, dot(q * vec2(1., .9), q)) * .55);   // fade into paper, not black
        else c *= 1. - dot(q, q) * .28;
        gl_FragColor = vec4(c, 1.);
      }`, finalU());
  }

  setSize(W, H){
    this.W = W; this.H = H;
    const f = FINISHES[this.mode] || FINISHES.clean;
    this.fullRT.setSize(W, H);
    this.px = Math.max(2, Math.round(H / (270 * (f.lowScale || 1))));
    this.lowRT.setSize(Math.ceil(W / this.px), Math.ceil(H / this.px));
    const hw = Math.ceil(W * this.paintScale), hh = Math.ceil(H * this.paintScale);
    this.halfRT.setSize(hw, hh); this.kuwRT.setSize(hw, hh); this.tfm[0].setSize(hw, hh); this.tfm[1].setSize(hw, hh);
    const q = [Math.ceil(W / 4), Math.ceil(H / 4)], e = [Math.ceil(W / 8), Math.ceil(H / 8)];
    this.b[0].setSize(...q); this.b[1].setSize(...q); this.b[2].setSize(...e); this.b[3].setSize(...e);
    this.d[0].setSize(...q); this.d[1].setSize(...q);
  }
  setMode(m){ this.mode = FINISHES[m] ? m : 'clean'; this.setSize(this.W, this.H); }

  target(f){ return f.base === 'low' ? this.lowRT : f.base === 'half' ? this.halfRT : this.fullRT; }

  _blur(src, a, b, w, h, scale = 1){
    this.blur.u.src.value = src.texture; this.blur.u.dir.value.set(scale / w, 0); this.blur.run(this.r, a);
    this.blur.u.src.value = a.texture; this.blur.u.dir.value.set(0, scale / h); this.blur.run(this.r, b);
  }

  render(scene, camera, opts){
    const r = this.r, f = FINISHES[this.mode] || FINISHES.clean, T = this.target(f);
    r.setRenderTarget(T); r.render(scene, camera);
    if (f.normals){
      // A view-space normal pass, without sky, water and particles.
      if (this.normalRT.width !== T.width || this.normalRT.height !== T.height) this.normalRT.setSize(T.width, T.height);
      const hidden = (opts.normalHide || []).filter(o => o.visible);
      hidden.forEach(o => { o.visible = false; });
      const bg = scene.background, fog = scene.fog, swapped = [];
      scene.traverseVisible(o => {
        if (!o.isMesh) return;
        let ink = false; for (let p = o; p; p = p.parent) if (p.userData.ink){ ink = true; break; }
        swapped.push([o, o.material]); o.material = ink ? this.normalInk : this.normalPlain;
      });
      scene.background = null; scene.fog = null;
      r.setRenderTarget(this.normalRT); r.setClearColor(0x8080ff, 0); r.clear(); r.render(scene, camera);
      for (const [o, m] of swapped) o.material = m;
      scene.background = bg; scene.fog = fog; r.setClearColor(0x000000, 1);
      hidden.forEach(o => { o.visible = true; });
    }
    // Bloom from the bright parts.
    this.bright.u.src.value = T.texture; this.bright.u.threshold.value = opts.threshold ?? 1;
    this.bright.run(r, this.b[0]);
    const [qw, qh] = [this.b[0].width, this.b[0].height], [ew, eh] = [this.b[2].width, this.b[2].height];
    this._blur(this.b[0], this.b[1], this.b[0], qw, qh);
    this.copy.u.src.value = this.b[0].texture; this.copy.run(r, this.b[2]);
    this._blur(this.b[2], this.b[3], this.b[2], ew, eh, 1.5);
    this._blur(this.b[2], this.b[3], this.b[2], ew, eh, 2.5);

    let src = T;
    if (f.kuwahara){
      const K = f.kuwahara === 'aniso' ? this.anisoKuwahara : this.kuwahara;
      for (const P of [this.tensor, K]){ P.u.src.value = T.texture; P.u.srcRes.value.set(T.width, T.height); P.u.exposure.value = opts.exposure; P.u.R.value = Math.max(2, Math.round((f.R || 4) * this.paintScale / .55)); }
      if (f.kuwahara === 'aniso'){
        this.tensor.run(r, this.tfm[0]);
        this._blur(this.tfm[0], this.tfm[1], this.tfm[0], T.width, T.height, 1.6);
        K.u.tfm.value = this.tfm[0].texture;
      }
      K.run(r, this.kuwRT); src = this.kuwRT;
    }
    if (f.blur){
      this.copy.u.src.value = src.texture; this.copy.run(r, this.d[0]);
      this._blur(this.d[0], this.d[1], this.d[0], qw, qh, 1.2);
      this._blur(this.d[0], this.d[1], this.d[0], qw, qh, 2.2);
    }
    const F = f.final === 'pixel' ? this.finalPixel : f.final === 'paint' ? this.finalPaint : this.finalClean;
    const U = F.u;
    U.src.value = src.texture; U.raw.value = T.texture; U.depthTex.value = T.depthTexture; U.normalTex.value = this.normalRT.texture;
    U.bloom1.value = this.b[0].texture; U.bloom2.value = this.b[2].texture; U.blurTex.value = this.d[0].texture;
    U.res.value.set(this.W, this.H); U.srcRes.value.set(T.width, T.height);
    U.time.value = opts.time; U.exposure.value = opts.exposure; U.bloomAmt.value = opts.bloom ?? .6;
    U.near.value = camera.near; U.far.value = camera.far; U.style.value = f.style || 1; U.tilt.value = opts.tilt ?? 1;
    if (opts.tint) U.tint.value.copy(opts.tint);
    if (U.inkAmt) U.inkAmt.value = opts.inkAmt ?? 1;
    if (U.soft){ U.soft.value = opts.soft ?? 0; U.focus.value = opts.focus ?? 60; }
    F.run(r, null);
  }
}
