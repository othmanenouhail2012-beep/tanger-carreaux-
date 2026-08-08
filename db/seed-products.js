#!/usr/bin/env node
// Seede/rafraîchit la table `products` (prix serveur pour la revalidation au checkout,
// voir api/checkout.js) en parsant les 7 pages catalogue HTML réelles -- jamais de prix
// inventé. Même schéma d'id que dataFromCard() dans js/main.js : "tag::name".
//
// À relancer après CHAQUE ajout/modification de prix dans les pages catalogue, sinon
// api/checkout.js échouera pour les produits absents de la table (comportement voulu,
// voir schema.sql -- fail closed plutôt que de faire confiance au client).
//
// Usage : npm run seed:products
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { sql } = require("../lib/db");

const CATALOG_PAGES = [
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
  var match = priceText.match(/^([\d\s ]+)\s*MAD(\/m²)?/);
  if (!match) return null; // "Prix sur devis" ou similaire -- pas de prix fixe, normal et attendu
  var value = parseInt(match[1].replace(/[\s ]/g, ""), 10);
  if (!value) return null;
  return { value: value, unit: match[2] ? "m²" : "unité" };
}

function extractFromFile(filePath) {
  var html = fs.readFileSync(filePath, "utf8");
  var $ = cheerio.load(html);
  var rows = [];
  $(".product-card").each(function () {
    var card = $(this);
    var name = card.find("h4").first().text().trim();
    var tag = card.find(".product-tag").first().text().trim();
    var priceEl = card.find(".product-price").first();
    if (!name || !priceEl.length) return;
    // .firstChild.textContent côté navigateur = premier nœud texte, pas le <span> imbriqué
    var priceText = (priceEl.contents().first().text() || "").trim();
    var parsed = parsePrice(priceText);
    if (!parsed) return; // "Prix sur devis" -- pas de ligne products pour ce produit, c'est voulu
    rows.push({ id: tag + "::" + name, name: name, tag: tag, price: parsed.value, unit: parsed.unit });
  });
  return rows;
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error("DATABASE_URL manquant -- remplis .env.local d'abord (voir .env.local.example).");
    process.exit(1);
  }
  var root = path.join(__dirname, "..");
  var all = [];
  CATALOG_PAGES.forEach(function (file) {
    var rows = extractFromFile(path.join(root, file));
    console.log(file + " : " + rows.length + " produit(s) à prix fixe trouvé(s).");
    all = all.concat(rows);
  });

  var seen = {};
  var duplicates = [];
  all.forEach(function (r) {
    if (seen[r.id]) duplicates.push(r.id);
    seen[r.id] = true;
  });
  if (duplicates.length) {
    console.warn("Attention, id en double (même tag+nom sur plusieurs pages) :", duplicates);
  }

  for (var i = 0; i < all.length; i++) {
    var p = all[i];
    await sql`
      INSERT INTO products (id, name, tag, price, unit, updated_at)
      VALUES (${p.id}, ${p.name}, ${p.tag}, ${p.price}, ${p.unit}, now())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, tag = EXCLUDED.tag, price = EXCLUDED.price,
        unit = EXCLUDED.unit, updated_at = now()
    `;
  }
  console.log("Terminé : " + all.length + " produits à prix fixe insérés/mis à jour en base.");
  process.exit(0);
}

main().catch(function (err) {
  console.error("Échec :", err.message);
  process.exit(1);
});
