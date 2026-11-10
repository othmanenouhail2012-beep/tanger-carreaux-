// stage.js — canvas 1080×1920 mis à l'échelle (contain) + utilitaires SVG
export const W = 1080, H = 1920, SVGNS = 'http://www.w3.org/2000/svg';
export const params = new URLSearchParams(location.search);
export const isExport = params.has('export');
export const isPlayground = params.has('playground');
export const ILLU = { cx: 540, cy: 610, h: 1220 }; // zone illustration

let svgRoot;
export const root = () => svgRoot;

export function createStage(defs = '') {
  const stage = document.getElementById('stage');
  stage.innerHTML = `
    <svg id="reel" xmlns="${SVGNS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <defs>${defs}</defs>
      <rect width="${W}" height="${H}" fill="#F7F8FC"/>
      <g id="scenes"></g>
    </svg>
    <div id="captions" class="layer"></div>
    <div id="endcard" class="layer"></div>
    <div id="loop" class="layer"></div>`;
  svgRoot = stage.querySelector('#reel');
  if (isExport) document.body.classList.add('export');
  const fit = () => {
    if (isExport) return;
    const vp = document.getElementById('viewport').getBoundingClientRect();
    const s = Math.min(vp.width / W, vp.height / H);
    stage.style.transform = `scale(${s})`;
  };
  addEventListener('resize', fit); fit();
  return { stage, svg: svgRoot, scenes: svgRoot.querySelector('#scenes'),
    captions: stage.querySelector('#captions'), endcard: stage.querySelector('#endcard'), loop: stage.querySelector('#loop') };
}

// crée un élément SVG (ou un groupe à partir d'une chaîne)
export function mk(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
export function frag(str, parent, attrs = {}) {
  const g = mk('g', attrs, parent);
  g.innerHTML = str;
  return g;
}

// bbox de `el` exprimée dans le repère de `ref`
export function boxIn(el, ref = svgRoot) {
  const b = el.getBBox();
  const m = ref.getScreenCTM().inverse().multiply(el.getScreenCTM());
  const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
    .map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

// RNG déterministe (export identique à la lecture)
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
