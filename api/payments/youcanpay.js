// GET  /api/payments/youcanpay?ref=XXX -- atterrissage navigateur après le paiement
//      (success_url / error_url passées à YouCan Pay lors du tokenize, voir
//      lib/youcanpay.js initPayment). Jamais une preuve de paiement à elle seule -- un
//      GET est rejouable en rechargeant l'URL, donc cette page affiche seulement le
//      statut déjà en base, mis à jour par le webhook (source de vérité réelle).
// POST /api/payments/youcanpay -- webhook YouCan Pay (à enregistrer dans leur dashboard
//      une fois le compte marchand actif, voir developer.youcan.shop/youcan-pay/
//      webhooks). Payload : { id, event_name, sandbox, payload: {...} }.
//
// Les deux fusionnés (routage par méthode HTTP) pour repasser sous la limite de 12
// fonctions serverless du forfait Vercel Hobby (13 fichiers dans /api au 28/08/2026,
// déploiement refusé).
//
// Important -- vérification, pas confiance aveugle : la documentation publique de
// YouCan Pay au moment où ce code a été écrit (2026-08-08) ne détaille pas de mécanisme
// de signature pour authentifier un webhook. Donc la branche POST ne marque JAMAIS une
// commande "payée" sur la seule foi du payload reçu -- elle revérifie le statut réel via
// GET /api/v2/transactions/{id} (lib/youcanpay.js verifyTransaction, nécessite
// YOUCANPAY_ACCESS_TOKEN). Si cette vérification n'est pas configurée, la commande
// reste dans son état existant et un avertissement est journalisé pour confirmation
// manuelle par l'admin -- mieux vaut une commande "à vérifier" qu'une commande
// faussement marquée payée.
const { sql } = require("../../lib/db");
const youcanpay = require("../../lib/youcanpay");
const { PAYMENT_STATUS } = require("../../lib/orderStatus");

var STATUS_MESSAGES = {
  paid: "Paiement confirmé. Merci pour votre commande !",
  awaiting_payment: "Paiement en cours de vérification -- vous recevrez une confirmation sous peu.",
  awaiting_gateway_setup: "Votre commande est enregistrée, notre équipe vous contactera pour le règlement.",
  failed: "Le paiement n'a pas abouti. Vous pouvez réessayer ou nous contacter.",
  refunded: "Cette commande a été remboursée.",
  not_applicable: "Commande enregistrée."
};

function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

async function handleReturn(req, res) {
  var ref = req.query && req.query.ref;
  var status = "unknown";
  var found = false;

  if (ref) {
    var rows = await sql`SELECT payment_status FROM orders WHERE ref = ${ref}`;
    if (rows[0]) {
      found = true;
      status = rows[0].payment_status;
    }
  }

  var message = found
    ? STATUS_MESSAGES[status] || "Statut de la commande : " + status
    : "Commande introuvable -- contactez-nous en indiquant la référence si vous avez été débité.";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(
    "<!doctype html><html lang=\"fr\"><head><meta charset=\"utf-8\">" +
    "<title>Tanger Carreaux — Statut de la commande</title>" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
    "<style>body{font-family:system-ui,sans-serif;max-width:560px;margin:80px auto;padding:0 24px;text-align:center;color:#101210}" +
    "h1{font-size:1.3rem}a{color:#163a2c}</style></head><body>" +
    "<h1>" + (ref ? "Commande " + escapeHtml(ref) : "Commande") + "</h1>" +
    "<p>" + escapeHtml(message) + "</p>" +
    "<p><a href=\"/\">Retour au site</a></p>" +
    "</body></html>"
  );
}

async function handleWebhook(req, res) {
  var body = req.body || {};
  var payload = body.payload || {};
  var transactionId = payload.id || payload.transaction_id;
  var orderRef = payload.order_id;

  if (!transactionId || !orderRef) {
    return res.status(400).json({ error: "Payload webhook incomplet." });
  }

  await sql`
    INSERT INTO payments (order_id, provider, provider_ref, amount, status, raw_payload)
    SELECT id, 'youcanpay', ${transactionId},
           ${payload.amount && payload.amount.amount ? Number(payload.amount.amount) : 0},
           'webhook_received', ${JSON.stringify(body)}
    FROM orders WHERE ref = ${orderRef}
  `;

  if (youcanpay.canVerifyTransactions()) {
    try {
      var real = await youcanpay.verifyTransaction(transactionId);
      var mapped =
        real.status === "paid" ? PAYMENT_STATUS.PAID :
        real.status === "refunded" ? PAYMENT_STATUS.REFUNDED :
        (real.status === "failed" || real.status === "canceled") ? PAYMENT_STATUS.FAILED :
        PAYMENT_STATUS.AWAITING_PAYMENT;
      await sql`UPDATE orders SET payment_status = ${mapped} WHERE ref = ${orderRef}`;
      await sql`
        UPDATE payments SET status = ${real.status}
        WHERE order_id = (SELECT id FROM orders WHERE ref = ${orderRef}) AND provider_ref = ${transactionId}
      `;
    } catch (err) {
      console.error("Vérification YouCan Pay échouée pour " + orderRef + " :", err.message);
    }
  } else {
    console.warn(
      "Webhook YouCan Pay reçu pour " + orderRef +
      " mais YOUCANPAY_ACCESS_TOKEN absent -- statut NON mis à jour automatiquement, à vérifier manuellement."
    );
  }

  // YouCan Pay attend un 2xx pour ne pas réessayer -- on répond OK même si la
  // vérification serveur a échoué/été sautée, l'erreur est journalisée côté serveur.
  return res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") return handleReturn(req, res);
  if (req.method === "POST") return handleWebhook(req, res);
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Méthode non autorisée." });
};
