// The page: navigation, the paper panel with the content, language, and the bridge to the lakeside stage.
import { PROFILE, PROJECTS, FEATURED, ROUTE, NOW, EXPERIENCE, EDUCATION, AWARDS } from './content.mjs';
import { UI, SECTIONS, MOMENT_EN } from './i18n.mjs';
import { createWhen } from './when.mjs';
import { createRowGame, BOAT } from './rowgame.mjs';

const Q = new URLSearchParams(location.search);
const REVIEW = Q.has('review');                       // ?review=1 marks private projects, for checking before going public
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get(k){ try { return localStorage.getItem(k); } catch { return null; } }, set(k, v){ try { localStorage.setItem(k, v); } catch {} } };

let lang = store.get('lang') || 'en';
const T = v => v == null ? '' : typeof v === 'object' && !Array.isArray(v) ? (v[lang] ?? v.en ?? '') : v;
const U = () => UI[lang];

// ---------- stage ----------
let stage = null;
const panel = $('#panel'), body = $('#panel .body');
async function startStage(){
  try {
    const test = document.createElement('canvas').getContext('webgl2');
    if (!test) throw new Error('no webgl2');
    const { createStage } = await import('./scene/stage.mjs');
    let override = null;
    if (Q.get('t') || Q.get('d')){
      const { helsinkiParts, helsinkiToUTC } = await import('./astro.mjs');
      const now = helsinkiParts(Date.now());
      const [mo, d] = (Q.get('d') || `${now.mo}-${now.d}`).split('-').map(Number);
      const [h, mi] = (Q.get('t') || `${now.h}:${now.mi}`).split(':').map(Number);
      override = helsinkiToUTC(now.y, mo, d, h, mi);
    }
    stage = createStage($('#lake'), {
      override,
      onHover: h => { hovered = h; tag.hidden = !h; if (h) renderTag(h); },
      onPick: id => { if (id) go(id); },
      onClock: c => { clockInfo = c; renderClock(); },
    });
    if (Q.has('debug')) window.__stage = stage;
    when = createWhen({ stage, button: $('#clock'), popover: $('#when'), labels: () => U().when, onChange: () => renderClock() });
    if (!override) when.apply();
    game = createRowGame({
      stage, el: $('#row'), steps: STEPS, U, T, esc,
      coverRight: () => innerWidth > 760 && document.body.classList.contains('open') ? panel.getBoundingClientRect().width : 0,
      highlight, onLeave: () => go('home'), onAgain: () => { game.stop(); startRow(); },
    });
    document.body.classList.add('ready');
    route();
  } catch (e) {
    console.warn('Lake scene unavailable, showing the painted still instead.', e);
    document.body.classList.add('nogl', 'ready');
    route();
  }
}

// ---------- header, clock, language ----------
let clockInfo = null, hovered = null, when = null, game = null;
function renderHeader(){
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  $('#name').textContent = PROFILE.name;
  $('#tagline').textContent = T(PROFILE.tagline);
  $('#nav').innerHTML = SECTIONS.map(s => `<a href="#${s}" data-s="${s}">${esc(U().nav[s])}</a>`).join('');
  $('#lang').innerHTML = `<button data-lang="en" class="${lang === 'en' ? 'on' : ''}">EN</button><button data-lang="zh" class="${lang === 'zh' ? 'on' : ''}">中</button>`;
  $('#hint').textContent = U().hint;
  $('#marks').innerHTML = [...SECTIONS, 'row'].map(s => `<a class="mark${s === 'row' ? ' row' : ''}" href="#${s}" data-s="${s}"><i></i>${esc(U().nav[s])}</a>`).join('');
  document.title = `${PROFILE.name} · ${T(PROFILE.tagline)}`;
  renderClock();
  markNav();
}
function renderClock(){
  if (!clockInfo){ $('#clock').hidden = true; return; }
  const c = clockInfo, pad = n => String(n).padStart(2, '0');
  const word = lang === 'zh' ? c.word : (MOMENT_EN[c.word] || '');
  $('#clock').hidden = false;
  const mine = !when || when.S.mode === 'yours';
  $('#clock').innerHTML = `<b>${pad(c.h)}:${pad(c.mi)} <small>${esc(mine ? U().yourTime : U().customTime)}</small></b><span>${esc(word)} · ${esc(U().season[c.season] || '')}</span>`;
}
$('#lang').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]'); if (!b) return;
  lang = b.dataset.lang; store.set('lang', lang); renderHeader(); route(true); game && game.relabel();
});

// ---------- hover tag and the small marks by each place ----------
const tag = $('#tag');
function renderTag(h){
  tag.innerHTML = h.id ? `<b>${esc(U().nav[h.id])}</b><span>${esc(U().place[h.id])}</span>` : `<span>${esc(U().toy)}</span>`;
}
function follow(){
  if (stage){
    if (hovered){ const a = stage.hoverAnchor(); if (a) tag.style.transform = `translate(${a.x}px, ${a.y}px)`; }
    if (!document.body.classList.contains('open')) for (const m of document.querySelectorAll('.mark')){
      const a = stage.anchorOf(m.dataset.s);
      m.style.visibility = a ? '' : 'hidden';
      // keep the whole label on screen; the stem still points at the place
      if (a) m.style.transform = `translate(${Math.min(a.x, innerWidth - m.offsetWidth + 6).toFixed(1)}px, ${a.y.toFixed(1)}px)`;
    }
  }
  requestAnimationFrame(follow);
}

// ---------- routing ----------
function go(section, id){ location.hash = id ? `${section}/${id}` : section; }
function markNav(){
  const [s] = location.hash.slice(1).split('/');
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.s === s));
}
let lastRoute = '';
function route(force){
  let [s, id] = location.hash.slice(1).split('/');
  if (s === 'now') s = 'about';                         // "now" lives on the about page
  if (s === 'row' && !stage){ location.replace('#work'); return; }
  markNav();
  const key = `${s}/${id || ''}/${lang}`;
  if (key === lastRoute && !force) return;
  const prevSection = lastRoute.split('/')[0];
  lastRoute = key;
  if (s !== 'row' && game && game.on) game.stop();
  if (!SECTIONS.includes(s) && s !== 'row'){ closePanel(); return; }
  openPanel(s, id);
  if (s === 'row'){ if (!(game && game.on)) startRow(); }
  else if (stage && s !== prevSection) stage.goView(s);
}
addEventListener('hashchange', () => route());
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (game && game.on) go('home');
  else if (document.body.classList.contains('open')) history.pushState('', '', location.pathname + location.search), route();
});

// On wide screens the panel covers the right side; on phones it is a sheet over the bottom.
const panelCover = () => innerWidth > 760 ? [panel.getBoundingClientRect().width, 0]
  : document.body.classList.contains('rowing') ? [0, 0] : [0, panel.getBoundingClientRect().height];
function openPanel(s, id){
  document.body.classList.add('open');
  document.body.classList.toggle('rowing', s === 'row');
  panel.dataset.section = s;
  $('#panel .kicker').textContent = U().kicker[s] ?? U().row.kicker;
  $('#panel h2').textContent = id ? '' : U().title[s] ?? U().row.title;
  $('#panel .close').setAttribute('aria-label', U().close);
  body.innerHTML = RENDER[s](id);
  panel.scrollTop = 0; body.scrollTop = 0;
  panel.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => stage && stage.setPanel(...panelCover()));
}
function closePanel(){
  document.body.classList.remove('open', 'rowing');
  panel.setAttribute('aria-hidden', 'true');
  if (stage){ stage.setPanel(0, 0); if (lastRoute && stage.state.view !== 'home') stage.goView('home'); }
}
$('#panel .close').addEventListener('click', () => { history.pushState('', '', location.pathname + location.search); route(); });
addEventListener('resize', () => { if (stage && document.body.classList.contains('open')) stage.setPanel(...panelCover()); });

// ---------- sections ----------
const linkRow = links => (links || []).length ? `<p class="links">${links.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</p>` : '';
const badge = p => [
  p.status && p.status !== 'released' ? `<span class="badge">${esc(U().status[p.status] || p.status)}</span>` : '',
  REVIEW && p.private ? `<span class="badge private">${esc(U().private)}</span>` : '',
].join('');
const cover = (p, cls = '') => p.cover
  ? `<img class="cover ${cls}" src="${esc(p.cover)}" alt="" loading="lazy">`
  : `<div class="cover blank ${cls}" style="--h:${[...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 360}"><span>${esc(T(p.title)).slice(0, 1)}</span></div>`;
let filter = 'all';

const RENDER = {
  work(id){
    if (id){
      const p = PROJECTS.find(x => x.id === id);
      if (!p) return `<p>${esc(U().back)}</p>`;
      const about = T(p.about);
      return `<a class="back" href="#work">← ${esc(U().back)}</a>
        <article class="project">
          ${cover(p, 'big')}
          <h3>${esc(T(p.title))}</h3>
          <p class="meta">${[p.year, U().kind[p.kind]].filter(Boolean).map(esc).join(' · ')} ${badge(p)}</p>
          <p class="lede">${esc(T(p.line))}</p>
          ${(Array.isArray(about) ? about : [about]).filter(Boolean).map(x => `<p>${esc(x)}</p>`).join('')}
          ${T(p.role) ? `<h4>${esc(U().role)}</h4><p>${esc(T(p.role))}</p>` : ''}
          ${(p.tech || []).length ? `<h4>${esc(U().tech)}</h4><p class="chips">${p.tech.map(t => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
          ${(p.links || []).length ? `<h4>${esc(U().links)}</h4>${linkRow(p.links)}` : ''}
        </article>`;
    }
    const kinds = ['all', ...new Set(PROJECTS.map(p => p.kind))];
    const show = p => filter === 'all' || p.kind === filter;
    const rank = p => { const i = (FEATURED || []).indexOf(p.id); return i < 0 ? 99 : i; };
    const featured = PROJECTS.filter(p => p.featured && show(p)).sort((a, b) => rank(a) - rank(b)), rest = PROJECTS.filter(p => !p.featured && show(p));
    const start = stage ? `<p><a class="row-start" href="#row">${BOAT}${esc(U().row.start)}</a></p>` : '';
    return `${start}<p class="chips filters">${kinds.map(k => `<button data-filter="${k}" class="${k === filter ? 'on' : ''}">${esc(U().filters[k] || k)}</button>`).join('')}</p>
      ${featured.length ? `<h4>${esc(U().featured)}</h4><div class="cards">${featured.map(p => `
        <a class="card" href="#work/${esc(p.id)}">${cover(p)}<b>${esc(T(p.title))}</b><span>${esc(T(p.line))}</span><em>${[p.year, U().kind[p.kind]].filter(Boolean).map(esc).join(' · ')} ${badge(p)}</em></a>`).join('')}</div>` : ''}
      ${rest.length ? `<h4>${esc(U().more)}</h4><ul class="rows">${rest.map(p => `
        <li><a href="#work/${esc(p.id)}"><b>${esc(T(p.title))}</b><span>${esc(T(p.line))}</span><em>${esc(p.year || '')} ${badge(p)}</em></a></li>`).join('')}</ul>` : ''}`;
  },
  experience(){
    const d = v => esc(String(v ?? '').replace('-', '.'));
    const span = x => `${d(x.from)}${x.to !== x.from ? `–${x.to ? d(x.to) : esc(U().present)}` : ''}`;
    return `<h4>${esc(U().experience)}</h4><ol class="timeline">${EXPERIENCE.map(x => `
        <li class="${x.highlight ? 'hl' : ''}"><time>${span(x)}</time><div><b>${esc(T(x.role))}</b><span class="org">${esc(x.org)}${x.place ? ` · ${esc(x.place)}` : ''}</span>
        <ul>${(T(x.points) || []).map(pt => `<li>${esc(pt)}</li>`).join('')}</ul>${x.project ? `<a class="more" href="#work/${esc(x.project)}">${esc(U().seeWork)} →</a>` : ''}</div></li>`).join('')}</ol>
      <h4>${esc(U().education)}</h4><ol class="timeline">${EDUCATION.map(x => `<li><time>${span(x)}</time><div><b>${esc(T(x.degree))}</b><span class="org">${esc(x.school)}</span></div></li>`).join('')}</ol>
      <h4>${esc(U().awards)}</h4><ul class="rows plain">${AWARDS.map(a => `<li><em>${esc(a.year)}</em><span>${esc(T(a.title))}</span></li>`).join('')}</ul>`;
  },
  row(){
    const list = STEPS();
    return `<p class="row-intro">${esc(U().row.intro)}</p>
      <div class="row-now"><p class="row-first">${esc(U().row.first)}</p></div>
      <ol class="journey">${list.map((p, i) => `
        <li data-i="${i}"><span class="n">${i + 1}</span><b>${esc(T(p.title))}</b><em>${esc([p.year, U().kind[p.kind]].filter(Boolean).join(' · '))}</em></li>`).join('')}
        <li class="home" data-i="${list.length}"><span class="n">⌂</span><b>${esc(U().row.home)}</b></li></ol>`;
  },
  about(){
    const bio = T(PROFILE.bio) || [];
    return `<p class="lede">${esc(T(PROFILE.tagline))}<br><span>${esc(T(PROFILE.tagline2))}</span></p>
      ${bio.map(p => `<p>${esc(p)}</p>`).join('')}
      ${NOW.length ? `<h4 id="now">${esc(U().now)}</h4><ul class="now">${NOW.map(n => `<li><b>${esc(T(n.title))}</b><p>${esc(T(n.line))}</p>${n.link ? linkRow([n.link]) : ''}</li>`).join('')}</ul>` : ''}
      <h4>${esc(U().elsewhere)}</h4>${linkRow(PROFILE.links)}`;
  },
  contact(){
    return `${U().contactText.map(p => `<p>${esc(p)}</p>`).join('')}${linkRow(PROFILE.links)}`;
  },
};
// ---------- rowing ----------
/** The projects along the rowing route, one pair of buoys each, in the order they are passed. */
function STEPS(){ return ROUTE.map(id => PROJECTS.find(p => p.id === id)).filter(Boolean); }
const yt = id => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${id}&rel=0&modestbranding=1`;
/** The project just passed opens at the top of the panel: a video plays, a game can be played, a picture drifts. */
function nowCard(p){
  const links = (p.links || []).slice(0, 2);
  const media = p.video
    ? `<div class="media"><iframe src="${yt(p.video)}" title="${esc(T(p.title))}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`
    : p.play
      ? `<div class="media play" style="--ar:${p.play.w} / ${p.play.h}">${p.cover ? `<img src="${esc(p.cover)}" alt="">` : ''}<button type="button" data-play="${esc(p.id)}">▶ ${esc(U().row.play)}</button></div>`
      : `<div class="media drift">${p.cover ? `<img src="${esc(p.cover)}" alt="">` : ''}</div>`;
  return `${media}<h3>${esc(T(p.title))} ${badge(p)}</h3><p class="meta">${[p.year, U().kind[p.kind]].filter(Boolean).map(esc).join(' · ')}</p>
    <p class="lede">${esc(T(p.line))}</p>${linkRow(links)}<p><a class="more" href="#work/${esc(p.id)}">${esc(U().seeWork)} →</a></p>`;
}
/** Light up the project just passed in the panel and open it at the top. */
function highlight(i){
  body.querySelectorAll('.journey > li').forEach(li => { const k = +li.dataset.i; li.classList.toggle('passed', k < i); li.classList.toggle('lit', k === i); });
  const p = STEPS()[i], now = body.querySelector('.row-now');
  if (now && p){ now.innerHTML = nowCard(p); now.classList.remove('in'); void now.offsetWidth; now.classList.add('in'); }
  $('#panel .sheet').scrollTo({ top: 0, behavior: 'smooth' });
}
body.addEventListener('click', e => {
  const b = e.target.closest('[data-play]'); if (!b) return;
  const p = PROJECTS.find(x => x.id === b.dataset.play); if (!p || !p.play) return;
  const m = b.closest('.media');
  m.innerHTML = `<iframe src="${esc(p.play.src)}" title="${esc(T(p.title))}" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>`;
  m.insertAdjacentHTML('afterend', `<p class="note">${esc(U().row.playNote)}</p>`);
  stage && stage.row.input(0, 0);
});
function startRow(){
  if (!stage || !game) return;
  if (stage.state.vis === 'winter' && when){ when.set('summer'); toast(U().row.frozen); }
  game.start();
}
let toastT = 0;
function toast(text){
  const t = $('#toast'); t.textContent = text; t.hidden = false; t.classList.add('in');
  clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('in'); setTimeout(() => { t.hidden = true; }, 600); }, 4200);
}

body.addEventListener('click', e => {
  const b = e.target.closest('[data-filter]'); if (!b) return;
  filter = b.dataset.filter; body.innerHTML = RENDER.work();
});

renderHeader();
requestAnimationFrame(follow);
startStage();
