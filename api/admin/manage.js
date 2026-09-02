// GET    /api/admin/manage?resource=promo-codes         -- liste tous les codes promo
// POST   /api/admin/manage?resource=promo-codes         -- crée un code promo
// PATCH  /api/admin/manage?resource=promo-codes         -- { id, ...champs } modifie un code
// DELETE /api/admin/manage?resource=promo-codes         -- { id } (query ou body) supprime un code
//
// GET    /api/admin/manage?resource=products             -- liste les produits créés au dashboard
// POST   /api/admin/manage?resource=products              -- crée un produit (visible de TOUS les
//                                                             visiteurs, voir api/page-content.js)
// PATCH  /api/admin/manage?resource=products               -- { id, ...champs } modifie/supprime
//                                                             (suppression douce : deleted=true)
//
// Petit hub d'administration générique par ressource (?resource=...), pour rester sous
// la limite de 12 fonctions serverless du forfait Vercel Hobby plutôt que créer un
// fichier par nouvelle fonctionnalité admin (voir api/auth/admin.js pour le même choix
// appliqué aux comptes).
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

// ---------- Produits créés au dashboard (demande explicite du 03/09/2026) ----------
// Avant cet ajout, "Ajouter un produit" ne sauvegardait qu'en localStorage -- jamais visible
// pour un vrai visiteur, seulement dans le navigateur du manager. Ces produits vivent
// maintenant dans la vraie table `products` (déjà utilisée pour la revalidation des prix au
// checkout, voir api/checkout.js) avec source='admin', pour être servis à tous via
// api/page-content.js (section "Nouveautés" de l'accueil + injection sur leur page catégorie).
// Les produits scrapés depuis le HTML statique (source='site', voir api/admin/seed-products.js)
// ne sont jamais touchés ici.
var productColumnsReady = false;
async function ensureProductColumns() {
  if (productColumnsReady) return;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS page TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS row_label TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2)`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'site'`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`;
  productColumnsReady = true;
}

// IMPORTANT : `price` est TOUJOURS le montant réellement facturé au checkout (voir
// api/checkout.js, qui lit cette colonne directement -- exactement comme pour un produit
// scrapé depuis le HTML statique en promotion, où le prix "actuel" affiché est bien celui
// facturé). `original_price` n'est QUE l'ancien prix à afficher barré quand une promo est
// active -- jamais utilisé pour le calcul du total. Donc quand un manager saisit un prix
// normal ET un prix promo dans le formulaire, c'est promoPrice (le prix payé) qui va dans
// la colonne `price`, et price (le prix normal) qui va dans `original_price`.
function publicProduct(row) {
  var hasDiscount = row.original_price != null;
  return {
    id: row.id, name: row.name, tag: row.tag,
    price: hasDiscount ? Number(row.original_price) : Number(row.price), // prix "normal" affiché
    promoPrice: hasDiscount ? Number(row.price) : null,                  // prix réellement payé si promo
    unit: row.unit, description: row.description || "", image: row.image || "",
    page: row.page, rowLabel: row.row_label || "", deleted: row.deleted, createdAt: row.created_at
  };
}

var CATALOG_PAGE_LABELS = {
  "carrelage.html": "Carrelage", "sanitaire.html": "Sanitaire", "robinetterie.html": "Robinetterie",
  "mosaique-pierre.html": "Mosaïque & Pierre", "meubles-salle-de-bain.html": "Meubles de salle de bain",
  "miroirs-led.html": "Miroirs LED", "destockage.html": "Déstockage"
};

async function handleProducts(req, res) {
  await ensureProductColumns();
  var session = requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    var rows = await sql`SELECT * FROM products WHERE source = 'admin' ORDER BY created_at DESC`;
    return res.status(200).json({ products: rows.map(publicProduct) });
  }

  if (req.method === "POST") {
    var body = req.body || {};
    var name = body.name ? String(body.name).trim() : "";
    var tag = body.tag ? String(body.tag).trim() : "";
    var page = body.page ? String(body.page).trim() : "";
    var price = Number(body.price);

    if (!name) return res.status(400).json({ error: "Nom du produit requis." });
    if (!tag) return res.status(400).json({ error: "Marque/gamme requise." });
    if (!CATALOG_PAGE_LABELS[page]) return res.status(400).json({ error: "Catégorie invalide." });
    if (!price || price <= 0) return res.status(400).json({ error: "Prix invalide." });

    var promoPrice = body.promoPrice != null && body.promoPrice !== "" ? Number(body.promoPrice) : null;
    if (promoPrice != null && (!promoPrice || promoPrice >= price)) {
      return res.status(400).json({ error: "Le prix promotionnel doit être inférieur au prix normal." });
    }
    var id = tag + "::" + name; // même schéma que dataFromCard() dans js/main.js

    var existing = await sql`SELECT id FROM products WHERE id = ${id}`;
    if (existing.length) return res.status(409).json({ error: "Un produit avec ce nom et cette marque existe déjà." });

    // Voir la note au-dessus de publicProduct() : `price` = montant facturé (le prix promo
    // s'il y en a un, sinon le prix normal), `original_price` = prix normal barré si promo.
    var chargedPrice = promoPrice != null ? promoPrice : price;
    var originalPrice = promoPrice != null ? price : null;

    var created = await sql`
      INSERT INTO products (id, name, tag, price, original_price, unit, description, image, page, row_label, source, deleted, created_at)
      VALUES (${id}, ${name}, ${tag}, ${chargedPrice}, ${originalPrice}, ${body.unit || "unité"}, ${body.description || ""},
              ${body.image || ""}, ${page}, ${"Ajoutés récemment"}, 'admin', false, now())
      RETURNING *
    `;
    return res.status(201).json({ product: publicProduct(created[0]) });
  }

  if (req.method === "PATCH") {
    var body2 = req.body || {};
    if (!body2.id) return res.status(400).json({ error: "id requis." });
    var rows2 = await sql`SELECT * FROM products WHERE id = ${body2.id} AND source = 'admin'`;
    var current = rows2[0];
    if (!current) return res.status(404).json({ error: "Produit introuvable." });

    var deleted2 = typeof body2.deleted === "boolean" ? body2.deleted : current.deleted;
    // body2.price/body2.promoPrice suivent la même convention "prix normal / prix payé si
    // promo" que POST -- reconverti ici vers charged/original avant écriture, voir la note
    // au-dessus de publicProduct(). Si aucun des deux n'est fourni, on ne touche pas au prix.
    var chargedPrice2 = current.price, originalPrice2 = current.original_price;
    if (body2.price != null || body2.promoPrice !== undefined) {
      var normalPrice2 = body2.price != null ? Number(body2.price) : (current.original_price != null ? Number(current.original_price) : Number(current.price));
      var promo2 = body2.promoPrice !== undefined
        ? (body2.promoPrice === "" || body2.promoPrice === null ? null : Number(body2.promoPrice))
        : (current.original_price != null ? Number(current.price) : null);
      chargedPrice2 = promo2 != null ? promo2 : normalPrice2;
      originalPrice2 = promo2 != null ? normalPrice2 : null;
    }

    var updated = await sql`
      UPDATE products SET deleted = ${deleted2}, price = ${chargedPrice2}, original_price = ${originalPrice2}
      WHERE id = ${body2.id} RETURNING *
    `;
    return res.status(200).json({ product: publicProduct(updated[0]) });
  }

  res.setHeader("Allow", "GET, POST, PATCH");
  return res.status(405).json({ error: "Méthode non autorisée." });
}

module.exports = async function handler(req, res) {
  var resource = req.query && req.query.resource;
  if (resource === "promo-codes") return handlePromoCodes(req, res);
  if (resource === "products") return handleProducts(req, res);
  return res.status(400).json({ error: "Ressource inconnue." });
};
