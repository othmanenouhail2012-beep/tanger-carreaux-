// GET    /api/admin/manage?resource=promo-codes         -- liste tous les codes promo
// POST   /api/admin/manage?resource=promo-codes         -- crée un code promo
// PATCH  /api/admin/manage?resource=promo-codes         -- { id, ...champs } modifie un code
// DELETE /api/admin/manage?resource=promo-codes         -- { id } (query ou body) supprime un code
//
// Petit hub d'administration générique par ressource (?resource=...), pour rester sous
// la limite de 12 fonctions serverless du forfait Vercel Hobby plutôt que créer un
// fichier par nouvelle fonctionnalité admin (voir api/auth/admin.js pour le même choix
// appliqué aux comptes). Une seule ressource pour l'instant (promo-codes), pensé pour en
// accueillir d'autres sans nouveau fichier.
const { sql } = require("../../lib/db");
const { requireAdmin } = require("../../lib/auth");

var promoTableReady = false;
async function ensurePromoTable() {
  if (promoTableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code           TEXT NOT NULL UNIQUE,
      discount_type  TEXT NOT NULL,
      discount_value NUMERIC(10, 2) NOT NULL,
      active         BOOLEAN NOT NULL DEFAULT true,
      max_uses       INTEGER,
      used_count     INTEGER NOT NULL DEFAULT 0,
      expires_at     TIMESTAMPTZ,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  promoTableReady = true;
}

function publicPromo(row) {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    active: row.active,
    maxUses: row.max_uses,
    usedCount: row.used_count,
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}

async function handlePromoCodes(req, res) {
  await ensurePromoTable();
  var session = requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    var rows = await sql`SELECT * FROM promo_codes ORDER BY created_at DESC`;
    return res.status(200).json({ promoCodes: rows.map(publicPromo) });
  }

  if (req.method === "POST") {
    var body = req.body || {};
    var code = body.code ? String(body.code).trim().toUpperCase() : "";
    var discountType = body.discountType === "fixed" ? "fixed" : "percent";
    var discountValue = Number(body.discountValue);

    if (!code) return res.status(400).json({ error: "Code requis." });
    if (!discountValue || discountValue <= 0) return res.status(400).json({ error: "Valeur de remise invalide." });
    if (discountType === "percent" && discountValue > 100) return res.status(400).json({ error: "Un pourcentage ne peut pas dépasser 100." });

    var maxUses = body.maxUses != null && body.maxUses !== "" ? parseInt(body.maxUses, 10) : null;
    var expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    var existing = await sql`SELECT id FROM promo_codes WHERE code = ${code}`;
    if (existing.length) return res.status(409).json({ error: "Ce code existe déjà." });

    var created = await sql`
      INSERT INTO promo_codes (code, discount_type, discount_value, active, max_uses, expires_at)
      VALUES (${code}, ${discountType}, ${discountValue}, true, ${maxUses}, ${expiresAt})
      RETURNING *
    `;
    return res.status(201).json({ promoCode: publicPromo(created[0]) });
  }

  if (req.method === "PATCH") {
    var body2 = req.body || {};
    if (!body2.id) return res.status(400).json({ error: "id requis." });
    var rows2 = await sql`SELECT * FROM promo_codes WHERE id = ${body2.id}`;
    var current = rows2[0];
    if (!current) return res.status(404).json({ error: "Code introuvable." });

    var active2 = typeof body2.active === "boolean" ? body2.active : current.active;
    var maxUses2 = body2.maxUses !== undefined ? (body2.maxUses === "" || body2.maxUses === null ? null : parseInt(body2.maxUses, 10)) : current.max_uses;

    var updated = await sql`UPDATE promo_codes SET active = ${active2}, max_uses = ${maxUses2} WHERE id = ${body2.id} RETURNING *`;
    return res.status(200).json({ promoCode: publicPromo(updated[0]) });
  }

  if (req.method === "DELETE") {
    var id = (req.query && req.query.id) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: "id requis." });
    await sql`DELETE FROM promo_codes WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return res.status(405).json({ error: "Méthode non autorisée." });
}

module.exports = async function handler(req, res) {
  var resource = req.query && req.query.resource;
  if (resource === "promo-codes") return handlePromoCodes(req, res);
  return res.status(400).json({ error: "Ressource inconnue." });
};
