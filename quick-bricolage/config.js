/* =========================================================
   QUICK BRICOLAGE — CONFIGURATION
   Modifiez UNIQUEMENT ce fichier pour changer les infos.
   Tout ce qui est marqué « à compléter » doit être vérifié
   (demander à papa) avant la mise en ligne.
   ========================================================= */
window.QB_CONFIG = {
  nom: "Quick Bricolage",
  site: "quickbricolage.ma",

  // Numéro WhatsApp au format international SANS + ni espaces, ex : "212600000000"
  // À COMPLÉTER. Laissé vide : WhatsApp s'ouvre et le client choisit le destinataire.
  whatsapp: "",

  // Numéro d'appel (affiché + bouton « Appeler »)
  // À CONFIRMER : numéro de la boutique, même entreprise ?
  telephone: "0522592206",
  telephoneAffiche: "05 22 59 22 06",

  email: "", // à compléter
  villes: [], // à compléter, ex : ["Casablanca", "Bouskoura"]
  horaires: "", // à compléter, ex : "Lun–Sam 8h30–19h"

  boutique: {
    afficher: true, // À CONFIRMER : même entreprise ? Mettre false sinon.
    nom: "Quick Bricolage",
    adresse: "Lot 95, Parc industriel de Bouskoura (CFCIM – Sogepib), local n°3, Bouskoura",
    mapsQuery: "Parc industriel Bouskoura CFCIM Sogepib",
    horaires: "" // à compléter
  },

  // Services : id (ne pas changer après mise en ligne), icône (emoji), libellés FR / AR / Darija
  services: [
    { id: "chauffe-eau", icone: "🔥", fr: "Installation chauffe-eau", ar: "تركيب سخان الماء", da: "Trkib chauffe-eau" },
    { id: "clim", icone: "❄️", fr: "Installation climatiseur", ar: "تركيب المكيف", da: "Trkib climatiseur" },
    { id: "filtration", icone: "💧", fr: "Filtration d'eau", ar: "تصفية الماء", da: "Filtrage dyal lma" },
    { id: "plomberie", icone: "🔧", fr: "Plomberie", ar: "السباكة", da: "Plombri" },
    { id: "electromenager", icone: "🔌", fr: "Électroménager", ar: "الأجهزة المنزلية", da: "Électroménager" },
    { id: "domotique", icone: "🏠", fr: "Domotique", ar: "المنزل الذكي", da: "Domotique" },
    { id: "renovation", icone: "🧱", fr: "Rénovation", ar: "الترميم والإصلاح", da: "Tjdid dar" },
    { id: "equipement", icone: "🛠️", fr: "Équipement maison", ar: "تجهيز المنزل", da: "Tjhiz dar" }
  ],

  // FAQ — À COMPLÉTER / VALIDER avec papa (aucune promesse de prix ni de délai ici)
  faq: [
    { fr: { q: "Comment envoyer ma demande ?", r: "Remplissez les 4 étapes, puis appuyez sur « Envoyer sur WhatsApp ». Le message est déjà rédigé, il suffit de l'envoyer." },
      ar: { q: "كيف أرسل طلبي؟", r: "املأ الخطوات الأربع ثم اضغط على « إرسال عبر واتساب ». الرسالة جاهزة، يكفي إرسالها." },
      da: { q: "Kifach nsifet talab dyali ?", r: "3mmer l'4 étapes, o dghet 3la « Sifet f WhatsApp ». Lmessage wajd, ghir sifto." } },
    { fr: { q: "Comment envoyer une photo du problème ?", r: "Après l'ouverture de WhatsApp, envoyez le message, puis joignez la photo avec le trombone 📎 ou l'appareil photo." },
      ar: { q: "كيف أرسل صورة المشكل؟", r: "بعد فتح واتساب، أرسل الرسالة ثم أرفق الصورة عبر 📎 أو الكاميرا." },
      da: { q: "Kifach nsifet tswira ?", r: "Mli ytl3 WhatsApp, sifet lmessage, o zid tswira b 📎 wla camera." } },
    { fr: { q: "Quels sont les tarifs ?", r: "À compléter." }, ar: { q: "ما هي الأسعار؟", r: "سيتم التحديد لاحقاً." }, da: { q: "Ch7al taman ?", r: "À compléter." } },
    { fr: { q: "Quelles villes sont couvertes ?", r: "À compléter." }, ar: { q: "ما هي المدن المغطاة؟", r: "سيتم التحديد لاحقاً." }, da: { q: "Fin khdamin ?", r: "À compléter." } }
  ]
};
