// GET /api/payments/youcanpay/return -- atterrissage navigateur après le paiement
// (success_url / error_url passées à YouCan Pay lors du tokenize, voir lib/youcanpay.js
// initPayment). Jamais une preuve de paiement à elle seule -- un GET est rejouable en
// rechargeant l'URL, donc cette page affiche seulement le statut déjà en base, mis à
// jour par le webhook (source de vérité réelle, voir webhook.js).
//
// Rendu HTML minimal directement ici plutôt qu'une redirection vers une page statique
// dédiée -- une vraie page stylée (assortie au reste du site) sera construite en Phase
// 4/5 lors du branchement complet du tunnel de paiement ; ce handler reste correct et
// sûr en attendant, sans dépendre d'un fichier qui n'existe pas encore.
const { sql } = require("../../../lib/db");

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

module.exports = async function handler(req, res) {
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
};
