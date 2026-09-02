// GET    /api/admin/page-edits        -- toutes les modifications enregistrées (texte/image
//                                        par page + logo global), pour charger l'Éditeur visuel
//                                        et la Médiathèque à l'ouverture. Remplace la lecture
//                                        localStorage tc-admin-page-edits-v1 seule -- voir
//                                        refreshPageEditsFromApi() dans admin/admin.js.
// PUT    /api/admin/page-edits        -- { page?, edits?: {key:{type,value}}, logo? } --
//                                        enregistre (upsert) les modifications d'UNE page et/ou
//                                        le logo global si fourni. Remplace saveCurrentEdits()/
//                                        savePageEdits() côté serveur (le localStorage reste en
//                                        plus, pour un retour instantané dans l'aperçu et un
//                                        secours hors-ligne).
// DELETE /api/admin/page-edits?page=X -- supprime toutes les modifications de la page X
//                                        (bouton "Réinitialiser cette page").
const { sql } = require("../../lib/db");
const { requireAdmin } = require("../../lib/auth");

var VALID_TYPES = { text: true, img: true, bg: true, color: true, icon: true };

module.exports = async function handler(req, res) {
  var session = requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    var rows = await sql`SELECT page, edit_key, edit_type, value FROM site_content_edits`;
    var pages = {};
    rows.forEach(function (r) {
      pages[r.page] = pages[r.page] || {};
      pages[r.page][r.edit_key] = { type: r.edit_type, value: r.value };
    });
    var logoRows = await sql`SELECT value FROM site_settings WHERE key = 'global_logo'`;
    return res.status(200).json({ pages: pages, globalLogo: logoRows[0] ? logoRows[0].value : null });
  }

  if (req.method === "PUT") {
    var body = req.body || {};

    if (body.page && body.edits && typeof body.edits === "object") {
      var keys = Object.keys(body.edits);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var edit = body.edits[key] || {};
        if (!VALID_TYPES[edit.type] || typeof edit.value !== "string") continue;
        await sql`
          INSERT INTO site_content_edits (page, edit_key, edit_type, value, updated_at)
          VALUES (${body.page}, ${key}, ${edit.type}, ${edit.value}, now())
          ON CONFLICT (page, edit_key) DO UPDATE SET
            edit_type = EXCLUDED.edit_type, value = EXCLUDED.value, updated_at = now()
        `;
      }
    }

    if (typeof body.logo === "string" && body.logo) {
      await sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES ('global_logo', ${body.logo}, now())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      `;
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    var page = req.query && req.query.page;
    if (!page) return res.status(400).json({ error: "Paramètre page requis." });
    await sql`DELETE FROM site_content_edits WHERE page = ${page}`;
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ error: "Méthode non autorisée." });
};
