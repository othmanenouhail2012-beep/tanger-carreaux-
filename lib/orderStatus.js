// Source unique de vérité pour le statut de traitement d'une commande. Reprend
// EXACTEMENT l'énumération déjà utilisée par l'admin simulé (admin/admin.js,
// STATUS_LABELS / STATUS_ORDER autour de la ligne 1146) -- ne pas faire diverger les
// deux copies. admin/admin.js ne peut pas `require()` ce fichier (simple <script>,
// pas un module), donc si cette énumération change ici, reporter le même changement
// à la main dans admin/admin.js.
const STATUS_LABELS = {
  pending: "En attente",
  preparing: "En préparation",
  shipping: "En livraison",
  done: "Livrée",
  cancelled: "Annulée"
};

const STATUS_ORDER = ["pending", "preparing", "shipping", "done", "cancelled"];

// payment_status est un axe séparé de fulfillment_status (voir db/schema.sql) : une
// commande "paiement à la livraison" peut être en "preparing" avec payment_status
// encore "not_applicable", pendant qu'une commande carte en ligne a un vrai cycle de
// paiement indépendant de la préparation/livraison.
const PAYMENT_STATUS = {
  NOT_APPLICABLE: "not_applicable", // paiement à la livraison / showroom -- rien à suivre ici
  AWAITING_GATEWAY_SETUP: "awaiting_gateway_setup", // carte en ligne choisie mais YouCan Pay pas encore configuré
  AWAITING_PAYMENT: "awaiting_payment", // token créé, en attente de confirmation client/webhook
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded"
};

module.exports = { STATUS_LABELS: STATUS_LABELS, STATUS_ORDER: STATUS_ORDER, PAYMENT_STATUS: PAYMENT_STATUS };
