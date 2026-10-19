// The time-and-season switcher in the corner. By default the lake shows the visitor's own
// wall-clock time and season (flipped by six months south of the equator), painted onto the
// Helsinki lakeside. Picking a season or dragging the time sets a custom moment that keeps ticking.
import { helsinkiToUTC } from './astro.mjs';

const SOUTH = /^(Australia|Antarctica|Pacific\/(Auckland|Chatham|Fiji|Tongatapu|Apia|Noumea|Efate|Port_Moresby)|America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|Punta_Arenas)|Africa\/(Johannesburg|Maputo|Harare|Windhoek|Lusaka|Gaborone|Maseru|Mbabane|Luanda|Blantyre)|Indian\/(Mauritius|Reunion|Antananarivo))/;
/** A day that shows each season at its best. */
export const SEASON_DAYS = { spring: [4, 28], summer: [7, 12], midsummer: [6, 21], autumn: [10, 2], winter: [1, 22] };

function southern(){
  try { return SOUTH.test(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch { return false; }
}

/** The visitor's own moment as a Helsinki wall-clock time: same hour, same (northern) season. */
function yours(){
  const n = new Date();
  let y = n.getFullYear(), mo = n.getMonth() + 1;
  if (southern()){ mo += 6; if (mo > 12){ mo -= 12; y += 1; } }
  const d = Math.min(n.getDate(), 28);
  return { y, mo, d, h: n.getHours(), mi: n.getMinutes(), s: n.getSeconds() };
}

export function createWhen({ stage, button, popover, labels, onChange }){
  const S = { mode: 'yours', season: null, minutes: null };

  function apply(){
    if (!stage) return;
    const me = yours();
    let target;
    if (S.mode === 'yours') target = helsinkiToUTC(me.y, me.mo, me.d, me.h, me.mi, me.s);
    else {
      const [mo, d] = S.season ? SEASON_DAYS[S.season] : [me.mo, me.d];
      const m = S.minutes ?? me.h * 60 + me.mi;
      target = helsinkiToUTC(me.y, mo, d, Math.floor(m / 60), m % 60);
    }
    stage.setShift(target - Date.now());
    onChange && onChange(S);
  }

  function render(){
    const L = labels(), me = yours();
    const m = S.minutes ?? me.h * 60 + me.mi, pad = n => String(n).padStart(2, '0');
    popover.innerHTML = `
      <button type="button" class="yours ${S.mode === 'yours' ? 'on' : ''}" data-yours>${L.yours}</button>
      <p class="lbl">${L.seasonLabel}</p>
      <p class="chips">${Object.keys(SEASON_DAYS).map(k => `<button type="button" data-season="${k}" class="${S.mode === 'custom' && S.season === k ? 'on' : ''}">${L.seasons[k]}</button>`).join('')}</p>
      <p class="lbl">${L.timeLabel} <b>${pad(Math.floor(m / 60))}:${pad(m % 60)}</b></p>
      <input type="range" min="0" max="1439" step="5" value="${m}" aria-label="${L.timeLabel}">`;
  }

  popover.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if ('yours' in b.dataset){ S.mode = 'yours'; S.season = null; S.minutes = null; }
    else if (b.dataset.season){ S.mode = 'custom'; S.season = b.dataset.season; }
    apply(); render();
  });
  popover.addEventListener('input', e => {
    if (e.target.type !== 'range') return;
    S.mode = 'custom'; S.minutes = +e.target.value;
    apply();
    const pad = n => String(n).padStart(2, '0'), b = popover.querySelector('.lbl b');
    if (b) b.textContent = `${pad(Math.floor(S.minutes / 60))}:${pad(S.minutes % 60)}`;
    popover.querySelector('[data-yours]').classList.remove('on');
  });
  button.addEventListener('click', e => { e.stopPropagation(); popover.hidden = !popover.hidden; button.setAttribute('aria-expanded', String(!popover.hidden)); if (!popover.hidden) render(); });
  document.addEventListener('pointerdown', e => { if (!popover.hidden && !popover.contains(e.target) && !button.contains(e.target)){ popover.hidden = true; button.setAttribute('aria-expanded', 'false'); } });

  return {
    S, apply, render,
    /** Set a season (and optionally minutes past midnight) from code, e.g. summer for rowing in winter. */
    set(season, minutes){ S.mode = 'custom'; S.season = season; if (minutes != null) S.minutes = minutes; apply(); if (!popover.hidden) render(); },
    yours(){ S.mode = 'yours'; S.season = null; S.minutes = null; apply(); },
  };
}
