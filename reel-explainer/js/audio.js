// audio.js — aperçu sonore : bruitages en direct + voix/musique (audio/voice.*, audio/music.*) calées sur la timeline
import { bus, play, unlock } from './sfx.js';
const EXTS = ['wav', 'm4a', 'mp3', 'webm', 'ogg', 'aac'];

export async function findAudio(base, exts = EXTS) {
  for (const ext of exts) {
    const url = `${window.__audioDir || 'audio/'}${base}.${ext}`;
    try { const r = await fetch(url, { method: 'HEAD', cache: 'no-store' }); if (r.ok) return url; } catch { /* absent */ }
  }
  return null;
}

// relie la timeline au son ; renvoie { setMuted, sync(playing) }
export async function attachAudio(tl, { sfx = true } = {}) {
  let muted = false;
  const tracks = [];
  const voice = (await findAudio('voice')) || (await findAudio('voice-ai', ['wav'])), music = await findAudio('music');
  if (voice) tracks.push(Object.assign(new Audio(voice), { _vol: 1 }));
  if (music) tracks.push(Object.assign(new Audio(music), { _vol: voice ? .18 : .5, loop: true }));
  if (sfx) bus.on = type => { if (!muted && !tl.paused()) play(type); };
  const sync = () => {
    tracks.forEach(a => {
      a.volume = muted ? 0 : a._vol;
      if (tl.paused()) a.pause();
      else { if (Math.abs(a.currentTime - tl.time()) > .15) a.currentTime = tl.time(); a.play().catch(() => {}); }
    });
  };
  return { voice, music, sync, unlock, setMuted: m => { muted = m; sync(); }, get muted() { return muted; } };
}
