// Intégration YouCan Pay -- isolée ici pour que tout changement lié à cette passerelle
// spécifique reste dans ce seul fichier. Basé sur la vraie documentation publique
// (https://developer.youcan.shop/youcan-pay/...), vérifiée le 2026-08-08, pas devinée :
//   - Paiement : POST /api/tokenize (clé privée, server-side) -> token -> yp.js
//     (clé publique, client-side) -> payment.confirm() -> résultat.
//   - Vérification : GET /api/v2/transactions/{id} (statut réel, à ne jamais déduire
//     du seul payload webhook -- voir verifyTransaction ci-dessous).
// Tant que YOUCANPAY_SECRET_KEY est vide (cas actuel, pas de compte marchand), toute
// fonction ici lève une erreur explicite -- c'est /api/checkout.js qui doit appeler
// isConfigured() D'ABORD et ne jamais tenter d'utiliser ce module sinon. Ne JAMAIS
// simuler un paiement "réussi" quand ce module n'est pas configuré.

const TOKENIZE_URL = "https://youcanpay.com/api/tokenize";
const TRANSACTION_URL = "https://youcanpay.com/api/v2/transactions/";

function isConfigured() {
  return !!(process.env.YOUCANPAY_SECRET_KEY && process.env.YOUCANPAY_PUBLIC_KEY);
}

// Peut-on vérifier un webhook/statut de transaction côté serveur ? Nécessite un jeton
// d'accès obtenu via le flux OAuth de YouCan Pay (distinct de la clé privée simple
// utilisée par /api/tokenize) -- voir .env.local.example. Tant que ce n'est pas
// configuré, le webhook ne doit JAMAIS marquer une commande "payée" tout seul : il doit
// la laisser dans un état "à vérifier manuellement" (voir api/payments/youcanpay.js).
function canVerifyTransactions() {
  return !!process.env.YOUCANPAY_ACCESS_TOKEN;
}

function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  var proto = (req && req.headers["x-forwarded-proto"]) || "https";
  var host = req && (req.headers["x-forwarded-host"] || req.headers.host);
  return host ? proto + "://" + host : "";
}

// Crée un token de paiement pour une commande déjà enregistrée en base (order.id /
// order.ref / order.subtotal doivent déjà exister -- ne JAMAIS appeler ceci avant
// d'avoir persisté la commande, sinon un paiement pourrait exister sans commande
// correspondante). amount en centimes (unité la plus petite), donc MAD * 100.
async function initPayment(order, req) {
  if (!isConfigured()) {
    throw new Error("YouCan Pay n'est pas configuré (clés API manquantes) -- voir .env.local.example.");
  }
  var origin = baseUrl(req);
  var form = new URLSearchParams();
  form.set("amount", String(Math.round(order.subtotal * 100)));
  form.set("currency", "MAD");
  form.set("order_id", order.ref);
  form.set("pri_key", process.env.YOUCANPAY_SECRET_KEY);
  form.set("success_url", origin + "/api/payments/youcanpay?ref=" + encodeURIComponent(order.ref));
  form.set("error_url", origin + "/api/payments/youcanpay?ref=" + encodeURIComponent(order.ref) + "&failed=1");

  var res = await fetch(TOKENIZE_URL, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form
  });
  if (!res.ok) {
    var errText = await res.text().catch(function () { return ""; });
    throw new Error("YouCan Pay tokenize a échoué (" + res.status + ") : " + errText);
  }
  var data = await res.json();
  return {
    transactionId: data.transaction_id,
    tokenId: data.token && data.token.id,
    publicKey: process.env.YOUCANPAY_PUBLIC_KEY
  };
}

// Interroge YouCan Pay pour le vrai statut d'une transaction plutôt que de faire
// confiance au payload du webhook ou à un retour navigateur (tous deux falsifiables/
// rejouables côté client). Statuts possibles côté YouCan Pay : paid, canceled,
// pending, refunded, failed, authorized.
async function verifyTransaction(transactionId) {
  if (!canVerifyTransactions()) {
    throw new Error("YOUCANPAY_ACCESS_TOKEN manquant -- impossible de vérifier une transaction côté serveur.");
  }
  var res = await fetch(TRANSACTION_URL + encodeURIComponent(transactionId), {
    headers: { Authorization: "Bearer " + process.env.YOUCANPAY_ACCESS_TOKEN, Accept: "application/json" }
  });
  if (!res.ok) {
    var errText = await res.text().catch(function () { return ""; });
    throw new Error("Vérification YouCan Pay a échoué (" + res.status + ") : " + errText);
  }
  return res.json(); // { status, amount, order_id, ... } -- voir doc transactions/object
}

module.exports = {
  isConfigured: isConfigured,
  canVerifyTransactions: canVerifyTransactions,
  initPayment: initPayment,
  verifyTransaction: verifyTransaction
};
