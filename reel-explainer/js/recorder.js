// recorder.js — ?record=1 : enregistre TA voix pendant que le reel défile (synchronisation automatique).
// Le prompteur affiche la phrase en cours et la suivante ; à la fin, télécharge le fichier et mets-le dans audio/.
const plain = s => s.replace(/\[([^\]|]+)\|\w+\]/g, '$1').replace(/(\d) (?=\d{3}\b)/g, '$1\u202F');

export function recorder({ tl, marks, duration }) {
  document.body.classList.add('rec');
  const lines = marks.filter(m => m.caption);
  const panel = document.createElement('div'); panel.id = 'rec';
  panel.innerHTML = `
    <h2>🎙 Enregistrer la voix</h2>
    <ol class="tips"><li>Mets un casque ou des écouteurs.</li><li>Pièce calme, micro à ~20 cm.</li>
      <li>Clique, attends le décompte, puis lis la phrase <b>En cours</b> à voix naturelle.</li></ol>
    <div class="prompt"><div class="lbl">En cours</div><div class="now" dir="rtl"></div><div class="lbl">Ensuite</div><div class="next" dir="rtl"></div></div>
    <div class="row"><button class="go">● Enregistrer</button><button class="stop" hidden>■ Arrêter</button></div>
    <div class="count"></div>
    <div class="result" hidden><audio controls></audio>
      <div class="row"><button class="review">▶ Revoir avec la voix</button><a class="dl" download>⬇ Télécharger</a></div>
      <p class="hint">Enregistre le fichier dans <code>reel-explainer/audio/</code> sous le nom <code>voice.webm</code> (ou garde son extension), puis lance <code>node export/render.mjs</code>.</p></div>
    <details><summary>Tout le texte</summary><ol class="script" dir="rtl">${lines.map(m => `<li>${plain(m.caption)}</li>`).join('')}</ol></details>`;
  document.body.appendChild(panel);
  const $ = s => panel.querySelector(s);
  const now = $('.now'), next = $('.next'), count = $('.count'), go = $('.go'), stop = $('.stop'), result = $('.result'), player = $('audio'), dl = $('.dl');

  const prompt = () => {
    const t = tl.time(); let i = lines.findIndex((m, k) => t >= m.t && (k === lines.length - 1 || t < lines[k + 1].t));
    if (i < 0) i = 0;
    const end = t >= lines[lines.length - 1].t + lines[lines.length - 1].duration;
    now.textContent = end ? '— fin —' : plain(lines[i].caption);
    next.textContent = end || !lines[i + 1] ? '' : plain(lines[i + 1].caption);
    next.classList.toggle('soon', !!lines[i + 1] && lines[i + 1].t - t < .8);
  };
  tl.eventCallback('onUpdate', prompt); tl.pause(0); prompt();

  let rec, chunks = [], stream;
  const mime = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
  const ext = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : 'webm';

  go.onclick = async () => {
    try {
      stream ||= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    } catch (e) { count.textContent = 'Micro refusé : autorise le micro dans le navigateur.'; return; }
    result.hidden = true; go.hidden = true; tl.pause(0); prompt();
    for (const n of [3, 2, 1]) { count.textContent = n; await new Promise(r => setTimeout(r, 1000)); } // décompte (hors timeline)
    count.textContent = '● REC';
    chunks = []; rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || mime });
      const url = URL.createObjectURL(blob);
      player.src = url; dl.href = url; dl.download = `voice.${ext}`; dl.textContent = `⬇ Télécharger voice.${ext}`;
      result.hidden = false; go.hidden = false; stop.hidden = true; go.textContent = '● Refaire'; count.textContent = '';
      window.__voiceBlob = blob;
    };
    rec.start(); tl.play(0); stop.hidden = false;
  };
  const finish = () => { tl.pause(); if (rec && rec.state === 'recording') rec.stop(); };
  stop.onclick = finish;
  tl.eventCallback('onComplete', finish);
  $('.review').onclick = () => { tl.play(0); player.currentTime = 0; player.play(); };
}
