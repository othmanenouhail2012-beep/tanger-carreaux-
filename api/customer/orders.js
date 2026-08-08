// GET /api/customer/orders -- historique de commandes du client connecté (espace
// client, voir Phase 4 du plan). Nécessite une session valide -- pas d'accès invité ici
// (contrairement au checkout, qui reste ouvert sans compte).
const { sql } = require("../../lib/db");
const { requireCustomer } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  var session = requireCustomer(req, res);
  if (!session) return;

  var result = await sql`
    SELECT o.ref, o.subtotal, o.fulfillment_status, o.payment_method, o.payment_status, o.created_at,
           COALESCE(
             json_agg(json_build_object('name', oi.name, 'qty', oi.qty, 'unit', oi.unit, 'total', oi.total))
               FILTER (WHERE oi.id IS NOT NULL),
             '[]'
           ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = ${session.id}
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  return res.status(200).json({ orders: result });
};
