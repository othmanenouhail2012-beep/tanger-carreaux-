#!/usr/bin/env python3
"""export/tts.py — voix off IA (voix neuronales marocaines ar-MA de Microsoft, via edge-tts).

  pip install edge-tts
  python3 export/tts.py                          # voix du storyboard (ou Jamal par défaut)
  python3 export/tts.py --voice ar-MA-MounaNeural --rate +5%
  python3 export/tts.py --story chauffe-eau

Produit dans audio/ (ou audio/<story>/) :
  voice-ai/<scene>.mp3   une prise par réplique
  voice-ai.wav           la piste complète, chaque réplique placée au début de sa scène
  voice-ai.json          temps de chaque mot + durée des scènes (lu par main.js : sous-titres calés sur la voix)
Un vrai enregistrement audio/voice.* reste prioritaire à l'export.
"""
import argparse, asyncio, json, os, re, ssl, subprocess, sys
from pathlib import Path

import edge_tts
import edge_tts.communicate as ec

ROOT = Path(__file__).resolve().parent.parent
CA = Path('/root/.ccr/ca-bundle.crt')  # proxy d'entreprise éventuel
if os.environ.get('SSL_CERT_FILE'): ec._SSL_CTX = ssl.create_default_context(cafile=os.environ['SSL_CERT_FILE'])
elif CA.exists(): ec._SSL_CTX = ssl.create_default_context(cafile=str(CA))
PROXY = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy') or None

ap = argparse.ArgumentParser()
ap.add_argument('--story'); ap.add_argument('--voice'); ap.add_argument('--rate'); ap.add_argument('--pitch')
ap.add_argument('--lead', type=float, default=.15, help='silence avant chaque réplique (s)')
ap.add_argument('--tail', type=float, default=.45, help='respiration après chaque réplique (s)')
args = ap.parse_args()

story_file = ROOT / 'js' / ('stories/%s.js' % re.sub(r'[^\w-]', '', args.story) if args.story else 'storyboard.js')
adir = ROOT / 'audio' / (args.story or '')
(adir / 'voice-ai').mkdir(parents=True, exist_ok=True)

js = ("const m = await import(process.argv[1]);"
      "console.log(JSON.stringify({fps: m.reel.fps, voice: m.reel.voice || {}, scenes: m.reel.scenes.map(s => ({id: s.id, caption: s.caption || '', say: s.say || null, duration: s.duration, endCard: !!s.endCard}))}))")
data = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js, story_file.as_uri()], text=True))
voice = args.voice or data['voice'].get('name') or 'ar-MA-JamalNeural'
rate = args.rate or data['voice'].get('rate') or '+0%'
pitch = args.pitch or data['voice'].get('pitch') or '+0Hz'
fps = data['fps']
plain = lambda s: re.sub(r'\[([^\]|]+)\|\w+\]', r'\1', s)

async def synth(text, out):
    c = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary='WordBoundary', proxy=PROXY)
    words = []
    with open(out, 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': words.append((ch['offset'] / 1e7, ch['duration'] / 1e7, ch['text']))
    return words

result = {'story': args.story or '', 'voice': voice, 'rate': rate, 'scenes': {}}
clips, t = [], 0.0
for sc in data['scenes']:
    dur = sc['duration']
    text = sc['say'] or plain(sc['caption'])
    if text.strip() and not sc['endCard']:
        mp3 = adir / 'voice-ai' / f"{sc['id']}.mp3"
        words = asyncio.run(synth(text, mp3))
        # position (fraction de caractères) de chaque mot dans le texte prononcé → alignement avec les sous-titres
        pos, b = 0, []
        for off, d, w in words:
            i = text.find(w, pos); i = pos if i < 0 else i; pos = i + len(w)
            b.append([round(args.lead + off, 3), round(i / max(1, len(text)), 4)])
        end = words[-1][0] + words[-1][1] if words else 0
        dur = max(dur, args.lead + end + args.tail)
        dur = round(round(dur * fps) / fps, 4)
        result['scenes'][sc['id']] = {'duration': dur, 'spoken': text, 'boundaries': b, 'speechEnd': round(args.lead + end, 3)}
        clips.append((t + args.lead, mp3))
        print(f"  {sc['id']:<10} {dur:5.2f}s  {text}")
    elif sc['endCard']:
        result['scenes'][sc['id']] = {'duration': dur}
    t += dur

(adir / 'voice-ai.json').write_text(json.dumps(result, ensure_ascii=False, indent=1))
# piste complète : chaque réplique placée au début de sa scène
cmd = ['ffmpeg', '-y', '-loglevel', 'error']
for _, f in clips: cmd += ['-i', str(f)]
fl = ';'.join(f'[{i}:a]aresample=48000,adelay={round(s * 1000)}:all=1[a{i}]' for i, (s, _) in enumerate(clips))
fl += ';' + ''.join(f'[a{i}]' for i in range(len(clips))) + f'amix=inputs={len(clips)}:normalize=0:duration=longest,apad=whole_dur={t:.3f}[out]'
cmd += ['-filter_complex', fl, '-map', '[out]', '-ac', '1', '-ar', '24000', '-t', f'{t:.3f}', str(adir / 'voice-ai.wav')]
subprocess.run(cmd, check=True)
print(f"✓ {(adir / 'voice-ai.wav').relative_to(ROOT)}  ({voice}, {rate}, {t:.1f} s)")
