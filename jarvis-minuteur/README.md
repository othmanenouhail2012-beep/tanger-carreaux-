# JARVIS Minuteur

Une application web à installer sur l'iPad. Tu lui donnes ton programme de la journée, et elle te prévient à la fin de chaque activité, **même si tu es dans un jeu ou une autre appli**.

- Importer le programme : photo ou capture d'écran (lecture du texte en français et en arabe), PDF, ou texte collé.
- Vérifier et corriger le programme dans un tableau, puis le lancer.
- Alertes : « C'est fini : Fortnite » / « Maintenant : HG – lire la leçon », et « Plus que 5 minutes » avant la fin des jeux et du temps libre.

---

## Étape 1 — Mettre le projet sur GitHub

1. Crée un compte sur <https://github.com> (si tu n'en as pas).
2. Le projet est dans le dossier `jarvis-minuteur/` de ce dépôt. Rien d'autre à faire si le dépôt est déjà sur GitHub.
   - *Pour un dépôt à part* : clique **New repository**, puis **uploading an existing file**, glisse **le contenu** du dossier `jarvis-minuteur` (pas le dossier `node_modules`), puis **Commit changes**.

## Étape 2 — Créer les clés VAPID (une seule fois)

Les clés VAPID permettent au serveur d'envoyer les notifications.

- Si Node.js est installé sur ton ordinateur, ouvre un terminal dans le dossier `jarvis-minuteur` et tape :
  ```
  npx web-push generate-vapid-keys
  ```
- Tu obtiens une **Public Key** et une **Private Key**. Garde-les dans un endroit sûr.
- ⚠ **Ne mets jamais la clé privée dans le code** ni sur GitHub. Elle va uniquement dans Netlify (étape 4).

## Étape 3 — Relier le projet à Netlify

1. Va sur <https://app.netlify.com> et connecte-toi **avec ton compte GitHub**.
2. **Add new site → Import an existing project → GitHub**, puis choisis ton dépôt.
3. Dans les réglages de déploiement :
   - **Base directory** : `jarvis-minuteur` (laisse vide si tu as fait un dépôt à part)
   - **Build command** : laisse ce qui est proposé (rien à compiler)
   - **Publish directory** : `.` (ou `jarvis-minuteur` selon ce que Netlify affiche)
   - **Functions directory** : `netlify/functions`
4. Clique **Deploy**.

## Étape 4 — Ajouter les clés dans Netlify

1. Sur ton site Netlify : **Site configuration → Environment variables → Add a variable**.
2. Ajoute ces 3 variables :

   | Nom | Valeur |
   |---|---|
   | `VAPID_PUBLIC_KEY` | ta Public Key |
   | `VAPID_PRIVATE_KEY` | ta Private Key |
   | `VAPID_SUBJECT` | `mailto:ton.adresse@email.com` |

3. Va dans **Deploys → Trigger deploy → Deploy site** pour que les clés soient prises en compte.

## Étape 5 — Choisir l'adresse gratuite xxx.netlify.app

1. **Site configuration → General → Site details → Change site name**.
2. Écris par exemple `jarvis-othmane` : ton appli sera à **https://jarvis-othmane.netlify.app**.

## Étape 6 — Installer l'appli sur l'iPad

1. Ouvre l'adresse dans **Safari** (pas Chrome) sur l'iPad.
2. Touche le bouton jaune **« Installer sur l'écran d'accueil »** et suis les images :
   **Partager** → **Sur l'écran d'accueil** → **Ajouter**.
3. Ferme Safari et **ouvre JARVIS depuis l'icône de l'écran d'accueil**.

> Sur iPad, les notifications ne marchent **que** dans l'appli installée et ouverte depuis l'écran d'accueil (iPadOS 16.4 ou plus récent).

Sur PC ou Android (Chrome/Edge), le bouton lance l'installation directement.

## Étape 7 — Autoriser les notifications

1. Dans l'appli installée, touche **« 🔔 Activer les notifications »**, puis **Autoriser**.
2. Une notification de test « JARVIS est prêt ✔ » arrive en quelques secondes. Si elle arrive, tout fonctionne.
3. Si tu as refusé par erreur : **Réglages de l'iPad → Notifications → JARVIS → Autoriser**.

## Utilisation

1. Onglet **Photo / PDF / Texte** : importe ton programme. Exemple de texte :
   ```
   13h40 - 14h30 : Maths – exercices
   14h30 Pause
   14h45 – 15h30 HG – lire la leçon
   15h30 Fortnite
   17h Dîner
   ```
   Formats acceptés : `13h40`, `13:40`, `13h`, avec `-` ou `–`. Si une ligne n'a qu'une heure, l'activité dure jusqu'au début de la suivante.
2. Corrige le tableau si besoin (➕ Ajouter une ligne, ✕ supprimer).
3. **▶ Lancer le programme**. Les alertes sont envoyées au serveur : tu peux fermer l'appli et jouer.
4. **+5 min**, **Pause**, **Activité suivante**, **Modifier** ou **Arrêter** : les anciennes alertes du serveur sont remplacées ou annulées automatiquement.

## Comment ça marche (pour les curieux)

- `app.js` calcule l'heure exacte de chaque alerte dans le fuseau **Africa/Casablanca** (changement d'heure du Ramadan compris), et l'envoie à `netlify/functions/alerts.mjs`, qui l'enregistre avec **Netlify Blobs**.
- `netlify/functions/send-alerts.mjs` est une **Scheduled Function** qui tourne chaque minute : elle envoie les notifications arrivées à l'heure (librairie `web-push`) puis les supprime.
- `sw.js` (service worker) affiche les notifications, ouvre l'appli quand tu les touches, et garde l'appli en cache pour qu'elle s'ouvre hors ligne.
- Une notification peut arriver avec jusqu'à une minute de retard (la fonction planifiée tourne une fois par minute).

## Tests

```
npm install
npm test
```
Le test lit un programme d'exemple, vérifie les heures et les couleurs, puis envoie de vraies notifications chiffrées à un faux service push et vérifie qu'on peut les déchiffrer.
