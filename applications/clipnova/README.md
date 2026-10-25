# ClipNova

Transforme une vidéo longue en clips verticaux 9:16, sous-titrés, **gratuitement et sans filigrane**.
Tout tourne sur ton ordinateur : aucun abonnement, aucune clé API.

## Ce que fait l'app
1. Lien (YouTube, etc.) ou fichier vidéo.
2. Transcription automatique mot par mot (faster-whisper).
3. Choix des meilleurs passages : phrases complètes, accroche, rythme, questions → note /100.
4. Clips sans chevauchement (pas de répétition).
5. Recadrage vertical centré sur le visage (OpenCV).
6. Sous-titres style « Shorts » : 3 mots à la fois, mot actif en couleur.
7. Export MP4 1080×1920, prêt pour TikTok / Reels / Shorts.

## Installation (une seule fois)
Il faut Python 3.10+ et ffmpeg (Windows : `winget install ffmpeg`, Mac : `brew install ffmpeg`).

```bash
cd applications/clipnova
python -m venv .venv
source .venv/bin/activate        # Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

## Lancer
```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```
- Sur l'ordinateur : http://localhost:8000
- Sur ton téléphone (même Wi-Fi) : http://IP-DE-TON-PC:8000 (ex. http://192.168.1.20:8000)

La première fois, le modèle de transcription se télécharge (≈ 500 Mo pour « Normale »).

## Les 2 pages
1. **Accueil** : lien ou fichier, langue, nombre de clips, durée min/max, couleur, sous-titres oui/non → « Générer les clips ».
2. **Mes clips** : tous les clips avec leur note. Touche un clip pour ouvrir le montage :
   sous-titres (oui/non, mots à la fois, position, majuscules), style (police, taille, couleurs, contour, fond),
   musique (ton MP3, volumes voix/musique), coupe début/fin, zoom visage, texte d'accroche en haut,
   « Appliquer le style à tous les clips », téléchargement.

## Conseils
- Plus de clips : baisse la durée min, augmente « Nombre de clips max », relance avec une autre durée.
- Arabe/darija : choisis « Arabe » et la précision « Haute ».
- Utilise uniquement tes vidéos ou celles que tu as le droit de réutiliser
  (télécharger les vidéos d'autres personnes sur YouTube est contraire à ses conditions).
