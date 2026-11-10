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
- **Props** (`js/props.js`) : `room`, `heater` (`:cut` pour la vue en coupe), `safetyValve` (ajouté automatiquement sous le chauffe-eau), `kettle`, `sink`, `shower`, `mirror`, `expansionTank`. Chaque sous-partie a un id : `#heater-shell`, `#heater-element`, `#heater-scale`, `#heater-water`, `#heater-dial`, `#valve-body`…
- **Effets** (`js/fx.js`) : `camera`, `ring`, `pop` (`icon` : check, cross, warning, shield, gauge, thermometer, calendarBadge, badge), `insetCard`, `magnifier`, `crossSection`, `heatUp`, `scaleFall`, `ripples`, `fillLevel`/`expand`, `gauge`, `thermometer`, `danger`, `steamBurst`, `counter`, `compare`, `phoneChecklist`. Les options de chaque beat sont passées telles quelles à l'effet.
- Pour un contenu d'insetCard réutilisable, ajoute une chaîne SVG (repère 780×640) dans `insets` et appelle-la par son nom : `content: 'kettleInside'`.
- La dernière scène `{ id: 'end', duration: 2.6, endCard: true }` affiche le logo et « تابعنا », puis revient en fondu sur la première image pour une boucle propre.

## Exporter en MP4
```bash
node export/render.mjs               # → out/reel.mp4 (H.264, yuv420p, 30 fps, crf 18)
node export/render.mjs --from 18 --to 24 --keep   # extrait, en gardant frames/
```
Le script lance son propre serveur statique, ouvre `index.html?export=1` dans Chromium avec Playwright (viewport 1080×1920), attend les polices, puis pour chaque frame appelle `tl.seek(i / fps)` et fait une capture. ffmpeg assemble ensuite les images. Si `audio/voice.mp3` existe, il est ajouté avec `-shortest`. Il faut `ffmpeg` et `playwright` installés.

Toute l'animation passe par une seule timeline GSAP maître, en pause, sans setTimeout ni animation CSS. L'export est donc identique, image pour image, à la lecture.
