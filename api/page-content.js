// GET /api/page-content?page=index.html -- lecture PUBLIQUE (sans authentification) des
// modifications de texte/image enregistrées depuis l'Éditeur visuel admin, pour que TOUS les
// visiteurs du site voient les mêmes changements -- pas seulement le navigateur du manager qui
// les a faites (limite du localStorage seul, voir db/schema.sql). Contenu non sensible : mêmes
// textes/images que ceux déjà publiés en dur dans le HTML, donc pas de session requise ici.
// Appelé depuis js/main.js pour compléter (et faire autorité sur) l'application locale
// instantanée basée sur localStorage.
//
// Étendu (demande explicite du 03/09/2026) pour porter aussi :
// - adminProducts : les produits créés depuis le dashboard (admin/ > Ajouter un produit) pour
//   CETTE page -- avant cet ajout, un produit créé au dashboard n'était sauvegardé que dans le
//   navigateur du manager (localStorage), jamais visible pour un vrai visiteur. Maintenant
//   sauvegardé dans la vraie table `products` (source='admin'), donc visible par tous.
// - newest : les 6 produits admin les plus récents TOUTES pages confondues, pour la section
//   "Nouveautés" de la page d'accueil (voir index.html).
// - bestSellers : les 6 produits les plus vendus (vraies commandes, jamais annulées), pour la
//   section "Meilleures ventes" de la page d'accueil. Agrégat public mais anonyme -- aucune
//   donnée client (nom, téléphone, adresse) n'est jamais renvoyée ici.
const { sql } = require("../lib/db");

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

// `price` en base est TOUJOURS le montant réellement facturé au checkout (voir
// api/checkout.js) ; `original_price` n'est que l'ancien prix à afficher barré. On
// reconvertit ici vers la paire price(normal)/promoPrice(payé) attendue côté affichage
// public (js/main.js) -- voir la même logique dans api/admin/manage.js.
function publicProduct(row) {
  var hasDiscount = row.original_price != null;
  return {
    id: row.id, name: row.name, tag: row.tag,
    price: hasDiscount ? Number(row.original_price) : Number(row.price),
    promoPrice: hasDiscount ? Number(row.price) : null,
    unit: row.unit, description: row.description || "", image: row.image || "",
    page: row.page, rowLabel: row.row_label || "", createdAt: row.created_at
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  await ensureProductColumns();

  var page = req.query && req.query.page;
  var edits = {};
  if (page) {
    var rows = await sql`SELECT edit_key, edit_type, value FROM site_content_edits WHERE page = ${page}`;
    rows.forEach(function (r) { edits[r.edit_key] = { type: r.edit_type, value: r.value }; });
  }
  var logoRows = await sql`SELECT value FROM site_settings WHERE key = 'global_logo'`;

  var adminProducts = [];
  if (page) {
    var prodRows = await sql`
      SELECT * FROM products WHERE source = 'admin' AND deleted = false AND page = ${page}
      ORDER BY created_at DESC
    `;
    adminProducts = prodRows.map(publicProduct);
  }

  var newestRows = await sql`
    SELECT * FROM products WHERE source = 'admin' AND deleted = false
    ORDER BY created_at DESC LIMIT 6
  `;

  // Meilleures ventes : agrégat public et anonyme -- uniquement nom/tag/quantité, jamais de
  // donnée client. Exclut les commandes annulées (jamais réellement vendues).
  var bestSellerRows = await sql`
    SELECT oi.name, oi.tag, SUM(oi.qty) AS qty
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.fulfillment_status != 'cancelled'
    GROUP BY oi.name, oi.tag
    ORDER BY qty DESC
    LIMIT 6
  `;

  // Cache court côté CDN Vercel : les visites successives ne retapent pas la base à chaque
  // fois, tout en gardant les changements de l'admin visibles en moins d'une minute.
  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  return res.status(200).json({
    edits: edits,
    globalLogo: logoRows[0] ? logoRows[0].value : null,
    adminProducts: adminProducts,
    newest: newestRows.map(publicProduct),
    bestSellers: bestSellerRows.map(function (r) { return { name: r.name, tag: r.tag, qty: Number(r.qty) }; })
  });
};
