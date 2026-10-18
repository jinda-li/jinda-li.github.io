// The page: navigation, the paper panel with the content, language, and the bridge to the lakeside stage.
import { PROFILE, PROJECTS, FEATURED, NOW, EXPERIENCE, EDUCATION, AWARDS } from './content.mjs';
import { UI, SECTIONS, MOMENT_EN } from './i18n.mjs';

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
    document.body.classList.add('ready');
    route();
  } catch (e) {
    console.warn('Lake scene unavailable, showing the painted still instead.', e);
    document.body.classList.add('nogl', 'ready');
    route();
  }
}

// ---------- header, clock, language ----------
let clockInfo = null, hovered = null;
function renderHeader(){
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  $('#name').textContent = PROFILE.name;
  $('#tagline').textContent = T(PROFILE.tagline);
  $('#nav').innerHTML = SECTIONS.map(s => `<a href="#${s}" data-s="${s}">${esc(U().nav[s])}</a>`).join('');
  $('#lang').innerHTML = `<button data-lang="en" class="${lang === 'en' ? 'on' : ''}">EN</button><button data-lang="zh" class="${lang === 'zh' ? 'on' : ''}">中</button>`;
  $('#hint').textContent = U().hint;
  $('#marks').innerHTML = SECTIONS.map(s => `<a class="mark" href="#${s}" data-s="${s}"><i></i>${esc(U().nav[s])}</a>`).join('');
  document.title = `${PROFILE.name} · ${T(PROFILE.tagline)}`;
  renderClock();
  markNav();
}
function renderClock(){
  if (!clockInfo){ $('#clock').hidden = true; return; }
  const c = clockInfo, pad = n => String(n).padStart(2, '0');
  const word = lang === 'zh' ? c.word : (MOMENT_EN[c.word] || '');
  $('#clock').hidden = false;
  $('#clock').innerHTML = `<b>${esc(U().helsinki)} ${pad(c.h)}:${pad(c.mi)}</b><span>${esc(word)} · ${esc(U().season[c.season] || '')}</span>`;
}
$('#lang').addEventListener('click', e => {
  const b = e.target.closest('[data-lang]'); if (!b) return;
  lang = b.dataset.lang; store.set('lang', lang); renderHeader(); route(true);
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
  markNav();
  const key = `${s}/${id || ''}/${lang}`;
  if (key === lastRoute && !force) return;
  const prevSection = lastRoute.split('/')[0];
  lastRoute = key;
  if (!SECTIONS.includes(s)){ closePanel(); return; }
  openPanel(s, id);
  if (stage && s !== prevSection) stage.goView(s);
}
addEventListener('hashchange', () => route());
addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('open')) history.pushState('', '', location.pathname + location.search), route(); });

// On wide screens the panel covers the right side; on phones it is a sheet over the bottom.
const panelCover = () => innerWidth > 760 ? [panel.getBoundingClientRect().width, 0] : [0, panel.getBoundingClientRect().height];
function openPanel(s, id){
  document.body.classList.add('open');
  panel.dataset.section = s;
  $('#panel .kicker').textContent = U().kicker[s];
  $('#panel h2').textContent = id ? '' : U().title[s];
  $('#panel .close').setAttribute('aria-label', U().close);
  body.innerHTML = RENDER[s](id);
  panel.scrollTop = 0; body.scrollTop = 0;
  panel.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => stage && stage.setPanel(...panelCover()));
}
function closePanel(){
  document.body.classList.remove('open');
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
    return `<p class="chips filters">${kinds.map(k => `<button data-filter="${k}" class="${k === filter ? 'on' : ''}">${esc(U().filters[k] || k)}</button>`).join('')}</p>
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
body.addEventListener('click', e => {
  const b = e.target.closest('[data-filter]'); if (!b) return;
  filter = b.dataset.filter; body.innerHTML = RENDER.work();
});

renderHeader();
requestAnimationFrame(follow);
startStage();
