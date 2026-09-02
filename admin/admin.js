// TANGER CARREAUX — Back-office administrateur
// Plateforme séparée du site public, simulant une base de données partagée via localStorage
// (même origine/navigateur uniquement — voir note de sécurité dans le README de session).

document.addEventListener("DOMContentLoaded", function () {
  var PRODUCTS_KEY = "tc-admin-products-v1";
  var ORDERS_KEY = "tc-admin-orders-v1";
  var SETTINGS_KEY = "tc-admin-settings-v1";
  var THEME_KEY = "tc-admin-theme-v1";

  // ---------- Thème clair/sombre ----------
  // Couleurs de graphiques Chart.js : hors de portée des variables CSS (Chart.js prend des couleurs
  // JS, pas des styles calculés), donc gérées ici en fonction du thème courant. Tout le reste de
  // l'admin re-thème automatiquement via les variables --a-* dans admin.css.
  function isLightTheme() { return document.documentElement.getAttribute("data-theme") === "light"; }
  function chartTickColor() { return isLightTheme() ? "#5a5f5a" : "#9a9a9a"; }
  function chartGridColor() { return isLightTheme() ? "rgba(13,13,13,0.08)" : "rgba(255,255,255,0.06)"; }
  function chartCardBg() { return isLightTheme() ? "#ffffff" : "#1a1a1a"; }

  var allChartRefs = [];
  function registerChartDestroyer(getter, setter) { allChartRefs.push({ get: getter, set: setter }); }
  function destroyAllCharts() {
    allChartRefs.forEach(function (ref) {
      var c = ref.get();
      if (c) { c.destroy(); ref.set(null); }
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var moonIcon = document.querySelector("#themeIconMoon");
    var sunIcon = document.querySelector("#themeIconSun");
    if (moonIcon) moonIcon.hidden = theme === "light";
    if (sunIcon) sunIcon.hidden = theme !== "light";
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }
  var savedTheme = "light";
  try { savedTheme = localStorage.getItem(THEME_KEY) || "light"; } catch (e) {}
  applyTheme(savedTheme);

  var PLACEHOLDER_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23232a27'/%3E%3Cpath d='M22 70l18-24 14 17 10-12 18 19z' fill='%233a4440'/%3E%3Ccircle cx='32' cy='32' r='9' fill='%233a4440'/%3E%3C/svg%3E";

  // Catalogue réel du site, extrait des 6 pages catégorie (carrelage, sanitaire, robinetterie, mosaïque & pierre, meubles de salle de bain, miroirs LED).
  var SEED_PRODUCTS = [
  {
    "id": "Grès cérame::Grès cérame émaillé classique",
    "name": "Grès cérame émaillé classique",
    "tag": "Grès cérame",
    "cat": "gres",
    "price": 160,
    "unit": "m²",
    "description": "Idéal pour les salons, cuisines et chambres.",
    "image": "https://images.unsplash.com/photo-1706629503586-2731f65587ae?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Le grès cérame"
  },
  {
    "id": "Grès cérame::Grès cérame pleine masse",
    "name": "Grès cérame pleine masse",
    "tag": "Grès cérame",
    "cat": "gres",
    "price": 320,
    "unit": "m²",
    "description": "Le plus robuste, teinté dans l'épaisseur, pour zones à fort passage.",
    "image": "https://images.unsplash.com/photo-1489272889853-8093472c6f42?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Le grès cérame"
  },
  {
    "id": "Grès cérame::Grès cérame imitation bois",
    "name": "Grès cérame imitation bois",
    "tag": "Grès cérame",
    "cat": "gres",
    "price": 220,
    "unit": "m²",
    "description": "La chaleur visuelle du bois, l'entretien facile du carrelage.",
    "image": "https://images.unsplash.com/photo-1508920052992-6f5a921eba78?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Le grès cérame"
  },
  {
    "id": "Grès cérame::Grès cérame imitation marbre / béton",
    "name": "Grès cérame imitation marbre / béton",
    "tag": "Grès cérame",
    "cat": "gres",
    "price": 270,
    "unit": "m²",
    "description": "Pour un style moderne ou industriel épuré.",
    "image": "https://images.unsplash.com/photo-1521459467264-802e2ef3141f?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Le grès cérame"
  },
  {
    "id": "Mural::Faïence classique",
    "name": "Faïence classique",
    "tag": "Mural",
    "cat": "faience",
    "price": 130,
    "unit": "m²",
    "description": "Facile à poser, disponible dans une infinité de couleurs.",
    "image": "https://images.unsplash.com/photo-1573385044784-ba6c83bfa408?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Faïences & carrelages muraux"
  },
  {
    "id": "Mural::Carreau de métro",
    "name": "Carreau de métro",
    "tag": "Mural",
    "cat": "faience",
    "price": 160,
    "unit": "m²",
    "description": "Petit format rectangulaire biseauté, look urbain et rétro.",
    "image": "https://images.unsplash.com/photo-1627283699359-033f900853e0?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Faïences & carrelages muraux"
  },
  {
    "id": "Mural::Mosaïque sur filet",
    "name": "Mosaïque sur filet",
    "tag": "Mural",
    "cat": "faience",
    "price": 220,
    "unit": "m²",
    "description": "Pour habiller les niches de douche ou créer des frises décoratives.",
    "image": "https://images.unsplash.com/photo-1613124152913-c180d8c1d740?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Faïences & carrelages muraux"
  },
  {
    "id": "Naturel::Carreau de ciment",
    "name": "Carreau de ciment",
    "tag": "Naturel",
    "cat": "naturel",
    "price": 430,
    "unit": "m²",
    "description": "Artisanal, aux motifs géométriques ou rétro très colorés.",
    "image": "https://images.unsplash.com/photo-1551893478-d726eaf0442c?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Matériaux naturels & traditionnels"
  },
  {
    "id": "Naturel::Terre cuite & tomettes",
    "name": "Terre cuite & tomettes",
    "tag": "Naturel",
    "cat": "naturel",
    "price": 380,
    "unit": "m²",
    "description": "Ambiance chaleureuse, idéale pour les maisons rustiques ou de campagne.",
    "image": "https://images.unsplash.com/photo-1759854909332-b73cdb19b705?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Matériaux naturels & traditionnels"
  },
  {
    "id": "Naturel::Pierre naturelle (Travertin, Ardoise)",
    "name": "Pierre naturelle (Travertin, Ardoise)",
    "tag": "Naturel",
    "cat": "naturel",
    "price": 270,
    "unit": "m²",
    "description": "Aspect minéral inimitable, à l'intérieur comme à l'extérieur.",
    "image": "https://images.unsplash.com/photo-1532901074349-dc9d1505589c?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Matériaux naturels & traditionnels"
  },
  {
    "id": "Extérieur::Dalle grès cérame 2 cm",
    "name": "Dalle grès cérame 2 cm",
    "tag": "Extérieur",
    "cat": "exterieur",
    "price": 380,
    "unit": "m²",
    "description": "Pose sur plots, sur sable ou sur pelouse pour les terrasses.",
    "image": "https://images.unsplash.com/photo-1662557499709-a8d7ef6d7d5e?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Carrelage extérieur"
  },
  {
    "id": "Extérieur::Carrelage de piscine",
    "name": "Carrelage de piscine",
    "tag": "Extérieur",
    "cat": "exterieur",
    "price": 270,
    "unit": "m²",
    "description": "Résistant au chlore, au sel et aux produits de traitement.",
    "image": "https://images.unsplash.com/photo-1558617320-e695f0d420de?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Carrelage extérieur"
  },
  {
    "id": "Lavabo::Vasque à poser",
    "name": "Vasque à poser",
    "tag": "Lavabo",
    "cat": "lavabo",
    "price": 450,
    "unit": "unité",
    "description": "Posée sur un plan de toilette, en céramique ou résine.",
    "image": "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Lavabos & vasques"
  },
  {
    "id": "Lavabo::Vasque suspendue",
    "name": "Vasque suspendue",
    "tag": "Lavabo",
    "cat": "lavabo",
    "price": null,
    "unit": "unité",
    "description": "Fixée au mur, pour un rendu épuré et un sol dégagé.",
    "image": "https://images.unsplash.com/photo-1591961166327-4c13862cfe9b?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Lavabos & vasques"
  },
  {
    "id": "Lavabo::Vasque sur colonne",
    "name": "Vasque sur colonne",
    "tag": "Lavabo",
    "cat": "lavabo",
    "price": 1000,
    "unit": "unité",
    "description": "Un ensemble vasque et colonne, sans meuble en dessous.",
    "image": "https://images.unsplash.com/photo-1609210884848-2d530cfb2a07?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Lavabos & vasques"
  },
  {
    "id": "Lavabo::Double vasque",
    "name": "Double vasque",
    "tag": "Lavabo",
    "cat": "lavabo",
    "price": null,
    "unit": "unité",
    "description": "Deux points d'eau côte à côte, idéal en famille.",
    "image": "https://images.unsplash.com/photo-1600488999585-e4364713b90a?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Lavabos & vasques"
  },
  {
    "id": "Baignoire::Baignoire droite",
    "name": "Baignoire droite",
    "tag": "Baignoire",
    "cat": "baignoire",
    "price": 1000,
    "unit": "unité",
    "description": "Le format classique, rectangulaire, pour salle de bain standard.",
    "image": "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Baignoires"
  },
  {
    "id": "Baignoire::Baignoire d'angle",
    "name": "Baignoire d'angle",
    "tag": "Baignoire",
    "cat": "baignoire",
    "price": 2000,
    "unit": "unité",
    "description": "Optimise l'espace dans les coins, souvent avec balnéo.",
    "image": "https://images.unsplash.com/photo-1774716925765-d55848d8b157?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Baignoires"
  },
  {
    "id": "Baignoire::Baignoire îlot",
    "name": "Baignoire îlot",
    "tag": "Baignoire",
    "cat": "baignoire",
    "price": 4300,
    "unit": "unité",
    "description": "Autoportante, installée au centre de la pièce.",
    "image": "https://images.unsplash.com/photo-1631215750638-bdde5f616128?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Baignoires"
  },
  {
    "id": "Baignoire::Baignoire balnéothérapie",
    "name": "Baignoire balnéothérapie",
    "tag": "Baignoire",
    "cat": "baignoire",
    "price": null,
    "unit": "unité",
    "description": "Jets hydromassants intégrés pour un moment de détente.",
    "image": "https://images.unsplash.com/photo-1613487700221-38271bedcb52?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Baignoires"
  },
  {
    "id": "Douche::Receveur de douche",
    "name": "Receveur de douche",
    "tag": "Douche",
    "cat": "douche",
    "price": 900,
    "unit": "unité",
    "description": "À poser ou à encastrer, pour douche à l'italienne.",
    "image": "https://images.unsplash.com/photo-1566446896748-6075a87760c1?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Douches"
  },
  {
    "id": "Douche::Paroi de douche",
    "name": "Paroi de douche",
    "tag": "Douche",
    "cat": "douche",
    "price": 1100,
    "unit": "unité",
    "description": "Vitrée, fixe ou pivotante, pour fermer l'espace douche.",
    "image": "https://images.unsplash.com/photo-1571781418606-70265b9cce90?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Douches"
  },
  {
    "id": "Douche::Cabine de douche intégrale",
    "name": "Cabine de douche intégrale",
    "tag": "Douche",
    "cat": "douche",
    "price": null,
    "unit": "unité",
    "description": "Solution complète clé en main, parois et receveur inclus.",
    "image": "https://images.unsplash.com/photo-1650894622070-1c4cc26d7492?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Douches"
  },
  {
    "id": "Douche::Colonne de douche",
    "name": "Colonne de douche",
    "tag": "Douche",
    "cat": "douche",
    "price": 1000,
    "unit": "unité",
    "description": "Hydromassante ou classique, avec pommeau et douchette.",
    "image": "https://images.unsplash.com/photo-1652662700928-5a4685e87d64?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Douches"
  },
  {
    "id": "Bidet::Bidet",
    "name": "Bidet",
    "tag": "Bidet",
    "cat": "bidet",
    "price": null,
    "unit": "unité",
    "description": "Au sol ou suspendu, en complément du WC.",
    "image": "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Bidets & WC"
  },
  {
    "id": "WC::WC suspendu",
    "name": "WC suspendu",
    "tag": "WC",
    "cat": "wc",
    "price": 2700,
    "unit": "unité",
    "description": "Sur bâti-support encastré, pour un nettoyage facile du sol.",
    "image": "https://images.unsplash.com/photo-1576698483491-8c43f0862543?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Bidets & WC"
  },
  {
    "id": "WC::WC à poser",
    "name": "WC à poser",
    "tag": "WC",
    "cat": "wc",
    "price": 650,
    "unit": "unité",
    "description": "Modèle classique au sol, avec réservoir attenant.",
    "image": "https://images.unsplash.com/photo-1569597967185-cd6120712154?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Bidets & WC"
  },
  {
    "id": "WC::Urinoir",
    "name": "Urinoir",
    "tag": "WC",
    "cat": "wc",
    "price": null,
    "unit": "unité",
    "description": "Pour les espaces collectifs et installations spécifiques.",
    "image": "https://images.unsplash.com/photo-1651544861863-e834ba8496e4?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Bidets & WC"
  },
  {
    "id": "Salle de bain::Mitigeur vasque mural 3 trous — Chromé",
    "name": "Mitigeur vasque mural 3 trous — Chromé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 1290,
    "unit": "unité",
    "description": "Set 3 trous à poignées croisillon, corps encastré, finition chromée brillante.",
    "image": "../assets/images/produits/mitigeur-vasque-mural-3trous-chrome.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Mitigeur vasque mural 3 trous — Noir mat",
    "name": "Mitigeur vasque mural 3 trous — Noir mat",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 1450,
    "unit": "unité",
    "description": "Set 3 trous à poignées croisillon, corps encastré, finition noir mat.",
    "image": "../assets/images/produits/mitigeur-vasque-mural-3trous-noir.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Mitigeur vasque mural 3 trous — Doré brossé",
    "name": "Mitigeur vasque mural 3 trous — Doré brossé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 1690,
    "unit": "unité",
    "description": "Set 3 trous à poignées croisillon, corps encastré, finition laiton doré brossé.",
    "image": "../assets/images/produits/mitigeur-vasque-mural-3trous-dore.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Mitigeur vasque mural 3 trous — Cuivré",
    "name": "Mitigeur vasque mural 3 trous — Cuivré",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 1690,
    "unit": "unité",
    "description": "Set 3 trous à poignées croisillon, corps encastré, finition cuivre brossé.",
    "image": "../assets/images/produits/mitigeur-vasque-mural-3trous-cuivre.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Mitigeur de vasque compact",
    "name": "Mitigeur de vasque compact",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 950,
    "unit": "unité",
    "description": "Mono-commande à poser, corps bas. Disponible en noir mat, doré brossé ou cuivré.",
    "image": "../assets/images/produits/mitigeur-vasque-compact-3finitions.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Mitigeur vasque mural bec + levier — Cuivré",
    "name": "Mitigeur vasque mural bec + levier — Cuivré",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 1350,
    "unit": "unité",
    "description": "Version épurée à levier unique, bec verseur mural assorti, finition cuivrée.",
    "image": "../assets/images/produits/mitigeur-vasque-mural-cuivre.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Robinet baignoire sur pied — Noir mat",
    "name": "Robinet baignoire sur pied — Noir mat",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 3200,
    "unit": "unité",
    "description": "Colonne autoportante avec douchette à main, idéal baignoire îlot. Finition noir mat.",
    "image": "../assets/images/produits/robinet-baignoire-sur-pied-noir.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Robinet baignoire sur pied — Doré brossé",
    "name": "Robinet baignoire sur pied — Doré brossé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 3600,
    "unit": "unité",
    "description": "Colonne autoportante avec douchette à main, idéal baignoire îlot. Finition laiton doré.",
    "image": "../assets/images/produits/robinet-baignoire-sur-pied-dore.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Robinet baignoire sur pied — Chromé",
    "name": "Robinet baignoire sur pied — Chromé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 2900,
    "unit": "unité",
    "description": "Colonne autoportante avec douchette à main, idéal baignoire îlot. Finition chromée.",
    "image": "../assets/images/produits/robinet-baignoire-sur-pied-chrome.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Kit douche encastrée + bec baignoire — Cuivré",
    "name": "Kit douche encastrée + bec baignoire — Cuivré",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 2890,
    "unit": "unité",
    "description": "Tête de douche ronde, mitigeur encastré, douchette à main et bec de remplissage. Finition cuivrée.",
    "image": "../assets/images/produits/kit-douche-encastree-cuivre.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Kit douche encastrée + bec baignoire — Noir mat",
    "name": "Kit douche encastrée + bec baignoire — Noir mat",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 2690,
    "unit": "unité",
    "description": "Tête de douche ronde, mitigeur encastré, douchette à main et bec de remplissage. Finition noir mat.",
    "image": "../assets/images/produits/kit-douche-encastree-noir.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Kit douche encastrée + bec baignoire — Doré brossé",
    "name": "Kit douche encastrée + bec baignoire — Doré brossé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 3090,
    "unit": "unité",
    "description": "Tête de douche ronde, mitigeur encastré, douchette à main et bec de remplissage. Finition dorée brossée.",
    "image": "../assets/images/produits/kit-douche-encastree-dore.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Kit douche encastrée + bec baignoire — Chromé",
    "name": "Kit douche encastrée + bec baignoire — Chromé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 2450,
    "unit": "unité",
    "description": "Tête de douche ronde, mitigeur encastré, douchette à main et bec de remplissage. Finition chromée.",
    "image": "../assets/images/produits/kit-douche-encastree-chrome.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Cuisine::Mitigeur cuisine bec pivotant — Anthracite",
    "name": "Mitigeur cuisine bec pivotant — Anthracite",
    "tag": "Cuisine",
    "cat": "cuisine",
    "price": 1590,
    "unit": "unité",
    "description": "Bec haut carré pivotant à 360°, commande mono-levier, finition gris anthracite brossé.",
    "image": "../assets/images/produits/mitigeur-cuisine-bec-pivotant-anthracite.jpg",
    "page": "robinetterie.html",
    "row": "Nos nouvelles gammes premium"
  },
  {
    "id": "Salle de bain::Mitigeur de lavabo standard",
    "name": "Mitigeur de lavabo standard",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 320,
    "unit": "unité",
    "description": "Fixé directement sur le lavabo ou le meuble.",
    "image": "https://images.unsplash.com/photo-1542855368-ca6ea825bca2?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de salle de bain"
  },
  {
    "id": "Salle de bain::Mitigeur de lavabo haut",
    "name": "Mitigeur de lavabo haut",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 650,
    "unit": "unité",
    "description": "Spécialement conçu pour les vasques à poser.",
    "image": "https://images.unsplash.com/photo-1644916925497-109cbd92087d?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de salle de bain"
  },
  {
    "id": "Salle de bain::Robinet encastré (mural)",
    "name": "Robinet encastré (mural)",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 1600,
    "unit": "unité",
    "description": "Mécanisme caché dans la cloison, corps encastré inclus.",
    "image": "https://images.unsplash.com/photo-1708424230529-7933b11425fc?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de salle de bain"
  },
  {
    "id": "Salle de bain::Mitigeur de douche mécanique",
    "name": "Mitigeur de douche mécanique",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 430,
    "unit": "unité",
    "description": "Modèle classique à poignée unique.",
    "image": "https://images.unsplash.com/photo-1627008952471-a0339ea450c7?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de salle de bain"
  },
  {
    "id": "Salle de bain::Mitigeur de douche thermostatique",
    "name": "Mitigeur de douche thermostatique",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 1000,
    "unit": "unité",
    "description": "Blocage à 38°C et gestion précise de la température.",
    "image": "https://images.unsplash.com/photo-1655369424135-d95267d6bb8c?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de salle de bain"
  },
  {
    "id": "Salle de bain::Mitigeur de baignoire (avec inverseur)",
    "name": "Mitigeur de baignoire (avec inverseur)",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 650,
    "unit": "unité",
    "description": "Bascule l'eau entre le bec de remplissage et la douchette.",
    "image": "https://images.unsplash.com/photo-1552143232-454554411763?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de salle de bain"
  },
  {
    "id": "Cuisine::Mitigeur col de cygne",
    "name": "Mitigeur col de cygne",
    "tag": "Cuisine",
    "cat": "cuisine",
    "price": 430,
    "unit": "unité",
    "description": "Bec haut et courbé, un espace confortable sous le robinet.",
    "image": "https://images.unsplash.com/photo-1629078692818-c5a0443f4ae3?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de cuisine"
  },
  {
    "id": "Cuisine::Mitigeur à douchette extractible",
    "name": "Mitigeur à douchette extractible",
    "tag": "Cuisine",
    "cat": "cuisine",
    "price": 750,
    "unit": "unité",
    "description": "Flexible coulissant pour orienter le jet avec précision.",
    "image": "https://images.unsplash.com/photo-1628116906597-5239a936a3d0?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de cuisine"
  },
  {
    "id": "Cuisine::Robinet rabattable (sous-fenêtre)",
    "name": "Robinet rabattable (sous-fenêtre)",
    "tag": "Cuisine",
    "cat": "cuisine",
    "price": 1000,
    "unit": "unité",
    "description": "S'abaisse ou se couche pour laisser passer une fenêtre.",
    "image": "https://images.unsplash.com/photo-1767921827734-616aa9ababfb?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de cuisine"
  },
  {
    "id": "Cuisine::Robinet professionnel (type chef)",
    "name": "Robinet professionnel (type chef)",
    "tag": "Cuisine",
    "cat": "cuisine",
    "price": 1300,
    "unit": "unité",
    "description": "Modèle haut à grand ressort et douchette mobile intensive.",
    "image": "https://images.unsplash.com/photo-1774716925718-82ea2f2eb01b?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Robinetterie de cuisine"
  },
  {
    "id": "Accessoire::Bonde de lavabo / vasque",
    "name": "Bonde de lavabo / vasque",
    "tag": "Accessoire",
    "cat": "accessoires",
    "price": 160,
    "unit": "unité",
    "description": "Système de fermeture de l'évacuation, clic-clac ou à tirette.",
    "image": "https://images.unsplash.com/photo-1654440122140-f1fc995ddb34?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Accessoires complémentaires"
  },
  {
    "id": "Accessoire::Siphon de lavabo (laiton)",
    "name": "Siphon de lavabo (laiton)",
    "tag": "Accessoire",
    "cat": "accessoires",
    "price": 270,
    "unit": "unité",
    "description": "Pour les installations où le dessous du lavabo reste visible.",
    "image": "https://images.unsplash.com/photo-1760571327612-8ab776dcd462?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Accessoires complémentaires"
  },
  {
    "id": "Accessoire::Flexibles d'alimentation (la paire)",
    "name": "Flexibles d'alimentation (la paire)",
    "tag": "Accessoire",
    "cat": "accessoires",
    "price": 110,
    "unit": "unité",
    "description": "Raccordements eau chaude / eau froide indispensables.",
    "image": "https://images.unsplash.com/photo-1598023707207-276835c2b5fe?auto=format&fit=crop&w=800&q=80",
    "page": "robinetterie.html",
    "row": "Accessoires complémentaires"
  },
  {
    "id": "Pierre::Marbre",
    "name": "Marbre",
    "tag": "Pierre",
    "cat": "pierre",
    "price": 500,
    "unit": "m²",
    "description": "Blanc de Carrare, noir, vert impérial ou beige, en finition polie ou vieillie.",
    "image": "https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Mosaïque en pierre naturelle"
  },
  {
    "id": "Pierre::Travertin",
    "name": "Travertin",
    "tag": "Pierre",
    "cat": "pierre",
    "price": 270,
    "unit": "m²",
    "description": "Pierre calcaire rustique aux tons chauds, pour ambiances méditerranéennes ou zen.",
    "image": "https://images.unsplash.com/photo-1525468568166-6f2cd17c7ec9?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Mosaïque en pierre naturelle"
  },
  {
    "id": "Pierre::Ardoise",
    "name": "Ardoise",
    "tag": "Pierre",
    "cat": "pierre",
    "price": 320,
    "unit": "m²",
    "description": "Roche feuilletée gris anthracite ou noire, pour du relief mural contemporain.",
    "image": "https://images.unsplash.com/photo-1580687104139-9d51ce55e346?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Mosaïque en pierre naturelle"
  },
  {
    "id": "Pierre::Galets sur filet",
    "name": "Galets sur filet",
    "tag": "Pierre",
    "cat": "pierre",
    "price": 380,
    "unit": "m²",
    "description": "Pierres polies et bombées, pour douche à l'italienne ou terrasse extérieure.",
    "image": "https://images.unsplash.com/photo-1673924969559-ecb4835f314c?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Mosaïque en pierre naturelle"
  },
  {
    "id": "Verre::Pâte de verre",
    "name": "Pâte de verre",
    "tag": "Verre",
    "cat": "verre",
    "price": 320,
    "unit": "m²",
    "description": "Résistante à l'humidité, incontournable pour piscines et cabines de douche.",
    "image": "https://images.unsplash.com/photo-1667710059131-e31dfc6e035b?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Mosaïque en verre, céramique & mélanges"
  },
  {
    "id": "Verre::Faïence & grès cérame miniature",
    "name": "Faïence & grès cérame miniature",
    "tag": "Verre",
    "cat": "verre",
    "price": 480,
    "unit": "m²",
    "description": "Formats miniatures imitation marbre ou pierre, sans la porosité du naturel.",
    "image": "https://images.unsplash.com/photo-1550820946-1c6f7b8e2030?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Mosaïque en verre, céramique & mélanges"
  },
  {
    "id": "Verre::Mélanges pierre & verre / alu",
    "name": "Mélanges pierre & verre / alu",
    "tag": "Verre",
    "cat": "verre",
    "price": 950,
    "unit": "m²",
    "description": "Pierre mate et inserts de verre brillant ou métal, pour un effet graphique.",
    "image": "https://images.unsplash.com/photo-1607675719720-c8fd1f2e0f55?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Mosaïque en verre, céramique & mélanges"
  },
  {
    "id": "Format::Tomettes & hexagones",
    "name": "Tomettes & hexagones",
    "tag": "Format",
    "cat": "formats",
    "price": 500,
    "unit": "m²",
    "description": "Format nid d'abeille, très tendance pour les crédences de cuisine.",
    "image": "https://images.unsplash.com/photo-1580398562556-d33329a0f29b?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Formats & motifs géométriques"
  },
  {
    "id": "Format::Chevrons & bâtons rompus",
    "name": "Chevrons & bâtons rompus",
    "tag": "Format",
    "cat": "formats",
    "price": 550,
    "unit": "m²",
    "description": "Rectangles posés en biais, pour dynamiser les volumes d'une pièce.",
    "image": "https://images.unsplash.com/photo-1599799948077-3d6ff577d17f?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Formats & motifs géométriques"
  },
  {
    "id": "Format::Écailles de poisson",
    "name": "Écailles de poisson",
    "tag": "Format",
    "cat": "formats",
    "price": 650,
    "unit": "m²",
    "description": "Forme arrondie et fluide, dans l'esprit aquatique de la salle de bain.",
    "image": "https://images.unsplash.com/photo-1627668306651-33114d40ae30?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Formats & motifs géométriques"
  },
  {
    "id": "Format::Briquettes & joints décalés",
    "name": "Briquettes & joints décalés",
    "tag": "Format",
    "cat": "formats",
    "price": null,
    "unit": "unité",
    "description": "Pose imitant les briques murales miniatures, style industriel ou épuré.",
    "image": "https://images.unsplash.com/photo-1608533240316-dd18303ed09c?auto=format&fit=crop&w=800&q=80",
    "page": "mosaique-pierre.html",
    "row": "Formats & motifs géométriques"
  },
  {
    "id": "Origin::Art Renoir",
    "name": "Art Renoir",
    "tag": "Origin",
    "cat": "origin",
    "price": null,
    "unit": "m²",
    "description": "Grès cérame émaillé 22,3×22,3 cm, motifs floraux et artistiques adoucis.",
    "image": "https://images.unsplash.com/photo-1778489926872-8c3ad4223550?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Gamme Origin — décors & rétro"
  },
  {
    "id": "Origin::Art Degas — Negro & Blanco",
    "name": "Art Degas — Negro & Blanco",
    "tag": "Origin",
    "cat": "origin",
    "price": null,
    "unit": "m²",
    "description": "Grès cérame émaillé 22,3×22,3 cm, contrastes géométriques, déclinaisons Negro et Blanco.",
    "image": "https://images.unsplash.com/photo-1764670281751-8b7874d2d85f?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Gamme Origin — décors & rétro"
  },
  {
    "id": "Origin::Art Corot",
    "name": "Art Corot",
    "tag": "Origin",
    "cat": "origin",
    "price": null,
    "unit": "m²",
    "description": "Grès cérame émaillé 22,3×22,3 cm, motifs rétro inspirés des carreaux de ciment traditionnels espagnols.",
    "image": "../assets/images/motifs/motif-mosaique.jpg",
    "page": "carrelage.html",
    "row": "Gamme Origin — décors & rétro"
  },
  {
    "id": "Origin::Origin Mayolica",
    "name": "Origin Mayolica",
    "tag": "Origin",
    "cat": "origin",
    "price": null,
    "unit": "m²",
    "description": "Faïence de revêtement mural, finition brillante et artisanale, aspect céramique émaillée à la main.",
    "image": "https://images.unsplash.com/photo-1719597677180-2b1457e47bb2?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Gamme Origin — décors & rétro"
  },
  {
    "id": "Woods::Kalon Cerezo",
    "name": "Kalon Cerezo",
    "tag": "Woods",
    "cat": "woods",
    "price": null,
    "unit": "m²",
    "description": "Grès cérame finition mate rectifiée, veinage naturel du bois brut. Formats 20×120, 25×150 ou 30×180 cm. Réf. 017.241.0232.14567.",
    "image": "https://images.unsplash.com/photo-1508920052992-6f5a921eba78?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Gamme Woods — effet bois"
  },
  {
    "id": "Woods::Kalon Roble",
    "name": "Kalon Roble",
    "tag": "Woods",
    "cat": "woods",
    "price": null,
    "unit": "m²",
    "description": "Même gamme Kalon, teinte chêne clair. Finition mate rectifiée, formats 20×120, 25×150 ou 30×180 cm.",
    "image": "https://images.unsplash.com/photo-1635603498472-bd44fd7b0735?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Gamme Woods — effet bois"
  },
  {
    "id": "Woods::Kalon Wengue",
    "name": "Kalon Wengue",
    "tag": "Woods",
    "cat": "woods",
    "price": null,
    "unit": "m²",
    "description": "Teinte wengué foncée de la gamme Kalon. Finition mate rectifiée, formats 20×120, 25×150 ou 30×180 cm.",
    "image": "https://images.unsplash.com/photo-1751288301679-b6121e123dd1?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Gamme Woods — effet bois"
  },
  {
    "id": "Luxury::Kenzo Marfil",
    "name": "Kenzo Marfil",
    "tag": "Luxury",
    "cat": "marbre",
    "price": null,
    "unit": "m²",
    "description": "Grès cérame effet marbre noble, veines dorées ou grises très prononcées.",
    "image": "../assets/images/motifs/motif-marbre-vert.jpg",
    "page": "carrelage.html",
    "row": "Marbres & Luxury"
  },
  {
    "id": "Luxury::Materia CR.Lux / Ultra Lux",
    "name": "Materia CR.Lux / Ultra Lux",
    "tag": "Luxury",
    "cat": "marbre",
    "price": null,
    "unit": "m²",
    "description": "Plaques grand format ultra-brillantes, imitation marbres de prestige (Calacatta, Macchia Vecchia).",
    "image": "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?auto=format&fit=crop&w=800&q=80",
    "page": "carrelage.html",
    "row": "Marbres & Luxury"
  },
  {
    "id": "Ciment::Cromat",
    "name": "Cromat",
    "tag": "Ciment",
    "cat": "ciment",
    "price": null,
    "unit": "m²",
    "description": "Grès cérame, collection neutre, palette chromatique pure, aspect béton lissé.",
    "image": "../assets/images/motifs/motif-pierre.jpg",
    "page": "carrelage.html",
    "row": "Ciment & Pierres"
  },
  {
    "id": "Pierre::Montpellier",
    "name": "Montpellier",
    "tag": "Pierre",
    "cat": "ciment",
    "price": null,
    "unit": "m²",
    "description": "Grès cérame, reproduction pierre calcaire de Bourgogne avec incrustations de fossiles. Formats 60×120 et 120×120 cm.",
    "image": "../assets/images/motifs/motif-terrasse.jpg",
    "page": "carrelage.html",
    "row": "Ciment & Pierres"
  },
  {
    "id": "Olympia Ceramica::WC Suspendu Monolith",
    "name": "WC Suspendu Monolith",
    "tag": "Olympia Ceramica",
    "cat": "wc",
    "price": null,
    "unit": "unité",
    "description": "Chasse d'eau « Hidden Vortex » dissimulée et émail antibactérien « Olypolish ». Finitions : blanc mat, noir mat, vert mat, bleu pétrole brillant, turquoise mat, gris mat, noir brillant.",
    "image": "https://images.unsplash.com/photo-1576698483491-8c43f0862543?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Collection Monolith (Olympia Ceramica)"
  },
  {
    "id": "Olympia Ceramica::Bidet Suspendu Monolith",
    "name": "Bidet Suspendu Monolith",
    "tag": "Olympia Ceramica",
    "cat": "bidet",
    "price": null,
    "unit": "unité",
    "description": "Design monobloc suspendu aux formes arrondies et épurées, assorti au WC Monolith.",
    "image": "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Collection Monolith (Olympia Ceramica)"
  },
  {
    "id": "Olympia Ceramica::Lavabo à poser Wave 40×60",
    "name": "Lavabo à poser Wave 40×60",
    "tag": "Olympia Ceramica",
    "cat": "lavabo",
    "price": null,
    "unit": "unité",
    "description": "Céramique fine, rebords ultra-fins, forme rectangulaire adoucie. Dimensions 600×400×150 mm.",
    "image": "https://images.unsplash.com/photo-1721901945499-8fd5c1446b21?auto=format&fit=crop&w=800&q=80",
    "page": "sanitaire.html",
    "row": "Collection Monolith (Olympia Ceramica)"
  },
  {
    "id": "Simple vasque::Meuble Cannelé en Bois Massif « Cosy »",
    "name": "Meuble Cannelé en Bois Massif « Cosy »",
    "tag": "Simple vasque",
    "cat": "simple-vasque",
    "price": null,
    "unit": "unité",
    "description": "Meuble haut de gamme livré entièrement assemblé en usine — aucun montage en kit. Bois massif résistant à l'humidité, façade cannelée.",
    "image": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "page": "meubles-salle-de-bain.html",
    "row": "Meubles vasques"
  },
  {
    "id": "Double vasque::Meuble Double Vasque Cannelé « Duo »",
    "name": "Meuble Double Vasque Cannelé « Duo »",
    "tag": "Double vasque",
    "cat": "double-vasque",
    "price": null,
    "unit": "unité",
    "description": "Grand format cannelé en bois massif, deux vasques côte à côte pour les salles de bains familiales. Livré entièrement monté d'usine.",
    "image": "https://images.unsplash.com/photo-1564540579594-0930edb6de43?auto=format&fit=crop&w=800&q=80",
    "page": "meubles-salle-de-bain.html",
    "row": "Meubles vasques"
  },
  {
    "id": "Lave-mains::Petit Meuble Lave-Mains « Mini »",
    "name": "Petit Meuble Lave-Mains « Mini »",
    "tag": "Lave-mains",
    "cat": "lave-mains",
    "price": null,
    "unit": "unité",
    "description": "Version compacte du meuble cannelé, pensée pour les WC et les petits espaces. Monté d'usine.",
    "image": "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80",
    "page": "meubles-salle-de-bain.html",
    "row": "Meubles vasques"
  },
  {
    "id": "Personnalisable::Meuble Personnalisable Sur-Mesure",
    "name": "Meuble Personnalisable Sur-Mesure",
    "tag": "Personnalisable",
    "cat": "personnalisable",
    "price": null,
    "unit": "unité",
    "description": "Dimensions, coloris et plan configurés selon les mesures exactes de votre chantier.",
    "image": "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80",
    "page": "meubles-salle-de-bain.html",
    "row": "Meubles vasques"
  },
  {
    "id": "Plan vasque::Plan pour Vasque — Bois ou Pierre",
    "name": "Plan pour Vasque — Bois ou Pierre",
    "tag": "Plan vasque",
    "cat": "plan-vasque",
    "price": null,
    "unit": "unité",
    "description": "Plan de toilette plein, conçu pour recevoir une vasque à poser. Au choix en bois massif ou en pierre véritable.",
    "image": "https://images.unsplash.com/photo-1754788358645-d6e6cca12e25?auto=format&fit=crop&w=800&q=80",
    "page": "meubles-salle-de-bain.html",
    "row": "Plans, colonnes & accessoires"
  },
  {
    "id": "Colonne::Armoire de Rangement Suspendue",
    "name": "Armoire de Rangement Suspendue",
    "tag": "Colonne",
    "cat": "colonne",
    "price": null,
    "unit": "unité",
    "description": "Colonne suspendue assortie aux meubles cannelés, pour maximiser le rangement vertical.",
    "image": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
    "page": "meubles-salle-de-bain.html",
    "row": "Plans, colonnes & accessoires"
  },
  {
    "id": "Accessoire::Kit Siphon & Bonde Design",
    "name": "Kit Siphon & Bonde Design",
    "tag": "Accessoire",
    "cat": "accessoire",
    "price": null,
    "unit": "unité",
    "description": "Pack d'évacuation technique pour vasque, disponible en finition chrome, noir mat ou or brossé.",
    "image": "../assets/images/produits/mitigeur-vasque-compact-3finitions.jpg",
    "page": "meubles-salle-de-bain.html",
    "row": "Plans, colonnes & accessoires"
  },
  {
    "id": "Ledimex::Miroir LED Rome 60×90 cm",
    "name": "Miroir LED Rome 60×90 cm",
    "tag": "Ledimex",
    "cat": "arche",
    "price": null,
    "unit": "unité",
    "description": "Style chapelle, profilé aluminium noir mat. LED périmétrique 3 températures, capteur tactile, antibuée intégré. Réf. sur demande.",
    "image": "https://images.unsplash.com/photo-1758548157276-00c54fd4a9fa?auto=format&fit=crop&w=800&q=80",
    "page": "miroirs-led.html",
    "row": "Miroirs LED — Série Rome (Ledimex)"
  },
  {
    "id": "Ledimex::Miroir LED Rome 60×110 cm",
    "name": "Miroir LED Rome 60×110 cm",
    "tag": "Ledimex",
    "cat": "arche",
    "price": null,
    "unit": "unité",
    "description": "Style chapelle (arche arrondie haute), profilé aluminium noir mat premium. LED périmétrique 3 températures (3000K/4000K/6500K), double capteur tactile et antibuée intégré. Réf. ROMA025/110NG.",
    "image": "https://images.unsplash.com/photo-1758548157276-00c54fd4a9fa?auto=format&fit=crop&w=800&q=80",
    "page": "miroirs-led.html",
    "row": "Miroirs LED — Série Rome (Ledimex)"
  },
  {
    "id": "Ledimex::Miroir LED Rome 70×130 cm",
    "name": "Miroir LED Rome 70×130 cm",
    "tag": "Ledimex",
    "cat": "arche",
    "price": null,
    "unit": "unité",
    "description": "Grand format, même technologie que toute la série Rome : LED périmétrique 3 températures, capteur tactile et antibuée. Réf. sur demande.",
    "image": "https://images.unsplash.com/photo-1758548157276-00c54fd4a9fa?auto=format&fit=crop&w=800&q=80",
    "page": "miroirs-led.html",
    "row": "Miroirs LED — Série Rome (Ledimex)"
  },
  {
    "id": "Salle de bain::Robinet baignoire sur pied — Chromé",
    "name": "Robinet baignoire sur pied — Chromé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 2900,
    "promoPrice": 2290,
    "unit": "unité",
    "description": "Fin de série, stock limité. Colonne autoportante avec douchette à main.",
    "image": "../assets/images/produits/robinet-baignoire-sur-pied-chrome.jpg",
    "page": "destockage.html",
    "row": "À prix cassé"
  },
  {
    "id": "Salle de bain::Kit douche encastrée + bec baignoire — Noir mat",
    "name": "Kit douche encastrée + bec baignoire — Noir mat",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 2690,
    "promoPrice": 2190,
    "unit": "unité",
    "description": "Surstock, quantité limitée. Tête ronde, douchette et bec de remplissage.",
    "image": "../assets/images/produits/kit-douche-encastree-noir.jpg",
    "page": "destockage.html",
    "row": "À prix cassé"
  },
  {
    "id": "Salle de bain::Kit douche encastrée + bec baignoire — Doré brossé",
    "name": "Kit douche encastrée + bec baignoire — Doré brossé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 3090,
    "promoPrice": 2390,
    "unit": "unité",
    "description": "Dernières pièces en stock. Tête ronde, douchette et bec de remplissage.",
    "image": "../assets/images/produits/kit-douche-encastree-dore.jpg",
    "page": "destockage.html",
    "row": "À prix cassé"
  },
  {
    "id": "Salle de bain::Mitigeur vasque mural 3 trous — Chromé",
    "name": "Mitigeur vasque mural 3 trous — Chromé",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 1290,
    "promoPrice": 990,
    "unit": "unité",
    "description": "Fin de série. Set 3 trous à poignées croisillon, corps encastré.",
    "image": "../assets/images/produits/mitigeur-vasque-mural-3trous-chrome.jpg",
    "page": "destockage.html",
    "row": "À prix cassé"
  },
  {
    "id": "Salle de bain::Mitigeur de vasque compact",
    "name": "Mitigeur de vasque compact",
    "tag": "Salle de bain",
    "cat": "sdb",
    "price": 950,
    "promoPrice": 690,
    "unit": "unité",
    "description": "Surstock. Mono-commande à poser, noir mat, doré brossé ou cuivré.",
    "image": "../assets/images/produits/mitigeur-vasque-compact-3finitions.jpg",
    "page": "destockage.html",
    "row": "À prix cassé"
  },
  {
    "id": "Cuisine::Mitigeur cuisine bec pivotant — Anthracite",
    "name": "Mitigeur cuisine bec pivotant — Anthracite",
    "tag": "Cuisine",
    "cat": "cuisine",
    "price": 1590,
    "promoPrice": 1190,
    "unit": "unité",
    "description": "Dernières pièces. Bec haut pivotant à 360°, commande mono-levier.",
    "image": "../assets/images/produits/mitigeur-cuisine-bec-pivotant-anthracite.jpg",
    "page": "destockage.html",
    "row": "À prix cassé"
  },
  {
    "id": "Carrelage::Grès cérame émaillé — fin de série",
    "name": "Grès cérame émaillé — fin de série",
    "tag": "Carrelage",
    "cat": "carrelage",
    "price": 160,
    "promoPrice": 119,
    "unit": "m²",
    "description": "Lot limité, coloris classique. Idéal salons, cuisines et chambres.",
    "image": "../assets/images/carrelage-interieur.jpg",
    "page": "destockage.html",
    "row": "À prix cassé"
  },
  {
    "id": "Sanitaire::Vasque à poser — fin de série",
    "name": "Vasque à poser — fin de série",
    "tag": "Sanitaire",
    "cat": "sanitaire",
    "price": 1200,
    "promoPrice": 890,
    "unit": "unité",
    "description": "Modèle en céramique, quantité limitée en showroom.",
    "image": "../assets/images/sanitaire.jpg",
    "page": "destockage.html",
    "row": "À prix cassé"
  }
];

  var DEFAULT_SETTINGS = {
    tangerPhone1: "05 39 32 46 96",
    tangerPhone2: "05 39 32 46 97",
    casaPhone: "06 53 77 56 09",
    tangerHours: "À confirmer avec le showroom",
    casaHours: "À confirmer avec le showroom",
    monthlyTarget: 0
  };

  var CATEGORY_LABELS = {
    "carrelage.html": "Carrelage",
    "sanitaire.html": "Sanitaire",
    "robinetterie.html": "Robinetterie",
    "mosaique-pierre.html": "Mosaïque & Pierre",
    "meubles-salle-de-bain.html": "Meubles de salle de bain",
    "miroirs-led.html": "Miroirs LED",
    "destockage.html": "Déstockage"
  };

  var STATUS_LABELS = { pending: "En attente", preparing: "En préparation", shipping: "En livraison", done: "Livrée", cancelled: "Annulée" };
  var STATUS_ORDER = ["pending", "preparing", "shipping", "done", "cancelled"];
  var DEFAULT_STOCK = 20;
  var STOCK_ALERT_THRESHOLD = 5;

  // ---------- Stockage (simulateur de base de données partagée avec le site public) ----------
  function getProducts() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(PRODUCTS_KEY)); } catch (e) {}
    if (!raw) {
      raw = SEED_PRODUCTS.map(function (p) {
        return {
          id: p.id, name: p.name, tag: p.tag, cat: p.cat, price: p.price, unit: p.unit,
          description: p.description, image: p.image, page: p.page, row: p.row,
          promoPrice: null, deleted: false, source: "site", createdAt: 0, stock: DEFAULT_STOCK
        };
      });
      saveProducts(raw);
    }
    var changed = false;
    raw.forEach(function (p) {
      if (typeof p.stock !== "number") { p.stock = DEFAULT_STOCK; changed = true; }
      // Migration : 14 produits robinetterie ajoutés avec un chemin d'image relatif au site public
      // (sans le "../" nécessaire depuis /admin/) — corrige les enregistrements déjà en localStorage.
      if (typeof p.image === "string" && p.image.indexOf("assets/images/produits/") === 0) {
        p.image = "../" + p.image;
        changed = true;
      }
    });
    // Migration : les 8 produits Déstockage ajoutés à SEED_PRODUCTS le 29/08/2026
    // n'apparaissent jamais tout seuls dans un navigateur qui avait déjà un catalogue
    // enregistré (le seed ci-dessus ne tourne qu'une fois, sur localStorage vide) --
    // complète les entrées manquantes sans toucher à celles déjà là.
    var existingIds = {};
    raw.forEach(function (p) { existingIds[p.id] = true; });
    SEED_PRODUCTS.forEach(function (p) {
      if (p.page === "destockage.html" && !existingIds[p.id]) {
        raw.push({
          id: p.id, name: p.name, tag: p.tag, cat: p.cat, price: p.price, unit: p.unit,
          description: p.description, image: p.image, page: p.page, row: p.row,
          promoPrice: p.promoPrice != null ? p.promoPrice : null,
          deleted: false, source: "site", createdAt: 0, stock: DEFAULT_STOCK
        });
        changed = true;
      }
    });
    if (changed) saveProducts(raw);
    return raw;
  }
  function saveProducts(list) { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list)); }
  // Commandes réelles (API /api/admin/orders, voir Phase 3/tâche #9 du plan) --
  // ordersCache=null tant qu'aucune réponse serveur n'est arrivée, auquel cas getOrders()
  // retombe sur localStorage (mode local, backend pas encore déployé ou hors-ligne).
  // Seuls la lecture et le changement de statut sont réellement synchronisés avec l'API --
  // suppression de commande et attribution vendeur restent volontairement locales
  // (pas d'endpoint dédié dans le périmètre validé), voir updateOrderStatusRemote.
  var ordersCache = null;
  // Mis à true uniquement sur un vrai 401 (pas de session valide) -- distingue "pas
  // connecté" (doit afficher l'écran de connexion) d'une simple panne réseau/DB (ne
  // doit jamais bloquer l'accès, voir bootstrapAdmin plus bas).
  var authRequired = false;
  var PAYMENT_METHOD_LABELS = {
    cod: "Paiement à la livraison",
    showroom: "Paiement au showroom",
    online_card: "Paiement en ligne"
  };
  function mapApiOrder(o) {
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    var d = new Date(o.created_at);
    return {
      id: o.id, // UUID réel de la table orders -- clé utilisée par le PATCH de statut
      ref: o.ref,
      date: d.getTime(),
      dateLabel: pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " à " + pad(d.getHours()) + ":" + pad(d.getMinutes()),
      customer: {
        name: o.name, phone: o.phone, city: o.city, address: o.address || "",
        payment: PAYMENT_METHOD_LABELS[o.payment_method] || o.payment_method
      },
      items: (o.items || []).map(function (it) {
        return { name: it.name, tag: it.tag, qty: it.qty, unit: it.unit, price: Number(it.price), total: Number(it.total) };
      }),
      subtotal: Number(o.subtotal),
      status: o.fulfillment_status
    };
  }
  function refreshOrdersFromApi() {
    return fetch("/api/admin/orders", { credentials: "same-origin" })
      .then(function (res) {
        if (res.status === 401) { authRequired = true; return null; }
        authRequired = false;
        if (!res.ok) throw new Error("Erreur serveur (" + res.status + ")");
        return res.json();
      })
      .then(function (data) {
        if (!data) return null;
        ordersCache = data.orders.map(mapApiOrder);
        return ordersCache;
      })
      .catch(function (err) {
        console.warn("Impossible de charger les commandes depuis l'API, secours localStorage :", err.message);
        return null;
      });
  }
  function updateOrderStatusRemote(id, status) {
    fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id: id, status: status })
    }).catch(function (err) {
      console.warn("Statut non synchronisé côté serveur (backend indisponible) :", err.message);
    });
  }
  function getOrders() {
    if (ordersCache !== null) return ordersCache;
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch (e) { return []; }
  }
  function saveOrders(list) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
    ordersCache = list;
  }
  function getSettings() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(SETTINGS_KEY)); } catch (e) {}
    var out = {};
    for (var k in DEFAULT_SETTINGS) out[k] = DEFAULT_SETTINGS[k];
    if (raw) for (var k2 in raw) out[k2] = raw[k2];
    return out;
  }
  function saveSettings(obj) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj)); }

  function formatMAD(n) {
    var s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return s + " MAD";
  }
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }
  function findById(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // Bouton "supprimer" compact, réutilisé partout où une commande est listée (Vue globale,
  // notifications, Livraisons) en plus du tableau Commandes — ouvre la même confirmation.
  function orderDeleteBtnHtml(id) {
    return '<button type="button" class="admin-icon-btn-sm danger" data-action="delete-order" data-id="' + escapeHtml(id) +
      '" title="Supprimer cette commande" aria-label="Supprimer cette commande">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg></button>';
  }
  function bindOrderDeleteButtons(root) {
    root.querySelectorAll('[data-action="delete-order"]').forEach(function (btn) {
      if (btn._tcDeleteBound) return;
      btn._tcDeleteBound = true;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        openDeleteModal(btn.getAttribute("data-id"), "order");
      });
    });
  }

  // ---------- Navigation (sidebar) ----------
  var navLinks = document.querySelectorAll(".admin-nav-link[data-panel]");
  var panels = document.querySelectorAll(".admin-panel");
  var panelRenderers = {};
  function showPanel(name) {
    panels.forEach(function (p) { p.classList.toggle("active", p.id === "panel-" + name); });
    navLinks.forEach(function (l) { l.classList.toggle("active", l.dataset.panel === name); });
    var group = document.querySelector('.admin-nav-group:has([data-panel="' + name + '"])');
    if (group) group.classList.add("open");
    if (panelRenderers[name]) panelRenderers[name]();
    window.scrollTo(0, 0);
  }
  navLinks.forEach(function (l) {
    l.addEventListener("click", function () { showPanel(l.getAttribute("data-panel")); });
  });
  document.querySelectorAll("[data-panel-link]").forEach(function (el) {
    el.addEventListener("click", function () { showPanel(el.getAttribute("data-panel-link")); });
  });

  // ---------- Navigation (groupes repliables) ----------
  document.querySelectorAll(".admin-nav-group-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.closest(".admin-nav-group").classList.toggle("open");
    });
  });

  // ---------- Toast ----------
  var toast = document.querySelector("#adminToast");
  var toastText = document.querySelector("#adminToastText");
  var toastTimer = null;
  function showToast(text) {
    toastText.textContent = text;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  // ---------- Tableau de bord ----------
  var currentRange = "week";
  var RANGE_LABELS = { today: "Aujourd'hui", week: "Cette semaine", month: "Ce mois" };
  var WEEKDAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  function getRangeStart(range, now) {
    if (range === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    if (range === "week") { var d = new Date(now); d.setDate(d.getDate() - 6); return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0); }
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }
  function getRangeBuckets(range) {
    var now = new Date();
    var buckets = [];
    if (range === "today") {
      for (var h = 0; h < 24; h++) {
        var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0, 0);
        var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 59, 59, 999);
        buckets.push({ label: h + "h", start: start.getTime(), end: end.getTime() });
      }
    } else if (range === "week") {
      for (var d = 6; d >= 0; d--) {
        var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
        var start2 = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
        var end2 = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
        buckets.push({ label: WEEKDAY_LABELS[day.getDay()], start: start2.getTime(), end: end2.getTime() });
      }
    } else {
      var daysInMonth = now.getDate();
      for (var dd = 1; dd <= daysInMonth; dd++) {
        var day2 = new Date(now.getFullYear(), now.getMonth(), dd, 0, 0, 0, 0);
        var end3 = new Date(now.getFullYear(), now.getMonth(), dd, 23, 59, 59, 999);
        buckets.push({ label: String(dd), start: day2.getTime(), end: end3.getTime() });
      }
    }
    return buckets;
  }

  function sumRevenue(orders) {
    // Une commande annulée ne compte jamais comme chiffre d'affaires réel.
    var total = 0;
    orders.forEach(function (o) { if (o.status !== "cancelled") total += o.subtotal || 0; });
    return total;
  }

  function renderPeriodRevenue(allOrders) {
    var now = new Date();
    var startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    var startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
    var ordersToday = allOrders.filter(function (o) { return o.date >= startToday; });
    var ordersMonth = allOrders.filter(function (o) { return o.date >= startMonth; });

    var revTodayEl = document.querySelector("#revToday");
    if (revTodayEl) {
      revTodayEl.textContent = formatMAD(sumRevenue(ordersToday));
      document.querySelector("#revMonth").textContent = formatMAD(sumRevenue(ordersMonth));
    }

    var gauge = document.querySelector("#objectiveGauge");
    if (gauge) {
      var target = getSettings().monthlyTarget || 0;
      var achieved = sumRevenue(ordersMonth);
      var pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
      gauge.style.setProperty("--gauge-value", pct);
      document.querySelector("#objectiveGaugeValue").textContent = pct + "%";
      document.querySelector("#objectiveSub").textContent = target > 0
        ? formatMAD(achieved) + " sur " + formatMAD(target) + " visés ce mois"
        : "Aucun objectif défini — configurez-le dans Paramètres.";
    }

    var loyalEl = document.querySelector("#statLoyal");
    if (loyalEl) {
      var byPhone = {};
      allOrders.forEach(function (o) {
        var key = (o.customer && o.customer.phone) || o.customer.name;
        byPhone[key] = (byPhone[key] || 0) + 1;
      });
      var phones = Object.keys(byPhone);
      var loyal = phones.filter(function (k) { return byPhone[k] >= 2; }).length;
      var fresh = phones.filter(function (k) { return byPhone[k] === 1; }).length;
      loyalEl.textContent = loyal;
      document.querySelector("#statNew").textContent = fresh;
      document.querySelector("#statTotalClients").textContent = phones.length;
    }

    return { ordersToday: ordersToday, ordersMonth: ordersMonth };
  }

  // ---------- Bento Grid — graphiques de la Vue globale ----------
  var bentoAreaChart = null, bentoTopProductsChart = null, bentoCategoryDonut = null,
    bentoShowroomBar = null, bentoStockDonut = null, bentoPaymentDonut = null;
  registerChartDestroyer(function () { return bentoAreaChart; }, function (v) { bentoAreaChart = v; });
  registerChartDestroyer(function () { return bentoTopProductsChart; }, function (v) { bentoTopProductsChart = v; });
  registerChartDestroyer(function () { return bentoCategoryDonut; }, function (v) { bentoCategoryDonut = v; });
  registerChartDestroyer(function () { return bentoShowroomBar; }, function (v) { bentoShowroomBar = v; });
  registerChartDestroyer(function () { return bentoStockDonut; }, function (v) { bentoStockDonut = v; });
  registerChartDestroyer(function () { return bentoPaymentDonut; }, function (v) { bentoPaymentDonut = v; });

  function renderDonut(canvasId, legendId, labels, values, colors, getExisting, setExisting) {
    var canvas = document.querySelector("#" + canvasId);
    if (!canvas || typeof Chart === "undefined") return;
    var existing = getExisting();
    if (existing) {
      existing.data.labels = labels;
      existing.data.datasets[0].data = values;
      existing.data.datasets[0].backgroundColor = colors;
      existing.update();
    } else {
      setExisting(new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderColor: chartCardBg(), borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { display: false } } }
      }));
    }
    var legendEl = document.querySelector("#" + legendId);
    if (legendEl) {
      var total = values.reduce(function (a, b) { return a + b; }, 0);
      legendEl.innerHTML = labels.map(function (l, i) {
        var pct = total ? Math.round((values[i] / total) * 100) : 0;
        return '<span><i style="background:' + colors[i] + '"></i>' + escapeHtml(l) + " (" + pct + "%)</span>";
      }).join("");
    }
  }

  function renderBentoCharts(allOrders) {
    var now = new Date();
    var startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
    var ordersMonth = allOrders.filter(function (o) { return o.date >= startMonth; });

    // Évolution des ventes (aire) — jours du mois en cours
    var buckets = getRangeBuckets("month");
    var evolLabels = buckets.map(function (b) { return b.label; });
    var evolData = buckets.map(function (b) {
      var sum = 0;
      ordersMonth.forEach(function (o) { if (o.date >= b.start && o.date <= b.end) sum += o.subtotal || 0; });
      return sum;
    });
    var canvasArea = document.querySelector("#bentoAreaChart");
    if (canvasArea && typeof Chart !== "undefined") {
      var gradient = canvasArea.getContext("2d").createLinearGradient(0, 0, 0, 220);
      gradient.addColorStop(0, "rgba(0,176,116,0.5)");
      gradient.addColorStop(1, "rgba(0,176,116,0.02)");
      if (bentoAreaChart) { bentoAreaChart.data.labels = evolLabels; bentoAreaChart.data.datasets[0].data = evolData; bentoAreaChart.update(); }
      else {
        bentoAreaChart = new Chart(canvasArea.getContext("2d"), {
          type: "line",
          data: { labels: evolLabels, datasets: [{ data: evolData, borderColor: "#ffffff", backgroundColor: gradient, pointRadius: 0, borderWidth: 2, tension: 0.4, fill: true }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: chartTickColor(), font: { size: 9 }, maxTicksLimit: 10 } },
              y: { beginAtZero: true, grid: { color: chartGridColor() }, ticks: { color: chartTickColor(), font: { size: 10 }, callback: function (v) { return v + " MAD"; } } }
            }
          }
        });
      }
    }

    // Top 10 des produits vendus (barres horizontales)
    var counts = {};
    allOrders.forEach(function (o) { o.items.forEach(function (i) { counts[i.name] = (counts[i.name] || 0) + i.qty; }); });
    var topNames = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 10);
    var topData = topNames.map(function (n) { return counts[n]; });
    var canvasTop = document.querySelector("#bentoTopProductsChart");
    if (canvasTop && typeof Chart !== "undefined") {
      if (bentoTopProductsChart) { bentoTopProductsChart.data.labels = topNames; bentoTopProductsChart.data.datasets[0].data = topData; bentoTopProductsChart.update(); }
      else {
        bentoTopProductsChart = new Chart(canvasTop.getContext("2d"), {
          type: "bar",
          data: { labels: topNames, datasets: [{ data: topData, backgroundColor: "#00b074", borderRadius: 4, barThickness: 14 }] },
          options: {
            indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, grid: { color: chartGridColor() }, ticks: { color: chartTickColor(), font: { size: 10 } } },
              y: { grid: { display: false }, ticks: { color: chartTickColor(), font: { size: 10 } } }
            }
          }
        });
      }
    }

    // Total références catalogue
    var totalRefsEl = document.querySelector("#bentoTotalRefs");
    if (totalRefsEl) totalRefsEl.textContent = getProducts().filter(function (p) { return !p.deleted; }).length;

    // Ventes par catégorie (donut) — regroupées par famille de produits (page catalogue), pas par tag fin,
    // pour rester lisible (6 familles réelles) plutôt qu'un donut éclaté en 15+ tags.
    var pageById = {};
    getProducts().forEach(function (p) { pageById[p.id] = p.page; });
    var catTotals = {};
    allOrders.forEach(function (o) {
      o.items.forEach(function (i) {
        var page = pageById[i.id];
        var k = CATEGORY_LABELS[page] || "Autre";
        catTotals[k] = (catTotals[k] || 0) + i.total;
      });
    });
    var catLabels = Object.keys(catTotals);
    var catValues = catLabels.map(function (k) { return catTotals[k]; });
    // Palette dédiée vert / blanc / gris pour ce donut (le CHART_PALETTE partagé inclut orange/rouge, réservés aux alertes ailleurs).
    var CATEGORY_DONUT_PALETTE = ["#00b074", "#4ddba8", "#00875a", "#c7c7c7", "#6f7873", "#eafaf4"];
    var catColors = catLabels.map(function (_, i) { return CATEGORY_DONUT_PALETTE[i % CATEGORY_DONUT_PALETTE.length]; });
    renderDonut("bentoCategoryDonut", "bentoCategoryLegend", catLabels, catValues, catColors,
      function () { return bentoCategoryDonut; }, function (c) { bentoCategoryDonut = c; });

    // Ventes par showroom (barres verticales)
    function revenueForCity(city) {
      return sumRevenue(allOrders.filter(function (o) { return o.customer && o.customer.city === city; }));
    }
    var srData = [revenueForCity("Tanger"), revenueForCity("Casablanca")];
    var canvasSr = document.querySelector("#bentoShowroomBar");
    if (canvasSr && typeof Chart !== "undefined") {
      if (bentoShowroomBar) { bentoShowroomBar.data.datasets[0].data = srData; bentoShowroomBar.update(); }
      else {
        bentoShowroomBar = new Chart(canvasSr.getContext("2d"), {
          type: "bar",
          data: { labels: ["Tanger", "Casablanca"], datasets: [{ data: srData, backgroundColor: ["#00b074", "#4ddba8"], borderRadius: 6, barThickness: 46 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: chartTickColor(), font: { size: 11 } } },
              y: { beginAtZero: true, grid: { color: chartGridColor() }, ticks: { color: chartTickColor(), font: { size: 10 }, callback: function (v) { return v + " MAD"; } } }
            }
          }
        });
      }
    }

    // État des stocks (donut)
    var products = getProducts().filter(function (p) { return !p.deleted; });
    var inStock = 0, low = 0, out = 0;
    products.forEach(function (p) {
      var s = p.stock || 0;
      if (s <= 0) out++; else if (s < STOCK_ALERT_THRESHOLD) low++; else inStock++;
    });
    renderDonut("bentoStockDonut", "bentoStockLegend", ["En stock", "Stock faible", "Rupture"], [inStock, low, out], ["#00b074", "#9a9a9a", "#ffffff"],
      function () { return bentoStockDonut; }, function (c) { bentoStockDonut = c; });

    // Modes de paiement (donut) — les deux seules méthodes réellement proposées au tunnel de commande
    var delivery = 0, showroomPay = 0;
    allOrders.forEach(function (o) {
      var pay = (o.customer && o.customer.payment) || "";
      if (pay.indexOf("livraison") !== -1) delivery += o.subtotal || 0;
      else if (pay.toLowerCase().indexOf("showroom") !== -1) showroomPay += o.subtotal || 0;
    });
    renderDonut("bentoPaymentDonut", "bentoPaymentLegend", ["Livraison", "Showroom"], [delivery, showroomPay], ["#00b074", "#00875a"],
      function () { return bentoPaymentDonut; }, function (c) { bentoPaymentDonut = c; });
  }

  function renderDashboard() {
    var allOrders = getOrders();
    var periods = renderPeriodRevenue(allOrders);
    var ordersToday = periods.ordersToday, ordersMonth = periods.ordersMonth;

    var kpiOrdersToday = document.querySelector("#kpiOrdersToday");
    if (kpiOrdersToday) {
      kpiOrdersToday.textContent = ordersToday.length;
      document.querySelector("#kpiOrdersPending").textContent = allOrders.filter(function (o) { return o.status === "pending"; }).length;

      var byPhoneAll = {};
      allOrders.forEach(function (o) {
        var key = (o.customer && o.customer.phone) || o.customer.name;
        byPhoneAll[key] = (byPhoneAll[key] || 0) + 1;
      });
      var newClients = Object.keys(byPhoneAll).filter(function (k) { return byPhoneAll[k] === 1; }).length;
      document.querySelector("#kpiNewClients").textContent = newClients;

      var validOrdersMonth = ordersMonth.filter(function (o) { return o.status !== "cancelled"; });
      var avgBasket = validOrdersMonth.length ? Math.round(sumRevenue(validOrdersMonth) / validOrdersMonth.length) : 0;
      document.querySelector("#kpiAvgBasket").textContent = formatMAD(avgBasket);

      // Bénéfices réels — uniquement sur les produits dont le prix d'achat a été renseigné (jamais estimé).
      var profitEl = document.querySelector("#kpiProfit");
      if (profitEl) {
        var costById = {};
        getProducts().forEach(function (p) { if (p.costPrice != null) costById[p.id] = p.costPrice; });
        var knownProfit = 0, itemCount = 0, unknownCount = 0;
        validOrdersMonth.forEach(function (o) {
          (o.items || []).forEach(function (i) {
            itemCount++;
            if (costById[i.id] != null) knownProfit += (i.price - costById[i.id]) * i.qty;
            else unknownCount++;
          });
        });
        if (itemCount === 0) {
          profitEl.textContent = "—";
          profitEl.title = "Aucune commande ce mois-ci.";
        } else if (unknownCount === itemCount) {
          profitEl.textContent = "N/A";
          profitEl.title = "Aucun produit vendu ce mois n'a de prix d'achat renseigné (fiche produit > Prix d'achat).";
        } else {
          profitEl.textContent = formatMAD(knownProfit) + (unknownCount ? " *" : "");
          profitEl.title = unknownCount
            ? unknownCount + " article(s) vendu(s) sans prix d'achat renseigné, exclu(s) de ce calcul."
            : "Bénéfice réel (prix de vente − prix d'achat) sur toutes les commandes du mois.";
        }
      }
    }

    var recentList = document.querySelector("#recentOrdersList");
    if (recentList) {
      var recent = allOrders.slice(-5).reverse();
      if (!recent.length) {
        recentList.innerHTML =
          '<p style="color:var(--a-muted); font-size:0.86rem; padding:10px 0;">Aucune commande pour le moment. Les commandes passées sur le site public apparaîtront ici automatiquement.</p>';
      } else {
        recentList.innerHTML = recent.map(function (o) {
          return (
            '<div class="admin-recent-item">' +
              '<div class="who"><strong>' + escapeHtml(o.customer.name) + '</strong><span>' + escapeHtml(o.ref) + " · " + escapeHtml(o.customer.city) + '</span></div>' +
              '<div class="admin-recent-item-right"><span class="amount">' + formatMAD(o.subtotal) + '</span>' + orderDeleteBtnHtml(o.id) + '</div>' +
            '</div>'
          );
        }).join("");
        bindOrderDeleteButtons(recentList);
      }
    }

    renderBentoCharts(allOrders);
    renderNotifications();
  }

  document.querySelectorAll(".admin-time-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".admin-time-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentRange = btn.getAttribute("data-range");
      renderDashboard();
    });
  });

  // ---------- Notifications ----------
  function renderNotifications() {
    var list = document.querySelector("#notifList");
    var dot = document.querySelector("#notifDot");
    var count = document.querySelector("#notifCount");
    if (!list) return;
    var pendingOrders = getOrders().filter(function (o) { return o.status === "pending"; }).slice(-8).reverse();
    dot.hidden = pendingOrders.length === 0;
    count.textContent = pendingOrders.length + " en attente";
    if (!pendingOrders.length) {
      list.innerHTML = '<p class="admin-notif-empty">Aucune nouvelle commande en attente.</p>';
      return;
    }
    list.innerHTML = pendingOrders.map(function (o) {
      return (
        '<div class="admin-notif-row">' +
          '<button type="button" class="admin-notif-item" data-notif-order="' + escapeHtml(o.id) + '">' +
            "<strong>Nouvelle commande — " + escapeHtml(o.ref) + "</strong>" +
            "<span>" + escapeHtml(o.customer.name) + " · " + formatMAD(o.subtotal) + "</span>" +
          "</button>" +
          orderDeleteBtnHtml(o.id) +
        "</div>"
      );
    }).join("");
    bindOrderDeleteButtons(list);
    list.querySelectorAll("[data-notif-order]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeNotifPanel();
        showPanel("orders");
        var input = document.querySelector("#ordersSearch");
        if (input) { input.value = ""; }
        var statusSel = document.querySelector("#ordersStatusFilter");
        if (statusSel) statusSel.value = "";
        renderOrders();
      });
    });
  }

  var notifBell = document.querySelector("#notifBell");
  var notifPanel = document.querySelector("#notifPanel");
  function openNotifPanel() {
    notifPanel.classList.add("open");
    notifPanel.setAttribute("aria-hidden", "false");
  }
  function closeNotifPanel() {
    notifPanel.classList.remove("open");
    notifPanel.setAttribute("aria-hidden", "true");
  }
  if (notifBell) {
    notifBell.addEventListener("click", function (e) {
      e.stopPropagation();
      if (notifPanel.classList.contains("open")) closeNotifPanel();
      else { renderNotifications(); openNotifPanel(); }
    });
    document.addEventListener("click", function (e) {
      if (notifPanel.classList.contains("open") && !notifPanel.contains(e.target) && e.target !== notifBell) closeNotifPanel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNotifPanel();
    });
  }

  // ---------- Déconnexion ----------
  var themeToggleBtn = document.querySelector("#themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", function () {
      var next = isLightTheme() ? "dark" : "light";
      applyTheme(next);
      destroyAllCharts();
      var activePanel = document.querySelector(".admin-panel.active");
      if (activePanel) {
        var name = activePanel.id.replace(/^panel-/, "");
        if (panelRenderers[name]) panelRenderers[name]();
      }
      showToast("Thème " + (next === "light" ? "clair" : "sombre") + " activé.");
    });
  }

  var logoutBtn = document.querySelector("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      showToast("Déconnexion...");
      var done = function () { window.location.href = "../index.html"; };
      if (location.protocol === "file:") { setTimeout(done, 500); return; }
      fetch("/api/auth/admin?action=logout", { method: "POST", credentials: "same-origin" })
        .catch(function () {})
        .then(function () { setTimeout(done, 400); });
    });
  }

  // ---------- Commandes ----------
  function renderOrders() {
    var orders = getOrders().slice().reverse();
    var search = (document.querySelector("#ordersSearch").value || "").toLowerCase();
    var statusFilter = document.querySelector("#ordersStatusFilter").value;
    var body = document.querySelector("#ordersTableBody");

    var pendingCount = orders.filter(function (o) { return o.status === "pending"; }).length;
    var badge = document.querySelector("#ordersBadge");
    badge.hidden = pendingCount === 0;
    badge.textContent = pendingCount;

    var filtered = orders.filter(function (o) {
      var haystack = (o.ref + " " + o.customer.name + " " + o.customer.city).toLowerCase();
      var matchSearch = !search || haystack.indexOf(search) !== -1;
      var matchStatus = !statusFilter || o.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (!filtered.length) {
      body.innerHTML = '<tr class="admin-empty-row"><td colspan="7">Aucune commande. Passez une commande sur le site public pour la voir apparaître ici.</td></tr>';
      return;
    }

    body.innerHTML = filtered.map(function (o) {
      var options = STATUS_ORDER.map(function (s) {
        return '<option value="' + s + '"' + (s === o.status ? " selected" : "") + ">" + STATUS_LABELS[s] + "</option>";
      }).join("");
      return (
        "<tr>" +
          "<td>" + escapeHtml(o.ref) + '<br><span style="color:var(--a-muted); font-size:0.74rem;">' + escapeHtml(o.dateLabel) + "</span></td>" +
          "<td>" + escapeHtml(o.customer.name) + '<br><span style="color:var(--a-muted); font-size:0.74rem;">' + escapeHtml(o.customer.phone) + "</span></td>" +
          "<td>" + escapeHtml(o.customer.city) + (o.customer.address ? '<br><span style="color:var(--a-muted); font-size:0.74rem;">' + escapeHtml(o.customer.address) + "</span>" : "") + "</td>" +
          "<td>" + escapeHtml(o.customer.payment) + "</td>" +
          "<td><strong>" + formatMAD(o.subtotal) + "</strong></td>" +
          '<td><select class="admin-status-select status-' + o.status + '" data-order-id="' + escapeHtml(o.id) + '">' + options + "</select></td>" +
          '<td><button type="button" class="admin-icon-btn danger" data-action="delete-order" data-id="' + escapeHtml(o.id) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>Supprimer</button></td>' +
        "</tr>"
      );
    }).join("");

    body.querySelectorAll("select[data-order-id]").forEach(function (sel) {
      sel.addEventListener("change", function () {
        var list = getOrders();
        var order = findById(list, sel.getAttribute("data-order-id"));
        if (order) {
          order.status = sel.value;
          saveOrders(list);
          updateOrderStatusRemote(order.id, sel.value); // synchronise avec la vraie DB si le backend répond
        }
        sel.className = "admin-status-select status-" + sel.value;
        renderDashboard();
        showToast("Statut de la commande mis à jour.");
      });
    });
    body.querySelectorAll('[data-action="delete-order"]').forEach(function (btn) {
      btn.addEventListener("click", function () { openDeleteModal(btn.getAttribute("data-id"), "order"); });
    });
  }
  document.querySelector("#ordersSearch").addEventListener("input", renderOrders);
  document.querySelector("#ordersStatusFilter").addEventListener("change", renderOrders);

  // ---------- Catalogue produits ----------
  function renderCatalog() {
    var products = getProducts();
    var search = (document.querySelector("#catalogSearch").value || "").toLowerCase();
    var pageFilter = document.querySelector("#catalogPageFilter").value;
    var statusFilter = document.querySelector("#catalogStatusFilter").value;
    var body = document.querySelector("#catalogTableBody");

    var filtered = products.filter(function (p) {
      var matchSearch = !search || p.name.toLowerCase().indexOf(search) !== -1;
      var matchPage = !pageFilter || p.page === pageFilter;
      var matchStatus =
        statusFilter === "all" ? true :
        statusFilter === "hidden" ? !!p.deleted :
        !p.deleted; // "active" par défaut : les produits supprimés n'apparaissent plus ici
      return matchSearch && matchPage && matchStatus;
    });

    if (!filtered.length) {
      var emptyMsg = statusFilter === "hidden"
        ? "Aucun produit supprimé."
        : "Aucun produit ne correspond à votre recherche.";
      body.innerHTML = '<tr class="admin-empty-row"><td colspan="6">' + emptyMsg + "</td></tr>";
      return;
    }

    body.innerHTML = filtered.map(function (p) {
      var priceCell;
      if (p.price == null) {
        priceCell = '<span style="color:var(--a-muted);">Sur devis</span>';
      } else if (p.promoPrice != null) {
        priceCell = '<div class="admin-price-cell"><span class="old-price">' + formatMAD(p.price) + '</span><strong class="new-price">' + formatMAD(p.promoPrice) + "</strong></div>";
      } else {
        priceCell = "<strong>" + formatMAD(p.price) + "</strong>";
      }

      var statusBadge = p.deleted
        ? '<span class="admin-badge status-hidden">Masqué</span>'
        : (p.promoPrice != null ? '<span class="admin-badge status-promo">Promotion</span>' : '<span class="admin-badge status-active">Actif</span>');

      var priceBtn = p.price != null
        ? '<button type="button" class="admin-icon-btn" data-action="price" data-id="' + escapeHtml(p.id) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Modifier le prix</button>'
        : "";
      var promoBtn = p.price != null
        ? '<button type="button" class="admin-icon-btn' + (p.promoPrice != null ? " is-active" : "") + '" data-action="promo" data-id="' + escapeHtml(p.id) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .58 1.41l9.59 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z"/><circle cx="7.5" cy="7.5" r="1"/></svg>' + (p.promoPrice != null ? "Retirer la promo" : "Activer une réduction") + "</button>"
        : "";
      var deleteBtn = '<button type="button" class="admin-icon-btn danger" data-action="delete" data-id="' + escapeHtml(p.id) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>' + (p.deleted ? "Réactiver" : "Supprimer") + "</button>";
      var stockBtn = '<button type="button" class="admin-icon-btn" data-action="stock" data-id="' + escapeHtml(p.id) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2m18 0v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0H3m4 4h10"/></svg>Gérer le stock</button>';
      var stockCell = '<span class="admin-stock-cell' + (p.stock < STOCK_ALERT_THRESHOLD ? " low" : "") + '">' + p.stock + "</span>";
      var marginCell = "—";
      if (p.costPrice != null && typeof p.price === "number") {
        var unitMargin = p.price - p.costPrice;
        marginCell = '<span style="color:' + (unitMargin >= 0 ? "var(--a-green)" : "var(--a-danger)") + '">' + formatMAD(unitMargin) + "</span>";
      }

      return (
        "<tr>" +
          '<td><div class="admin-cell-product"><img class="admin-product-thumb" src="' + escapeHtml(p.image || PLACEHOLDER_IMAGE) + '" alt="" loading="lazy"><div><strong>' + escapeHtml(p.name) + "</strong><span>" + escapeHtml(p.tag || "") + (p.source === "admin" ? " · ajouté manuellement" : "") + "</span></div></div></td>" +
          "<td>" + escapeHtml(CATEGORY_LABELS[p.page] || p.page) + "</td>" +
          "<td>" + escapeHtml(p.brand || "—") + "</td>" +
          "<td>" + priceCell + "</td>" +
          "<td>" + marginCell + "</td>" +
          "<td>" + stockCell + "</td>" +
          "<td>" + statusBadge + "</td>" +
          '<td><div class="admin-row-actions">' + priceBtn + promoBtn + stockBtn + deleteBtn + "</div></td>" +
        "</tr>"
      );
    }).join("");

    body.querySelectorAll('[data-action="price"]').forEach(function (btn) {
      btn.addEventListener("click", function () { openPriceModal(btn.getAttribute("data-id"), "price"); });
    });
    body.querySelectorAll('[data-action="stock"]').forEach(function (btn) {
      btn.addEventListener("click", function () { openPriceModal(btn.getAttribute("data-id"), "stock"); });
    });
    body.querySelectorAll('[data-action="promo"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var list = getProducts();
        var product = findById(list, id);
        if (product && product.promoPrice != null) {
          product.promoPrice = null;
          saveProducts(list);
          renderCatalog();
          renderDashboard();
          showToast("Promotion retirée.");
        } else {
          openPriceModal(id, "promo");
        }
      });
    });
    body.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener("click", function () { openDeleteModal(btn.getAttribute("data-id"), "product"); });
    });
  }
  document.querySelector("#catalogSearch").addEventListener("input", renderCatalog);
  document.querySelector("#catalogPageFilter").addEventListener("change", renderCatalog);
  document.querySelector("#catalogStatusFilter").addEventListener("change", renderCatalog);

  // ---------- Modal : modifier le prix / activer une promotion ----------
  var priceModal = document.querySelector("#priceModal");
  var priceModalForm = document.querySelector("#priceModalForm");
  var priceModalInput = document.querySelector("#priceModalInput");
  var priceModalTitle = document.querySelector("#priceModalTitle");
  var priceModalSub = document.querySelector("#priceModalSub");
  var priceModalLabel = document.querySelector("#priceModalLabel");
  var priceModalMode = null;
  var priceModalProductId = null;

  function openPriceModal(id, mode) {
    var product = findById(getProducts(), id);
    if (!product) return;
    priceModalMode = mode;
    priceModalProductId = id;
    if (mode === "price") {
      priceModalTitle.textContent = "Modifier le prix";
      priceModalSub.textContent = product.name;
      priceModalLabel.textContent = "Nouveau prix (MAD)";
      priceModalInput.value = product.price;
    } else if (mode === "stock") {
      priceModalTitle.textContent = "Gérer le stock";
      priceModalSub.textContent = product.name + " — une alerte apparaît sous le seuil de " + STOCK_ALERT_THRESHOLD + " unités.";
      priceModalLabel.textContent = "Quantité en stock";
      priceModalInput.value = product.stock;
    } else {
      priceModalTitle.textContent = "Activer une réduction";
      priceModalSub.textContent = product.name + " — prix actuel : " + formatMAD(product.price);
      priceModalLabel.textContent = "Prix promotionnel (MAD)";
      priceModalInput.value = product.promoPrice != null ? product.promoPrice : "";
    }
    priceModal.classList.add("open");
    priceModal.setAttribute("aria-hidden", "false");
    priceModalInput.focus();
  }
  function closePriceModal() {
    priceModal.classList.remove("open");
    priceModal.setAttribute("aria-hidden", "true");
  }
  priceModal.querySelectorAll("[data-price-modal-close]").forEach(function (el) {
    el.addEventListener("click", closePriceModal);
  });
  priceModalForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = parseInt(priceModalInput.value, 10);
    if (isNaN(value) || value < 0) return;
    var list = getProducts();
    var product = findById(list, priceModalProductId);
    if (!product) return;
    if (priceModalMode === "price") {
      product.price = value;
      showToast("Prix mis à jour pour « " + product.name + " ».");
    } else if (priceModalMode === "stock") {
      product.stock = value;
      showToast("Stock mis à jour pour « " + product.name + " » (" + value + " unités).");
    } else {
      product.promoPrice = value;
      showToast("Réduction activée pour « " + product.name + " ».");
    }
    saveProducts(list);
    closePriceModal();
    renderCatalog();
    renderDashboard();
  });

  // ---------- Modal : suppression / réactivation (produits ET commandes) ----------
  var deleteModal = document.querySelector("#deleteModal");
  var deleteModalId = null;
  var deleteModalType = "product";
  var deleteModalTitle = document.querySelector("#deleteModalTitle");
  var deleteModalSub = document.querySelector("#deleteModalSub");
  var deleteModalConfirm = document.querySelector("#deleteModalConfirm");

  function openDeleteModal(id, type) {
    deleteModalType = type || "product";
    deleteModalId = id;

    if (deleteModalType === "order") {
      var order = findById(getOrders(), id);
      if (!order) return;
      deleteModalTitle.textContent = "Supprimer cette commande ?";
      deleteModalSub.textContent = "La commande " + order.ref + " (" + order.customer.name + ", " + formatMAD(order.subtotal) + ") sera définitivement supprimée. Cette action est irréversible.";
      deleteModalConfirm.textContent = "Supprimer";
      deleteModalConfirm.style.background = "var(--a-danger)";
      deleteModalConfirm.style.color = "#fff";
    } else {
      var product = findById(getProducts(), id);
      if (!product) return;
      if (product.deleted) {
        deleteModalTitle.textContent = "Réactiver ce produit ?";
        deleteModalSub.textContent = "« " + product.name + " » redeviendra visible sur le site public.";
        deleteModalConfirm.textContent = "Réactiver";
        deleteModalConfirm.style.background = "var(--a-green)";
        deleteModalConfirm.style.color = "#fff";
      } else {
        deleteModalTitle.textContent = "Supprimer ce produit ?";
        deleteModalSub.textContent = "« " + product.name + " » sera retiré de cette liste et n'apparaîtra plus sur le site public. Retrouvable via le filtre « Produits supprimés ».";
        deleteModalConfirm.textContent = "Supprimer";
        deleteModalConfirm.style.background = "var(--a-danger)";
        deleteModalConfirm.style.color = "#fff";
      }
    }
    deleteModal.classList.add("open");
    deleteModal.setAttribute("aria-hidden", "false");
  }
  function closeDeleteModal() {
    deleteModal.classList.remove("open");
    deleteModal.setAttribute("aria-hidden", "true");
  }
  deleteModal.querySelectorAll("[data-delete-modal-close]").forEach(function (el) {
    el.addEventListener("click", closeDeleteModal);
  });
  deleteModalConfirm.addEventListener("click", function () {
    if (deleteModalType === "order") {
      var orders = getOrders();
      var order = findById(orders, deleteModalId);
      if (!order) return;
      orders = orders.filter(function (o) { return o.id !== deleteModalId; });
      saveOrders(orders);
      showToast("Commande " + order.ref + " supprimée.");
      closeDeleteModal();
      // Une commande peut être supprimée depuis plusieurs endroits (Commandes, Vue globale,
      // notifications, Livraisons) : on rafraîchit toutes les vues qui en listent, pas
      // seulement celle d'où vient le clic.
      renderOrders();
      renderDashboard();
      renderLivraisons();
      renderNotifications();
      renderNotificationsFull();
      return;
    }
    var list = getProducts();
    var product = findById(list, deleteModalId);
    if (!product) return;
    product.deleted = !product.deleted;
    saveProducts(list);
    showToast(product.deleted ? "Produit supprimé du site." : "Produit réactivé.");
    closeDeleteModal();
    renderCatalog();
    renderDashboard();
    // Les produits créés au dashboard (source="admin") vivent aussi dans la vraie base
    // (voir "Ajouter un produit" plus haut) -- il faut y répercuter la suppression/
    // réactivation, sinon le produit resterait visible pour les vrais visiteurs malgré le
    // "supprimé" affiché ici. L'id de la ligne en base est "tag::nom" (voir
    // api/admin/manage.js), différent de l'id local "admin-xxxxx" utilisé dans ce tableau.
    if (product.source === "admin") {
      fetch("/api/admin/manage?resource=products", {
        method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.tag + "::" + product.name, deleted: product.deleted })
      }).catch(function () { showToast("Suppression non synchronisée côté serveur (service indisponible)."); });
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (priceModal.classList.contains("open")) closePriceModal();
    if (deleteModal.classList.contains("open")) closeDeleteModal();
  });

  // ---------- Ajouter un produit ----------
  var addProductForm = document.querySelector("#addProductForm");
  var pDropzone = document.querySelector("#pDropzone");
  var pImageInput = document.querySelector("#pImage");
  var pImagePreview = document.querySelector("#pImagePreview");
  var pImagePreviewImg = document.querySelector("#pImagePreviewImg");
  var pImagePreviewName = document.querySelector("#pImagePreviewName");
  var pendingImageDataUrl = null;

  function resizeImageFile(file, maxWidth, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxWidth / img.width);
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  function handleImageFile(file) {
    if (!file || file.type.indexOf("image/") !== 0) return;
    resizeImageFile(file, 640, function (dataUrl) {
      pendingImageDataUrl = dataUrl;
      pImagePreviewImg.src = dataUrl;
      pImagePreviewName.textContent = file.name;
      pImagePreview.classList.add("show");
    });
  }
  pImageInput.addEventListener("change", function () {
    if (pImageInput.files && pImageInput.files[0]) handleImageFile(pImageInput.files[0]);
  });
  ["dragenter", "dragover"].forEach(function (evt) {
    pDropzone.addEventListener(evt, function (e) { e.preventDefault(); pDropzone.classList.add("drag-over"); });
  });
  ["dragleave", "drop"].forEach(function (evt) {
    pDropzone.addEventListener(evt, function (e) { e.preventDefault(); pDropzone.classList.remove("drag-over"); });
  });
  pDropzone.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
  });
  document.querySelector("#pImageRemove").addEventListener("click", function () {
    pendingImageDataUrl = null;
    pImageInput.value = "";
    pImagePreview.classList.remove("show");
  });

  addProductForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.querySelector("#pName").value.trim();
    var page = document.querySelector("#pCategory").value;
    var brand = document.querySelector("#pBrand").value.trim();
    var price = parseInt(document.querySelector("#pPrice").value, 10);
    var costPriceRaw = document.querySelector("#pCostPrice").value;
    var costPrice = costPriceRaw ? parseInt(costPriceRaw, 10) : null;
    var promoRaw = document.querySelector("#pPromo").value;
    var promoPrice = promoRaw ? parseInt(promoRaw, 10) : null;
    var stockRaw = document.querySelector("#pStock").value;
    var stock = stockRaw ? parseInt(stockRaw, 10) : DEFAULT_STOCK;
    var description = document.querySelector("#pDescription").value.trim();
    var status = document.querySelector("#addProductStatus");

    if (!name || isNaN(price)) {
      status.textContent = "Merci de renseigner au moins le nom et le prix du produit.";
      status.classList.add("show");
      return;
    }
    if (promoPrice != null && (isNaN(promoPrice) || promoPrice >= price)) {
      status.textContent = "Le prix promotionnel doit être inférieur au prix normal.";
      status.classList.add("show");
      return;
    }

    var list = getProducts();
    var id = "admin-" + Date.now().toString(36);
    list.push({
      id: id,
      name: name,
      tag: CATEGORY_LABELS[page] || "",
      cat: "nouveau",
      brand: brand || null,
      price: price,
      costPrice: (costPrice != null && !isNaN(costPrice)) ? costPrice : null,
      promoPrice: promoPrice,
      stock: isNaN(stock) ? DEFAULT_STOCK : stock,
      unit: "unité",
      description: description,
      image: pendingImageDataUrl || "",
      page: page,
      row: "Ajoutés récemment",
      deleted: false,
      source: "admin",
      createdAt: Date.now()
    });
    saveProducts(list);

    addProductForm.reset();
    pendingImageDataUrl = null;
    pImagePreview.classList.remove("show");
    renderCatalog();
    renderDashboard();
    showPanel("catalog");

    // Sauvegarde aussi dans la vraie base de données (demande explicite du 03/09/2026) :
    // sans ça, ce produit ne serait visible QUE dans ce navigateur (voir getProducts() plus
    // haut) -- jamais pour un vrai visiteur. C'est ÇA qui rend le produit réellement public,
    // pas la ligne saveProducts() ci-dessus qui ne sert qu'à garder l'affichage du dashboard
    // cohérent (Catalogue, Stock, statistiques, export PDF...).
    status.textContent = "« " + name + " » ajouté -- publication en cours...";
    status.classList.add("show");
    fetch("/api/admin/manage?resource=products", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name, tag: CATEGORY_LABELS[page] || "", page: page, price: price, promoPrice: promoPrice,
        unit: "unité", description: description, image: pendingImageDataUrl || ""
      })
    }).then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
      .then(function (r) {
        if (!r.ok) {
          status.textContent = "« " + name + " » ajouté au catalogue local, mais PAS ENCORE visible pour les vrais visiteurs (" + (r.d.error || "erreur serveur") + "). Réessaie depuis Catalogue Produits.";
          status.classList.add("is-error");
          showToast("Produit ajouté localement, publication échouée.");
          return;
        }
        status.textContent = "« " + name + " » ajouté et visible dès maintenant pour tous les visiteurs sur la page " + (CATEGORY_LABELS[page] || page) + ".";
        showToast("Produit publié sur le site.");
      })
      .catch(function () {
        status.textContent = "« " + name + " » ajouté au catalogue local, mais PAS ENCORE visible pour les vrais visiteurs (service indisponible). Réessaie plus tard.";
        status.classList.add("is-error");
        showToast("Produit ajouté localement, publication échouée.");
      });
  });

  // ---------- Paramètres du site ----------
  var settingsForm = document.querySelector("#settingsForm");
  function fillSettingsForm() {
    var s = getSettings();
    document.querySelector("#sTangerPhone1").value = s.tangerPhone1;
    document.querySelector("#sTangerPhone2").value = s.tangerPhone2;
    document.querySelector("#sTangerHours").value = s.tangerHours;
    document.querySelector("#sCasaPhone").value = s.casaPhone;
    document.querySelector("#sCasaHours").value = s.casaHours;
    var targetInput = document.querySelector("#sMonthlyTarget");
    if (targetInput) targetInput.value = s.monthlyTarget || "";
  }
  settingsForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var targetInput = document.querySelector("#sMonthlyTarget");
    var newSettings = {
      tangerPhone1: document.querySelector("#sTangerPhone1").value.trim(),
      tangerPhone2: document.querySelector("#sTangerPhone2").value.trim(),
      tangerHours: document.querySelector("#sTangerHours").value.trim(),
      casaPhone: document.querySelector("#sCasaPhone").value.trim(),
      casaHours: document.querySelector("#sCasaHours").value.trim(),
      monthlyTarget: targetInput ? (parseInt(targetInput.value, 10) || 0) : 0
    };
    saveSettings(newSettings);
    var status = document.querySelector("#settingsStatus");
    status.textContent = "Paramètres enregistrés — le site public affichera ces changements dès son prochain chargement de page.";
    status.classList.add("show");
    showToast("Paramètres du site mis à jour.");
    renderDashboard();
  });
  document.querySelector("#settingsReset").addEventListener("click", function () {
    localStorage.removeItem(SETTINGS_KEY);
    fillSettingsForm();
    showToast("Paramètres réinitialisés aux valeurs actuelles du site.");
  });

  // ---------- Recharger les prix du catalogue en base ----------
  var seedProductsBtn = document.querySelector("#seedProductsBtn");
  if (seedProductsBtn) {
    seedProductsBtn.addEventListener("click", function () {
      var status = document.querySelector("#seedProductsStatus");
      status.classList.remove("is-error");
      if (location.protocol === "file:") {
        status.textContent = "Indisponible en local (fichier ouvert directement) -- utilisable une fois le site déployé.";
        status.classList.add("show", "is-error");
        return;
      }
      seedProductsBtn.disabled = true;
      status.textContent = "Rechargement en cours...";
      status.classList.add("show");
      fetch("/api/admin/seed-products", { method: "POST", credentials: "same-origin" })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          seedProductsBtn.disabled = false;
          if (!r.ok) {
            status.textContent = r.data.error || "Échec du rechargement.";
            status.classList.add("is-error");
            return;
          }
          status.textContent = r.data.total + " produits à prix fixe rechargés en base." +
            (r.data.errors && r.data.errors.length ? " Pages en échec : " + r.data.errors.join(", ") : "");
          status.classList.remove("is-error");
          showToast("Prix du catalogue rechargés.");
        })
        .catch(function () {
          seedProductsBtn.disabled = false;
          status.textContent = "Service momentanément indisponible -- réessaie plus tard.";
          status.classList.add("is-error");
        });
    });
  }

  // ---------- Mon compte (changer email / mot de passe) ----------
  var accountForm = document.querySelector("#accountForm");
  if (accountForm) {
    accountForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.querySelector("#accountStatus");
      status.classList.remove("is-error");
      var currentPassword = document.querySelector("#accCurrentPassword").value;
      var newEmail = document.querySelector("#accNewEmail").value.trim();
      var newPassword = document.querySelector("#accNewPassword").value;

      if (location.protocol === "file:") {
        status.textContent = "Indisponible en local (fichier ouvert directement) -- utilisable une fois le site déployé.";
        status.classList.add("show", "is-error");
        return;
      }
      if (!newEmail && !newPassword) {
        status.textContent = "Renseigne un nouvel email et/ou un nouveau mot de passe.";
        status.classList.add("show", "is-error");
        return;
      }
      if (newPassword && newPassword.length < 8) {
        status.textContent = "Le nouveau mot de passe doit contenir au moins 8 caractères.";
        status.classList.add("show", "is-error");
        return;
      }

      var body = { currentPassword: currentPassword };
      if (newEmail) body.newEmail = newEmail;
      if (newPassword) body.newPassword = newPassword;

      fetch("/api/auth/admin?action=update-account", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (!r.ok) {
            status.textContent = r.data.error || "Mise à jour impossible.";
            status.classList.add("show", "is-error");
            return;
          }
          status.textContent = "Compte mis à jour avec succès.";
          status.classList.remove("is-error");
          status.classList.add("show");
          document.querySelector("#accCurrentPassword").value = "";
          document.querySelector("#accNewPassword").value = "";
          showToast("Identifiants du compte mis à jour.");
        })
        .catch(function () {
          status.textContent = "Service momentanément indisponible -- réessaie plus tard.";
          status.classList.add("show", "is-error");
        });
    });
  }

  // ==========================================================
  // Nouveaux modules — données réelles (commandes / produits)
  // ==========================================================

  function pad2v(n) { return n < 10 ? "0" + n : "" + n; }
  function formatDate2(d) { return pad2v(d.getDate()) + "/" + pad2v(d.getMonth() + 1) + "/" + d.getFullYear(); }
  var CHART_PALETTE = ["#00b074", "#00875a", "#4ddba8", "#f5a623", "#ff5470", "#9a9a9a", "#4c9c78", "#c7c7c7"];

  // ---------- Ventes ----------
  var ventesLineChart = null, ventesBarChart = null, ventesPieChart = null;
  registerChartDestroyer(function () { return ventesLineChart; }, function (v) { ventesLineChart = v; });
  registerChartDestroyer(function () { return ventesBarChart; }, function (v) { ventesBarChart = v; });
  registerChartDestroyer(function () { return ventesPieChart; }, function (v) { ventesPieChart = v; });
  function getVentesBuckets(range, now) {
    if (range === "year") {
      var months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      var buckets = [];
      for (var m = 0; m <= now.getMonth(); m++) {
        var start = new Date(now.getFullYear(), m, 1, 0, 0, 0, 0);
        var end = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
        buckets.push({ label: months[m], start: start.getTime(), end: end.getTime() });
      }
      return buckets;
    }
    return getRangeBuckets(range);
  }
  function renderVentes() {
    var rangeSel = document.querySelector("#ventesRangeFilter");
    var villeSel = document.querySelector("#ventesVilleFilter");
    if (!rangeSel) return;
    var range = rangeSel.value;
    var ville = villeSel.value;
    var now = new Date();
    var rangeStart = getRangeStart(range === "year" ? "month" : range, now).getTime();
    if (range === "year") rangeStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
    var orders = getOrders().filter(function (o) { return o.date >= rangeStart; });
    if (ville) orders = orders.filter(function (o) { return o.customer && o.customer.city === ville; });

    var RANGE_LABELS_V = { week: "Cette semaine", month: "Ce mois", year: "Cette année" };
    document.querySelector("#ventesEvolLabel").textContent = RANGE_LABELS_V[range];

    var revenue = sumRevenue(orders);
    var itemCount = 0;
    orders.forEach(function (o) { o.items.forEach(function (i) { itemCount += i.qty; }); });
    document.querySelector("#ventesStatRevenue").textContent = formatMAD(revenue);
    document.querySelector("#ventesStatOrders").textContent = orders.length;
    document.querySelector("#ventesStatItems").textContent = itemCount;
    document.querySelector("#ventesStatAvg").textContent = formatMAD(orders.length ? Math.round(revenue / orders.length) : 0);

    var buckets = getVentesBuckets(range, now);
    var lineLabels = buckets.map(function (b) { return b.label; });
    var lineData = buckets.map(function (b) {
      var sum = 0;
      orders.forEach(function (o) { if (o.date >= b.start && o.date <= b.end) sum += o.subtotal || 0; });
      return sum;
    });
    var canvas1 = document.querySelector("#ventesLineChart");
    if (canvas1 && typeof Chart !== "undefined") {
      if (ventesLineChart) { ventesLineChart.data.labels = lineLabels; ventesLineChart.data.datasets[0].data = lineData; ventesLineChart.update(); }
      else {
        ventesLineChart = new Chart(canvas1.getContext("2d"), {
          type: "line",
          data: { labels: lineLabels, datasets: [{ label: "CA", data: lineData, borderColor: "#00b074", backgroundColor: "rgba(0,176,116,0.12)", pointBackgroundColor: "#00b074", pointRadius: 3, borderWidth: 2, tension: 0.35, fill: true }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: chartTickColor(), font: { size: 11 } } },
              y: { beginAtZero: true, grid: { color: chartGridColor() }, ticks: { color: chartTickColor(), font: { size: 11 }, callback: function (v) { return v + " MAD"; } } }
            }
          }
        });
      }
    }

    var catTotals = {};
    orders.forEach(function (o) { o.items.forEach(function (i) { var k = i.tag || "Autre"; catTotals[k] = (catTotals[k] || 0) + i.total; }); });
    var catLabels = Object.keys(catTotals);
    var catValues = catLabels.map(function (k) { return catTotals[k]; });
    var catColors = catLabels.map(function (_, i) { return CHART_PALETTE[i % CHART_PALETTE.length]; });

    var canvas2 = document.querySelector("#ventesBarChart");
    if (canvas2 && typeof Chart !== "undefined") {
      if (ventesBarChart) { ventesBarChart.data.labels = catLabels; ventesBarChart.data.datasets[0].data = catValues; ventesBarChart.data.datasets[0].backgroundColor = catColors; ventesBarChart.update(); }
      else {
        ventesBarChart = new Chart(canvas2.getContext("2d"), {
          type: "bar",
          data: { labels: catLabels, datasets: [{ data: catValues, backgroundColor: catColors, borderRadius: 4 }] },
          options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: chartTickColor(), font: { size: 10 } } },
              y: { beginAtZero: true, grid: { color: chartGridColor() }, ticks: { color: chartTickColor(), font: { size: 10 } } }
            }
          }
        });
      }
    }

    var canvas3 = document.querySelector("#ventesPieChart");
    if (canvas3 && typeof Chart !== "undefined") {
      if (ventesPieChart) { ventesPieChart.data.labels = catLabels; ventesPieChart.data.datasets[0].data = catValues; ventesPieChart.data.datasets[0].backgroundColor = catColors; ventesPieChart.update(); }
      else {
        ventesPieChart = new Chart(canvas3.getContext("2d"), {
          type: "doughnut",
          data: { labels: catLabels, datasets: [{ data: catValues, backgroundColor: catColors, borderColor: chartCardBg(), borderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: chartTickColor(), font: { size: 10 }, boxWidth: 10, padding: 8 } } } }
        });
      }
    }

    // Produits les plus vendus (demande explicite) : même filtre période/ville que
    // ci-dessus, à partir des vraies lignes de commande déjà chargées -- exclut les
    // commandes annulées (jamais réellement vendues), même logique que sumRevenue().
    var topBody = document.querySelector("#topProductsBody");
    if (topBody) {
      var salesByProduct = {};
      orders.filter(function (o) { return o.status !== "cancelled"; }).forEach(function (o) {
        o.items.forEach(function (i) {
          var key = i.tag + "::" + i.name;
          if (!salesByProduct[key]) salesByProduct[key] = { name: i.name, tag: i.tag, qty: 0, revenue: 0 };
          salesByProduct[key].qty += i.qty;
          salesByProduct[key].revenue += i.total;
        });
      });
      var topList = Object.keys(salesByProduct).map(function (k) { return salesByProduct[k]; })
        .sort(function (a, b) { return b.qty - a.qty; }).slice(0, 10);
      if (!topList.length) {
        topBody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">Aucune vente sur cette période.</td></tr>';
      } else {
        topBody.innerHTML = topList.map(function (p, i) {
          return "<tr><td>" + (i + 1) + "</td><td><strong>" + escapeHtml(p.name) + "</strong></td><td>" + escapeHtml(p.tag) +
            "</td><td>" + p.qty + "</td><td>" + formatMAD(p.revenue) + "</td></tr>";
        }).join("");
      }
    }
  }
  ["ventesRangeFilter", "ventesVilleFilter"].forEach(function (id) {
    var el = document.querySelector("#" + id);
    if (el) el.addEventListener("change", renderVentes);
  });

  // ---------- Statistiques catalogue (top ventes / flops) ----------
  function renderCatalogStats() {
    var topEl = document.querySelector("#statTopSellers");
    var flopEl = document.querySelector("#statFlops");
    if (!topEl) return;
    var counts = {};
    getOrders().forEach(function (o) { o.items.forEach(function (i) { counts[i.name] = (counts[i.name] || 0) + i.qty; }); });
    var products = getProducts().filter(function (p) { return !p.deleted; });
    var sold = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 5);
    if (!sold.length) topEl.innerHTML = '<p style="color:var(--a-muted); font-size:0.84rem;">Aucune vente enregistrée pour le moment.</p>';
    else topEl.innerHTML = sold.map(function (name) {
      return '<div class="admin-compare-row"><span>' + escapeHtml(name) + '</span><span>' + counts[name] + ' vendu(s)</span></div>';
    }).join("");

    var neverSold = products.filter(function (p) { return !counts[p.name]; }).slice(0, 5);
    if (!neverSold.length) flopEl.innerHTML = '<p style="color:var(--a-muted); font-size:0.84rem;">Tous les produits ont été vendus au moins une fois.</p>';
    else flopEl.innerHTML = neverSold.map(function (p) {
      return '<div class="admin-compare-row"><span>' + escapeHtml(p.name) + '</span><span style="color:var(--a-muted);">0 vente</span></div>';
    }).join("");
  }

  // ---------- Stock ----------
  function renderStock() {
    var products = getProducts().filter(function (p) { return !p.deleted; });
    var totalUnits = 0, totalValue = 0, outCount = 0, lowCount = 0;
    products.forEach(function (p) {
      var stock = p.stock || 0;
      totalUnits += stock;
      totalValue += stock * (p.promoPrice != null ? p.promoPrice : (p.price || 0));
      if (stock <= 0) outCount++;
      else if (stock < STOCK_ALERT_THRESHOLD) lowCount++;
    });
    document.querySelector("#stockStatUnits").textContent = totalUnits;
    document.querySelector("#stockStatValue").textContent = formatMAD(totalValue);
    document.querySelector("#stockStatOut").textContent = outCount;
    document.querySelector("#stockStatLow").textContent = lowCount;

    var searchInput = document.querySelector("#stockSearch");
    var search = (searchInput ? searchInput.value : "").toLowerCase();
    var filtered = products.filter(function (p) { return !search || p.name.toLowerCase().indexOf(search) !== -1; });
    filtered.sort(function (a, b) { return (a.stock || 0) - (b.stock || 0); });

    var tbody = document.querySelector("#stockTableBody");
    if (!filtered.length) { tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">Aucun produit.</td></tr>'; return; }
    tbody.innerHTML = filtered.map(function (p) {
      var stock = p.stock || 0;
      var pct = Math.max(4, Math.min(100, Math.round((stock / 20) * 100)));
      var levelClass = stock < STOCK_ALERT_THRESHOLD ? "low" : (stock < 10 ? "mid" : "");
      var value = stock * (p.promoPrice != null ? p.promoPrice : (p.price || 0));
      return (
        '<tr><td class="admin-cell-product"><img class="admin-product-thumb" src="' + escapeHtml(p.image || "") + '" alt=""><div><strong>' + escapeHtml(p.name) + '</strong></div></td>' +
        '<td>' + escapeHtml(CATEGORY_LABELS[p.page] || p.page) + '</td>' +
        '<td>' + stock + '</td>' +
        '<td><div class="admin-stock-bar"><div class="admin-stock-bar-fill ' + levelClass + '" style="width:' + pct + '%"></div></div></td>' +
        '<td>' + formatMAD(value) + '</td></tr>'
      );
    }).join("");
  }
  var stockSearchEl = document.querySelector("#stockSearch");
  if (stockSearchEl) stockSearchEl.addEventListener("input", renderStock);

  // ---------- Clients (CRM dérivé des commandes) ----------
  function buildClients() {
    var map = {};
    getOrders().forEach(function (o) {
      var key = (o.customer && o.customer.phone) || o.customer.name;
      if (!map[key]) map[key] = { name: o.customer.name, phone: o.customer.phone, city: o.customer.city, orders: [], total: 0, last: 0 };
      map[key].orders.push(o);
      map[key].total += o.subtotal || 0;
      if (o.date > map[key].last) map[key].last = o.date;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }
  function renderClients() {
    var clients = buildClients();
    clients.sort(function (a, b) { return b.total - a.total; });
    var total = clients.length;
    var vipCount = Math.ceil(total * 0.2);
    var loyalCount = clients.filter(function (c) { return c.orders.length >= 2; }).length;
    var totalSpent = clients.reduce(function (s, c) { return s + c.total; }, 0);
    document.querySelector("#clientsStatTotal").textContent = total;
    document.querySelector("#clientsStatVip").textContent = total ? vipCount : 0;
    document.querySelector("#clientsStatLoyal").textContent = loyalCount;
    document.querySelector("#clientsStatAvg").textContent = formatMAD(total ? Math.round(totalSpent / total) : 0);

    var searchInput = document.querySelector("#clientsSearch");
    var search = (searchInput ? searchInput.value : "").toLowerCase();
    var filtered = clients.filter(function (c) {
      if (!search) return true;
      return (c.name || "").toLowerCase().indexOf(search) !== -1 || (c.city || "").toLowerCase().indexOf(search) !== -1;
    });
    var tbody = document.querySelector("#clientsTableBody");
    if (!filtered.length) { tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="6">Aucun client pour le moment — les commandes passées sur le site apparaîtront ici.</td></tr>'; return; }
    tbody.innerHTML = filtered.map(function (c) {
      var isVip = clients.indexOf(c) < vipCount && c.total > 0;
      return (
        '<tr><td><strong>' + escapeHtml(c.name) + '</strong>' + (isVip ? ' <span class="admin-badge status-active">VIP</span>' : '') + '</td>' +
        '<td>' + escapeHtml(c.city || "—") + '</td>' +
        '<td>' + escapeHtml(c.phone || "—") + '</td>' +
        '<td>' + c.orders.length + '</td>' +
        '<td>' + formatMAD(c.total) + '</td>' +
        '<td>' + formatDate2(new Date(c.last)) + '</td></tr>'
      );
    }).join("");
  }
  var clientsSearchEl = document.querySelector("#clientsSearch");
  if (clientsSearchEl) clientsSearchEl.addEventListener("input", renderClients);

  // ---------- Livraisons (pipeline Kanban) ----------
  function renderLivraisons() {
    var orders = getOrders().slice().reverse();
    var groups = { pending: [], preparing: [], shipping: [], done: [] };
    orders.forEach(function (o) { if (groups[o.status]) groups[o.status].push(o); });
    function renderCol(list, elId, countId) {
      document.querySelector("#" + countId).textContent = list.length;
      var el = document.querySelector("#" + elId);
      if (!list.length) { el.innerHTML = '<p class="admin-kanban-empty">Aucune commande.</p>'; return; }
      el.innerHTML = list.map(function (o) {
        return '<div class="admin-kanban-card"><strong>' + escapeHtml(o.ref) + '</strong><span>' + escapeHtml(o.customer.name) + ' · ' + escapeHtml(o.customer.city) + '</span><span>' + formatMAD(o.subtotal) + '</span>' + orderDeleteBtnHtml(o.id) + '</div>';
      }).join("");
      bindOrderDeleteButtons(el);
    }
    renderCol(groups.pending, "kanbanPending", "kanbanCountPending");
    renderCol(groups.preparing, "kanbanPreparing", "kanbanCountPreparing");
    renderCol(groups.shipping, "kanbanShipping", "kanbanCountShipping");
    renderCol(groups.done, "kanbanDone", "kanbanCountDone");
  }

  // ---------- Paiements ----------
  var paiementsPieChart = null;
  registerChartDestroyer(function () { return paiementsPieChart; }, function (v) { paiementsPieChart = v; });
  function renderPaiements() {
    var orders = getOrders();
    var delivery = 0, showroom = 0, doneTotal = 0, pendingTotal = 0;
    orders.forEach(function (o) {
      var pay = (o.customer && o.customer.payment) || "";
      if (pay.indexOf("livraison") !== -1) delivery += o.subtotal || 0;
      else if (pay.toLowerCase().indexOf("showroom") !== -1) showroom += o.subtotal || 0;
      if (o.status === "done") doneTotal += o.subtotal || 0;
      else pendingTotal += o.subtotal || 0;
    });
    document.querySelector("#payDelivery").textContent = formatMAD(delivery);
    document.querySelector("#payShowroom").textContent = formatMAD(showroom);
    document.querySelector("#payDone").textContent = formatMAD(doneTotal);
    document.querySelector("#payPending").textContent = formatMAD(pendingTotal);

    var canvas = document.querySelector("#paiementsPieChart");
    if (canvas && typeof Chart !== "undefined") {
      var data = [delivery, showroom];
      if (paiementsPieChart) { paiementsPieChart.data.datasets[0].data = data; paiementsPieChart.update(); }
      else {
        paiementsPieChart = new Chart(canvas.getContext("2d"), {
          type: "doughnut",
          data: { labels: ["Livraison", "Showroom"], datasets: [{ data: data, backgroundColor: ["#00b074", "#00875a"], borderColor: chartCardBg(), borderWidth: 2 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: chartTickColor(), font: { size: 11 } } } } }
        });
      }
    }
  }

  // ---------- Showrooms ----------
  function renderShowrooms() {
    var orders = getOrders();
    function statsFor(city) {
      var list = orders.filter(function (o) { return o.customer && o.customer.city === city; });
      var rev = sumRevenue(list);
      return { revenue: rev, count: list.length, avg: list.length ? Math.round(rev / list.length) : 0 };
    }
    var t = statsFor("Tanger"), c = statsFor("Casablanca");
    document.querySelector("#srTangerRevenue").textContent = formatMAD(t.revenue);
    document.querySelector("#srTangerOrders").textContent = t.count;
    document.querySelector("#srTangerAvg").textContent = formatMAD(t.avg);
    document.querySelector("#srCasaRevenue").textContent = formatMAD(c.revenue);
    document.querySelector("#srCasaOrders").textContent = c.count;
    document.querySelector("#srCasaAvg").textContent = formatMAD(c.avg);
  }

  // ---------- Centre de notifications (vue complète) ----------
  function renderNotificationsFull() {
    var pendingOrders = getOrders().filter(function (o) { return o.status === "pending"; }).slice().reverse();
    var el1 = document.querySelector("#notifOrdersFull");
    if (el1) {
      if (!pendingOrders.length) el1.innerHTML = '<p class="admin-notif-empty">Aucune commande en attente.</p>';
      else {
        el1.innerHTML = pendingOrders.map(function (o) {
          return '<div class="admin-recent-item"><div class="who"><strong>' + escapeHtml(o.ref) + '</strong><span>' + escapeHtml(o.customer.name) + ' · ' + escapeHtml(o.customer.city) + '</span></div><div class="admin-recent-item-right"><span class="amount">' + formatMAD(o.subtotal) + '</span>' + orderDeleteBtnHtml(o.id) + '</div></div>';
        }).join("");
        bindOrderDeleteButtons(el1);
      }
    }
    var lowStock = getProducts().filter(function (p) { return !p.deleted && typeof p.stock === "number" && p.stock < STOCK_ALERT_THRESHOLD; });
    var el2 = document.querySelector("#notifStockFull");
    if (el2) {
      if (!lowStock.length) el2.innerHTML = '<p class="admin-notif-empty">Aucune alerte stock.</p>';
      else el2.innerHTML = lowStock.map(function (p) {
        return '<div class="admin-recent-item"><div class="who"><strong>' + escapeHtml(p.name) + '</strong><span>' + escapeHtml(CATEGORY_LABELS[p.page] || p.page) + '</span></div><span class="amount" style="color:var(--a-danger);">' + (p.stock <= 0 ? "Rupture" : p.stock + " restant(s)") + '</span></div>';
      }).join("");
    }
    var navBadge = document.querySelector("#notifNavBadge");
    if (navBadge) {
      var count = pendingOrders.length + lowStock.length;
      navBadge.hidden = count === 0;
      navBadge.textContent = count;
    }
  }

  // ---------- Import / Export (CSV réel) ----------
  function toCsv(rows) {
    return rows.map(function (row) {
      return row.map(function (cell) {
        var s = cell == null ? "" : String(cell);
        if (s.indexOf(",") !== -1 || s.indexOf('"') !== -1 || s.indexOf("\n") !== -1) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(",");
    }).join("\r\n");
  }
  function downloadCsv(filename, rows) {
    var csv = "﻿" + toCsv(rows);
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  var exportProductsBtn = document.querySelector("#exportProductsBtn");
  if (exportProductsBtn) exportProductsBtn.addEventListener("click", function () {
    var rows = [["Nom", "Catégorie", "Marque", "Prix vente", "Prix achat", "Bénéfice unitaire", "Prix promo", "Stock", "Statut"]];
    getProducts().forEach(function (p) {
      var unitMargin = p.costPrice != null ? p.price - p.costPrice : "";
      rows.push([p.name, CATEGORY_LABELS[p.page] || p.page, p.brand || "", p.price, p.costPrice != null ? p.costPrice : "", unitMargin, p.promoPrice || "", p.stock, p.deleted ? "Supprimé" : "Actif"]);
    });
    downloadCsv("produits.csv", rows);
    showToast("Export produits téléchargé.");
  });
  var exportOrdersBtn = document.querySelector("#exportOrdersBtn");
  if (exportOrdersBtn) exportOrdersBtn.addEventListener("click", function () {
    var rows = [["Référence", "Date", "Client", "Téléphone", "Ville", "Paiement", "Total", "Statut"]];
    getOrders().forEach(function (o) {
      rows.push([o.ref, o.dateLabel, o.customer.name, o.customer.phone, o.customer.city, o.customer.payment, o.subtotal, STATUS_LABELS[o.status] || o.status]);
    });
    downloadCsv("commandes.csv", rows);
    showToast("Export commandes téléchargé.");
  });
  var exportClientsBtn = document.querySelector("#exportClientsBtn");
  if (exportClientsBtn) exportClientsBtn.addEventListener("click", function () {
    var rows = [["Nom", "Ville", "Téléphone", "Commandes", "Total dépensé"]];
    buildClients().forEach(function (c) { rows.push([c.name, c.city, c.phone, c.orders.length, c.total]); });
    downloadCsv("clients.csv", rows);
    showToast("Export clients téléchargé.");
  });

  // ---------- Fournisseurs ----------
  var SUPPLIERS_KEY = "tc-admin-suppliers-v1";
  function getSuppliers() {
    try { return JSON.parse(localStorage.getItem(SUPPLIERS_KEY)) || []; } catch (e) { return []; }
  }
  function saveSuppliers(list) { try { localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(list)); } catch (e) {} }

  function renderSuppliers() {
    var list = getSuppliers();
    var body = document.querySelector("#supplierTableBody");
    var countEl = document.querySelector("#supplierCount");
    if (countEl) countEl.textContent = list.length + " fournisseur" + (list.length === 1 ? "" : "s");
    if (!body) return;
    if (!list.length) {
      body.innerHTML = '<tr class="admin-empty-row"><td colspan="5">Aucun fournisseur enregistré — ajoutez-en un ci-dessus.</td></tr>';
      return;
    }
    body.innerHTML = list.slice().reverse().map(function (s) {
      return (
        "<tr>" +
          "<td><strong>" + escapeHtml(s.name) + "</strong></td>" +
          "<td>" + escapeHtml(s.category || "—") + "</td>" +
          "<td>" + escapeHtml(s.contact || "—") + (s.phone ? "<br><span style='color:var(--a-muted); font-size:0.74rem;'>" + escapeHtml(s.phone) + "</span>" : "") + "</td>" +
          "<td>" + escapeHtml(s.leadTime || "—") + "</td>" +
          '<td><button type="button" class="admin-icon-btn danger" data-action="delete-supplier" data-id="' + escapeHtml(s.id) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>Supprimer</button></td>' +
        "</tr>"
      );
    }).join("");
    body.querySelectorAll('[data-action="delete-supplier"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("Supprimer ce fournisseur ?")) return;
        var updated = getSuppliers().filter(function (s) { return s.id !== btn.getAttribute("data-id"); });
        saveSuppliers(updated);
        renderSuppliers();
        showToast("Fournisseur supprimé.");
      });
    });
  }
  var supplierForm = document.querySelector("#supplierForm");
  if (supplierForm) {
    supplierForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.querySelector("#supName").value.trim();
      var status = document.querySelector("#supplierFormStatus");
      if (!name) { status.textContent = "Le nom de l'entreprise est requis."; status.classList.add("show"); return; }
      var list = getSuppliers();
      list.push({
        id: "sup-" + Date.now().toString(36),
        name: name,
        category: document.querySelector("#supCategory").value,
        contact: document.querySelector("#supContact").value.trim(),
        phone: document.querySelector("#supPhone").value.trim(),
        email: document.querySelector("#supEmail").value.trim(),
        leadTime: document.querySelector("#supLeadTime").value.trim(),
        notes: document.querySelector("#supNotes").value.trim(),
        createdAt: Date.now()
      });
      saveSuppliers(list);
      supplierForm.reset();
      status.textContent = "Fournisseur ajouté.";
      status.classList.add("show");
      renderSuppliers();
      showToast("Fournisseur ajouté.");
    });
  }

  panelRenderers.fournisseurs = renderSuppliers;

  // ---------- Codes promo (demande explicite) ----------
  // Table réelle promo_codes (voir api/admin/manage.js), appliqués en vrai au checkout
  // (voir api/checkout.js) -- pas une simulation locale.
  var promoCache = null;
  function refreshPromoCodesFromApi() {
    return fetch("/api/admin/manage?resource=promo-codes", { credentials: "same-origin" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) { promoCache = data ? data.promoCodes : []; return promoCache; })
      .catch(function () { return null; });
  }
  function formatPromoDiscount(p) {
    return p.discountType === "percent" ? p.discountValue + " %" : formatMAD(p.discountValue);
  }
  function renderPromoCodes() {
    var body = document.querySelector("#promoTableBody");
    var countEl = document.querySelector("#promoCount");
    if (!body) return;
    var list = promoCache || [];
    if (countEl) countEl.textContent = list.length + " code" + (list.length === 1 ? "" : "s");
    if (!list.length) {
      body.innerHTML = '<tr class="admin-empty-row"><td colspan="6">Aucun code promo -- créez-en un ci-dessus.</td></tr>';
      return;
    }
    body.innerHTML = list.map(function (p) {
      var usage = p.usedCount + (p.maxUses != null ? " / " + p.maxUses : " (illimité)");
      var expires = p.expiresAt ? formatDate2(new Date(p.expiresAt)) : "—";
      var expired = p.expiresAt && new Date(p.expiresAt).getTime() < Date.now();
      var statusLabel = !p.active
        ? '<span class="admin-data-badge pending">Désactivé</span>'
        : expired
          ? '<span class="admin-data-badge pending">Expiré</span>'
          : '<span class="admin-data-badge live">Actif</span>';
      return (
        "<tr><td><strong>" + escapeHtml(p.code) + "</strong></td><td>" + formatPromoDiscount(p) + "</td><td>" + usage +
        "</td><td>" + expires + "</td><td>" + statusLabel + '</td><td><div class="admin-row-actions">' +
        '<button type="button" class="admin-icon-btn" data-action="toggle-promo" data-id="' + escapeHtml(p.id) + '" data-active="' + p.active + '">' + (p.active ? "Désactiver" : "Activer") + "</button>" +
        '<button type="button" class="admin-icon-btn danger" data-action="delete-promo" data-id="' + escapeHtml(p.id) + '">Supprimer</button>' +
        "</div></td></tr>"
      );
    }).join("");

    body.querySelectorAll('[data-action="toggle-promo"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        fetch("/api/admin/manage?resource=promo-codes", {
          method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: btn.getAttribute("data-id"), active: btn.getAttribute("data-active") !== "true" })
        }).then(function () { return refreshPromoCodesFromApi(); }).then(renderPromoCodes)
          .catch(function () { showToast("Service momentanément indisponible."); });
      });
    });
    body.querySelectorAll('[data-action="delete-promo"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("Supprimer ce code promo ?")) return;
        fetch("/api/admin/manage?resource=promo-codes&id=" + encodeURIComponent(btn.getAttribute("data-id")), {
          method: "DELETE", credentials: "same-origin"
        }).then(function () { return refreshPromoCodesFromApi(); }).then(renderPromoCodes)
          .catch(function () { showToast("Service momentanément indisponible."); });
      });
    });
  }
  var promoForm = document.querySelector("#promoForm");
  if (promoForm) {
    promoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.querySelector("#promoFormStatus");
      status.classList.remove("show", "is-error");
      var payload = {
        code: document.querySelector("#promoCodeInput").value.trim(),
        discountType: document.querySelector("#promoType").value,
        discountValue: document.querySelector("#promoValue").value,
        maxUses: document.querySelector("#promoMaxUses").value,
        expiresAt: document.querySelector("#promoExpires").value || null
      };
      fetch("/api/admin/manage?resource=promo-codes", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
        .then(function (r) {
          if (!r.ok) { status.textContent = r.d.error || "Création impossible."; status.classList.add("show", "is-error"); return; }
          promoForm.reset();
          status.textContent = "Code promo créé.";
          status.classList.add("show");
          showToast("Code promo créé.");
          refreshPromoCodesFromApi().then(renderPromoCodes);
        })
        .catch(function () { status.textContent = "Service momentanément indisponible."; status.classList.add("show", "is-error"); });
    });
  }
  panelRenderers["promo-codes"] = function () { refreshPromoCodesFromApi().then(renderPromoCodes); };

  // ---------- IA & Recommandations (calculs réels, pas de prédiction inventée) ----------
  function renderIA() {
    var allOrders = getOrders().filter(function (o) { return o.status !== "cancelled"; });
    var now = Date.now();
    var day = 86400000;
    var last30 = allOrders.filter(function (o) { return o.date >= now - 30 * day; });
    var prev30 = allOrders.filter(function (o) { return o.date >= now - 60 * day && o.date < now - 30 * day; });
    var revLast30 = sumRevenue(last30), revPrev30 = sumRevenue(prev30);

    var trendEl = document.querySelector("#iaTrendBlock");
    if (trendEl) {
      if (!last30.length && !prev30.length) {
        trendEl.innerHTML = '<p style="color:var(--a-muted); font-size:0.88rem;">Pas encore assez de commandes pour calculer une tendance.</p>';
      } else if (!revPrev30) {
        trendEl.innerHTML = '<p style="color:var(--a-muted); font-size:0.88rem;">' + formatMAD(revLast30) + " sur les 30 derniers jours. Pas de données sur la période précédente pour comparer.</p>";
      } else {
        var pct = Math.round(((revLast30 - revPrev30) / revPrev30) * 100);
        var up = pct >= 0;
        trendEl.innerHTML =
          '<div style="display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;">' +
            '<span style="font-family:var(--a-ff-serif); font-size:2rem; color:var(--a-ink);">' + formatMAD(revLast30) + "</span>" +
            '<span style="font-weight:700; color:' + (up ? "var(--a-green)" : "var(--a-danger)") + ';">' + (up ? "▲" : "▼") + " " + Math.abs(pct) + "%</span>" +
            '<span style="color:var(--a-muted); font-size:0.84rem;">vs ' + formatMAD(revPrev30) + " sur la période précédente</span>" +
          "</div>";
      }
    }

    var restockBody = document.querySelector("#iaRestockBody");
    if (restockBody) {
      var suppliers = getSuppliers();
      var lowStock = getProducts().filter(function (p) { return !p.deleted && typeof p.stock === "number" && p.stock < STOCK_ALERT_THRESHOLD; });
      if (!lowStock.length) {
        restockBody.innerHTML = '<tr class="admin-empty-row"><td colspan="4">Aucun produit sous le seuil d\'alerte actuellement.</td></tr>';
      } else {
        restockBody.innerHTML = lowStock.map(function (p) {
          var catLabel = CATEGORY_LABELS[p.page] || p.page;
          var match = suppliers.filter(function (s) { return s.category === catLabel; });
          var supplierCell = match.length ? escapeHtml(match.map(function (s) { return s.name; }).join(", ")) : '<span style="color:var(--a-muted);">Aucun fournisseur enregistré pour « ' + escapeHtml(catLabel) + ' »</span>';
          return (
            "<tr><td><strong>" + escapeHtml(p.name) + "</strong></td><td>" + escapeHtml(catLabel) + '</td><td><span class="admin-stock-cell low">' +
            p.stock + "</span></td><td>" + supplierCell + "</td></tr>"
          );
        }).join("");
      }
    }

    var summaryEl = document.querySelector("#iaSummaryText");
    if (summaryEl) {
      var startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      var monthOrders = allOrders.filter(function (o) { return o.date >= startMonth; });
      var counts = {};
      monthOrders.forEach(function (o) { (o.items || []).forEach(function (i) { counts[i.name] = (counts[i.name] || 0) + i.qty; }); });
      var topName = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0];
      var lowStockCount = getProducts().filter(function (p) { return !p.deleted && typeof p.stock === "number" && p.stock < STOCK_ALERT_THRESHOLD; }).length;
      var parts = [];
      parts.push(monthOrders.length
        ? monthOrders.length + " commande" + (monthOrders.length > 1 ? "s" : "") + " réelle" + (monthOrders.length > 1 ? "s" : "") + " ce mois, pour " + formatMAD(sumRevenue(monthOrders)) + " de chiffre d'affaires."
        : "Aucune commande enregistrée ce mois-ci pour le moment.");
      if (topName) parts.push("Le produit le plus vendu ce mois est « " + topName + " ».");
      parts.push(lowStockCount
        ? lowStockCount + " référence" + (lowStockCount > 1 ? "s" : "") + " " + (lowStockCount > 1 ? "sont" : "est") + " sous le seuil d'alerte stock — voir le tableau ci-dessus."
        : "Aucune référence n'est actuellement sous le seuil d'alerte stock.");
      summaryEl.textContent = parts.join(" ");
    }
  }
  panelRenderers.ia = renderIA;

  // ---------- Éditeur visuel du site public (clic-pour-modifier, façon Canva/PowerPoint) ----------
  // Sélecteurs partagés avec js/main.js (voir plus bas dans ce fichier ET dans main.js) : gardez-les identiques,
  // sinon l'index d'un élément calculé ici ne correspondra plus à celui calculé côté site public.
  var EDITOR_PAGES = [
    ["index.html", "Accueil"],
    ["carrelage.html", "Carrelage"],
    ["sanitaire.html", "Sanitaire"],
    ["robinetterie.html", "Robinetterie"],
    ["mosaique-pierre.html", "Mosaïque & Pierre"],
    ["meubles-salle-de-bain.html", "Meubles de salle de bain"],
    ["miroirs-led.html", "Miroirs LED"],
    ["destockage.html", "Destockage"],
    ["showrooms.html", "Nos magasins"],
    ["a-propos.html", "À propos"],
    ["avis.html", "Avis clients"],
    ["contact.html", "Contact"]
  ];
  var PAGE_EDITS_KEY = "tc-admin-page-edits-v1";
  var GLOBAL_LOGO_KEY = "tc-admin-global-logo-v1";
  var EDIT_TEXT_SELECTOR = "main h1, main h2, main h3, main h4, main p, main li, main span.eyebrow";
  var EDIT_EXCLUDE_SELECTOR = ".product-card, .product-modal, .cart-drawer, .checkout-modal, form";

  // Synchronisation serveur (api/admin/page-edits.js) -- le localStorage local reste la
  // source utilisée en lecture par getPageEdits()/le reste du code ci-dessous (aperçu
  // instantané dans l'iframe, résilience hors-ligne), mais chaque écriture est aussi
  // envoyée au serveur pour que les visiteurs réels du site public (autre navigateur,
  // autre appareil) voient le même contenu -- voir js/main.js pour la lecture côté public.
  function refreshPageEditsFromApi() {
    return fetch("/api/admin/page-edits", { credentials: "same-origin" })
      .then(function (res) {
        if (res.status === 401 || !res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (!data) return null;
        try { localStorage.setItem(PAGE_EDITS_KEY, JSON.stringify(data.pages || {})); } catch (e) {}
        if (data.globalLogo) { try { localStorage.setItem(GLOBAL_LOGO_KEY, data.globalLogo); } catch (e) {} }
        return data;
      })
      .catch(function (err) {
        console.warn("Impossible de charger l'éditeur de contenu depuis l'API, secours localStorage :", err.message);
        return null;
      });
  }
  function syncPageEditsRemote(page, edits, logo) {
    var body = {};
    if (page && edits) { body.page = page; body.edits = edits; }
    if (logo) body.logo = logo;
    if (!body.page && !body.logo) return;
    fetch("/api/admin/page-edits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body)
    }).catch(function (err) {
      console.warn("Modification non synchronisée côté serveur (backend indisponible) :", err.message);
    });
  }
  function deletePageEditsRemote(page) {
    fetch("/api/admin/page-edits?page=" + encodeURIComponent(page), {
      method: "DELETE",
      credentials: "same-origin"
    }).catch(function (err) {
      console.warn("Réinitialisation non synchronisée côté serveur (backend indisponible) :", err.message);
    });
  }

  function tcEditableTextEls(doc) {
    return Array.prototype.filter.call(doc.querySelectorAll(EDIT_TEXT_SELECTOR), function (el) {
      return !el.closest(EDIT_EXCLUDE_SELECTOR);
    });
  }
  function tcEditableImgEls(doc) {
    return Array.prototype.filter.call(doc.querySelectorAll("main img"), function (el) {
      return !el.closest(EDIT_EXCLUDE_SELECTOR) && !el.classList.contains("brand-mark");
    });
  }
  function tcEditableBgEls(doc) {
    return Array.prototype.filter.call(doc.querySelectorAll('main [style*="background-image"]'), function (el) {
      return !el.closest(".product-card");
    });
  }
  // Petites icônes de contenu (fiches showroom, bandeau de confiance, cartes valeurs) --
  // volontairement PAS tous les SVG de la page (menu, panier, etc. restent hors édition).
  // Sélecteur identique à editableIconEls() dans js/main.js -- garder synchronisé.
  function tcEditableIconEls(doc) {
    return Array.prototype.filter.call(
      doc.querySelectorAll(".showroom-detail > svg, .trust-item > svg, .icon-badge > svg"),
      function (el) { return !el.closest(EDIT_EXCLUDE_SELECTOR); }
    );
  }

  var editorFrame = document.querySelector("#editorFrame");
  var editorPageSelect = document.querySelector("#editorPageSelect");
  var editorToggleBtn = document.querySelector("#editorToggleBtn");
  var editorSaveBtn = document.querySelector("#editorSaveBtn");
  var editorResetBtn = document.querySelector("#editorResetBtn");
  var editorPendingCountEl = document.querySelector("#editorPendingCount");
  var editorModeOn = false;
  var editorPendingEdits = {};
  var editorLogoChanged = null;
  var editorInitialised = false;
  var editorFrameLoaded = false;

  function getPageEdits() {
    try { return JSON.parse(localStorage.getItem(PAGE_EDITS_KEY)) || {}; } catch (e) { return {}; }
  }
  function savePageEdits(all) {
    try { localStorage.setItem(PAGE_EDITS_KEY, JSON.stringify(all)); } catch (e) {}
  }
  function currentEditorPage() { return editorPageSelect.value; }

  function updateEditorPendingUi() {
    var count = Object.keys(editorPendingEdits).length + (editorLogoChanged ? 1 : 0);
    if (editorSaveBtn) editorSaveBtn.disabled = count === 0;
    if (editorPendingCountEl) {
      editorPendingCountEl.hidden = count === 0;
      editorPendingCountEl.textContent = count;
    }
  }

  function tcResizeImageFile(file, maxWidth, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxWidth / img.width);
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  function promptImageReplace(callback) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) tcResizeImageFile(input.files[0], 1200, callback);
    });
    input.click();
  }

  function injectEditorStyles(doc) {
    if (doc.querySelector("#tc-editor-style")) return;
    var style = doc.createElement("style");
    style.id = "tc-editor-style";
    style.textContent =
      "body{padding-top:42px !important;}" +
      "[data-tc-editable-text]{outline:2px dashed rgba(0,176,116,.75); outline-offset:3px; cursor:text; transition:background .15s; background:rgba(0,176,116,.05);}" +
      "[data-tc-editable-text]:hover{background:rgba(0,176,116,.14);}" +
      "[data-tc-editable-text]:focus{outline:3px solid #00b074; background:rgba(0,176,116,.16);}" +
      ".tc-img-edit-wrap{position:relative;}" +
      ".tc-img-edit-btn{position:absolute; top:10px; right:10px; z-index:80; background:rgba(13,13,13,.85); color:#fff; border:1px solid rgba(255,255,255,.55); border-radius:999px; padding:7px 14px; font-size:.72rem; font-weight:600; letter-spacing:.02em; cursor:pointer; font-family:Inter,Arial,sans-serif; white-space:nowrap;}" +
      ".tc-img-edit-btn:hover{background:#00b074; border-color:#00b074;}" +
      ".tc-icon-edit-wrap{position:relative; display:inline-flex;}" +
      ".tc-icon-edit-btn{position:absolute; top:-8px; left:50%; transform:translateX(-50%); z-index:80; background:rgba(13,13,13,.9); color:#fff; border:1px solid rgba(255,255,255,.55); border-radius:999px; padding:3px 8px; font-size:.6rem; font-weight:600; cursor:pointer; font-family:Inter,Arial,sans-serif; white-space:nowrap; opacity:0; transition:opacity .15s;}" +
      ".tc-icon-edit-wrap:hover .tc-icon-edit-btn{opacity:1;}" +
      "#tc-color-popup{position:absolute; z-index:99998; display:none; background:#161616; border:1px solid rgba(255,255,255,.2); border-radius:8px; padding:6px; box-shadow:0 8px 24px rgba(0,0,0,.5);}" +
      "#tc-color-popup input[type=color]{width:34px; height:34px; padding:0; border:none; background:none; cursor:pointer;}";
    doc.head.appendChild(style);
  }

  // Popup couleur unique par iframe (pas un bouton par texte -- trop de textes sur une
  // page pour que ce soit lisible) : réapparaît positionné sur le texte actuellement
  // ciblé au clic (mousedown, avant que le blur ne se déclenche).
  function getColorPopup(doc) {
    var popup = doc.querySelector("#tc-color-popup");
    if (!popup) {
      popup = doc.createElement("div");
      popup.id = "tc-color-popup";
      var input = doc.createElement("input");
      input.type = "color";
      popup.appendChild(input);
      doc.body.appendChild(popup);
    }
    return popup;
  }

  function attachEditingHandlers() {
    var doc = editorFrame.contentDocument;
    if (!doc || !doc.body) return;
    injectEditorStyles(doc);
    var colorPopup = getColorPopup(doc);
    var colorInput = colorPopup.querySelector("input");

    tcEditableTextEls(doc).forEach(function (el, i) {
      el.setAttribute("contenteditable", "true");
      el.setAttribute("data-tc-editable-text", "");
      if (el._tcBound) return;
      el._tcBound = true;
      el.addEventListener("blur", function () {
        editorPendingEdits["text:" + i] = { type: "text", value: el.innerHTML };
        updateEditorPendingUi();
      });
      // mousedown (pas click) : se déclenche avant le blur de l'élément précédemment
      // édité, donc le popup reste toujours positionné sur le bon texte.
      el.addEventListener("mousedown", function () {
        var rect = el.getBoundingClientRect();
        colorPopup.style.display = "block";
        colorPopup.style.top = (rect.top + doc.defaultView.scrollY - 46) + "px";
        colorPopup.style.left = (rect.left + doc.defaultView.scrollX) + "px";
        var current = getComputedStyle(el).color;
        var hexMatch = current.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (hexMatch) {
          var toHex = function (n) { return ("0" + parseInt(n, 10).toString(16)).slice(-2); };
          colorInput.value = "#" + toHex(hexMatch[1]) + toHex(hexMatch[2]) + toHex(hexMatch[3]);
        }
        colorInput.oninput = function () {
          el.style.color = colorInput.value;
          editorPendingEdits["color:" + i] = { type: "color", value: colorInput.value };
          updateEditorPendingUi();
        };
      });
    });

    tcEditableImgEls(doc).forEach(function (el, i) {
      if (el._tcBound) return;
      el._tcBound = true;
      if (!el.parentElement.classList.contains("tc-img-edit-wrap")) {
        var wrap = doc.createElement("span");
        wrap.className = "tc-img-edit-wrap";
        wrap.style.display = getComputedStyle(el).display === "block" ? "block" : "inline-block";
        el.parentElement.insertBefore(wrap, el);
        wrap.appendChild(el);
      }
      var btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "tc-img-edit-btn";
      btn.textContent = "Changer la photo";
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        promptImageReplace(function (dataUrl) {
          el.src = dataUrl;
          editorPendingEdits["img:" + i] = { type: "img", value: dataUrl };
          updateEditorPendingUi();
        });
      });
      el.parentElement.appendChild(btn);
    });

    tcEditableBgEls(doc).forEach(function (el, i) {
      if (el._tcBgBound) return;
      el._tcBgBound = true;
      var btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "tc-img-edit-btn";
      btn.style.position = "absolute";
      btn.style.top = "16px";
      btn.style.right = "16px";
      btn.style.zIndex = "80";
      btn.textContent = "Changer la photo de fond";
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        promptImageReplace(function (dataUrl) {
          el.style.backgroundImage = "url('" + dataUrl + "')";
          editorPendingEdits["bg:" + i] = { type: "bg", value: dataUrl };
          updateEditorPendingUi();
        });
      });
      el.appendChild(btn);
    });

    tcEditableIconEls(doc).forEach(function (el, i) {
      if (el._tcBound) return;
      el._tcBound = true;
      if (!el.parentElement.classList.contains("tc-icon-edit-wrap")) {
        var wrap = doc.createElement("span");
        wrap.className = "tc-icon-edit-wrap";
        el.parentElement.insertBefore(wrap, el);
        wrap.appendChild(el);
      }
      var btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "tc-icon-edit-btn";
      btn.textContent = "Changer";
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        promptImageReplace(function (dataUrl) {
          el.style.display = "none";
          var img = el.nextElementSibling;
          if (!img || !img.classList || !img.classList.contains("tc-icon-override")) {
            img = doc.createElement("img");
            img.className = "tc-icon-override";
            img.alt = "";
            var cs = getComputedStyle(el);
            img.style.width = cs.width;
            img.style.height = cs.height;
            img.style.flexShrink = "0";
            img.style.objectFit = "contain";
            el.parentNode.insertBefore(img, el.nextSibling);
          }
          img.src = dataUrl;
          editorPendingEdits["icon:" + i] = { type: "icon", value: dataUrl };
          updateEditorPendingUi();
        });
      });
      el.parentElement.appendChild(btn);
    });

    // Logo (global — s'applique à toutes les pages, pas seulement celle-ci)
    Array.prototype.forEach.call(doc.querySelectorAll(".brand-mark"), function (el) {
      if (el._tcBound) return;
      el._tcBound = true;
      if (!el.parentElement.classList.contains("tc-img-edit-wrap")) {
        var wrap = doc.createElement("span");
        wrap.className = "tc-img-edit-wrap";
        wrap.style.display = "inline-block";
        el.parentElement.insertBefore(wrap, el);
        wrap.appendChild(el);
      }
      var btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "tc-img-edit-btn";
      btn.style.fontSize = "0.62rem";
      btn.style.padding = "5px 9px";
      btn.textContent = "Changer le logo (site entier)";
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        promptImageReplace(function (dataUrl) {
          Array.prototype.forEach.call(doc.querySelectorAll(".brand-mark"), function (logoEl) { logoEl.src = dataUrl; });
          editorLogoChanged = dataUrl;
          updateEditorPendingUi();
        });
      });
      el.parentElement.appendChild(btn);
    });
  }

  function injectEditorBanner(doc) {
    if (doc.querySelector("#tc-editor-banner")) return;
    var banner = doc.createElement("div");
    banner.id = "tc-editor-banner";
    banner.style.cssText =
      "position:fixed; top:0; left:0; right:0; z-index:99999; background:#00b074; color:#fff; text-align:center;" +
      "padding:10px 14px; font-family:Inter,Arial,sans-serif; font-size:0.82rem; font-weight:700; letter-spacing:.02em;" +
      "box-shadow:0 4px 16px rgba(0,0,0,.25);";
    banner.textContent = "✏️ MODE ÉDITION ACTIF — cliquez sur un texte pour le réécrire, cliquez « Changer la photo » sur une image";
    doc.body.insertBefore(banner, doc.body.firstChild);
  }
  function removeEditorBanner(doc) {
    var banner = doc && doc.querySelector && doc.querySelector("#tc-editor-banner");
    if (banner) banner.remove();
  }

  function doAttach() {
    var doc = editorFrame.contentDocument;
    if (!doc || !doc.body) return false;
    injectEditorBanner(doc);
    attachEditingHandlers();
    return true;
  }

  function enterEditMode() {
    editorModeOn = true;
    editorToggleBtn.classList.add("is-active");
    editorPendingEdits = {};
    editorLogoChanged = null;
    updateEditorPendingUi();
    if (editorFrameLoaded && doAttach()) {
      editorToggleBtn.textContent = "Quitter l'édition";
      editorToggleBtn.disabled = false;
      var textCount = tcEditableTextEls(editorFrame.contentDocument).length;
      showToast("Mode édition activé — " + textCount + " zones de texte modifiables sur cette page.");
      return;
    }
    // La page dans l'aperçu n'a pas encore fini de charger : on patiente au lieu de ne rien faire.
    editorToggleBtn.textContent = "Chargement de la page…";
    editorToggleBtn.disabled = true;
    var attempts = 0;
    var waitId = setInterval(function () {
      attempts++;
      if (!editorModeOn) { clearInterval(waitId); return; }
      if (doAttach()) {
        clearInterval(waitId);
        editorToggleBtn.textContent = "Quitter l'édition";
        editorToggleBtn.disabled = false;
        showToast("Mode édition activé.");
      } else if (attempts > 40) {
        clearInterval(waitId);
        editorToggleBtn.textContent = "Activer l'édition";
        editorToggleBtn.disabled = false;
        editorModeOn = false;
        showToast("La page n'a pas pu charger — vérifiez votre connexion et réessayez.");
      }
    }, 150);
  }
  function exitEditMode() {
    editorModeOn = false;
    editorToggleBtn.textContent = "Activer l'édition";
    editorToggleBtn.disabled = false;
    editorToggleBtn.classList.remove("is-active");
    editorPendingEdits = {};
    editorLogoChanged = null;
    updateEditorPendingUi();
    if (editorFrame.contentDocument) removeEditorBanner(editorFrame.contentDocument);
  }
  function saveCurrentEdits() {
    var all = getPageEdits();
    var page = currentEditorPage();
    var merged = all[page] || {};
    for (var k in editorPendingEdits) merged[k] = editorPendingEdits[k];
    all[page] = merged;
    savePageEdits(all);
    if (editorLogoChanged) { try { localStorage.setItem(GLOBAL_LOGO_KEY, editorLogoChanged); } catch (e) {} }
    syncPageEditsRemote(page, merged, editorLogoChanged);
    editorPendingEdits = {};
    editorLogoChanged = null;
    updateEditorPendingUi();
    showToast("Modifications enregistrées — visibles sur le site public pour tous les visiteurs.");
  }
  function resetCurrentPageEdits() {
    var all = getPageEdits();
    delete all[currentEditorPage()];
    savePageEdits(all);
    deletePageEditsRemote(currentEditorPage());
    showToast("Page réinitialisée.");
    editorFrame.contentWindow.location.reload();
  }

  function renderEditor() {
    if (editorInitialised) return;
    editorInitialised = true;
    EDITOR_PAGES.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p[0];
      opt.textContent = p[1];
      editorPageSelect.appendChild(opt);
    });
    editorFrameLoaded = false;
    editorFrame.src = "../" + EDITOR_PAGES[0][0];
    editorPageSelect.addEventListener("change", function () {
      exitEditMode();
      editorFrameLoaded = false;
      editorFrame.src = "../" + currentEditorPage();
    });
    editorToggleBtn.addEventListener("click", function () {
      if (editorModeOn) exitEditMode(); else enterEditMode();
    });
    editorSaveBtn.addEventListener("click", saveCurrentEdits);
    editorResetBtn.addEventListener("click", resetCurrentPageEdits);
    editorFrame.addEventListener("load", function () {
      editorFrameLoaded = true;
      if (editorModeOn) doAttach();
    });
  }

  // ---------- Médiathèque (toutes les photos d'ambiance du site, regroupées en un seul endroit) ----------
  // Réutilise le même mécanisme de stockage que l'Éditeur visuel (PAGE_EDITS_KEY / GLOBAL_LOGO_KEY,
  // mêmes index tcEditableImgEls/tcEditableBgEls) : les deux vues restent parfaitement compatibles.
  var mediaScanFrame = null;
  var mediaLibraryBound = false;
  var mediaLibraryScanned = false;

  function scanMediaLibrary() {
    var statusEl = document.querySelector("#mediaGalleryStatus");
    var groupsEl = document.querySelector("#mediaGalleryGroups");
    if (!groupsEl) return;
    groupsEl.innerHTML = "";
    if (statusEl) { statusEl.hidden = false; statusEl.textContent = "Analyse des pages du site…"; }

    if (!mediaScanFrame) {
      mediaScanFrame = document.createElement("iframe");
      mediaScanFrame.setAttribute("aria-hidden", "true");
      mediaScanFrame.style.cssText = "position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; left:-9999px; top:-9999px;";
      document.body.appendChild(mediaScanFrame);
    }

    var results = [];
    var pageIndex = 0;

    function scanNextPage() {
      if (pageIndex >= EDITOR_PAGES.length) { finishScan(); return; }
      var entry = EDITOR_PAGES[pageIndex];
      var page = entry[0], label = entry[1];
      if (statusEl) statusEl.textContent = "Analyse de « " + label + " »… (" + (pageIndex + 1) + "/" + EDITOR_PAGES.length + ")";
      var handled = false;
      function onLoaded() {
        if (handled) return;
        handled = true;
        mediaScanFrame.removeEventListener("load", onLoaded);
        var doc = mediaScanFrame.contentDocument;
        if (doc) {
          tcEditableImgEls(doc).forEach(function (el, i) {
            results.push({ page: page, pageLabel: label, type: "img", index: i, src: el.src, alt: el.alt || "" });
          });
          tcEditableBgEls(doc).forEach(function (el, i) {
            // getComputedStyle résout l'URL en absolu (contrairement à el.style.backgroundImage,
            // qui reste relatif à la page d'origine — invalide une fois affiché dans l'admin).
            var computed = doc.defaultView.getComputedStyle(el).backgroundImage;
            var m = /url\((['"]?)(.*?)\1\)/.exec(computed || "");
            results.push({ page: page, pageLabel: label, type: "bg", index: i, src: m ? m[2] : "", alt: "Photo de fond" });
          });
        }
        pageIndex++;
        scanNextPage();
      }
      mediaScanFrame.addEventListener("load", onLoaded);
      mediaScanFrame.src = "../" + page;
    }

    function finishScan() {
      if (statusEl) statusEl.hidden = true;
      renderMediaGroups(results);
    }

    scanNextPage();
  }

  function renderMediaGroups(results) {
    var groupsEl = document.querySelector("#mediaGalleryGroups");
    if (!groupsEl) return;
    if (!results.length) {
      groupsEl.innerHTML = '<div class="admin-card" style="text-align:center; color:var(--a-muted);">Aucune photo d’ambiance modifiable trouvée.</div>';
      return;
    }
    var byPage = {};
    results.forEach(function (r) { (byPage[r.page] = byPage[r.page] || []).push(r); });
    var html = EDITOR_PAGES.filter(function (entry) { return byPage[entry[0]] && byPage[entry[0]].length; }).map(function (entry) {
      var page = entry[0], label = entry[1];
      var items = byPage[page];
      var tiles = items.map(function (r) {
        return '<div class="admin-media-tile" data-page="' + escapeHtml(r.page) + '" data-type="' + r.type + '" data-index="' + r.index + '">' +
          '<img src="' + escapeHtml(r.src) + '" alt="' + escapeHtml(r.alt) + '">' +
          '<button type="button" class="admin-media-tile-btn">Changer la photo</button>' +
          "</div>";
      }).join("");
      return '<div class="admin-media-page-group"><h3>' + escapeHtml(label) + '</h3><p class="hint">' + items.length + " photo(s) modifiable(s)</p>" +
        '<div class="admin-media-grid">' + tiles + "</div></div>";
    }).join("");
    groupsEl.innerHTML = html;

    groupsEl.querySelectorAll(".admin-media-tile").forEach(function (tile) {
      var btn = tile.querySelector(".admin-media-tile-btn");
      var img = tile.querySelector("img");
      btn.addEventListener("click", function () {
        var page = tile.getAttribute("data-page");
        var type = tile.getAttribute("data-type");
        var index = tile.getAttribute("data-index");
        promptImageReplace(function (dataUrl) {
          var all = getPageEdits();
          var merged = all[page] || {};
          merged[type + ":" + index] = { type: type, value: dataUrl };
          all[page] = merged;
          savePageEdits(all);
          syncPageEditsRemote(page, merged, null);
          img.src = dataUrl;
          showToast("Photo mise à jour — visible sur le site public pour tous les visiteurs.");
        });
      });
    });
  }

  function renderMediaLibrary() {
    var refreshBtn = document.querySelector("#mediaRefreshBtn");
    var groupsEl = document.querySelector("#mediaGalleryGroups");
    var logoImg = document.querySelector("#mediaLogoTile img");
    var logoBtn = document.querySelector("#mediaLogoTile .admin-media-tile-btn");
    if (!groupsEl) return;

    if (!mediaLibraryBound) {
      mediaLibraryBound = true;
      if (refreshBtn) refreshBtn.addEventListener("click", scanMediaLibrary);
      if (logoBtn) {
        logoBtn.addEventListener("click", function () {
          promptImageReplace(function (dataUrl) {
            try { localStorage.setItem(GLOBAL_LOGO_KEY, dataUrl); } catch (e) {}
            syncPageEditsRemote(null, null, dataUrl);
            logoImg.src = dataUrl;
            showToast("Logo mis à jour sur tout le site, pour tous les visiteurs.");
          });
        });
      }
    }

    var savedLogo = null;
    try { savedLogo = localStorage.getItem(GLOBAL_LOGO_KEY); } catch (e) {}
    if (logoImg) logoImg.src = savedLogo || "../assets/logo.svg";

    if (!mediaLibraryScanned) {
      mediaLibraryScanned = true;
      scanMediaLibrary();
    }
  }

  // ---------- QR Codes ----------
  function localPhoneToIntl(local) {
    var digits = (local || "").replace(/\D/g, "");
    if (digits.charAt(0) === "0") digits = digits.slice(1);
    return "+212" + digits;
  }
  function qrPresetValue(key) {
    var s = getSettings();
    switch (key) {
      case "tel1": return "tel:" + localPhoneToIntl(s.tangerPhone1);
      case "tel2": return "tel:" + localPhoneToIntl(s.tangerPhone2);
      case "telcasa": return "tel:" + localPhoneToIntl(s.casaPhone);
      case "whatsapp": return "https://wa.me/212653775609";
      case "email": return "mailto:tangercarreaux1@gmail.com";
      case "instagram": return "https://www.instagram.com/tangercarreaux";
      default: return "";
    }
  }
  // Racine du site déduite de l'URL courante de l'admin (fonctionne en local, sur un
  // hébergement de test ou une fois le site en ligne sur un vrai nom de domaine).
  function siteBaseUrl() {
    var href = location.href;
    var m = href.match(/^(.*\/)admin\/[^/?#]*/);
    return m ? m[1] : href.replace(/[^/]*$/, "");
  }
  function productDeepLink(p) {
    return siteBaseUrl() + p.page + "?produit=" + encodeURIComponent(p.id);
  }
  function fillQrProductPicker(selectEl) {
    var previous = selectEl.value;
    var products = getProducts().filter(function (p) { return !p.deleted; });
    var byPage = {};
    products.forEach(function (p) { (byPage[p.page] = byPage[p.page] || []).push(p); });
    var pages = Object.keys(byPage).sort(function (a, b) {
      return (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b);
    });
    if (!products.length) {
      selectEl.innerHTML = '<option value="">Aucun produit actif au catalogue</option>';
      return;
    }
    selectEl.innerHTML = pages.map(function (page) {
      var opts = byPage[page]
        .slice()
        .sort(function (a, b) { return a.name.localeCompare(b.name); })
        .map(function (p) { return '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + "</option>"; })
        .join("");
      return '<optgroup label="' + escapeHtml(CATEGORY_LABELS[page] || page) + '">' + opts + "</optgroup>";
    }).join("");
    var stillExists = products.some(function (p) { return p.id === previous; });
    if (stillExists) selectEl.value = previous;
  }
  function renderQrPanel() {
    var presetEl = document.querySelector("#qrPreset");
    var valueEl = document.querySelector("#qrValue");
    var sizeEl = document.querySelector("#qrSize");
    var previewEl = document.querySelector("#qrPreview");
    var downloadBtn = document.querySelector("#qrDownloadBtn");
    var emptyHint = document.querySelector("#qrEmptyHint");
    var form = document.querySelector("#qrForm");
    var productField = document.querySelector("#qrProductField");
    var productPicker = document.querySelector("#qrProductPicker");
    if (!form) return;

    if (productPicker) fillQrProductPicker(productPicker);

    function applyProductValue() {
      if (!productPicker || !productPicker.value) return;
      var product = getProducts().filter(function (p) { return !p.deleted; }).find(function (p) { return p.id === productPicker.value; });
      if (product) valueEl.value = productDeepLink(product);
    }

    if (!form.dataset.qrBound) {
      form.dataset.qrBound = "1";
      presetEl.addEventListener("change", function () {
        var isProduct = presetEl.value === "product";
        if (productField) productField.hidden = !isProduct;
        if (isProduct) applyProductValue();
        else valueEl.value = presetEl.value === "custom" ? "" : qrPresetValue(presetEl.value);
        valueEl.focus();
      });
      if (productPicker) productPicker.addEventListener("change", applyProductValue);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = valueEl.value.trim();
        if (!text) { valueEl.focus(); return; }
        var size = parseInt(sizeEl.value, 10) || 256;
        previewEl.innerHTML = "";
        new QRCode(previewEl, {
          text: text,
          width: size,
          height: size,
          colorDark: "#101210",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
        if (emptyHint) emptyHint.hidden = true;
        if (downloadBtn) downloadBtn.disabled = false;
      });
      if (downloadBtn) {
        downloadBtn.addEventListener("click", function () {
          var canvas = previewEl.querySelector("canvas");
          if (!canvas) return;
          var link = document.createElement("a");
          var product = productPicker && presetEl.value === "product"
            ? getProducts().find(function (p) { return p.id === productPicker.value; })
            : null;
          link.download = product ? "qr-" + product.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".png" : "qr-code-tanger-carreaux.png";
          link.href = canvas.toDataURL("image/png");
          link.click();
        });
      }
    }
    if (productField) productField.hidden = presetEl.value !== "product";
    if (presetEl.value === "product") { if (!valueEl.value) applyProductValue(); }
    else if (presetEl && valueEl && !valueEl.value) valueEl.value = qrPresetValue(presetEl.value);
  }

  panelRenderers.editeur = renderEditor;
  panelRenderers.mediatheque = renderMediaLibrary;
  panelRenderers.qrcode = renderQrPanel;
  panelRenderers.dashboard = renderDashboard;
  panelRenderers.orders = renderOrders;

  panelRenderers.ventes = renderVentes;
  panelRenderers.stock = renderStock;
  panelRenderers.clients = renderClients;
  panelRenderers.livraisons = renderLivraisons;
  panelRenderers.paiements = renderPaiements;
  panelRenderers.showrooms = renderShowrooms;
  panelRenderers.notifications = renderNotificationsFull;
  panelRenderers.catalog = function () { renderCatalog(); renderCatalogStats(); };

  // ---------- Export du catalogue en PDF (demande explicite) ----------
  // 100% côté client (jsPDF + autotable, voir index.html) -- pas de nouvel endpoint
  // serveur. Regroupe par catégorie réelle (CATEGORY_LABELS), dans le même ordre que la
  // nav du site public. N'inclut jamais un produit supprimé (p.deleted).
  var exportCatalogPdfBtn = document.querySelector("#exportCatalogPdfBtn");
  if (exportCatalogPdfBtn) {
    exportCatalogPdfBtn.addEventListener("click", function () {
      if (typeof window.jspdf === "undefined") { showToast("Module PDF non chargé -- vérifiez votre connexion."); return; }
      var products = getProducts().filter(function (p) { return !p.deleted; });
      if (!products.length) { showToast("Aucun produit à exporter."); return; }

      var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
      var pageWidth = doc.internal.pageSize.getWidth();
      var margin = 40;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 135, 90);
      doc.text("Tanger Carreaux", margin, 50);
      doc.setFontSize(12);
      doc.setTextColor(90, 90, 90);
      doc.setFont("helvetica", "normal");
      doc.text("Catalogue produits -- " + formatDate2(new Date()), margin, 68);
      doc.setFontSize(9);
      doc.text("Tanger : Avenue Moulay Youssef -- Casablanca : Route de Mediouna, km 12", margin, 82);
      doc.text("Prix indicatifs, hors pose -- confirmés en showroom.", margin, 94);

      var cursorY = 118;
      var pageKeys = Object.keys(CATEGORY_LABELS).filter(function (page) {
        return products.some(function (p) { return p.page === page; });
      });
      pageKeys.forEach(function (page) {
        var rows = products.filter(function (p) { return p.page === page; }).map(function (p) {
          var priceLabel = p.price == null ? "Sur devis" : formatMAD(p.promoPrice != null ? p.promoPrice : p.price) + (p.unit ? " / " + p.unit : "");
          return [p.tag || "", p.name, priceLabel];
        });
        if (cursorY > 700) { doc.addPage(); cursorY = 50; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(20, 20, 20);
        doc.text(CATEGORY_LABELS[page], margin, cursorY);
        doc.autoTable({
          startY: cursorY + 8,
          head: [["Gamme", "Produit", "Prix"]],
          body: rows,
          margin: { left: margin, right: margin },
          styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
          headStyles: { fillColor: [0, 135, 90], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 248, 246] }
        });
        cursorY = doc.lastAutoTable.finalY + 26;
      });

      var pageCount = doc.internal.getNumberOfPages();
      for (var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Tanger Carreaux -- " + i + " / " + pageCount, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: "right" });
      }

      doc.save("tanger-carreaux-catalogue-" + new Date().toISOString().slice(0, 10) + ".pdf");
      showToast("Catalogue exporté en PDF.");
    });
  }

  // ---------- Authentification admin + Initialisation ----------
  var adminLoginScreen = document.querySelector("#adminLoginScreen");
  var adminShell = document.querySelector("#adminShell");
  var adminLoginForm = document.querySelector("#adminLoginForm");

  function showAdminShell() {
    if (adminLoginScreen) adminLoginScreen.setAttribute("aria-hidden", "true");
    if (adminLoginScreen) adminLoginScreen.style.display = "none";
    if (adminShell) adminShell.hidden = false;
  }
  function showAdminLoginScreen() {
    if (adminShell) adminShell.hidden = true;
    if (adminLoginScreen) {
      adminLoginScreen.style.display = "";
      adminLoginScreen.setAttribute("aria-hidden", "false");
    }
  }

  function startAdminApp() {
    showAdminShell();
    getProducts();
    fillSettingsForm();
    renderDashboard();
    renderOrders();
    renderCatalog();
    renderCatalogStats();
  }

  // Ouvert directement en local (double-clic sur le fichier, file://) : aucune API
  // n'est joignable dans ce contexte, donc jamais d'écran de connexion -- accès direct
  // au tableau de bord (données locales uniquement). Voir aussi accountForm plus haut.
  // Sur le vrai site déployé : l'écran de connexion protège l'accès (compte manager
  // requis, voir api/auth/admin.js). Toute panne réseau/DB une fois connecté ne
  // redonne jamais cet écran (authRequired ne passe à true que sur un vrai 401).
  function bootstrapAdmin() {
    if (location.protocol === "file:") { startAdminApp(); return; }
    Promise.all([refreshOrdersFromApi(), refreshPageEditsFromApi()]).then(function () {
      if (authRequired) { showAdminLoginScreen(); return; }
      startAdminApp();
    });
  }

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.querySelector("#loginStatus");
      status.classList.remove("is-error");
      var email = document.querySelector("#loginEmail").value.trim();
      var password = document.querySelector("#loginPassword").value;
      fetch("/api/auth/admin?action=login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (!r.ok) {
            status.textContent = r.data.error || "Connexion impossible.";
            status.classList.add("show", "is-error");
            return;
          }
          authRequired = false;
          adminLoginForm.reset();
          bootstrapAdmin();
        })
        .catch(function () {
          status.textContent = "Service momentanément indisponible -- réessaie plus tard.";
          status.classList.add("show", "is-error");
        });
    });
  }

  bootstrapAdmin();
});
