// Time-of-day palette: keyframes keyed by sun altitude, one track per season.
// Everything is interpolated smoothly so scrubbing the day never pops.

const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

// Field order matters only for readability. Colours are hex strings, converted below.
// sky: zenith, upper (~24°), mid (~10°), low (~3°), horizon
// glow: colour of the horizon glow toward the sun, its strength and azimuth width (deg)
// light/lift/sat: grading of the painted layers (multiply, additive shadow lift, saturation)
// haze: aerial perspective colour; hazeK: amount for [far hills, back forest, mid forest, main]
// emis: window/lamp strength; stars; cloud: [shade, mid, lit] ramp and opacity
// deep: water body colour; refl: reflectivity; smoke; ui: 0 dark text .. 1 light text
// bloom: bloom threshold; aurora: aurora strength
const SUMMER = [
  { alt: -18, sky: ['#0b1024', '#121a3a', '#1c2850', '#2a3762', '#39466f'], glow: '#3e4475', glowAmt: .25, glowW: 60,
    light: [.24, .26, .40], lift: [.015, .02, .05], sat: .72, haze: '#222d52', hazeK: [.6, .45, .3, .05], emis: 1, stars: 1,
    cloud: ['#0e1430', '#1b2546', '#2c3a66'], cloudOp: .55, deep: '#0b1128', refl: .85, smoke: '#59618a', ui: 1, bloom: .5, aurora: 0 },
  { alt: -11, sky: ['#1b2350', '#2a3568', '#454f8c', '#6a6aa2', '#8d80aa'], glow: '#b48aa6', glowAmt: .5, glowW: 55,
    light: [.42, .42, .58], lift: [.03, .03, .07], sat: .78, haze: '#5f6194', hazeK: [.62, .46, .3, .06], emis: 1, stars: .65,
    cloud: ['#2c3462', '#4b5184', '#7d71a0'], cloudOp: .75, deep: '#1f2650', refl: .9, smoke: '#8a8cb4', ui: 1, bloom: .55, aurora: 0 },
  { alt: -6, sky: ['#5f6aae', '#8f8fcc', '#c2a6d2', '#ecb9c0', '#fbd2b0'], glow: '#ffc59a', glowAmt: .85, glowW: 65,
    light: [.84, .70, .80], lift: [.06, .04, .09], sat: .86, haze: '#c4a8cc', hazeK: [.68, .5, .32, .06], emis: .95, stars: .05,
    cloud: ['#8a84c0', '#e6b8cc', '#ffd9b8'], cloudOp: .96, deep: '#6e6ca8', refl: .92, smoke: '#efe4ea', ui: 1, bloom: .62, aurora: 0 },
  { alt: -2.5, sky: ['#5a6cb6', '#8a8ccc', '#cfa6c4', '#f4b8a0', '#ffc890'], glow: '#ffae78', glowAmt: 1, glowW: 48,
    light: [.98, .72, .64], lift: [.05, .03, .06], sat: .9, haze: '#e3aeae', hazeK: [.62, .44, .28, .05], emis: .8, stars: 0,
    cloud: ['#8378b2', '#eaa8b4', '#ffcc9c'], cloudOp: 1, deep: '#626aa4', refl: .9, smoke: '#f1e0de', ui: 1, bloom: .66, aurora: 0 },
  { alt: .5, sky: ['#5878bc', '#7f96d0', '#c7b0cc', '#f6c09c', '#ffcc88'], glow: '#ffa868', glowAmt: 1, glowW: 40,
    light: [1.04, .80, .62], lift: [.04, .03, .04], sat: .95, haze: '#ebbaa0', hazeK: [.58, .4, .25, .05], emis: .6, stars: 0,
    cloud: ['#8c86b6', '#f2bcae', '#ffd8a4'], cloudOp: 1, deep: '#58689e', refl: .9, smoke: '#f4e6de', ui: 1, bloom: .72, aurora: 0 },
  { alt: 4, sky: ['#5574bc', '#7e94cc', '#cdb8c8', '#f6c898', '#ffcf86'], glow: '#ffb86e', glowAmt: .95, glowW: 44,
    light: [1.14, .86, .62], lift: [.03, .02, .02], sat: 1.06, haze: '#ecbe98', hazeK: [.56, .36, .23, .05], emis: .36, stars: 0,
    cloud: ['#8a88bc', '#f4c0ac', '#ffe0ae'], cloudOp: 1, deep: '#48659c', refl: .88, smoke: '#f6ece4', ui: 1, bloom: .78, aurora: 0 },
  { alt: 10, sky: ['#4078c6', '#6098d6', '#a2c0de', '#dfe0dc', '#f6e8d0'], glow: '#ffe2b0', glowAmt: .5, glowW: 50,
    light: [1.08, .96, .84], lift: [.02, .02, .03], sat: 1, haze: '#b9d0e6', hazeK: [.5, .3, .18, .03], emis: .06, stars: 0,
    cloud: ['#98aed0', '#e8eef6', '#fffaf0'], cloudOp: 1, deep: '#3a5f96', refl: .85, smoke: '#f2f2f2', ui: 1, bloom: .86, aurora: 0 },
  { alt: 22, sky: ['#3270c6', '#5090d8', '#80b2e4', '#b4d4ee', '#d9e9f0'], glow: '#ffffff', glowAmt: .18, glowW: 60,
    light: [1.04, 1.02, .98], lift: [.02, .025, .035], sat: 1.03, haze: '#abc8e6', hazeK: [.48, .28, .16, .03], emis: .03, stars: 0,
    cloud: ['#94acd0', '#e6eef8', '#ffffff'], cloudOp: 1, deep: '#2f5a94', refl: .82, smoke: '#f4f4f4', ui: 1, bloom: .9, aurora: 0 },
  { alt: 45, sky: ['#2a64c0', '#4686d6', '#76aae2', '#acd0ee', '#d4e6f0'], glow: '#ffffff', glowAmt: .15, glowW: 60,
    light: [1.05, 1.03, 1.0], lift: [.02, .025, .035], sat: 1.04, haze: '#a8c6e6', hazeK: [.46, .27, .15, .03], emis: .02, stars: 0,
    cloud: ['#93abd0', '#e6eef8', '#ffffff'], cloudOp: 1, deep: '#2c5894', refl: .8, smoke: '#f6f6f6', ui: 1, bloom: .92, aurora: 0 },
];

const WINTER = [
  { alt: -18, sky: ['#050912', '#09122a', '#0f1d40', '#182c58', '#22396a'], glow: '#2a3a6a', glowAmt: .2, glowW: 60,
    light: [.40, .46, .70], lift: [.02, .03, .07], sat: .72, haze: '#1a2850', hazeK: [.6, .48, .32, .06], emis: 1, stars: 1,
    cloud: ['#0a1024', '#121b36', '#1e2b52'], cloudOp: .3, deep: '#0c1430', refl: .8, smoke: '#5a6890', ui: 1, bloom: .5, aurora: 1 },
  { alt: -11, sky: ['#0b1530', '#13234a', '#1f3668', '#2f4c86', '#44649e'], glow: '#5f6aa4', glowAmt: .3, glowW: 55,
    light: [.48, .54, .80], lift: [.03, .04, .09], sat: .76, haze: '#2b4274', hazeK: [.6, .46, .3, .06], emis: 1, stars: .8,
    cloud: ['#111a36', '#1d2a4e', '#30406e'], cloudOp: .5, deep: '#152048', refl: .82, smoke: '#6c7aa4', ui: 1, bloom: .52, aurora: .7 },
  { alt: -6, sky: ['#1a2c60', '#2a4384', '#4466a8', '#6e8ac2', '#9aa8cc'], glow: '#d6a0b0', glowAmt: .5, glowW: 50,
    light: [.62, .66, .90], lift: [.04, .05, .10], sat: .8, haze: '#5a76aa', hazeK: [.62, .46, .3, .06], emis: 1, stars: .2,
    cloud: ['#36477a', '#5a6c9e', '#8a90b8'], cloudOp: .7, deep: '#2a3c6c', refl: .85, smoke: '#8e9cc4', ui: 1, bloom: .56, aurora: .15 },
  { alt: -2.5, sky: ['#22386e', '#34508e', '#6276b0', '#b294b4', '#e0a69a'], glow: '#f08e78', glowAmt: .75, glowW: 42,
    light: [.72, .72, .90], lift: [.05, .05, .10], sat: .84, haze: '#7c80b0', hazeK: [.6, .44, .28, .06], emis: 1, stars: .05,
    cloud: ['#3e4a80', '#8a7ca6', '#c898a6'], cloudOp: .85, deep: '#3e4a7c', refl: .85, smoke: '#a8a8c4', ui: 1, bloom: .6, aurora: 0 },
  { alt: .5, sky: ['#2c4482', '#465e9e', '#8288bc', '#d2a2b2', '#f2b496'], glow: '#ff9a70', glowAmt: .9, glowW: 42,
    light: [.84, .78, .88], lift: [.05, .05, .09], sat: .86, haze: '#a493b8', hazeK: [.58, .42, .27, .05], emis: .9, stars: 0,
    cloud: ['#525a94', '#bc94b0', '#f0b4a0'], cloudOp: .9, deep: '#4a5688', refl: .85, smoke: '#cbbcca', ui: 1, bloom: .68, aurora: 0 },
  { alt: 4, sky: ['#3e66aa', '#5e82be', '#a8aed0', '#f0c0a8', '#ffc894'], glow: '#ffb47e', glowAmt: .9, glowW: 42,
    light: [1.06, .86, .76], lift: [.03, .03, .05], sat: .92, haze: '#d0b8c0', hazeK: [.56, .36, .23, .04], emis: .45, stars: 0,
    cloud: ['#7a86b8', '#e8c4c4', '#fff0dc'], cloudOp: 1, deep: '#52649a', refl: .85, smoke: '#ece4e2', ui: 1, bloom: .78, aurora: 0 },
  { alt: 10, sky: ['#4a7cc2', '#6c98d4', '#a6c0e0', '#d6e2ee', '#eef0f2'], glow: '#fff0d8', glowAmt: .35, glowW: 50,
    light: [1.02, .99, .97], lift: [.03, .03, .04], sat: .95, haze: '#c4d4e8', hazeK: [.52, .32, .2, .04], emis: .08, stars: 0,
    cloud: ['#a0b2d2', '#eef2f8', '#ffffff'], cloudOp: 1, deep: '#4a6a9e', refl: .85, smoke: '#f0f0f2', ui: 1, bloom: .88, aurora: 0 },
  { alt: 22, sky: ['#3a76c4', '#5a94d6', '#8ab8e4', '#bcd8ee', '#e0ecf2'], glow: '#ffffff', glowAmt: .18, glowW: 60,
    light: [1.03, 1.02, 1.0], lift: [.03, .03, .04], sat: .98, haze: '#b6cce6', hazeK: [.5, .3, .18, .03], emis: .03, stars: 0,
    cloud: ['#9cb0d2', '#eaf0f8', '#ffffff'], cloudOp: 1, deep: '#3e6298', refl: .85, smoke: '#f4f4f4', ui: 1, bloom: .92, aurora: 0 },
  { alt: 45, sky: ['#3270c2', '#5090d6', '#80b2e4', '#b4d4ee', '#dceaf2'], glow: '#ffffff', glowAmt: .15, glowW: 60,
    light: [1.03, 1.02, 1.0], lift: [.03, .03, .04], sat: 1, haze: '#b0c8e6', hazeK: [.48, .29, .17, .03], emis: .02, stars: 0,
    cloud: ['#98aed2', '#e8eef8', '#ffffff'], cloudOp: 1, deep: '#3a6098', refl: .85, smoke: '#f6f6f6', ui: 1, bloom: .92, aurora: 0 },
];

function convert(kf){
  const o = {};
  for (const k in kf){
    const v = kf[k];
    if (typeof v === 'string') o[k] = hex(v);
    else if (Array.isArray(v) && typeof v[0] === 'string') o[k] = v.map(hex);
    else o[k] = v;
  }
  return o;
}
const S = SUMMER.map(convert), W = WINTER.map(convert);

function mixV(a, b, t){
  if (typeof a === 'number') return a + (b - a) * t;
  return a.map((x, i) => mixV(x, b[i], t));
}
function mixKF(a, b, t){ const o = {}; for (const k in a) o[k] = mixV(a[k], b[k], t); return o; }

// Seasons other than summer/winter are blends of the two tracks.
const BLEND = { summer: 0, autumn: .32, late: .55, spring: .3, winter: 1 };
const AURORA = { summer: 0, autumn: .5, late: .65, spring: .35, winter: 1 };
const TRACKS = {};
for (const s of Object.keys(BLEND)){
  TRACKS[s] = S.map((kf, i) => {
    const m = mixKF(kf, W[i], BLEND[s]);
    if (s !== 'winter' && s !== 'summer' && kf.alt <= -6) m.light = mixV(kf.light, W[i].light, BLEND[s] * .4);
    if (s === 'autumn' || s === 'late'){            // autumn dusk runs warmer and a little hazier
      m.haze = mixV(m.haze, hex('#d9a68c'), kf.alt > -4 && kf.alt < 8 ? .25 : 0);
    }
    m.aurora = W[i].aurora * AURORA[s];
    return m;
  });
}

const smooth = t => t * t * (3 - 2 * t);
/** Interpolated palette for a season at a given sun altitude (degrees). */
export function paletteAt(season, alt){
  const T = TRACKS[season] || TRACKS.summer;
  if (alt <= T[0].alt) return T[0];
  if (alt >= T[T.length - 1].alt) return T[T.length - 1];
  let i = 0; while (alt > T[i + 1].alt) i++;
  const t = smooth((alt - T[i].alt) / (T[i + 1].alt - T[i].alt));
  return mixKF(T[i], T[i + 1], t);
}

/** Sun disc colour by altitude (linear-ish RGB, may exceed 1 for bloom). */
export function sunDiscColor(alt){
  const a = Math.max(-2, Math.min(30, alt));
  const stops = [[-2, [1.0, .55, .32]], [1, [1.0, .66, .40]], [4, [1.0, .82, .58]], [10, [1.0, .94, .82]], [30, [1.0, .99, .95]]];
  let i = 0; while (i < stops.length - 2 && a > stops[i + 1][0]) i++;
  const t = Math.max(0, Math.min(1, (a - stops[i][0]) / (stops[i + 1][0] - stops[i][0])));
  return mixV(stops[i][1], stops[i + 1][1], t);
}
