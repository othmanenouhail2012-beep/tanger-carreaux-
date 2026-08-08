// POST /api/payments/youcanpay/webhook -- reçu de YouCan Pay (à enregistrer dans leur
// dashboard une fois le compte marchand actif, voir developer.youcan.shop/youcan-pay/
// webhooks). Payload : { id, event_name, sandbox, payload: {...} }.
//
// Important -- vérification, pas confiance aveugle : la documentation publique de
// YouCan Pay au moment où ce code a été écrit (2026-08-08) ne détaille pas de mécanisme
// de signature pour authentifier un webhook. Donc CE HANDLER NE MARQUE JAMAIS une
// commande "payée" sur la seule foi du payload reçu -- il revérifie le statut réel via
// GET /api/v2/transactions/{id} (lib/youcanpay.js verifyTransaction, nécessite
// YOUCANPAY_ACCESS_TOKEN). Si cette vérification n'est pas configurée, la commande
// reste dans son état existant et un avertissement est journalisé pour confirmation
// manuelle par l'admin -- mieux vaut une commande "à vérifier" qu'une commande
// faussement marquée payée.
const { sql } = require("../../../lib/db");
const youcanpay = require("../../../lib/youcanpay");
const { PAYMENT_STATUS } = require("../../../lib/orderStatus");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

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
};
