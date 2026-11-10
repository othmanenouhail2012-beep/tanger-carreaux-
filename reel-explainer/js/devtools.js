// devtools.js — barre de lecture (masquée avec ?export=1)
import { attachAudio } from './audio.js';

export async function devtools({ tl, marks, duration }) {
  const bar = document.getElementById('devtools');
  bar.innerHTML = `<button class="play">▶</button><button class="loop on" title="boucle">⟲</button><button class="snd on" title="son">🔊</button>
    <input type="range" min="0" max="${duration}" step="0.001" value="0"><span class="time"></span><div class="scenes"></div>`;
  const [play, loop, snd, range, time, scenes] = bar.children;
  const audio = await attachAudio(tl);
  const fmt = s => s.toFixed(2).padStart(5, '0');
  const sync = () => { range.value = tl.time(); time.textContent = `${fmt(tl.time())} / ${duration.toFixed(2)}`; play.textContent = tl.paused() ? '▶' : '❚❚'; };
  tl.eventCallback('onUpdate', sync);
  tl.eventCallback('onComplete', () => { if (loop.classList.contains('on')) { tl.restart(); audio.sync(); } else { sync(); audio.sync(); } });
  play.onclick = () => { audio.unlock(); if (tl.progress() >= 1) tl.restart(); else tl.paused(!tl.paused()); sync(); audio.sync(); };
  loop.onclick = () => loop.classList.toggle('on');
  snd.onclick = () => { audio.setMuted(!audio.muted); snd.classList.toggle('on', !audio.muted); snd.textContent = audio.muted ? '🔇' : '🔊'; };
  if (audio.voice) snd.title = 'son (voix : ' + audio.voice + ')';
  range.oninput = () => { tl.pause(); tl.seek(+range.value); sync(); audio.sync(); };
  marks.forEach((m, i) => { const b = document.createElement('button'); b.textContent = `${i + 1}·${m.id}`; b.onclick = () => { tl.seek(m.t); sync(); audio.sync(); }; scenes.appendChild(b); });
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); play.onclick(); } });
  sync();
}
