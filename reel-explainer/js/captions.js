// captions.js — sous-titres mot par mot (RTL), mots-clés [mot|couleur]
import { C } from './props.js';
const COLORS = { term: C.term, danger: C.danger, ok: C.ok, water: C.water, q: C.focus };

export function parse(text) {
  text = text.replace(/(\d) (?=\d{3}\b)/g, '$1\u202F'); // « 10 000 » reste un seul nombre en RTL
  const units = []; const re = /\[([^\]|]+)\|(\w+)\]|([^\s\[]+)|(\s+)/g; let m, space = false;
  while ((m = re.exec(text))) {
    if (m[4]) { space = true; continue; }
    if (m[1]) units.push({ t: m[1], kind: m[2], space });
    else {
      let w = m[3], q = null;
      if (/[؟?]$/.test(w)) { q = w.slice(-1); w = w.slice(0, -1); }
      if (w) units.push({ t: w, space }); if (q) units.push({ t: q, kind: 'q', space: false, attach: true });
    }
    space = false;
  }
  return units;
}

// construit la réplique ; renvoie { el, tl } — tl dure la réplique entière (sortie gérée par main)
export function caption(container, text, { hook = false, words = null, gap = .22, start = .1 } = {}) {
  const el = document.createElement('div'); el.className = 'cap' + (hook ? ' hook' : '');
  const line = document.createElement('div'); line.className = 'line'; el.appendChild(line);
  const units = parse(text); const spans = [];
  units.forEach(u => {
    if (u.space) line.appendChild(document.createTextNode(' '));
    const s = document.createElement('span'); s.className = 'w'; s.textContent = u.t; if (/[A-Za-z\d]/.test(u.t)) { s.style.unicodeBidi = 'isolate'; if (!/[\u0600-\u06FF]/.test(u.t)) s.style.direction = 'ltr'; }
    if (u.kind && u.kind !== 'q') { const ul = document.createElement('i'); ul.className = 'ul'; ul.style.background = COLORS[u.kind]; s.appendChild(ul); }
    line.appendChild(s); spans.push({ s, u });
  });
  container.appendChild(el);
  const tl = gsap.timeline();
  let i = 0, t = start;
  spans.forEach(({ s, u }, k) => {
    if (!u.attach) { t = words && words[i] != null ? words[i] : start + i * gap; i++; }
    const color = COLORS[u.kind] || C.ink, ul = s.querySelector('.ul');
    if (hook) { // accroche : visible dès la frame 0, soulignements qui se dessinent
      gsap.set(s, { opacity: 1, color });
      if (ul) tl.fromTo(ul, { scaleX: 0 }, { scaleX: 1, duration: .3, ease: 'power2.out', immediateRender: false }, .3 + k * .12);
      if (u.kind === 'q') tl.fromTo(s, { scale: 1 }, { scale: 1.25, duration: .25, yoyo: true, repeat: 3, ease: 'power1.inOut', immediateRender: false }, .4);
      return;
    }
    gsap.set(s, { opacity: 0, y: 8, color: C.gray });
    tl.fromTo(s, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .18, ease: 'power2.out', immediateRender: false }, t);
    tl.fromTo(s, { color: C.gray }, { color, duration: .3, ease: 'none', immediateRender: false }, t + .18);
    if (ul) tl.fromTo(ul, { scaleX: 0 }, { scaleX: 1, duration: .3, ease: 'power2.out', immediateRender: false }, t + .3);
  });
  if (hook) gsap.set(el, { opacity: 1 });
  return { el, tl };
}
