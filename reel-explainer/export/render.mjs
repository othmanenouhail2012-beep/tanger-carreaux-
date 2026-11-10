// export/render.mjs — export image par image → out/reel.mp4
// Usage : node export/render.mjs
//   options : --story chauffe-eau  --out reel.mp4  --fps 30  --from 0 --to <s>  --keep
//             --voice <fichier>  --voice-offset <s>  --no-sfx  --no-ai  --music-volume 0.18
// Audio : bruitages synthétisés (toujours, sauf --no-sfx) + audio/voice.* (ta voix) + audio/music.* (musique, en boucle, baissée sous la voix)
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mixToWav } from '../js/sfx.js';
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const KEEP = process.argv.includes('--keep');
const FRAMES = path.join(ROOT, 'frames'), OUT = path.join(ROOT, 'out');

// mini serveur statique (les modules ES ne marchent pas en file://)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(ROOT)) throw 0;
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

await rm(FRAMES, { recursive: true, force: true }); await mkdir(FRAMES, { recursive: true }); await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('pageerror:', e.message));
const story = arg('story');
await page.goto(`http://localhost:${port}/index.html?export=1${story ? '&story=' + story : ''}${process.argv.includes('--no-ai') ? '&novoice=1' : ''}`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready.then(() => 1));
await page.waitForFunction(() => window.__reel, null, { timeout: 30000 });
const { fps: fps0, duration } = await page.evaluate(() => ({ fps: window.__reel.fps, duration: window.__reel.duration }));
const fps = +arg('fps', fps0), from = +arg('from', 0), to = Math.min(+arg('to', duration), duration);
const n = Math.round((to - from) * fps);
console.log(`→ ${n} frames @ ${fps} fps (${(to - from).toFixed(2)} s)`);
const sfxEvents = process.argv.includes('--no-sfx') ? [] : await page.evaluate(() => window.__collectSfx());
const stage = await page.$('#stage');
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  await page.evaluate(t => { window.__reel.tl.seek(t, false); }, from + i / fps);
  await stage.screenshot({ path: path.join(FRAMES, String(i + 1).padStart(4, '0') + '.png') });
  if (i % 30 === 0) process.stdout.write(`\r  frame ${i + 1}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
await browser.close(); server.close();
console.log('\n→ ffmpeg');

const exists = p => access(p).then(() => true, () => false);
const ADIR = path.join(ROOT, 'audio', story || '');
const findAudio = async (base, exts = ['wav', 'm4a', 'mp3', 'webm', 'ogg', 'aac', 'flac']) => { for (const e of exts) { const p = path.join(ADIR, `${base}.${e}`); if (await exists(p)) return p; } return null; };
// priorité : --voice, puis un vrai enregistrement audio/voice.*, puis la voix IA audio/voice-ai.wav (sauf --no-ai)
const voice = arg('voice') ? path.resolve(arg('voice')) : (await findAudio('voice')) || (process.argv.includes('--no-ai') ? null : await findAudio('voice-ai', ['wav']));
const isAI = !!voice && path.basename(voice).startsWith('voice-ai');
const music = await findAudio('music');
const len = (to - from).toFixed(3);
const out = path.join(OUT, arg('out', story ? story + '.mp4' : 'reel.mp4'));

const ff = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(FRAMES, '%04d.png')];
const filters = [], mixIn = []; let idx = 1;
if (sfxEvents.length) {
  const wav = path.join(OUT, 'sfx.wav');
  await writeFile(wav, mixToWav(sfxEvents.map(e => ({ ...e, t: e.t - from })).filter(e => e.t >= 0), to - from));
  ff.push('-i', wav); filters.push(`[${idx++}:a]volume=${voice ? .6 : 1}[sfx]`); mixIn.push('[sfx]');
}
if (voice) {
  const off = +arg('voice-offset', 0) - from;
  ff.push('-i', voice);
  const shift = off > 0 ? `adelay=${Math.round(off * 1000)}:all=1,` : off < 0 ? `atrim=start=${-off},asetpts=PTS-STARTPTS,` : '';
  // nettoyage léger : coupe les graves parasites, réduit le souffle, niveau standard réseaux sociaux (-16 LUFS)
  filters.push(`[${idx++}:a]${shift}aformat=channel_layouts=mono,${isAI ? '' : 'highpass=f=80,afftdn=nf=-25,'}loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000${music ? ',asplit=2[voice][key]' : '[voice]'}`);
  mixIn.push('[voice]');
}
if (music) {
  ff.push('-stream_loop', '-1', '-i', music);
  filters.push(`[${idx++}:a]aresample=48000,volume=${arg('music-volume', voice ? .18 : .45)}${voice ? '[m0];[m0][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=500[music]' : '[music]'}`);
  mixIn.push('[music]');
}
if (mixIn.length) {
  filters.push(`${mixIn.join('')}amix=inputs=${mixIn.length}:normalize=0:duration=longest,alimiter=limit=0.95,apad,afade=t=out:st=${Math.max(0, to - from - .4).toFixed(3)}:d=0.4[a]`);
  ff.push('-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[a]', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
}
ff.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-r', String(fps), '-movflags', '+faststart', '-t', len, out);
const r = spawnSync('ffmpeg', ff, { stdio: 'inherit' });
if (r.status !== 0) { console.error('ffmpeg a échoué'); process.exit(1); }
if (!KEEP) await rm(FRAMES, { recursive: true, force: true });
const parts = [sfxEvents.length && `${sfxEvents.length} bruitages`, voice && `voix : ${path.relative(ROOT, voice)}`, music && `musique : ${path.relative(ROOT, music)}`].filter(Boolean);
console.log(`✓ ${path.relative(process.cwd(), out)}${parts.length ? '  (' + parts.join(', ') + ')' : '  (sans son)'}`);
