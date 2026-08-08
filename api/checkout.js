// POST /api/checkout -- crée une commande réelle en base. Remplace pushOrderToAdmin()
// (js/main.js) pour la persistance -- le lien WhatsApp existant reste géré côté client
// (voir Phase 4 du plan, wireRecapActions() n'est pas touché ici).
//
// Contrat de la requête :
//   { items: [{ id: "tag::name", qty: 2 }, ...],
//     customer: { name, phone, city, address, },
//     paymentMethod: "cod" | "showroom" | "online_card" }
//
// Sécurité prix (non négociable, voir le plan) : le prix n'est JAMAIS lu depuis la
// requête, seulement depuis la table `products` (seedée par db/seed-products.js à
// partir des pages HTML réelles). Un id absent de cette table fait échouer la commande
// plutôt que d'accepter un prix non vérifié.
const { sql } = require("../lib/db");
const { getOptionalCustomer } = require("../lib/auth");
const { PAYMENT_STATUS } = require("../lib/orderStatus");
const youcanpay = require("../lib/youcanpay");

function orderRef() {
  return "TC-" + Date.now().toString().slice(-6); // même format que js/main.js orderRef()
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
  var subtotal = resolvedItems.reduce(function (sum, it) { return sum + it.total; }, 0);

  var ref = orderRef();
  var customerSession = getOptionalCustomer(req); // rattache si connecté, sinon commande invité (voir Phase 4)
  var initialPaymentStatus =
    paymentMethod === "online_card"
      ? (youcanpay.isConfigured() ? PAYMENT_STATUS.AWAITING_PAYMENT : PAYMENT_STATUS.AWAITING_GATEWAY_SETUP)
      : PAYMENT_STATUS.NOT_APPLICABLE;

  var orderRows = await sql`
    INSERT INTO orders (ref, customer_id, name, phone, city, address, subtotal, payment_method, payment_status)
    VALUES (${ref}, ${customerSession ? customerSession.id : null}, ${customer.name}, ${customer.phone},
            ${customer.city}, ${customer.address || ""}, ${subtotal}, ${paymentMethod}, ${initialPaymentStatus})
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

  var responsePayload = { ref: order.ref, subtotal: subtotal, items: resolvedItems, paymentStatus: initialPaymentStatus };

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
