// playground.js — ?playground=1 : chaque effet seul, avec bouton pour le rejouer
import { mk } from './stage.js';
import { compose } from './props.js';
import * as camera from './camera.js';
import { FX, transition, endCard } from './fx.js';
import { insets } from './stories/chauffe-eau.js';

const H = { setup: 'room+heater+kettle', cam: ['#heater', 1.3] }, CUT = { setup: 'room+heater:cut', cam: ['#heater', 1.6] };
const DEMOS = {
  'camera.focus': [H, { fx: 'camera', target: '#safety-valve', zoom: 2.4 }],
  ring: [H, { fx: 'ring', target: '#valve-body' }],
  pop: [H, { fx: 'pop', icon: 'warning', target: '#heater' }],
  insetCard: [{ setup: H.setup, cam: ['#counter', 1.15] }, { fx: 'insetCard', target: '#kettle', content: insets.kettleInside }],
  magnifier: [H, { fx: 'magnifier', target: '#heater-box', lens: { x: 780, y: 360 } }],
  crossSection: [{ setup: H.setup, cam: ['#safety-valve', 2.4] }, { fx: 'crossSection', target: '#safety-valve', pos: { x: 770, y: 400 } }],
  heatUp: [CUT, { fx: 'heatUp', target: '#heater-element' }],
  scaleFall: [CUT, { fx: 'scaleFall' }],
  ripples: [H, { fx: 'ripples', target: '#heater' }],
  fillLevel: [CUT, { fx: 'fillLevel', target: '#heater-water', badgeTarget: '#heater-shell' }],
  gauge: [H, { fx: 'gauge', x: 800, y: 330 }],
  thermometer: [H, { fx: 'thermometer', to: 100, x: 820, y: 520 }],
  danger: [H, { fx: 'danger' }],
  steamBurst: [H, { fx: 'steamBurst', target: '#heater', counter: { from: 0, to: 100, suffix: '°' } }],
  counter: [H, { fx: 'counter', from: 0, to: 10000, x: 760, y: 400, duration: 1.5 }],
  compare: [CUT, { fx: 'compare', target: '#heater-element' }],
  phoneChecklist: [H, { fx: 'phoneChecklist', items: ['55° فالترموستا', 'الصمام : مرة فالشهر', 'تنقية : كل جوج عامين'] }],
  transition: [H, { fx: 'transition' }],
  endCard: [H, { fx: 'endCard' }],
};

export function playground(st) {
  document.body.classList.add('pg');
  const panel = document.createElement('div'); panel.id = 'pg'; document.body.appendChild(panel);
  let tl;
  const run = name => {
    tl && tl.kill(); st.scenes.innerHTML = ''; st.endcard.innerHTML = ''; gsap.set(st.endcard, { opacity: 0 });
    const [s, beat] = DEMOS[name];
    const mkScene = (setup, cam) => {
      const g = mk('g', { class: 'scene' }, st.scenes);
      g.innerHTML = `<g clip-path="url(#illu-clip)"><g class="world">${compose(setup)}</g></g><g class="overlay"></g>`;
      const world = g.querySelector('.world'); camera.set(world, camera.frame(world, g.querySelector(cam[0]), cam[1]));
      return { root: g, world, overlay: g.querySelector('.overlay'), until: 3 };
    };
    const ctx = mkScene(s.setup, s.cam);
    tl = gsap.timeline({ paused: true });
    if (beat.fx === 'transition') {
      const b = mkScene(CUT.setup, CUT.cam); gsap.set(b.root, { opacity: 0 });
      const from = camera.wider(camera.get(b.world));
      tl.add(transition(ctx.root, b.root), .3).add(camera.focus(b.world, b.root.querySelector('#heater'), { zoom: 1.6, from, duration: .8 }), .3);
    } else if (beat.fx === 'endCard') tl.add(endCard(st.endcard, { brand: { name: 'BRAND_NAME' } }), .3);
    else tl.add(FX[beat.fx](ctx, { ...beat }), .3);
    tl.to({}, { duration: .4 });
    window.__reel = { tl, fps: 30, duration: tl.duration(), marks: [] };
    [...panel.children].forEach(b => b.classList.toggle('on', b.textContent === name));
    tl.play(0);
    return tl.duration();
  };
  Object.keys(DEMOS).forEach(n => { const b = document.createElement('button'); b.textContent = n; b.onclick = () => run(n); panel.appendChild(b); });
  window.__pg = { names: Object.keys(DEMOS), run };
  run('ring');
}
