// The page side of the rowing game: keys and touch pads, the paper card that rises by each gate,
// the marker for the next gate, the progress dots, and the card waiting back at the pier.
const BOAT = '<svg viewBox="0 0 24 14" aria-hidden="true"><path d="M2 6h20l-3 6H5z" fill="currentColor"/><path d="M6 6 3 1M18 6l3-5" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>';
export { BOAT };

export function createRowGame({ stage, el, steps, U, T, esc, coverRight, highlight, onLeave, onAgain }){
  // Each step is a project: { id, title, line, year, kind, cover }.
  let list = [], card = -1, cardAt = 0, raf = 0, on = false;
  const keys = new Set(), pads = new Set();

  el.innerHTML = `
    <div class="row-card" hidden></div>
    <div class="row-next" hidden><i></i><span></span></div>
    <ol class="row-dots"></ol>
    <p class="row-help"></p>
    <div class="row-pad">
      <button type="button" data-pad="l" aria-label="left">◀</button>
      <button type="button" data-pad="f" aria-label="row">▲</button>
      <button type="button" data-pad="r" aria-label="right">▶</button>
    </div>
    <div class="row-end" hidden></div>
    <button type="button" class="row-exit"></button>`;
  const $ = s => el.querySelector(s);
  const cardEl = $('.row-card'), nextEl = $('.row-next'), dots = $('.row-dots'), endEl = $('.row-end');

  function input(){
    const k = c => keys.has(c);
    const f = (k('KeyW') || k('ArrowUp') || pads.has('f') ? 1 : 0) - (k('KeyS') || k('ArrowDown') ? 1 : 0);
    const r = (k('KeyD') || k('ArrowRight') || pads.has('r') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') || pads.has('l') ? 1 : 0);
    stage.row.input(f, r);
  }
  const GAME_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  addEventListener('keydown', e => {
    if (!on || e.metaKey || e.ctrlKey || e.altKey) return;
    if (GAME_KEYS.includes(e.code)){ keys.add(e.code); input(); e.preventDefault(); }
  });
  addEventListener('keyup', e => { if (keys.delete(e.code)) input(); });
  addEventListener('blur', () => { keys.clear(); pads.clear(); on && input(); });
  el.querySelectorAll('[data-pad]').forEach(b => {
    const down = e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); pads.add(b.dataset.pad); b.classList.add('on'); input(); };
    const up = () => { pads.delete(b.dataset.pad); b.classList.remove('on'); input(); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', e => e.preventDefault());
  });
  el.querySelector('.row-exit').addEventListener('click', () => onLeave());
  endEl.addEventListener('click', e => {
    const b = e.target.closest('[data-end]'); if (!b) return;
    b.dataset.end === 'again' ? onAgain() : onLeave();
  });

  function renderDots(){
    const n = stage.row.next;
    dots.innerHTML = list.map((_, i) => `<li class="${i < n ? 'done' : i === n ? 'now' : ''}"></li>`).join('') + `<li class="home ${n >= list.length ? 'now' : ''}"></li>`;
  }
  function showCard(i){
    const x = list[i]; card = i; cardAt = performance.now();
    cardEl.innerHTML = `<time>${esc([x.year, U().kind[x.kind]].filter(Boolean).join(' · '))}</time><b>${esc(T(x.title))}</b><p>${esc(T(x.line))}</p><em>${i + 1} / ${list.length}</em>`;
    cardEl.hidden = false; cardEl.classList.remove('out'); void cardEl.offsetWidth; cardEl.classList.add('in');
  }

  function place(node, a, { pad = 16, clampToEdge = false } = {}){
    const w = innerWidth - coverRight(), h = innerHeight, bw = node.offsetWidth, bh = node.offsetHeight;
    let x = a.x, y = a.y, edge = false;
    if (a.behind){ x = w - x; y = h - 40; }                       // behind the camera: show it at the bottom edge
    if (clampToEdge){
      const cx = Math.min(w - pad - bw / 2, Math.max(pad + bw / 2, x)), cy = Math.min(h - pad - 40, Math.max(pad + 90, y));
      edge = a.off || cx !== x || cy !== y; x = cx; y = cy;
    } else {
      x = Math.min(w - pad - bw / 2, Math.max(pad + bw / 2, x)); y = Math.max(pad + bh + 70, y);
    }
    node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    return { edge, ang: Math.atan2(a.y - y, a.x - x) };
  }

  function loop(){
    if (!on) return;
    raf = requestAnimationFrame(loop);
    const n = stage.row.next, home = n >= list.length;
    // The card stays by its gate for a while, then lets go.
    if (card >= 0){
      const a = stage.row.anchor(card), age = (performance.now() - cardAt) / 1000;
      if (a) place(cardEl, a);
      if (age > 9 && !cardEl.classList.contains('out')) cardEl.classList.add('out');
    }
    // The marker on the next gate (or the pier), pinned to the edge with an arrow when it is out of view.
    const a = stage.row.anchor(home ? null : n);
    if (a && endEl.hidden){
      nextEl.hidden = false;
      $('.row-next span').textContent = home ? U().row.home : `${U().row.next} · ${n + 1} / ${list.length}`;
      const p = place(nextEl, a, { clampToEdge: true });
      nextEl.classList.toggle('edge', p.edge);
      $('.row-next i').style.transform = p.edge ? `rotate(${p.ang}rad)` : '';
    } else nextEl.hidden = true;
  }

  return {
    get on(){ return on; },
    start(){
      list = steps(); card = -1; on = true; keys.clear(); pads.clear();
      el.hidden = false; endEl.hidden = true; cardEl.hidden = true;
      $('.row-help').innerHTML = matchMedia('(hover: hover) and (pointer: fine)').matches ? U().row.help : U().row.helpTouch;
      $('.row-exit').textContent = U().row.exit;
      stage.row.start(list.map(p => ({ cover: p.cover })), {
        onGate: i => { showCard(i); renderDots(); highlight(i); },
        onDock: () => {
          renderDots(); highlight(list.length);
          endEl.innerHTML = `<b>${esc(U().row.endTitle)}</b><p>${esc(U().row.endText)}</p><p class="links"><button type="button" data-end="again">${esc(U().row.again)}</button><button type="button" data-end="leave">${esc(U().row.leave)}</button></p>`;
          endEl.hidden = false; nextEl.hidden = true; cardEl.classList.add('out');
        },
      });
      renderDots(); input();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    },
    stop(){
      if (!on) return;
      on = false; cancelAnimationFrame(raf); keys.clear(); pads.clear();
      stage.row.input(0, 0); stage.row.stop(); el.hidden = true;
    },
    relabel(){ if (on){ renderDots(); $('.row-help').innerHTML = matchMedia('(hover: hover) and (pointer: fine)').matches ? U().row.help : U().row.helpTouch; if (card >= 0) showCard(card); } },
  };
}
