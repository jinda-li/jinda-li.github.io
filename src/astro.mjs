// Helsinki time, sun and moon positions.
// Solar/lunar formulas: low-precision series from Meeus' "Astronomical Algorithms"
// (the same set popularised by suncalc), good to a fraction of a degree.

export const LAT = 60.17, LON = 24.94;
const RAD = Math.PI / 180, DAY_MS = 864e5, J1970 = 2440588, J2000 = 2451545;
const OBL = RAD * 23.4397;

const toDays = ms => ms / DAY_MS - 0.5 + J1970 - J2000;
const rightAscension = (l, b) => Math.atan2(Math.sin(l) * Math.cos(OBL) - Math.tan(b) * Math.sin(OBL), Math.cos(l));
const declination = (l, b) => Math.asin(Math.sin(b) * Math.cos(OBL) + Math.cos(b) * Math.sin(OBL) * Math.sin(l));
const azimuthS = (H, phi, dec) => Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
const altitudeA = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
const sidereal = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw;

function sunCoords(d){
  const M = RAD * (357.5291 + 0.98560028 * d);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}
function moonCoords(d){
  const L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.22935 * d);
  const l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F), dist = 385001 - 20905 * Math.cos(M);
  return { ra: rightAscension(l, b), dec: declination(l, b), dist };
}
function refraction(h){ if (h < 0) h = 0; return 0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179)); }

/** Sun position: altitude and compass azimuth (0 = north, 90 = east), degrees. */
export function sunPosition(ms, lat = LAT, lon = LON){
  const lw = RAD * -lon, phi = RAD * lat, d = toDays(ms), c = sunCoords(d), H = sidereal(d, lw) - c.ra;
  return { alt: altitudeA(H, phi, c.dec) / RAD, az: (azimuthS(H, phi, c.dec) / RAD + 180 + 360) % 360 };
}
/** Moon position, illuminated fraction, and the bright limb angle relative to the sun. */
export function moonPosition(ms, lat = LAT, lon = LON){
  const lw = RAD * -lon, phi = RAD * lat, d = toDays(ms), c = moonCoords(d), H = sidereal(d, lw) - c.ra;
  let h = altitudeA(H, phi, c.dec); h += refraction(h);
  const s = sunCoords(d), sdist = 149598000;
  const ph = Math.acos(Math.sin(s.dec) * Math.sin(c.dec) + Math.cos(s.dec) * Math.cos(c.dec) * Math.cos(s.ra - c.ra));
  const inc = Math.atan2(sdist * Math.sin(ph), c.dist - sdist * Math.cos(ph));
  const ang = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - c.ra), Math.sin(s.dec) * Math.cos(c.dec) - Math.cos(s.dec) * Math.sin(c.dec) * Math.cos(s.ra - c.ra));
  return {
    alt: h / RAD, az: (azimuthS(H, phi, c.dec) / RAD + 180 + 360) % 360,
    fraction: (1 + Math.cos(inc)) / 2,
    phase: 0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / Math.PI,  // 0 new, .25 first quarter, .5 full, .75 last quarter
  };
}

// ---------- Helsinki wall clock ----------
const FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
export function helsinkiParts(ms){
  const o = {};
  for (const p of FMT.formatToParts(new Date(ms))) if (p.type !== 'literal') o[p.type] = +p.value;
  return { y: o.year, mo: o.month, d: o.day, h: o.hour % 24, mi: o.minute, s: o.second };
}
/** UTC instant (ms) of a Helsinki wall-clock time. */
export function helsinkiToUTC(y, mo, d, h, mi, s = 0){
  const want = Date.UTC(y, mo - 1, d, h, mi, s);
  let t = want - 2 * 3600e3;
  for (let i = 0; i < 3; i++){
    const p = helsinkiParts(t);
    t += want - Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
  }
  return t;
}

/** Season from the Helsinki date. */
export function seasonOf(mo, d){
  if (mo === 12 || mo <= 3) return 'winter';
  if (mo === 4) return 'spring';
  if (mo <= 8) return 'summer';
  if (mo <= 10) return 'autumn';
  return 'late';                     // November: bare birches, no snow yet
}
export const SEASON_CYCLE = ['summer', 'autumn', 'late', 'winter', 'spring'];

/** A word for the moment, shown next to the clock. */
export function momentWord(p, sunAlt, sunRising, season){
  const h = p.h + p.mi / 60;
  const mo = p.mo;
  const white = (mo === 6 || (mo === 5 && p.d > 20) || (mo === 7 && p.d < 25));
  const darkMonths = mo === 11 || mo === 12 || mo === 1;
  if (white && sunAlt < 1.5 && (h >= 21.5 || h < 4.5)) return '仲夏夜';
  if (darkMonths && !sunRising && sunAlt < 3 && sunAlt > -10 && h > 12) return '蓝调时刻';
  if (sunAlt > 0){
    if (sunAlt < 7) return sunRising ? '晨光' : '金色时刻';
    if (h < 11) return '上午';
    if (h < 14) return season === 'winter' ? '冬日正午' : '正午';
    return '午后';
  }
  if (sunAlt > -4) return sunRising ? '日出前' : '日落';
  if (white && sunAlt > -9 && (h >= 21 || h < 5)) return '仲夏夜';
  if (sunAlt > -10) return '蓝调时刻';
  if ((mo === 12 || mo === 1) && (h >= 15 || h < 9)) return '极夜';
  if (h >= 4 && h < 10) return '黎明前';
  if (h < 2 || h >= 23) return '深夜';
  return '夜';
}
