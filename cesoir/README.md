# CeSoir 🎬

PWA mobile pour choisir quoi regarder ce soir (films, séries, animes) en swipant.
Mode **Solo** ou **À deux** avec écran « MATCH ! » en temps réel.

## Stack
- HTML / CSS / JS vanilla, sans build
- GSAP (cdnjs) pour les cartes
- Netlify Functions : proxy TMDB (clé en variable d'environnement)
- Supabase Realtime : mode à deux
- PWA : `manifest.json` + `sw.js`

## Arborescence
```
cesoir/
├── index.html              # tous les écrans (accueil, quiz, deck, match, réglages, à propos)
├── manifest.json           # PWA
├── sw.js                   # service worker
├── netlify.toml
├── .env.example            # TMDB_API_KEY
├── css/style.css           # design system "salle de cinéma"
├── icons/                  # icônes PWA + logo TMDB
├── js/
│   ├── config.js           # URL + clé anon Supabase (publiques, RLS protège)
│   ├── api.js / app.js     # appels au proxy, navigation entre écrans
│   ├── quiz.js             # 4 questions → filtres TMDB
│   ├── deck.js             # récupération et préparation des 30 cartes
│   ├── swipe.js            # gestes tactiles + GSAP
│   ├── details.js          # dos de carte : synopsis, bande-annonce, où regarder
│   └── duo.js              # salle, swipes partagés, Match
├── netlify/functions/
│   └── tmdb.js             # proxy TMDB (liste blanche + cache)
└── supabase/schema.sql     # tables rooms/swipes + RLS + purge 24 h
```

## Lancer en local
```bash
npm i -g netlify-cli
cp .env.example .env        # puis renseigner TMDB_API_KEY
netlify dev                 # http://localhost:8888
```

## Mentions
This product uses the TMDB API but is not endorsed or certified by TMDB.
Données de plateformes de streaming fournies par JustWatch.
