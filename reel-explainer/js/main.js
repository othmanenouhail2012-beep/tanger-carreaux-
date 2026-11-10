// main.js — construit UNE timeline maître (en pause) à partir du storyboard
import { createStage, mk, isPlayground, isExport, params } from './stage.js';
import { bus } from './sfx.js';
import { defs, compose } from './props.js';
import * as camera from './camera.js';
import { caption } from './captions.js';
import { FX, transition, endCard } from './fx.js';
// ?story=chauffe-eau → js/stories/chauffe-eau.js ; sinon js/storyboard.js
const story = params.get('story');
const { reel, insets = {} } = await import(story ? `./stories/${story.replace(/[^\w-]/g, '')}.js` : './storyboard.js');

gsap.registerPlugin(DrawSVGPlugin);
const st = createStage(defs());
await document.fonts.ready;

if (isPlayground) {
  const { playground } = await import('./playground.js');
  playground(st);
} else build();

function build() {
  const tl = gsap.timeline({ paused: true });
  const marks = []; let t = 0, prev = null;
  reel.scenes.forEach((sc, i) => {
    const dur = sc.duration; marks.push({ id: sc.id, t, caption: sc.caption || '', duration: dur });
    if (sc.endCard) {
      if (prev) tl.to(prev, { opacity: 0, duration: .4 }, t + .4);
      tl.add(endCard(st.endcard, { brand: reel.brand }), t);
      // boucle propre : fondu final vers la première image
      tl.fromTo(st.loop, { opacity: 0 }, { opacity: 1, duration: .5, ease: 'power1.inOut', immediateRender: false }, t + dur - .5);
      t += dur; return;
    }
    const g = mk('g', { class: 'scene', 'data-id': sc.id, opacity: i ? 0 : 1 }, st.scenes);
    g.innerHTML = `<g clip-path="url(#illu-clip)"><g class="world">${compose(sc.setup)}</g></g><g class="overlay"></g>`;
    const world = g.querySelector('.world'), overlay = g.querySelector('.overlay');
    const cam = sc.camera || {}, target = cam.target ? g.querySelector(cam.target) : null, zoom = cam.zoom || 1;
    const end = camera.frame(world, target, zoom);
    const start = camera.wider(end, i ? .85 : .93);
    camera.set(world, start);
    if (i === 0) { // instantané de la frame 0 pour la boucle
      st.loop.innerHTML = `<svg viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0"><rect width="1080" height="1920" fill="#F7F8FC"/></svg>`;
      st.loop.firstChild.appendChild(g.cloneNode(true));
    }
    const fdur = i ? .8 : 1.1;
    tl.add(camera.focus(world, target, { zoom, from: start, duration: fdur, drift: Math.max(0, dur - fdur + .5) }), t);
    camera.apply(world, end);
    if (i) tl.add(transition(prev, g, { type: sc.transition }), t - .2);

    // sous-titre
    const c = caption(st.captions, sc.caption || '', { hook: i === 0, words: sc.words });
    if (i === 0) st.loop.appendChild(c.el.cloneNode(true));
    else tl.fromTo(c.el, { opacity: 0 }, { opacity: 1, duration: .01, immediateRender: false }, t);
    tl.add(c.tl, t);
    tl.to(c.el, { opacity: 0, duration: .12 }, t + dur - .12);

    // beats
    [...(sc.beats || [])].sort((a, b) => a.t - b.t).forEach(b => {
      const fn = FX[b.fx]; if (!fn) { console.warn('fx inconnu', b.fx); return; }
      const ctx = { root: g, world, overlay, until: dur - b.t };
      const R = v => (typeof v === 'string' && insets[v] ? insets[v] : v); // contenus SVG nommés
      const opts = { ...b, content: R(b.content) };
      ['left', 'right'].forEach(k => { if (b[k]) opts[k] = { ...b[k], content: R(b[k].content) }; });
      tl.add(fn(ctx, opts), t + b.t);
      if (b.fx === 'camera') camera.apply(world, camera.get(world));
    });
    prev = g; t += dur;
  });
  window.__reel = { tl, fps: reel.fps, duration: tl.duration(), marks };
  // liste des bruitages {t, type} : on balaie la timeline, les callbacks emit() se déclenchent au passage
  window.__collectSfx = (step = 1 / 240) => {
    const out = []; tl.pause(); tl.seek(0, true);
    bus.on = type => out.push({ t: +tl.time().toFixed(4), type });
    for (let i = 1, n = Math.ceil(tl.duration() / step); i <= n; i++) tl.seek(Math.min(i * step, tl.duration()), false);
    bus.on = null; tl.seek(0, true); return out;
  };
  if (params.has('record')) import('./recorder.js').then(m => m.recorder(window.__reel));
  else if (!isExport) import('./devtools.js').then(m => m.devtools(window.__reel));
}
