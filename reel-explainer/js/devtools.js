// devtools.js — barre de lecture (masquée avec ?export=1)
export function devtools({ tl, marks, duration }) {
  const bar = document.getElementById('devtools');
  bar.innerHTML = `<button class="play">▶</button><button class="loop on" title="boucle">⟲</button>
    <input type="range" min="0" max="${duration}" step="0.001" value="0"><span class="time"></span><div class="scenes"></div>`;
  const [play, loop, range, time, scenes] = bar.children;
  const fmt = s => s.toFixed(2).padStart(5, '0');
  const sync = () => { range.value = tl.time(); time.textContent = `${fmt(tl.time())} / ${duration.toFixed(2)}`; play.textContent = tl.paused() ? '▶' : '❚❚'; };
  tl.eventCallback('onUpdate', sync);
  tl.eventCallback('onComplete', () => { if (loop.classList.contains('on')) tl.restart(); else sync(); });
  play.onclick = () => { if (tl.progress() >= 1) tl.restart(); else tl.paused(!tl.paused()); sync(); };
  loop.onclick = () => loop.classList.toggle('on');
  range.oninput = () => { tl.pause(); tl.seek(+range.value); sync(); };
  marks.forEach((m, i) => { const b = document.createElement('button'); b.textContent = `${i + 1}·${m.id}`; b.onclick = () => { tl.seek(m.t); sync(); }; scenes.appendChild(b); });
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); play.onclick(); } });
  sync();
}
