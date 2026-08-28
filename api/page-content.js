// GET /api/page-content?page=index.html -- lecture PUBLIQUE (sans authentification) des
// modifications de texte/image enregistrées depuis l'Éditeur visuel admin, pour que TOUS les
// visiteurs du site voient les mêmes changements -- pas seulement le navigateur du manager qui
// les a faites (limite du localStorage seul, voir db/schema.sql). Contenu non sensible : mêmes
// textes/images que ceux déjà publiés en dur dans le HTML, donc pas de session requise ici.
// Appelé depuis js/main.js pour compléter (et faire autorité sur) l'application locale
// instantanée basée sur localStorage.
const { sql } = require("../lib/db");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  var page = req.query && req.query.page;
  var edits = {};
  if (page) {
    var rows = await sql`SELECT edit_key, edit_type, value FROM site_content_edits WHERE page = ${page}`;
    rows.forEach(function (r) { edits[r.edit_key] = { type: r.edit_type, value: r.value }; });
  }
  var logoRows = await sql`SELECT value FROM site_settings WHERE key = 'global_logo'`;

  // Cache court côté CDN Vercel : les visites successives ne retapent pas la base à chaque
  // fois, tout en gardant les changements de l'admin visibles en moins d'une minute.
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  return res.status(200).json({ edits: edits, globalLogo: logoRows[0] ? logoRows[0].value : null });
};
