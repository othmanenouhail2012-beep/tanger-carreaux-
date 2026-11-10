// fx.js — catalogue d'effets. Chaque effet : (ctx, opts) => gsap.timeline()
// ctx = { root, world, overlay, until }  (until = secondes restantes dans la scène, pour dimensionner les boucles)
import { mk, frag, boxIn, rng, root } from './stage.js';
import { C, icons, phone, elementView } from './props.js';
import * as camera from './camera.js';

const q = (ctx, t) => (typeof t === 'string' ? ctx.root.querySelector(t) : t);
const reps = (until, period) => Math.max(0, Math.floor(until / period) - 1);
const dashed = { 'stroke-dasharray': '2 14', 'stroke-linecap': 'round', fill: 'none' };
const ST = (w = 3, c = C.ink) => ({ stroke: c, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
const zoomOf = ctx => camera.get(ctx.world).s;
const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// pop d'un groupe centré sur 0,0 (échelle via l'attribut transform : origine exacte)
const scaleIn = (el, { from = 0, to = 1, duration = .35, ease = 'back.out(2)' } = {}) => {
  const o = { s: from };
  return gsap.fromTo(o, { s: from }, { s: to, duration, ease, immediateRender: false, onUpdate: () => el.setAttribute('transform', `scale(${o.s})`) });
};

/* 1. caméra (effet de beat) */
export function cameraFx(ctx, { target, zoom = 1.6, duration = 1.2, ease = 'power3.inOut' }) {
  return gsap.timeline().add(camera.focus(ctx.world, q(ctx, target), { zoom, duration, ease, drift: Math.max(0, ctx.until - duration) }));
}

/* 2. ring */
export function ring(ctx, { target, hold }) {
  const b = boxIn(q(ctx, target), ctx.world), r = Math.max(b.w, b.h) / 2 + 26 / zoomOf(ctx);
  const c = mk('circle', { cx: b.cx, cy: b.cy, r, fill: 'none', ...ST(5, C.focus), 'vector-effect': 'non-scaling-stroke', opacity: 0, transform: `rotate(-90 ${b.cx} ${b.cy})` }, ctx.world);
  hold = hold ?? Math.max(.8, ctx.until - 1);
  const k = Math.max(1, Math.floor(hold / .8));
  return gsap.timeline()
    .set(c, { opacity: 1 })
    .fromTo(c, { drawSVG: '0%', scale: 1.15 }, { drawSVG: '100%', scale: 1, duration: .5, ease: 'power2.out', svgOrigin: `${b.cx} ${b.cy}`, immediateRender: false })
    .to(c, { scale: 1.04, duration: .4, yoyo: true, repeat: 2 * k - 1, ease: 'sine.inOut', svgOrigin: `${b.cx} ${b.cy}` })
    .to(c, { opacity: 0, duration: .25 });
}

/* 3. pop d'icône (warning clignote 2×) */
export function pop(ctx, { icon = 'check', target, at = 'tr', size = 1, x, y, arg, layer = 'world' }) {
  let px = x, py = y, k = size;
  const parent = layer === 'world' ? ctx.world : ctx.overlay;
  if (target) {
    const b = boxIn(q(ctx, target), parent);
    px = at === 'tr' ? b.x + b.w * .88 : at === 'tl' ? b.x + b.w * .12 : b.cx;
    py = at === 'c' ? b.cy : b.y + b.h * .1;
  }
  if (layer === 'world') k = size / zoomOf(ctx);
  const g = mk('g', { transform: `translate(${px} ${py}) scale(${k})` }, parent);
  const inner = frag(icons[icon](arg), g, { opacity: 0 });
  const tl = gsap.timeline()
    .set(inner, { opacity: 1 })
    .add(scaleIn(inner));
  if (icon === 'warning') tl.to(inner, { opacity: .25, duration: .14, yoyo: true, repeat: 3, ease: 'none' });
  tl.el = inner;
  return tl;
}

/* 4. insetCard : sort de l'objet ciblé */
export function insetCard(ctx, { target, content = '', close, x = 150, y = 130, w = 780, h = 640 }) {
  const cx = x + w / 2, cy = y + h / 2;
  const card = frag(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.card}" stroke="${C.ink}" stroke-width="3"/>
    <g class="inset-content" transform="translate(${x} ${y})">${content}</g>`, ctx.overlay, { class: 'inset', opacity: 0 });
  let fx = 0, fy = 0;
  if (target) { const b = boxIn(q(ctx, target)); fx = b.cx - cx; fy = b.cy - cy; }
  const st = { x: fx, y: fy, s: .2, o: 0 };
  const draw = () => { card.setAttribute('transform', `translate(${cx + st.x} ${cy + st.y}) scale(${st.s}) translate(${-cx} ${-cy})`); card.setAttribute('opacity', st.o); };
  const tl = gsap.timeline()
    .fromTo(st, { x: fx, y: fy, s: .2, o: 0 }, { x: 0, y: 0, s: 1, o: 1, duration: .45, ease: 'power3.out', immediateRender: false, onUpdate: draw });
  if (close != null) tl.to(st, { o: 0, s: .96, duration: .3, ease: 'power2.in', onUpdate: draw }, close);
  tl.el = card;
  return tl;
}

/* 5. magnifier : point → loupe avec particules */
export function magnifier(ctx, { target, lens = { x: 760, y: 360 }, n = 26, seed = 4 }) {
  const b = boxIn(q(ctx, target)); const R = 110, r = rng(seed);
  const g = mk('g', { class: 'magnifier' }, ctx.overlay);
  const spot = mk('circle', { cx: b.cx, cy: b.cy, r: 34, ...ST(4, C.focus), ...dashed, 'stroke-dasharray': '6 9', opacity: 0 }, g);
  const ang = Math.atan2(lens.y - b.cy, lens.x - b.cx);
  const line = mk('path', { d: `M${b.cx + Math.cos(ang) * 38} ${b.cy + Math.sin(ang) * 38}L${lens.x - Math.cos(ang) * (R + 6)} ${lens.y - Math.sin(ang) * (R + 6)}`, ...ST(4, C.ink), ...dashed, 'stroke-dasharray': '2 12', opacity: 0 }, g);
  let parts = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (R - 22);
    parts += `<circle class="p" cx="${(Math.cos(a) * d).toFixed(1)}" cy="${(Math.sin(a) * d + 20).toFixed(1)}" r="${(6 + r() * 12).toFixed(1)}" fill="${C.scale}" stroke="${C.ink}" stroke-width="2"/>`;
  }
  const L = frag(`<path d="M${R * .7} ${R * .7}L${R * 1.25} ${R * 1.25}" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/>
    <clipPath id="lens-clip-${seed}"><circle r="${R}"/></clipPath>
    <circle r="${R}" fill="${C.glass}"/><g clip-path="url(#lens-clip-${seed})">${parts}</g>
    <circle r="${R}" fill="none" stroke="${C.ink}" stroke-width="6"/>`, g, { transform: `translate(${lens.x} ${lens.y})` });
  const lensIn = frag('', L); while (L.firstChild !== lensIn) lensIn.appendChild(L.firstChild); // inner group animable
  gsap.set(lensIn, { opacity: 0 });
  const ps = lensIn.querySelectorAll('.p');
  const tl = gsap.timeline()
    .set([spot, line], { opacity: 1 })
    .fromTo(spot, { drawSVG: '0%' }, { drawSVG: '100%', duration: .3, ease: 'power2.out', immediateRender: false })
    .fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', duration: .3, ease: 'power2.out', immediateRender: false })
    .set(lensIn, { opacity: 1 })
    .add(scaleIn(lensIn))
    .fromTo(ps, { scale: 0 }, { scale: 1, duration: .25, ease: 'back.out(2)', stagger: .04, transformOrigin: '50% 50%', immediateRender: false });
  const rest = ctx.until - tl.duration();
  if (rest > .8) tl.to(ps, { y: '+=4', duration: .5, yoyo: true, repeat: reps(rest, .5) | 1, ease: 'sine.inOut', stagger: { each: .03, from: 'random' } });
  return tl;
}

/* 6. crossSection : médaillon crème, ressort + clapet + gouttes */
export function crossSection(ctx, { target, pos = { x: 790, y: 470 }, R = 190 }) {
  const b = boxIn(q(ctx, target));
  const g = mk('g', { class: 'cross-section' }, ctx.overlay);
  const ang = Math.atan2(pos.y - b.cy, pos.x - b.cx);
  const line = mk('path', { d: `M${b.cx} ${b.cy}L${pos.x - Math.cos(ang) * R} ${pos.y - Math.sin(ang) * R}`, ...ST(4), ...dashed, 'stroke-dasharray': '2 12', opacity: 0 }, g);
  const spring = 'M0 -120' + [...Array(8)].map((_, i) => `L${i % 2 ? -26 : 26} ${-110 + i * 11}`).join('') + 'L0 -22';
  const drops = [0, 1, 2].map(i => `<g class="drop-w"><g class="drop-i" transform="translate(${-10 + i * 10} 70)">${icons.drop()}</g></g>`).join('');
  const med = frag(`
    <clipPath id="med-clip"><circle r="${R}"/></clipPath>
    <circle r="${R}" fill="${C.cream}"/>
    <g clip-path="url(#med-clip)">
      <rect x="-${R}" y="-12" width="${R * 2}" height="44" fill="${C.glass}" stroke="${C.ink}" stroke-width="3"/>
      <path d="M-50 -140H50V-12H-50Z" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
      <path class="spring" d="${spring}" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect class="clapet" x="-40" y="-26" width="80" height="18" rx="6" fill="${C.danger}" stroke="${C.ink}" stroke-width="3"/>
      <rect x="-12" y="32" width="24" height="40" fill="${C.glass}" stroke="${C.ink}" stroke-width="3"/>
      ${drops}
      <path d="M-56 140H56L16 176H-16Z" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
    </g>
    <circle r="${R}" fill="none" stroke="${C.ink}" stroke-width="4"/>`, g, { transform: `translate(${pos.x} ${pos.y})` });
  const inner = frag('', med); while (med.firstChild !== inner) inner.appendChild(med.firstChild);
  gsap.set(inner, { opacity: 0 });
  const springEl = inner.querySelector('.spring'), clap = inner.querySelector('.clapet'), dr = inner.querySelectorAll('.drop-i');
  gsap.set(dr, { opacity: 0 });
  const tl = gsap.timeline()
    .set(line, { opacity: 1 })
    .fromTo(line, { drawSVG: '0%' }, { drawSVG: '100%', duration: .3, immediateRender: false })
    .set(inner, { opacity: 1 })
    .add(scaleIn(inner, { duration: .4, ease: 'back.out(1.6)' }));
  const cycle = gsap.timeline()
    .to(springEl, { scaleY: .6, duration: .4, ease: 'power2.inOut', svgOrigin: '0 -120' })
    .to(clap, { y: -40, duration: .4, ease: 'power2.inOut' }, 0)
    .fromTo(dr, { y: 0, opacity: 1 }, { y: 70, opacity: 0, duration: .5, ease: 'power2.in', stagger: .12, immediateRender: false }, .3)
    .to([springEl, clap], { scaleY: 1, y: 0, duration: .35, ease: 'power2.inOut', svgOrigin: '0 -120' }, .9);
  cycle.repeat(Math.max(0, Math.floor((ctx.until - .8) / cycle.duration()) - 1));
  return tl.add(cycle);
}

/* 7. heatUp : résistance gris → rouge + flèches rayonnantes */
export function heatUp(ctx, { target = '#heater-element' }) {
  const el = q(ctx, target), b = boxIn(el, ctx.world);
  const g = mk('g', { class: 'heat' }, ctx.world);
  const arrows = [];
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1, yy = b.y + 30 + Math.floor(i / 2) * (b.h - 60) / 3, xx = side > 0 ? b.x + b.w + 18 : b.x - 18;
    const a = mk('path', { d: `M${xx} ${yy}l${side * 18} 0m${-side * 8} -8l${side * 8} 8l${-side * 8} 8`, ...ST(4, C.danger), fill: 'none', opacity: 0 }, g);
    arrows.push(a);
  }
  const tl = gsap.timeline().to(el, { stroke: C.danger, duration: .6, ease: 'power1.in' });
  const rest = Math.max(.9, ctx.until - .6);
  tl.fromTo(arrows, { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .35, ease: 'power2.out', transformOrigin: '50% 50%', stagger: { each: .08, repeat: reps(rest, .7), yoyo: true }, immediateRender: false }, .4);
  return tl;
}

/* 8. ripples : arcs de bruit + tremblement */
export function ripples(ctx, { target, shake = true }) {
  const el = q(ctx, target), b = boxIn(el, ctx.world), z = zoomOf(ctx);
  const g = mk('g', { class: 'ripples' }, ctx.world); const arcs = [];
  [-1, 1].forEach(side => {
    const ox = side > 0 ? b.x + b.w + 10 / z : b.x - 10 / z, oy = b.cy;
    [40, 70, 100].forEach(r0 => {
      const r = r0 / z, a0 = -.6, a1 = .6;
      const p = (a) => `${ox + side * Math.cos(a) * r} ${oy + Math.sin(a) * r}`;
      arcs.push(mk('path', { d: `M${p(a0)}A${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${p(a1)}`, ...ST(5, C.danger), fill: 'none', 'vector-effect': 'non-scaling-stroke', opacity: 0, 'data-o': `${ox} ${oy}` }, g));
    });
  });
  const tl = gsap.timeline(); const n = reps(ctx.until, .9);
  arcs.forEach((a, i) => tl.add(gsap.timeline({ repeat: n })
    .fromTo(a, { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .3, ease: 'power2.out', svgOrigin: a.dataset.o, immediateRender: false })
    .to(a, { opacity: 0, duration: .3 }).to({}, { duration: .3 }), (i % 3) * .15));
  if (shake) tl.fromTo(el, { x: -2 }, { x: 2, duration: .05, yoyo: true, repeat: Math.floor(ctx.until / .05) | 1, ease: 'none', immediateRender: false }, 0).set(el, { x: 0 });
  return tl;
}

/* 9. fillLevel / expand : montée d'eau + badge */
export function fillLevel(ctx, { target = '#heater-water', from = .7, badge = '+2 L', badgeTarget }) {
  const el = q(ctx, target);
  const tl = gsap.timeline().fromTo(el, { scaleY: from }, { scaleY: 1, duration: 1, ease: 'power2.inOut', transformOrigin: '50% 100%', immediateRender: false });
  if (badge) tl.add(pop(ctx, { icon: 'badge', arg: badge, target: badgeTarget || el, at: 'tr', size: 1.1 }), .6);
  return tl;
}

/* 10a. gauge : aiguille jusqu'à la zone rouge */
export function gaugeFx(ctx, { needle, from = -120, to = 75, x = 230, y = 330, size = 1 }) {
  const tl = gsap.timeline();
  let n = needle && q(ctx, needle);
  if (!n) { const p = pop(ctx, { icon: 'gauge', x, y, size, layer: 'overlay' }); n = p.el.querySelector('#needle'); tl.add(p); }
  gsap.set(n, { rotation: from, svgOrigin: '0 0' });
  tl.fromTo(n, { rotation: from }, { rotation: to, duration: 1.4, ease: 'power2.in', svgOrigin: '0 0', immediateRender: false });
  const rest = ctx.until - tl.duration();
  if (rest > .5) tl.to(n, { rotation: to - 6, duration: .08, yoyo: true, repeat: reps(rest, .08) | 1, ease: 'none', svgOrigin: '0 0' });
  return tl;
}
/* 10b. thermometer : mercure + compteur rouge */
export function thermometer(ctx, { to = 100, from = 20, x = 900, y = 420, size = .9 }) {
  const p = pop(ctx, { icon: 'thermometer', arg: `${from}°`, x, y, size, layer: 'overlay' });
  const merc = p.el.querySelector('#mercury'), label = p.el.querySelector('.thermo-label');
  return gsap.timeline().add(p)
    .fromTo(merc, { scaleY: .15 }, { scaleY: 1, duration: 1.4, ease: 'power2.in', transformOrigin: '50% 100%', immediateRender: false }, .2)
    .add(counter(ctx, { el: label, from, to, suffix: '°', duration: 1.4 }), .2);
}

/* 11. danger : contour rouge, fissures, tremblement croissant */
export function danger(ctx, { shell = '#heater-shell', target = '#heater' }) {
  const s = q(ctx, shell), t = q(ctx, target), b = boxIn(s, s.parentNode);
  const cracks = [[.25, .2], [.75, .45], [.3, .7]].map(([fx, fy], i) => {
    const x = b.x + b.w * fx, y = b.y + b.h * fy; let d = `M${x} ${y}`;
    for (let k = 1; k <= 4; k++) d += `L${x + (k % 2 ? 14 : -10) * (i % 2 ? -1 : 1)} ${y + k * 22}`;
    return mk('path', { d, ...ST(4), fill: 'none', opacity: 0 }, s.parentNode);
  });
  const tl = gsap.timeline()
    .to(s, { stroke: C.danger, duration: .4 })
    .set(cracks, { opacity: 1 }, .2)
    .fromTo(cracks, { drawSVG: '0%' }, { drawSVG: '100%', duration: .35, stagger: .2, ease: 'power2.out', immediateRender: false }, .2)
    .fromTo(t, { x: -2 }, { x: 2, duration: .05, yoyo: true, repeat: 11, ease: 'none', immediateRender: false }, .2);
  const rest = Math.max(.2, ctx.until - .8);
  tl.fromTo(t, { x: -5 }, { x: 5, duration: .045, yoyo: true, repeat: Math.floor(rest / .045) | 1, ease: 'none', immediateRender: false }).set(t, { x: 0 });
  return tl;
}

/* 12. steamBurst : nuage de vapeur + compteur optionnel */
export function steamBurst(ctx, { target, n = 30, seed = 9, counter: cnt }) {
  const b = boxIn(q(ctx, target)); const r = rng(seed); const g = mk('g', { class: 'steam' }, ctx.overlay);
  const tl = gsap.timeline();
  for (let i = 0; i < n; i++) {
    const rad = 20 + r() * 50, a = -Math.PI / 2 + (r() - .5) * 2.6, d = 120 + r() * 380;
    const c = mk('circle', { cx: b.cx + (r() - .5) * b.w * .5, cy: b.y + b.h * .3, r: rad, fill: '#fff', ...ST(2, C.steam), opacity: 0 }, g);
    const t0 = r() * .7;
    tl.set(c, { opacity: 1 }, t0)
      .fromTo(c, { scale: 0 }, { scale: 1, duration: .5, ease: 'power2.out', transformOrigin: '50% 50%', immediateRender: false }, t0)
      .to(c, { x: Math.cos(a) * d, y: Math.sin(a) * d - 80, duration: 1.6, ease: 'power1.out' }, t0)
      .to(c, { opacity: 0, duration: .5 }, t0 + 1.1);
  }
  if (cnt) {
    const tx = mk('text', { x: cnt.x ?? 540, y: cnt.y ?? 520, 'text-anchor': 'middle', 'font-size': 150, 'font-weight': 800, fill: C.danger, stroke: '#fff', 'stroke-width': 8, 'paint-order': 'stroke', 'font-family': 'Noto Kufi Arabic', opacity: 0 }, g);
    tl.set(tx, { opacity: 1 }, .2).add(counter(ctx, { el: tx, ...cnt }), .2);
  }
  return tl;
}

/* 13. counter */
export function counter(ctx, { el, from = 0, to = 100, suffix = '', prefix = '', duration = 1, x = 540, y = 400, color = C.danger, size = 120, ease = 'power1.out' }) {
  const t = el ? q(ctx, el) : mk('text', { x, y, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, fill: color, 'font-family': 'Noto Kufi Arabic', direction: 'ltr' }, ctx.overlay);
  const o = { v: from }; t.textContent = prefix + fmt(from) + suffix;
  const tl = gsap.timeline();
  if (!el) { t.setAttribute('opacity', 0); tl.set(t, { opacity: 1 }).fromTo(t, { scale: .6 }, { scale: 1, duration: .35, ease: 'back.out(2)', transformOrigin: '50% 50%', immediateRender: false }); }
  return tl.fromTo(o, { v: from }, { v: to, duration, ease, immediateRender: false, onUpdate: () => (t.textContent = prefix + fmt(o.v) + suffix) });
}

/* 14. compare : deux disques dans une insetCard, ✓ et ✗ */
export function compare(ctx, { target, left = { label: 'نقية', ok: true }, right = { label: 'عامرة كالكير', ok: false }, close }) {
  const disk = (x, side, dirty) => `<g transform="translate(${x} 330)"><circle r="150" fill="#fff" stroke="${C.ink}" stroke-width="3"/>
    <circle r="150" fill="${C.glass}" opacity=".5"/>${elementView(dirty)}
    <text y="-185" text-anchor="middle" direction="rtl" font-size="44" font-weight="800" fill="${side.ok ? C.ok : C.danger}" font-family="Noto Kufi Arabic">${side.label}</text></g>`;
  // RTL : la première option est à droite
  const content = disk(580, left, !left.ok) + disk(200, right, !right.ok);
  const card = insetCard(ctx, { target, content, close });
  const inner = card.el.querySelector('.inset-content');
  const tl = gsap.timeline().add(card);
  const ctx2 = { ...ctx, overlay: inner };
  tl.add(pop(ctx2, { icon: left.ok ? 'check' : 'cross', x: 580, y: 560, layer: 'overlay' }), .55);
  tl.add(pop(ctx2, { icon: right.ok ? 'check' : 'cross', x: 200, y: 560, layer: 'overlay' }), .85);
  return tl;
}

/* 15. phoneChecklist */
export function phoneChecklist(ctx, { items = [] }) {
  const g = frag(phone(items, { x: 300, y: 110 }), ctx.overlay);
  const ph = g.querySelector('.phone-in'), ticks = g.querySelectorAll('.tick-in');
  gsap.set(ticks, { scale: 0, transformOrigin: '50% 50%' }); gsap.set(ph, { y: 2000 });
  return gsap.timeline()
    .fromTo(ph, { y: 2000 }, { y: 0, duration: .7, ease: 'power3.out', immediateRender: false })
    .fromTo(ticks, { scale: 0 }, { scale: 1, duration: .35, ease: 'back.out(2)', transformOrigin: '50% 50%', stagger: .25, immediateRender: false }, .8);
}

/* 16. transition (utilisée par main.js) : fondu enchaîné + caméra plus large → cible */
export function transition(a, b, { type = 'fade', duration = .45 } = {}) {
  const tl = gsap.timeline();
  tl.fromTo(b, { opacity: 0 }, { opacity: 1, duration, ease: 'power2.out', immediateRender: false }, 0);
  if (a) {
    if (type === 'fromInset') { const card = a.querySelector('.inset'); if (card) tl.fromTo(card, { opacity: 1 }, { opacity: 0, duration: duration + .15, immediateRender: false }, 0); }
    tl.to(a, { opacity: 0, duration: .2 }, duration * .6);
  }
  return tl;
}

/* 17. endCard : logo rond, nom, تابعنا */
export function endCard(layer, { brand = {} } = {}) {
  const initials = (brand.name || 'B').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
  layer.innerHTML = `<svg class="logo" viewBox="-160 -160 320 320">${brand.logo ? `<image href="${brand.logo}" x="-150" y="-150" width="300" height="300"/>` :
    `<circle r="148" fill="${C.glass}" stroke="${C.ink}" stroke-width="6"/>
     <path d="M0 -92Q62 -14 62 34A62 62 0 0 1 -62 34Q-62 -14 0 -92Z" fill="#fff" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
     <text y="62" text-anchor="middle" font-size="58" font-weight="800" fill="${C.water}" font-family="sans-serif">${initials}</text>`}</svg>
    <div class="name">${brand.name || ''}</div><div class="follow">تابعنا</div>`;
  const [logo, name, follow] = layer.children;
  gsap.set([logo, name, follow], { opacity: 0 });
  return gsap.timeline()
    .fromTo(layer, { opacity: 0 }, { opacity: 1, duration: .4, ease: 'power2.out', immediateRender: false })
    .fromTo(logo, { scale: 0, opacity: 1 }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out(2)', immediateRender: false }, .2)
    .fromTo(name, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out', immediateRender: false }, .5)
    .fromTo(follow, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out', immediateRender: false }, .7)
    .to(logo, { scale: 1.05, duration: .5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 1.1);
}

export const FX = { camera: cameraFx, ring, pop, insetCard, magnifier, crossSection, heatUp, ripples, fillLevel, expand: fillLevel,
  gauge: gaugeFx, thermometer, danger, steamBurst, counter, compare, phoneChecklist };

/* extra : le calcaire tombe au fond (stagger) */
export function scaleFall(ctx, { target = '#heater-scale', height = 380 }) {
  const dots = q(ctx, target).querySelectorAll('.dot');
  const r = rng(11);
  return gsap.timeline().fromTo(dots, { y: () => -60 - r() * height, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power2.in', stagger: { each: .018, from: 'random' }, immediateRender: false });
}
FX.scaleFall = scaleFall;
