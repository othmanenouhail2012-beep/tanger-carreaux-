// POST /api/checkout -- crée une commande réelle en base. Remplace pushOrderToAdmin()
// (js/main.js) pour la persistance -- le lien WhatsApp existant reste géré côté client
// (voir Phase 4 du plan, wireRecapActions() n'est pas touché ici).
//
// Contrat de la requête :
//   { items: [{ id: "tag::name", qty: 2 }, ...],
//     customer: { name, phone, city, address, },
//     paymentMethod: "cod" | "showroom" | "online_card",
//     promoCode: "CODE" (optionnel) }
//
// Sécurité prix (non négociable, voir le plan) : le prix n'est JAMAIS lu depuis la
// requête, seulement depuis la table `products` (seedée par db/seed-products.js à
// partir des pages HTML réelles). Un id absent de cette table fait échouer la commande
// plutôt que d'accepter un prix non vérifié. Même logique pour le code promo (demande
// explicite) : la remise n'est jamais calculée côté client, seulement revérifiée et
// appliquée ici contre la table promo_codes (voir api/admin/manage.js) -- un code
// invalide/expiré/épuisé fait échouer la commande avec une erreur claire plutôt que
// d'accepter une remise non vérifiée.
const { sql } = require("../lib/db");
const { getOptionalCustomer } = require("../lib/auth");
const { PAYMENT_STATUS } = require("../lib/orderStatus");
const youcanpay = require("../lib/youcanpay");

function orderRef() {
  return "TC-" + Date.now().toString().slice(-6); // même format que js/main.js orderRef()
}

var orderColumnsReady = false;
async function ensureOrderColumns() {
  if (orderColumnsReady) return;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) NOT NULL DEFAULT 0`;
  orderColumnsReady = true;
}

// Revalide et applique un code promo contre la table promo_codes -- retourne
// { discount, code } ou lève une erreur avec un message adapté au client si le code est
// invalide, inactif, expiré ou épuisé. N'incrémente used_count qu'une fois la commande
// effectivement créée (voir plus bas), pour ne jamais consommer un usage sur une commande
// qui échoue ensuite (adresse manquante, etc.).
async function resolvePromoCode(rawCode, subtotal) {
  var code = String(rawCode).trim().toUpperCase();
  if (!code) return null;
  // Un client ne peut taper un code que si le gérant en a déjà créé un (voir
  // api/admin/manage.js), ce qui a déjà créé cette table -- gardé ici quand même,
  // idempotent et sans coût, pour ne jamais planter sur un cas limite (ex. table
  // supprimée manuellement) plutôt que de renvoyer une erreur SQL brute au client.
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
  var rows = await sql`SELECT * FROM promo_codes WHERE code = ${code}`;
  var promo = rows[0];
  if (!promo || !promo.active) {
    throw new Error("Code promo invalide.");
  }
  if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
    throw new Error("Ce code promo a expiré.");
  }
  if (promo.max_uses != null && promo.used_count >= promo.max_uses) {
    throw new Error("Ce code promo a atteint sa limite d'utilisation.");
  }
  var discount = promo.discount_type === "percent"
    ? Math.round(subtotal * (Number(promo.discount_value) / 100) * 100) / 100
    : Number(promo.discount_value);
  discount = Math.min(discount, subtotal); // jamais un total négatif
  return { id: promo.id, code: promo.code, discount: discount };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  var body = req.body || {};
  var items = Array.isArray(body.items) ? body.items : [];
  var customer = body.customer || {};
  var paymentMethod = body.paymentMethod;

  if (!items.length) return res.status(400).json({ error: "Panier vide." });
  if (!customer.name || !customer.phone || !customer.city) {
    return res.status(400).json({ error: "Nom, téléphone et ville sont requis." });
  }
  if (["cod", "showroom", "online_card"].indexOf(paymentMethod) === -1) {
    return res.status(400).json({ error: "Mode de paiement invalide." });
  }
  if (paymentMethod === "cod" && !customer.address) {
    return res.status(400).json({ error: "Adresse de livraison requise pour une livraison à domicile." });
  }

  var resolvedItems = [];
  for (var i = 0; i < items.length; i++) {
    var reqItem = items[i];
    var qty = parseInt(reqItem && reqItem.qty, 10);
    if (!reqItem || !reqItem.id || !qty || qty < 1) {
      return res.status(400).json({ error: "Article invalide dans le panier." });
    }
    var rows = await sql`SELECT id, name, tag, price, unit FROM products WHERE id = ${reqItem.id}`;
    var product = rows[0];
    if (!product) {
      return res.status(400).json({
        error: "Produit inconnu ou plus disponible : " + reqItem.id + ". Rafraîchissez la page et réessayez."
      });
    }
    resolvedItems.push({
      product_id: product.id,
      name: product.name,
      tag: product.tag,
      qty: qty,
      unit: product.unit,
      price: Number(product.price),
      total: Number(product.price) * qty
    });
  }
  var itemsSubtotal = resolvedItems.reduce(function (sum, it) { return sum + it.total; }, 0);

  await ensureOrderColumns();
  var appliedPromo = null;
  if (body.promoCode) {
    try {
      appliedPromo = await resolvePromoCode(body.promoCode, itemsSubtotal);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
  var discount = appliedPromo ? appliedPromo.discount : 0;
  var subtotal = itemsSubtotal - discount; // montant réellement dû -- voir note schema.sql

  var ref = orderRef();
  var customerSession = getOptionalCustomer(req); // rattache si connecté, sinon commande invité (voir Phase 4)
  var initialPaymentStatus =
    paymentMethod === "online_card"
      ? (youcanpay.isConfigured() ? PAYMENT_STATUS.AWAITING_PAYMENT : PAYMENT_STATUS.AWAITING_GATEWAY_SETUP)
      : PAYMENT_STATUS.NOT_APPLICABLE;

  var orderRows = await sql`
    INSERT INTO orders (ref, customer_id, name, phone, city, address, subtotal, payment_method, payment_status, promo_code, discount)
    VALUES (${ref}, ${customerSession ? customerSession.id : null}, ${customer.name}, ${customer.phone},
            ${customer.city}, ${customer.address || ""}, ${subtotal}, ${paymentMethod}, ${initialPaymentStatus},
            ${appliedPromo ? appliedPromo.code : null}, ${discount})
    RETURNING id, ref, created_at
  `;
  var order = orderRows[0];

  for (var j = 0; j < resolvedItems.length; j++) {
    var it = resolvedItems[j];
    await sql`
      INSERT INTO order_items (order_id, product_id, name, tag, qty, unit, price, total)
      VALUES (${order.id}, ${it.product_id}, ${it.name}, ${it.tag}, ${it.qty}, ${it.unit}, ${it.price}, ${it.total})
    `;
  }
  // N'incrémente l'usage qu'ici, la commande étant maintenant réellement créée.
  if (appliedPromo) {
    await sql`UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ${appliedPromo.id}`;
  }

  var responsePayload = {
    ref: order.ref, subtotal: subtotal, items: resolvedItems, paymentStatus: initialPaymentStatus,
    discount: discount, promoCode: appliedPromo ? appliedPromo.code : null
  };

  if (paymentMethod === "online_card" && youcanpay.isConfigured()) {
    try {
      var payment = await youcanpay.initPayment({ ref: order.ref, subtotal: subtotal }, req);
      responsePayload.youcanpay = { tokenId: payment.tokenId, publicKey: payment.publicKey };
    } catch (err) {
      // La commande reste enregistrée même si la passerelle est indisponible --
      // on ne perd jamais une commande à cause d'un souci côté YouCan Pay.
      responsePayload.paymentError =
        "Le paiement en ligne est momentanément indisponible. Contactez-nous pour finaliser la commande " + order.ref + ".";
    }
  } else if (paymentMethod === "online_card") {
    // YouCan Pay pas encore configuré (pas de compte marchand) -- jamais de faux
    // "paiement réussi", message honnête affiché côté client (voir Phase 5 du plan).
    responsePayload.message =
      "Le paiement en ligne par carte sera bientôt disponible. Votre commande " + order.ref +
      " est enregistrée, notre équipe vous contactera pour confirmer le règlement.";
  }

  return res.status(201).json(responsePayload);
};
