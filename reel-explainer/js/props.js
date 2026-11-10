// props.js — bibliothèque d'objets SVG (chaînes <g>), style flat line-art
import { rng } from './stage.js';

export const C = {
  ink: '#1E2230', bg: '#F7F8FC', wall: '#EDF1FC', floor: '#D9DEE8', glass: '#B4DCF0',
  hot: '#F2B8B0', cold: '#8A93A6', cream: '#FADCA8', white: '#FFFFFF', card: '#F1F4FB',
  focus: '#F28C0A', danger: '#D9503F', term: '#7F62B4', ok: '#23684B', water: '#3D7FC1', gray: '#A9AEBA',
  pinkWarn: '#F6C1BB', steam: '#C9CFDA', scale: '#EBDDB8',
};
const S = (w = 3, c = C.ink) => `stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const place = ({ x = 0, y = 0, scale = 1 } = {}) => `transform="translate(${x} ${y}) scale(${scale})"`;
// chaque prop : <g placement><g id=… class=…>…</g></g> (le groupe id n'a pas de transform → animable)
const wrap = (id, o, inner, cls = 'prop') => `<g class="place" ${place(o)}><g id="${id}" class="${cls}">${inner}</g></g>`;
// deux traits blancs de reflet
export const refl = (x, y, l = 30) =>
  `<g class="refl" ${S(4, '#fff')}><path d="M${x} ${y + l}L${x + l} ${y}"/><path d="M${x + 14} ${y + l + 6}L${x + l + 8} ${y + 20}" opacity=".9"/></g>`;

export const defs = () => `
  <pattern id="tiles" width="60" height="60" patternUnits="userSpaceOnUse">
    <rect width="60" height="60" fill="#DCEBF6"/>
    <path d="M30 2L58 30L30 58L2 30Z" fill="${C.glass}" ${S(2, '#9CC8E2')}/>
  </pattern>
  <clipPath id="illu-clip"><rect width="1080" height="1220"/></clipPath>
  <clipPath id="heater-clip"><rect x="14" y="14" width="252" height="492" rx="58"/></clipPath>`;

/* ---------- décor ---------- */
export function room(o = {}) {
  const bottles = [[700, 330, 46, 76, '#B4DCF0'], [770, 316, 40, 90, '#F2B8B0'], [836, 340, 50, 66, '#CFE6C9']]
    .map(([x, y, w, h, f], i) => `<g id="bottle-${i + 1}"><rect x="${x + w / 2 - 9}" y="${y - 18}" width="18" height="20" rx="4" fill="#fff" ${S()}/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${f}" ${S()}/>${i === 0 ? refl(x + 8, y + 18, 18) : ''}</g>`).join('');
  return wrap('room', o, `
    <rect id="wall" x="-1200" y="-800" width="3480" height="1840" fill="${C.wall}"/>
    <g id="window"><rect x="690" y="70" width="240" height="210" rx="16" fill="${C.glass}" ${S()}/>
      <path d="M810 70V280M690 175H930" ${S()} fill="none"/>${refl(712, 92, 34)}${refl(832, 196, 28)}</g>
    <g id="shelf"><rect x="660" y="406" width="300" height="16" rx="8" fill="#fff" ${S()}/>${bottles}</g>
    <rect id="credence" x="520" y="520" width="1760" height="250" fill="url(#tiles)" ${S()}/>
    <rect id="floor" x="-1200" y="1040" width="3480" height="700" fill="${C.floor}"/>
    <path d="M-1200 1040H2280" ${S()}/>
    <g id="counter">
      <rect x="500" y="770" width="1800" height="34" rx="8" fill="#fff" ${S()}/>
      <rect x="520" y="804" width="1760" height="236" fill="${C.wall}" ${S()}/>
      <path d="M800 804V1040" ${S()}/><circle cx="780" cy="920" r="6" fill="${C.ink}"/><circle cx="820" cy="920" r="6" fill="${C.ink}"/>
      <g id="cooktop"><rect x="830" y="758" width="210" height="14" rx="5" fill="${C.ink}"/></g>
    </g>`);
}

export function heater(o = {}) {
  const cut = !!o.cut, r = rng(7);
  let dots = '';
  for (let i = 0; i < 46; i++) {
    const x = 34 + r() * 212, y = 478 + r() * 24, rr = 4 + r() * 5;
    dots += `<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${C.scale}" ${S(1.5)}/>`;
  }
  const inside = cut ? `
    <g id="heater-inside" clip-path="url(#heater-clip)">
      <rect x="14" y="14" width="252" height="492" fill="#fff"/>
      <rect id="heater-water" x="14" y="70" width="252" height="440" fill="${C.glass}"/>
      <path d="M14 70H266" ${S(2, '#7FB7D6')}/>
      ${refl(40, 110, 36)}
      <path id="heater-anode" d="M214 505V250" ${S(8, '#8C7A62')} fill="none"/>
      <path id="heater-element" d="M100 505V290Q100 250 135 250Q170 250 170 290V505" fill="none" ${S(12, C.gray)}/>
      <g id="heater-scale">${dots}</g>
    </g>` : `
    <g id="heater-screen"><rect x="70" y="90" width="140" height="74" rx="14" fill="${C.glass}" ${S()}/>
      <text id="heater-temp" x="140" y="140" text-anchor="middle" font-size="34" font-weight="800" fill="${C.ink}" font-family="Noto Kufi Arabic">55°</text></g>
    <path d="M60 230H220M60 260H180" ${S(3, '#C8D0E2')} fill="none"/>`;
  return wrap('heater', o, `
    <g id="heater-pipes">
      <rect x="80" y="600" width="22" height="290" fill="${C.hot}" ${S(3, C.danger)}/>
      <rect x="179" y="600" width="22" height="40" fill="${C.cold}" ${S()}/>
    </g>
    <rect id="heater-body" x="0" y="0" width="280" height="520" rx="70" fill="#fff"/>
    ${inside}
    <rect id="heater-shell" x="0" y="0" width="280" height="520" rx="70" fill="none" ${S()}/>
    <g id="heater-box"><rect x="40" y="520" width="200" height="86" rx="18" fill="#fff" ${S()}/>
      <g id="heater-dial"><circle cx="100" cy="563" r="24" fill="${C.wall}" ${S()}/><path d="M100 563L112 548" ${S()}/></g>
      <circle id="heater-led" cx="182" cy="563" r="10" fill="${C.ok}" ${S()}/></g>`, cut ? 'prop cut' : 'prop');
}

export function safetyValve(o = {}) {
  return wrap('safety-valve', o, `
    <rect x="-11" y="-30" width="22" height="40" fill="${C.cold}" ${S()}/>
    <rect id="valve-body" x="-34" y="8" width="68" height="56" rx="12" fill="#C7CDDA" ${S()}/>
    <g id="valve-lever"><path d="M20 20L66 6" ${S(8, C.danger)}/><circle cx="20" cy="20" r="7" fill="#fff" ${S()}/></g>
    <path d="M-60 36H-34M34 52H58" ${S(14, C.cold)}/><path d="M-60 29H-34M-60 43H-34" ${S(2)}/>
    <rect x="-8" y="64" width="16" height="22" fill="${C.cold}" ${S()}/>
    <path id="valve-funnel" d="M-34 96H34L10 132H-10Z" fill="#fff" ${S()}/>
    <rect id="valve-drain" x="-9" y="132" width="18" height="128" fill="#D5DAE4" ${S()}/>`);
}

export function kettle(o = {}) {
  return wrap('kettle', o, `
    <path d="M128 50Q170 40 176 6" fill="none" ${S(8)}/><path d="M128 50Q170 40 176 6" fill="none" ${S(3, '#fff')}/>
    <path id="kettle-body" d="M18 128L34 32Q36 20 50 20H110Q124 20 126 32L142 128Z" fill="#fff" ${S()}/>
    <path d="M30 0Q80 -32 130 0" fill="none" ${S(8)}/>
    <rect id="kettle-lid" x="52" y="8" width="56" height="14" rx="6" fill="${C.glass}" ${S()}/>
    <rect x="44" y="60" width="72" height="46" rx="10" fill="${C.glass}" ${S()}/>${refl(54, 66, 18)}
    <path d="M10 130H150" ${S()}/>`);
}

export function sink(o = {}) {
  return wrap('sink', o, `
    <path d="M0 0H200L184 50Q180 64 166 64H34Q20 64 16 50Z" fill="#fff" ${S()}/>
    <path id="faucet" d="M100 0V-80Q100 -100 120 -100H150V-84" fill="none" ${S(9, C.cold)}/>
    <path d="M100 0V-80Q100 -100 120 -100H150V-84" fill="none" ${S(3)} opacity=".25"/>
    <circle cx="70" cy="-10" r="8" fill="${C.hot}" ${S()}/><circle cx="130" cy="-10" r="8" fill="${C.glass}" ${S()}/>`);
}

export function shower(o = {}) {
  let holes = ''; for (let i = 0; i < 5; i++) holes += `<circle cx="${-40 + i * 20}" cy="18" r="3" fill="${C.ink}"/>`;
  return wrap('shower', o, `<path d="M0 0V-120H80V-80" fill="none" ${S(8, C.cold)}/>
    <path d="M-60 10H60L44 -6H-44Z" fill="#fff" ${S()} transform="translate(80 -60)"/><g transform="translate(80 -60)">${holes}</g>`);
}

export function mirror(o = {}) {
  return wrap('mirror', o, `<rect x="0" y="0" width="220" height="280" rx="110" fill="${C.glass}" ${S()}/>${refl(40, 60, 50)}${refl(120, 180, 30)}`);
}

export function expansionTank(o = {}) {
  return wrap('expansion-tank', o, `<rect x="-8" y="-40" width="16" height="44" fill="${C.cold}" ${S()}/>
    <rect id="tank-body" x="-55" y="0" width="110" height="150" rx="50" fill="${C.danger}" ${S()}/>
    <path d="M-55 75H55" ${S()}/>${refl(-36, 22, 22)}`);
}

/* ---------- icônes (centrées sur 0,0, ~100 px) ---------- */
export const icons = {
  check: () => `<g class="icon check"><circle r="48" fill="#fff" ${S(4)}/><path d="M-22 2L-6 18L24 -16" fill="none" ${S(10, C.ok)}/></g>`,
  cross: () => `<g class="icon cross"><circle r="48" fill="#fff" ${S(4)}/><path d="M-18 -18L18 18M18 -18L-18 18" ${S(10, C.danger)}/></g>`,
  warning: () => `<g class="icon warning"><path d="M0 -52L52 42H-52Z" fill="${C.pinkWarn}" ${S(5, C.danger)}/>
    <path d="M0 -14V14" ${S(9, C.danger)}/><circle cx="0" cy="30" r="5" fill="${C.danger}"/></g>`,
  shield: (ok = true) => `<g class="icon shield"><path d="M0 -54L44 -38V2Q44 40 0 56Q-44 40 -44 2V-38Z" fill="#fff" ${S(4)}/>
    ${ok ? `<path d="M-18 2L-5 16L20 -12" fill="none" ${S(9, C.ok)}/>` : `<path d="M-14 -14L14 14M14 -14L-14 14" ${S(9, C.danger)}/>`}</g>`,
  gauge: () => `<g class="icon gauge"><circle r="90" fill="#fff" ${S(4)}/>
    <path d="M-63.6 63.6A90 90 0 0 1 -63.6 -63.6" fill="none" ${S(14, C.ok)} transform="scale(.82)"/>
    <path d="M-63.6 -63.6A90 90 0 0 1 63.6 -63.6" fill="none" ${S(14, C.focus)} transform="scale(.82)"/>
    <path d="M63.6 -63.6A90 90 0 0 1 63.6 63.6" fill="none" ${S(14, C.danger)} transform="scale(.82)"/>
    <g id="needle"><path d="M-7 0L0 -70L7 0Z" fill="${C.ink}" ${S(2)}/></g><circle r="12" fill="${C.ink}"/>
    <text y="58" text-anchor="middle" font-size="26" font-weight="800" fill="${C.ink}" font-family="sans-serif">bar</text></g>`,
  thermometer: (label = '') => `<g class="icon thermometer">
    <rect x="-24" y="-170" width="48" height="210" rx="24" fill="#fff" ${S(4)}/>
    <circle cy="60" r="40" fill="${C.danger}" ${S(4)}/>
    <rect id="mercury" x="-11" y="-150" width="22" height="200" rx="11" fill="${C.danger}"/>
    <path d="M24 -130H40M24 -90H40M24 -50H40M24 -10H40" ${S(3)}/>
    <text class="thermo-label" x="0" y="140" text-anchor="middle" font-size="52" font-weight="800" fill="${C.danger}" font-family="Noto Kufi Arabic">${label}</text></g>`,
  calendarBadge: (txt = '1×') => `<g class="icon calendar"><rect x="-50" y="-44" width="100" height="94" rx="14" fill="#fff" ${S(4)}/>
    <path d="M-50 -14H50" ${S(4)}/><rect x="-50" y="-44" width="100" height="30" rx="14" fill="${C.danger}" ${S(4)}/>
    <path d="M-24 -56V-34M24 -56V-34" ${S(5)}/><text y="34" text-anchor="middle" font-size="38" font-weight="800" fill="${C.ink}" font-family="sans-serif">${txt}</text></g>`,
  badge: (txt, color = C.water) => `<g class="icon badge"><rect x="-74" y="-36" width="148" height="72" rx="36" fill="${color}" ${S(3)}/>
    <text y="15" text-anchor="middle" font-size="40" font-weight="800" fill="#fff" font-family="sans-serif" direction="ltr">${txt}</text></g>`,
  drop: () => `<path class="drop" d="M0 -16Q10 -2 10 6A10 10 0 0 1 -10 6Q-10 -2 0 -16Z" fill="${C.water}" ${S(2)}/>`,
};

// téléphone avec liste de tâches (coordonnées écran)
export function phone(items = [], o = { x: 300, y: 150 }) {
  const rows = items.map((t, i) => {
    const y = 300 + i * 170;
    return `<g class="row" id="row-${i}">
      <rect x="28" y="${y - 60}" width="424" height="124" rx="22" fill="${C.card}" ${S()}/>
      <text x="368" y="${y + 12}" text-anchor="end" font-size="29" font-weight="600" fill="${C.ink}" font-family="Noto Kufi Arabic">${t}</text>
      <circle cx="406" cy="${y}" r="24" fill="#fff" ${S()}/>
      <g class="tick" transform="translate(406 ${y})"><g class="tick-in"><circle r="24" fill="${C.ok}"/><path d="M-12 1L-3 10L13 -9" fill="none" ${S(6, '#fff')}/></g></g>
    </g>`;
  }).join('');
  return `<g id="phone" ${place(o)}><g class="phone-in">
    <rect x="0" y="0" width="480" height="${300 + items.length * 170 + 60}" rx="56" fill="#fff" ${S(4)}/>
    <rect x="170" y="26" width="140" height="20" rx="10" fill="${C.ink}"/>
    <text x="440" y="150" text-anchor="end" font-size="44" font-weight="800" fill="${C.ink}" font-family="Noto Kufi Arabic">الصيانة</text>
    <path d="M440 186H250" ${S(4, C.focus)}/>${rows}</g></g>`;
}

// résistance (vue de face) pour compare/insets — propre ou entartrée
export function elementView(dirty = false, seed = 3) {
  const r = rng(seed); let dots = '';
  if (dirty) for (let i = 0; i < 70; i++) {
    const t = r(); const side = r() < .5 ? -1 : 1;
    const y = -60 + t * 150, x = side * 38 + (r() - .5) * 26;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(4 + r() * 6).toFixed(1)}" fill="${C.scale}" ${S(1.5)}/>`;
  }
  return `<path d="M-38 100V-40Q-38 -80 0 -80Q38 -80 38 -40V100" fill="none" ${S(18, dirty ? '#B9A27A' : C.gray)}/>
    <path d="M-38 100V-40Q-38 -80 0 -80Q38 -80 38 -40V100" fill="none" ${S(3, C.ink)} opacity=".3"/>${dots}`;
}

export const PROPS = { room, heater, safetyValve, kettle, sink, shower, mirror, expansionTank };
// positions par défaut dans la composition (zone illustration 0–1220)
export const LAYOUT = {
  room: {}, heater: { x: 120, y: 150 }, safetyValve: { x: 310, y: 820 }, kettle: { x: 860, y: 628 },
  sink: { x: 560, y: 770 }, shower: { x: 600, y: 300 }, mirror: { x: 560, y: 120 }, expansionTank: { x: 470, y: 800, scale: .8 },
};
// "room+heater:cut+kettle" → chaîne SVG
export function compose(setup) {
  const parts = setup.split('+').map(s => s.trim()).filter(Boolean);
  if (parts.some(p => p.startsWith('heater')) && !parts.includes('safetyValve')) parts.push('safetyValve');
  return parts.map(p => {
    const [name, ...flags] = p.split(':');
    const fn = PROPS[name]; if (!fn) throw new Error('prop inconnu : ' + name);
    const o = { ...LAYOUT[name] }; flags.forEach(f => (o[f] = true));
    return fn(o);
  }).join('');
}
