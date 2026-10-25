# MediaFlow

Application web (React + TypeScript + Tailwind, backend Node/Express + FFmpeg) pour analyser,
convertir et exporter **vos propres** fichiers multimédias.

## Ce qui fonctionne réellement

| Fonction | État |
|---|---|
| Import de fichier local (glisser-déposer), validation du contenu réel via FFprobe | ✅ |
| Conversion MP4 / WebM / MOV, choix de la résolution (360p → 8K, **jamais au-dessus de la source**) | ✅ |
| Extraction audio MP3 / WAV / M4A / AAC | ✅ |
| Liens directs `https://…/fichier.mp4` (protection SSRF, redirections limitées, taille max) | ✅ |
| Progression réelle (sortie `-progress` de FFmpeg), annulation, suppression, expiration auto | ✅ |
| Sous-titres intégrés (MKV/MP4) → SRT / VTT / TXT ; conversion de fichiers .srt/.vtt | ✅ |
| Interface FR / EN / AR (RTL), thème clair/sombre, responsive | ✅ |
| YouTube, Instagram, TikTok, Facebook, Vimeo, Dailymotion, Reddit | ⛔ « Connecteur non configuré » |
| Transcription vocale | ⛔ non configurée (aucun moteur branché) |
| Extracteur de miniature | ⛔ non implémenté |

**Pourquoi pas YouTube/Instagram/TikTok ?** Ces plateformes interdisent le téléchargement dans
leurs conditions d'utilisation et protègent techniquement leurs flux. MediaFlow ne contourne pas
ces protections. Chaque plateforme a un connecteur isolé dans `server/connectors.js` qui peut être
branché sur une API officielle autorisée le jour où vous en disposez.

## Lancer en local

Prérequis : Node.js ≥ 20 et FFmpeg (`ffmpeg` + `ffprobe` dans le PATH).

```bash
cd mediaflow
npm install
cp .env.example .env        # facultatif
npm run dev:server          # API sur :8787
npm run dev                 # interface sur :5173 (proxy /api)
```

Production : `npm run build && npm start` (le serveur sert `dist/` et l'API sur `PORT`).

## Tests

```bash
npm test
```
Tests unitaires (SSRF, formats, sous-titres) et d'intégration (upload, conversion, annulation,
isolation entre sessions, suppression, URL invalides/privées, connecteurs non configurés).

## API

| Route | Rôle |
|---|---|
| `GET /api/capabilities` | connecteurs, formats et limites réels |
| `POST /api/media/analyze` | `{ url }` → métadonnées accessibles |
| `POST /api/media/upload` | multipart `file` → métadonnées FFprobe + options possibles |
| `POST /api/media/convert` | `{ uploadId \| url, format, height }` → tâche asynchrone |
| `POST /api/media/transcribe` | 501 tant qu'aucun moteur n'est configuré |
| `GET /api/media/:id/subtitles/:index?format=srt\|vtt\|txt` | export d'une piste |
| `GET /api/tasks`, `GET /api/tasks/:id` | état réel |
| `POST /api/tasks/:id/cancel` | annulation |
| `GET /api/tasks/:id/file` | fichier final (propriétaire uniquement) |
| `DELETE /api/tasks/:id` | supprime la tâche et ses fichiers |

Chaque requête porte un en-tête `x-session-id` (UUID aléatoire généré par le navigateur) :
une session ne voit jamais les tâches d'une autre.

## Sécurité

- FFmpeg lancé via `spawn` avec des tableaux d'arguments fixes : aucune commande shell construite depuis l'entrée utilisateur.
- Blocage des IP privées/locales (y compris après chaque redirection), délais d'expiration, limite de taille, contrôle du type MIME.
- Fichiers temporaires nommés par UUID, permissions 0600, expiration automatique (`FILE_TTL_MIN`).
- Limitation du débit (`express-rate-limit`), erreurs normalisées sans fuite d'informations internes.

## Déploiement

Tout hébergeur exécutant Node + FFmpeg (VPS, Docker, Render, Railway, Fly.io) :
installez FFmpeg, définissez les variables de `.env.example`, `npm ci && npm run build && npm start`.
Les tâches sont gardées en mémoire : utilisez une seule instance, ou remplacez la `Map` des tâches
par Redis/une file de jobs pour passer à l'échelle. Les hébergeurs « serverless » sans FFmpeg ni
disque temporaire ne conviennent pas.
