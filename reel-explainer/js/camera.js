// camera.js — zoom/panoramique d'un groupe .world (une caméra par scène)
import { boxIn, ILLU } from './stage.js';
const states = new WeakMap();

export function apply(world, s) { world.setAttribute('transform', `translate(${s.x} ${s.y}) scale(${s.s})`); }
export function get(world) { return states.get(world) || { x: 0, y: 0, s: 1 }; }
export function set(world, s) { states.set(world, { ...s }); apply(world, s); }

// état caméra qui cadre `target` (élément dans world) au zoom donné
export function frame(world, target, zoom = 1) {
  if (!target) return { x: ILLU.cx * (1 - zoom), y: ILLU.cy * (1 - zoom), s: zoom };
  const prev = world.getAttribute('transform');
  world.setAttribute('transform', '');
  const b = boxIn(target, world);
  if (prev) world.setAttribute('transform', prev);
  return { x: ILLU.cx - b.cx * zoom, y: ILLU.cy - b.cy * zoom, s: zoom };
}

// focus : anime de l'état courant (ou `from`) vers le cadrage de la cible
export function focus(world, target, { zoom = 1.6, duration = 1.2, ease = 'power3.inOut', from, drift = 0 } = {}) {
  const a = { ...(from || get(world)) };
  const b = frame(world, target, zoom);
  const p = { ...a };
  const tl = gsap.timeline();
  tl.fromTo(p, { ...a }, { ...b, duration, ease, immediateRender: false, onUpdate: () => apply(world, p) });
  if (drift > 0) { // micro-poussée continue : aucune frame figée
    const d = { x: b.x + (ILLU.cx - b.x) * (1 - 1.035), y: b.y + (ILLU.cy - b.y) * (1 - 1.035), s: b.s * 1.035 };
    const q = { ...b };
    tl.fromTo(q, { ...b }, { ...d, duration: drift, ease: 'none', immediateRender: false, onUpdate: () => apply(world, q) });
    states.set(world, d);
  } else states.set(world, b);
  return tl;
}
// zoom out relatif (pour les transitions : départ un peu plus large)
export function wider(state, k = .85) {
  return { x: ILLU.cx - (ILLU.cx - state.x) * k, y: ILLU.cy - (ILLU.cy - state.y) * k, s: state.s * k };
}
