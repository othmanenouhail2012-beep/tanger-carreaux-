// storyboard.js — le SEUL fichier à modifier pour un nouveau reel.
// Reel : Quick Bricolage — « الروبيني كيقطر » (robinet qui goutte). Concept : concepts/quick-bricolage.md
// caption : [mot|term|danger|ok|water] = mot-clé coloré + soulignement.  words : temps exacts (s) de chaque mot (optionnel).
// say : texte prononcé par la voix IA s'il doit différer du sous-titre (chiffres en lettres, noms latins…).
// beats : effets placés en secondes depuis le début de la scène (voir js/fx.js).
const SET = 'bathroom+mirror+basin';
const drip = (until) => ({ t: 0, fx: 'drip', target: '#spout', fall: 150, ...(until ? { until } : {}) });

export const reel = {
  fps: 30,
  brand: { name: 'Quick Bricolage', logo: null, icon: 'wrench' },
  // voix IA (python3 export/tts.py) : ar-MA-JamalNeural (homme) ou ar-MA-MounaNeural (femme)
  voice: { name: 'ar-MA-JamalNeural', rate: '+5%' },
  scenes: [
    {
      id: 'hook', duration: 3.5, setup: SET,
      camera: { target: '#faucet', zoom: 1.6 },
      caption: 'واش [الروبيني|term] ديالك كيقطر وانت ساكت عليه؟',
      beats: [
        drip(),
        { t: 0.6, fx: 'ring', target: '#faucet' },
        { t: 2.0, fx: 'pop', icon: 'warning', target: '#faucet' },
      ],
    },
    {
      id: 'waste', duration: 4.2, setup: SET,
      camera: { target: '#basin', zoom: 1.3 },
      caption: 'قطرة وحدة فالثانية... كتولّي [10 000 لتر|water] فالعام',
      say: 'قطرة وحدة فالثانية... كتولّي عشرة آلاف لتر فالعام',
      beats: [
        drip(),
        { t: 0.5, fx: 'insetCard', target: '#spout', content: 'jug' },
        { t: 1.0, fx: 'fillLevel', target: '.inset #jug-water', from: 0.08, badge: null },
        { t: 1.0, fx: 'counter', from: 0, to: 10000, suffix: ' L', color: '#3D7FC1', x: 540, y: 990, size: 130, duration: 2.2 },
      ],
    },
    {
      id: 'cause', duration: 4.2, setup: SET, transition: 'fromInset',
      camera: { target: '#faucet', zoom: 1.9 },
      caption: 'السبب غالباً [الجوان|term] اللي داخل الروبيني تخسّر',
      beats: [
        drip(),
        { t: 0.4, fx: 'insetCard', target: '#faucet', content: 'faucetCut' },
        { t: 1.3, fx: 'magnifier', target: '.inset #f-joint', lens: { x: 800, y: 330 }, content: 'jointWorn' },
      ],
    },
    {
      id: 'compare', duration: 3.6, setup: SET, transition: 'fromInset',
      camera: { target: '#faucet', zoom: 1.5 },
      caption: '[جوان جديد|ok] كيسدّ مزيان... [القديم|danger] كيخلي الما يدوز',
      beats: [
        drip(),
        { t: 0.3, fx: 'compare', target: '#faucet',
          left: { label: 'جديد', ok: true, content: 'jointNew' }, right: { label: 'مستعمل', ok: false, content: 'jointOld' } },
      ],
    },
    {
      id: 'bill', duration: 3.4, setup: SET, transition: 'fromInset',
      camera: { target: '#basin', zoom: 1.25 },
      caption: 'و[فاتورة الما|danger] كتطلع شهر على شهر',
      beats: [
        drip(),
        { t: 0.4, fx: 'gauge', label: 'm³', x: 830, y: 300, size: 1.1 },
        { t: 2.0, fx: 'pop', icon: 'warning', x: 940, y: 190, size: .8, layer: 'overlay' },
      ],
    },
    {
      id: 'fix', duration: 5.0, setup: SET,
      camera: { target: '#basin', zoom: 1.4 },
      caption: 'الحل: [سدّ الما|ok] من تحت... وبدّل [الجوان|ok] ف 5 دقايق',
      say: 'الحل: سدّ الما من تحت... وبدّل الجوان ف خمس دقايق',
      beats: [
        drip(2.2), // la goutte s'arrête une fois l'eau coupée
        { t: 0.2, fx: 'camera', target: '#stop-valve', zoom: 2.6, duration: 1.0 },
        { t: 1.2, fx: 'ring', target: '#stop-valve', hold: 1.0 },
        { t: 2.1, fx: 'pop', icon: 'check', target: '#stop-valve', size: .9 },
        { t: 2.6, fx: 'camera', target: '#faucet', zoom: 1.8, duration: 0.9 },
        { t: 3.4, fx: 'pop', icon: 'wrench', target: '#faucet', at: 'tl', size: 1.3 },
        { t: 3.9, fx: 'pop', icon: 'check', target: '#faucet', size: .9 },
      ],
    },
    {
      id: 'shop', duration: 4.6, setup: SET,
      camera: { target: '#basin', zoom: 1.2 },
      caption: 'كلشي كاين عند [Quick Bricolage|ok]',
      say: 'كلشي كاين عند كْويك بْريكولاج',
      beats: [
        { t: 0.3, fx: 'phoneChecklist', title: 'شنو خاصك؟', items: ['جوان جديد', 'شريط تيفلون', 'كلي أنگليز'] },
      ],
    },
    { id: 'end', duration: 2.8, endCard: true },
  ],
};

// contenus SVG nommés : insetCard (repère 780×640), loupe (centrée 0,0, r 110), disques de compare (centrés 0,0, r 150)
const INK = '#1E2230', RUB = '#3A3F4E', W = '#B4DCF0';
const drops = (pts) => pts.map(([x, y, s = 1]) => `<path class="p" transform="translate(${x} ${y}) scale(${s})" d="M0 -16Q10 -2 10 6A10 10 0 0 1 -10 6Q-10 -2 0 -16Z" fill="#3D7FC1" stroke="${INK}" stroke-width="2"/>`).join('');
export const insets = {
  jug: `
    <rect x="345" y="70" width="90" height="40" rx="10" fill="#3D7FC1" stroke="${INK}" stroke-width="3"/>
    <rect x="360" y="104" width="60" height="40" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <rect x="250" y="140" width="280" height="440" rx="60" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <clipPath id="jug-clip"><rect x="252" y="142" width="276" height="436" rx="58"/></clipPath>
    <g clip-path="url(#jug-clip)"><rect id="jug-water" x="250" y="200" width="280" height="380" fill="${W}"/>
      <path d="M250 200H530" stroke="#7FB7D6" stroke-width="3"/></g>
    <rect x="250" y="140" width="280" height="440" rx="60" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M500 260H520M500 340H520M500 420H520M500 500H520" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M280 220l40 -40M290 250l24 -24" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
    <text x="390" y="410" text-anchor="middle" font-size="64" font-weight="800" fill="${INK}" font-family="sans-serif" opacity=".25">L</text>
    ${drops([[390, 40, 1.4]])}`,
  faucetCut: `
    <text x="740" y="70" text-anchor="end" font-size="40" font-weight="800" fill="${INK}" font-family="Noto Kufi Arabic">الروبيني من الداخل</text>
    <rect x="290" y="96" width="200" height="40" rx="16" fill="#DDE2EC" stroke="${INK}" stroke-width="3"/>
    <rect x="374" y="130" width="32" height="200" fill="#8A93A6" stroke="${INK}" stroke-width="3"/>
    <rect x="170" y="230" width="420" height="300" rx="40" fill="#DDE2EC" stroke="${INK}" stroke-width="3"/>
    <path d="M230 530V380H330V320H450V360H640V420H450V380H330V530Z" fill="${W}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="600" y="360" width="60" height="60" fill="${W}"/>
    <path d="M590 360H660V470H620V420H590" fill="#DDE2EC" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <rect x="346" y="300" width="88" height="22" rx="6" fill="#8A93A6" stroke="${INK}" stroke-width="3"/>
    <rect id="f-joint" x="350" y="322" width="80" height="18" rx="8" fill="${RUB}" stroke="${INK}" stroke-width="3"/>
    <path d="M330 380H350M430 380H450" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    ${drops([[640, 500], [640, 560, .8]])}
    <path d="M200 560H300" stroke="#F28C0A" stroke-width="4" stroke-linecap="round"/>
    <text x="250" y="606" text-anchor="middle" font-size="30" font-weight="600" fill="${INK}" font-family="Noto Kufi Arabic">الما داخل</text>`,
  jointWorn: `
    <rect x="-100" y="-34" width="200" height="68" rx="26" fill="${RUB}" stroke="${INK}" stroke-width="3"/>
    <path class="p" d="M-60 -34l14 22l-10 14l12 20" fill="none" stroke="#C9CFDA" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="p" d="M10 34l-10 -20l12 -12l-6 -22" fill="none" stroke="#C9CFDA" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="p" d="M60 -34l-8 18l14 12" fill="none" stroke="#C9CFDA" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path class="p" d="M100 -6h-26v14h26" fill="#fff" stroke="${INK}" stroke-width="3"/>
    ${drops([[-30, 70], [40, 78, .8], [80, 62, .7]])}`,
  jointNew: `
    <circle r="78" fill="none" stroke="${RUB}" stroke-width="38"/>
    <circle r="78" fill="none" stroke="${INK}" stroke-width="3" transform="scale(1.24)"/><circle r="59" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M-52 -66Q-20 -86 14 -82" fill="none" stroke="#8C93A6" stroke-width="6" stroke-linecap="round"/>`,
  jointOld: `
    <g transform="scale(1 .82)"><circle r="78" fill="none" stroke="#6B7080" stroke-width="38" stroke-dasharray="110 18 60 26 140 12"/>
    <circle r="97" fill="none" stroke="${INK}" stroke-width="3"/><circle r="59" fill="none" stroke="${INK}" stroke-width="3"/></g>
    <path d="M-70 -30l18 8l-6 14M40 50l14 -6l2 16M60 -50l-14 2" fill="none" stroke="#C9CFDA" stroke-width="5" stroke-linecap="round"/>
    ${drops([[-90, 90, .8], [100, 80, .7]])}`,
};
