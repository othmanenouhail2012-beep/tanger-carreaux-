// storyboard.js — le SEUL fichier à modifier pour un nouveau reel.
// caption : [mot|term|danger|ok|water] = mot-clé coloré + soulignement.  words : temps exacts (s) de chaque mot (optionnel).
// beats : effets placés en secondes depuis le début de la scène (voir js/fx.js pour les options).
export const reel = {
  fps: 30,
  brand: { name: 'BRAND_NAME', logo: null },
  scenes: [
    {
      id: 'hook', duration: 3.5, setup: 'room+heater+kettle',
      camera: { target: '#heater', zoom: 1.3 },
      caption: 'واش [الشوفو|term] ديالك عامر [بالكالكير|danger] وانت ما عارفش؟',
      beats: [
        { t: 0.6, fx: 'ring', target: '#valve-body' },
        { t: 2.0, fx: 'pop', icon: 'warning', target: '#heater' },
      ],
    },
    {
      id: 'kettle', duration: 4.2, setup: 'room+heater+kettle',
      camera: { target: '#counter', zoom: 1.15 },
      caption: 'شوف [المقراج|term] ديالك من الداخل... هداك هو [الكالكير|term]',
      beats: [
        { t: 0.3, fx: 'ring', target: '#kettle', hold: 0.7 },
        { t: 1.3, fx: 'insetCard', target: '#kettle', content: 'kettleInside' },
        { t: 2.0, fx: 'magnifier', target: '.inset #k-bottom', lens: { x: 760, y: 330 } },
      ],
    },
    {
      id: 'heater-cut', duration: 4, setup: 'room+heater:cut', transition: 'fromInset',
      camera: { target: '#heater', zoom: 1.75 },
      caption: 'ملي كيسخن الما، الكالكير كيطيح [لتحت|term]',
      beats: [
        { t: 0.5, fx: 'scaleFall' },
        { t: 1.7, fx: 'heatUp', target: '#heater-element' },
        { t: 2.2, fx: 'expand', target: '#heater-water', badge: '+2 L', badgeTarget: '#heater-shell' },
      ],
    },
    {
      id: 'noise', duration: 3.2, setup: 'room+heater',
      camera: { target: '#heater', zoom: 1.5 },
      caption: 'داك [الطقطيق|danger] اللي كتسمع... سببو الكالكير',
      beats: [{ t: 0.4, fx: 'ripples', target: '#heater' }],
    },
    {
      id: 'energy', duration: 3.6, setup: 'room+heater:cut',
      camera: { target: '#heater', zoom: 1.4 },
      caption: 'السلك كيخدم كتر... و[فاتورة الضو|danger] كتغلا',
      beats: [
        { t: 0.3, fx: 'heatUp', target: '#heater-element' },
        { t: 0.8, fx: 'compare', target: '#heater-element', left: { label: 'نقية', ok: true }, right: { label: 'عامرة كالكير', ok: false } },
        { t: 2.3, fx: 'steamBurst', target: '#heater', n: 0, counter: { from: 300, to: 10000, suffix: ' DH', duration: 1.1, y: 960 } },
      ],
    },
    {
      id: 'valve', duration: 5.2, setup: 'room+heater',
      camera: { target: '#heater', zoom: 1.5 },
      caption: '[الصمام|term] هو اللي كيحمي الشوفو... إلا تسد، [الضغط|danger] كيطلع',
      beats: [
        { t: 0.2, fx: 'camera', target: '#safety-valve', zoom: 2.4, duration: 1.1 },
        { t: 1.2, fx: 'crossSection', target: '#safety-valve', pos: { x: 770, y: 400 } },
        { t: 2.6, fx: 'gauge', x: 220, y: 300, size: 1 },
        { t: 2.9, fx: 'thermometer', to: 100, x: 220, y: 760, size: .75 },
        { t: 3.6, fx: 'danger', shell: '#heater-shell', target: '#heater' },
        { t: 4.0, fx: 'steamBurst', target: '#safety-valve', n: 30 },
      ],
    },
    {
      id: 'solution', duration: 4.6, setup: 'room+heater',
      camera: { target: '#heater-box', zoom: 2.2 },
      caption: 'خلي الحرارة ف [55°|ok]... ومرة فالشهر [حرّك الصمام|ok]',
      beats: [
        { t: 0.3, fx: 'ring', target: '#heater-dial', hold: 1.2 },
        { t: 0.4, fx: 'counter', from: 50, to: 55, suffix: '°', color: '#23684B', x: 540, y: 330, size: 170, duration: 1 },
        { t: 1.9, fx: 'phoneChecklist', items: ['55° فالترموستا', 'الصمام : مرة فالشهر', 'تنقية : كل جوج عامين'] },
      ],
    },
    { id: 'end', duration: 2.6, endCard: true },
  ],
};

// contenus SVG réutilisables pour insetCard (repère 780×640)
export const insets = {
  kettleInside: `<g transform="translate(390 330)">
    <path d="M-230 250L-190 -170Q-186 -200 -156 -200H156Q186 -200 190 -170L230 250Z" fill="#fff" stroke="#1E2230" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-210 40H210L230 250H-230Z" fill="#B4DCF0" stroke="#1E2230" stroke-width="3" stroke-linejoin="round"/>
    <path d="M-180 70l40 -40M-150 80l26 -26" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
    <g id="k-bottom"><path d="M-226 222Q-120 196 0 214Q120 196 226 222L230 250H-230Z" fill="#EBDDB8" stroke="#1E2230" stroke-width="3" stroke-linejoin="round"/>
    ${[...Array(12)].map((_, i) => `<circle cx="${-190 + i * 34}" cy="${226 + (i % 3) * 6}" r="${5 + (i % 4) * 2}" fill="#EBDDB8" stroke="#1E2230" stroke-width="2"/>`).join('')}</g>
  </g>`,
};
