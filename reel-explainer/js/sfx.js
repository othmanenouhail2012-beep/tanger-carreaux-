// sfx.js — bruitages synthétisés (pas de fichiers, pas de voix).
// Les mêmes sons servent à l'aperçu (WebAudio) et à l'export (WAV mixé par export/render.mjs).
// Les effets appellent emit('drip') etc. via la timeline : le son est donc calé à l'image près.
export const bus = { on: null };
export const emit = type => bus.on && bus.on(type);
export const SR = 48000;

const TAU = Math.PI * 2;
function noise(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2147483648 - 1; }; }

export function synth(type, sr = SR) {
  const buf = sec => new Float32Array(Math.round(sec * sr));
  const n = noise(type.length * 97);
  let d, ph = 0;
  switch (type) {
    case 'drip': { // « plic » : bulle dont la fréquence monte vite
      d = buf(.18);
      for (let i = 0; i < d.length; i++) { const t = i / sr; const f = 520 + 1500 * (1 - Math.exp(-t / .022)); ph += TAU * f / sr;
        d[i] = .55 * Math.min(1, t / .0015) * Math.exp(-t / .032) * Math.sin(ph); }
      return d;
    }
    case 'pop': {
      d = buf(.14);
      for (let i = 0; i < d.length; i++) { const t = i / sr; const f = 240 + 520 * Math.min(1, t / .05); ph += TAU * f / sr;
        d[i] = .45 * Math.exp(-t / .045) * Math.sin(ph) + (t < .004 ? .25 * n() * (1 - t / .004) : 0); }
      return d;
    }
    case 'swish': case 'whoosh': { // souffle filtré, balayage du filtre
      const T = type === 'swish' ? .32 : .5, amp = type === 'swish' ? .16 : .26;
      d = buf(T); let a = 0, b = 0;
      for (let i = 0; i < d.length; i++) { const t = i / sr, k = t / T;
        const c = .02 + .25 * Math.sin(Math.PI * k); a += c * (n() - a); b += c * .5 * (a - b);
        d[i] = amp * Math.pow(Math.sin(Math.PI * k), 1.5) * (a - b) * 3; }
      return d;
    }
    case 'tick': {
      d = buf(.3);
      for (let i = 0; i < d.length; i++) { const t = i / sr; const e = Math.min(1, t / .002) * Math.exp(-t / .07);
        d[i] = .22 * e * (Math.sin(TAU * 1318.5 * t) + .5 * Math.sin(TAU * 1975.5 * t)); }
      return d;
    }
    case 'warn': { // deux bips doux
      d = buf(.32);
      for (let i = 0; i < d.length; i++) { const t = i / sr; const f = t < .14 ? 740 : 554; const lt = t < .14 ? t : t - .16;
        const e = lt < 0 ? 0 : Math.min(1, lt / .006) * Math.exp(-lt / .06); d[i] = .2 * e * Math.sin(TAU * f * t); }
      return d;
    }
    case 'chime': { // arpège do-mi-sol
      d = buf(1.5);
      [[523.25, 0], [659.25, .11], [783.99, .22]].forEach(([f, t0]) => {
        for (let i = Math.round(t0 * sr); i < d.length; i++) { const t = i / sr - t0; const e = Math.min(1, t / .004) * Math.exp(-t / .38);
          d[i] += .16 * e * (Math.sin(TAU * f * t) + .3 * Math.sin(TAU * 2 * f * t)); }
      });
      return d;
    }
    default: return buf(0);
  }
}

// mixe des évènements [{t, type}] en un WAV mono 16 bits (Node ou navigateur)
export function mixToWav(events, duration, sr = SR) {
  const out = new Float32Array(Math.ceil((duration + .5) * sr)); const cache = {};
  for (const e of events) { const s = cache[e.type] ||= synth(e.type, sr); const o = Math.round(e.t * sr);
    for (let i = 0; i < s.length && o + i < out.length; i++) out[o + i] += s[i]; }
  const bytes = new ArrayBuffer(44 + out.length * 2), v = new DataView(bytes);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 36 + out.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, out.length * 2, true);
  for (let i = 0; i < out.length; i++) v.setInt16(44 + i * 2, Math.round(Math.tanh(out[i]) * 32000), true);
  return new Uint8Array(bytes);
}

// aperçu navigateur
let ac = null; const abufs = {};
export function unlock() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); }
export function play(type) {
  if (!ac) return;
  const b = abufs[type] ||= (() => { const d = synth(type, ac.sampleRate); const ab = ac.createBuffer(1, Math.max(1, d.length), ac.sampleRate); ab.copyToChannel(d, 0); return ab; })();
  const s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start();
}
