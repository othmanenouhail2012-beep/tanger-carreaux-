// POST /api/admin/seed-products -- (ré)alimente la table `products` (prix serveur pour
// la revalidation au checkout, voir api/checkout.js) en parsant les 7 pages catalogue
// HTML RÉELLEMENT EN LIGNE (fetch, pas de lecture de fichier local -- les fonctions
// serverless Vercel n'embarquent pas les .html du site dans leur bundle). Jamais de
// prix inventé : reprend exactement la même logique que db/seed-products.js (le
// script local, à garder synchronisé si l'un des deux change).
//
// À relancer (bouton "Recharger les prix" dans l'admin, voir admin/admin.js) après
// CHAQUE ajout/modification de prix dans les pages catalogue, sinon api/checkout.js
// échoue pour les produits absents de la table (comportement voulu -- fail closed
// plutôt que de faire confiance au client, voir db/schema.sql).
const cheerio = require("cheerio");
const { sql } = require("../../lib/db");
const { requireAdmin } = require("../../lib/auth");

var CATALOG_PAGES = [
  "carrelage.html",
  "sanitaire.html",
  "robinetterie.html",
  "mosaique-pierre.html",
  "meubles-salle-de-bain.html",
  "miroirs-led.html",
  "destockage.html"
];

// Reproduit exactement parsePriceFromCard() de js/main.js -- ne pas laisser diverger.
function parsePrice(priceText) {
  var match = priceText.match(/^([\d\s ]+)\s*MAD(\/m²)?/);
  if (!match) return null; // "Prix sur devis" ou similaire -- pas de prix fixe, normal et attendu
  var value = parseInt(match[1].replace(/[\s ]/g, ""), 10);
  if (!value) return null;
  return { value: value, unit: match[2] ? "m²" : "unité" };
}

function extractFromHtml(html) {
  var $ = cheerio.load(html);
  var rows = [];
  $(".product-card").each(function () {
    var card = $(this);
    var name = card.find("h4").first().text().trim();
    var tag = card.find(".product-tag").first().text().trim();
    var priceEl = card.find(".product-price").first();
    if (!name || !priceEl.length) return;
    var priceText = (priceEl.contents().first().text() || "").trim();
    var parsed = parsePrice(priceText);
    if (!parsed) return; // "Prix sur devis" -- pas de ligne products pour ce produit, c'est voulu
    rows.push({ id: tag + "::" + name, name: name, tag: tag, price: parsed.value, unit: parsed.unit });
  });
  return rows;
}

function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  var proto = (req.headers["x-forwarded-proto"]) || "https";
  var host = req.headers["x-forwarded-host"] || req.headers.host;
  return proto + "://" + host;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  var session = requireAdmin(req, res);
  if (!session) return;

  var origin = baseUrl(req);
  var all = [];
  var perPage = {};
  var errors = [];

  for (var i = 0; i < CATALOG_PAGES.length; i++) {
    var page = CATALOG_PAGES[i];
    try {
      var r = await fetch(origin + "/" + page);
      if (!r.ok) throw new Error("HTTP " + r.status);
      var html = await r.text();
      var rows = extractFromHtml(html);
      perPage[page] = rows.length;
      all = all.concat(rows);
    } catch (err) {
      errors.push(page + " : " + err.message);
    }
  }

  for (var j = 0; j < all.length; j++) {
    var p = all[j];
    await sql`
      INSERT INTO products (id, name, tag, price, unit, updated_at)
      VALUES (${p.id}, ${p.name}, ${p.tag}, ${p.price}, ${p.unit}, now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, tag = EXCLUDED.tag, price = EXCLUDED.price,
        unit = EXCLUDED.unit, updated_at = now()
    `;
  }

  return res.status(200).json({ ok: true, total: all.length, perPage: perPage, errors: errors });
};
