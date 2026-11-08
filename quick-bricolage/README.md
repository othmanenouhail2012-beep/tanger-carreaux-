# Quick Bricolage — application web installable (PWA)

HTML/CSS/JS sans framework ni build. Tout le dossier `quick-bricolage/` se publie tel quel.

## 1. Modifier les infos (`config.js`)
Ouvrez `config.js` avec n'importe quel éditeur de texte. Tout ce qui est marqué **« à compléter »** doit être vérifié avec papa :
- `whatsapp` : numéro au format `2126XXXXXXXX` (sans + ni espaces). **Vide = WhatsApp s'ouvre et le client choisit le contact** : à remplir avant la mise en ligne.
- `telephone` / `telephoneAffiche` : actuellement le numéro de la boutique (05 22 59 22 06) — à confirmer.
- `email`, `villes`, `horaires` : à compléter.
- `boutique.afficher` : mettre `false` si la boutique de Bouskoura n'est pas la même entreprise.
- `faq` : questions/réponses en fr / ar / da (les tarifs et villes sont « à compléter »).

**Services** : chaque ligne de `services` = `id`, `icone` (emoji), `fr`, `ar`, `da`. Ajoutez/supprimez une ligne pour ajouter/retirer un service.

Textes de l'interface : `i18n.js` (fr, ar, darija).
Logo : les icônes de `icons/` sont provisoires (« QB » sur fond orange). Remplacez-les par le vrai logo en gardant les mêmes noms et tailles (180, 192, 512 px).

⚠️ Après chaque modification, changez `VERSION` dans `sw.js` (ex. `qb-v2`) pour que les téléphones récupèrent la nouvelle version.

## 2. Publier sur Netlify
1. Allez sur https://app.netlify.com/drop
2. Glissez-déposez le **dossier `quick-bricolage`** entier.
3. Netlify donne une adresse en `https://…netlify.app`. Pour utiliser quickbricolage.ma : *Domain settings → Add custom domain*.

## 3. Installer sur iPad / iPhone
1. Ouvrez l'adresse dans **Safari**.
2. Touchez **Partager** (carré avec flèche ↑).
3. Choisissez **« Sur l'écran d'accueil »** puis **Ajouter**.

Sur Android / Chrome / PC : bouton **« Installer l'application »** sur l'accueil (ou menu ⋮ → Installer).

## Fonctionnement
- La demande (4 étapes) est envoyée par **WhatsApp** avec un message pré-rempli (service, problème, adresse, lien Google Maps, créneau, nom, téléphone).
- La photo n'est **pas** transmise automatiquement (limite de WhatsApp) : l'appli prévient le client de la joindre après l'envoi.
- « Mes demandes » est stocké uniquement sur l'appareil du client (localStorage).
