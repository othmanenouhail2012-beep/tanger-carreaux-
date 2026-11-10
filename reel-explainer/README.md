# reel-explainer

Moteur de reels explicatifs animés au format vertical 1080×1920, dans un style flat line-art. Il utilise HTML, CSS, des modules ES et GSAP 3.13 avec DrawSVG, sans framework ni build.

## Lancer
```bash
cd reel-explainer
npm install                  # optionnel : copie locale de GSAP si le CDN jsDelivr est bloqué
python3 -m http.server 5173  # ou : npx serve -l 5173 .
```
- `http://localhost:5173/` : lecture du reel, avec une barre de contrôle (lecture/pause, curseur, saut de scène, boucle). La barre d'espace lance ou met en pause.
- `?playground=1` : chaque effet du catalogue joué seul, avec un bouton pour le rejouer.
- `?export=1` : canvas à l'échelle 1:1, sans barre de contrôle (c'est le mode utilisé par l'export).

## Reels inclus
- `js/storyboard.js` est le reel actif : **Quick Bricolage, « الروبيني كيقطر؟ »** (concept dans `concepts/quick-bricolage.md`).
- `js/stories/chauffe-eau.js` est la démo chauffe-eau / calcaire. Ouvre-la avec `?story=chauffe-eau` et exporte-la avec `node export/render.mjs --story chauffe-eau`.

## Écrire un nouveau reel : seul `js/storyboard.js` change
```js
{
  id: 'valve', duration: 4,                // 2 à 4 s par réplique
  setup: 'room+heater:cut',                // props séparés par « + », options par « : »
  camera: { target: '#heater', zoom: 1.6 },// cadrage d'arrivée (avec transition automatique)
  caption: '[الصمام|term] هو اللي كيحمي الشوفو',  // [mot|term|danger|ok|water]
  words: [0.1, 0.4, 0.7, 0.9, 1.2],        // optionnel : temps de chaque mot (synchronisation voix)
  transition: 'fromInset',                 // optionnel
  beats: [                                 // effets, en secondes depuis le début de la scène
    { t: 0.5, fx: 'ring', target: '#valve-body' },
    { t: 1.2, fx: 'crossSection', target: '#safety-valve', pos: { x: 770, y: 400 } },
  ],
}
```
- **Props** (`js/props.js`) : `room` (cuisine), `bathroom`, `basin` (lavabo avec `#faucet`, `#spout`, `#stop-valve`), `heater` (`:cut` pour la vue en coupe), `safetyValve` (ajouté automatiquement sous le chauffe-eau), `kettle`, `sink`, `shower`, `mirror`, `expansionTank`. Chaque sous-partie a un id : `#heater-shell`, `#heater-element`, `#heater-scale`, `#heater-water`, `#heater-dial`, `#valve-body`…
- **Effets** (`js/fx.js`) : `camera`, `ring`, `pop` (`icon` : check, cross, warning, shield, gauge, thermometer, calendarBadge, badge), `insetCard`, `magnifier`, `crossSection`, `heatUp`, `scaleFall`, `ripples`, `fillLevel`/`expand`, `gauge`, `thermometer`, `danger`, `steamBurst`, `counter`, `compare`, `phoneChecklist` (`title`), `drip` (goutte en boucle, `until` pour l'arrêter). Les options de chaque beat sont passées telles quelles à l'effet.
- Pour un contenu d'insetCard réutilisable, ajoute une chaîne SVG (repère 780×640) dans `insets` et appelle-la par son nom : `content: 'kettleInside'`.
- Marque : `brand: { name, logo, icon }`, où `icon: 'wrench'` dessine une clé dans le logo rond quand `logo` est vide.
- La dernière scène `{ id: 'end', duration: 2.6, endCard: true }` affiche le logo et « تابعنا », puis revient en fondu sur la première image pour une boucle propre.

## Le son
- **Bruitages** (`js/sfx.js`) : goutte, pop, whoosh, ✓, alerte, carillon de fin. Ils sont synthétisés (aucun fichier, aucune voix) et déclenchés par la timeline, donc calés à l'image près. On les entend dans l'aperçu (bouton 🔊) et ils sont mixés à l'export.
- **Voix IA** (voix neuronales marocaines `ar-MA` de Microsoft, via [edge-tts](https://pypi.org/project/edge-tts/)) :
  ```bash
  pip install edge-tts
  python3 export/tts.py                               # voix du storyboard (reel.voice), Jamal par défaut
  python3 export/tts.py --voice ar-MA-MounaNeural     # voix féminine
  ```
  Le script génère `audio/voice-ai.wav` et `audio/voice-ai.json`. La durée des scènes s'allonge si une réplique est plus longue que prévu, et chaque mot du sous-titre apparaît au moment où il est prononcé. Si une prononciation sonne faux, ajoute `say: '…'` à la scène : c'est le texte prononcé (chiffres en lettres, noms latins écrits en arabe…), le sous-titre ne change pas. Le serveur `speech.platform.bing.com` doit être accessible.
- **Ta voix** : ouvre `http://localhost:5173/?record=1` dans Chrome, avec un casque. Le reel défile et un prompteur affiche la phrase en cours et la suivante. Clique « ● Enregistrer » et lis. À la fin, télécharge `voice.webm` et mets-le dans `audio/`. Comme la voix est enregistrée en même temps que l'animation, elle est déjà synchronisée.
  - Tu peux aussi enregistrer avec ton téléphone (mémo vocal) et déposer `audio/voice.m4a` (ou mp3, wav, ogg). Un léger décalage se corrige avec `--voice-offset 0.2` (en secondes).
  - À l'export, la voix est nettoyée : coupe des graves, réduction du souffle, niveau à -16 LUFS.
- Priorité à l'export : un vrai enregistrement `audio/voice.*` passe avant la voix IA. `--no-ai` désactive la voix IA.
- **Musique** (optionnelle) : `audio/music.mp3`, une musique libre de droits. Elle passe en boucle et baisse automatiquement quand la voix parle.

## Exporter en MP4
```bash
node export/render.mjs               # → out/reel.mp4 (H.264, yuv420p, 30 fps, crf 18)
node export/render.mjs --from 18 --to 24 --keep   # extrait, en gardant frames/
node export/render.mjs --no-sfx                    # sans bruitages
```
Le script lance son propre serveur statique, ouvre `index.html?export=1` dans Chromium avec Playwright (viewport 1080×1920), attend les polices, puis pour chaque frame appelle `tl.seek(i / fps)` et fait une capture. ffmpeg assemble ensuite les images et mixe le son : bruitages, plus `audio/voice.*` et `audio/music.*` s'ils existent. Il faut `ffmpeg` et `playwright` installés.

Toute l'animation passe par une seule timeline GSAP maître, en pause, sans setTimeout ni animation CSS. L'export est donc identique, image pour image, à la lecture.
