// GET  /api/admin/orders       -- liste toutes les commandes réelles (remplace la
//                                  lecture localStorage tc-admin-orders-v1 dans
//                                  admin/admin.js getOrders(), voir Phase 3/4 du plan)
// PATCH /api/admin/orders      -- { id, status } change fulfillment_status
//                                  (remplace saveOrders() localStorage)
const { sql } = require("../../lib/db");
const { requireAdmin } = require("../../lib/auth");
const { STATUS_ORDER } = require("../../lib/orderStatus");

module.exports = async function handler(req, res) {
  var session = requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    var result = await sql`
      SELECT o.id, o.ref, o.name, o.phone, o.city, o.address, o.subtotal,
             o.fulfillment_status, o.payment_method, o.payment_status, o.created_at,
             COALESCE(
               json_agg(
                 json_build_object('name', oi.name, 'tag', oi.tag, 'qty', oi.qty, 'unit', oi.unit, 'price', oi.price, 'total', oi.total)
               ) FILTER (WHERE oi.id IS NOT NULL),
               '[]'
             ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    return res.status(200).json({ orders: result });
  }

  if (req.method === "PATCH") {
    var body = req.body || {};
    if (!body.id || STATUS_ORDER.indexOf(body.status) === -1) {
      return res.status(400).json({ error: "id et status (valide parmi " + STATUS_ORDER.join(", ") + ") requis." });
    }
    await sql`UPDATE orders SET fulfillment_status = ${body.status} WHERE id = ${body.id}`;
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, PATCH");
  return res.status(405).json({ error: "Méthode non autorisée." });
};
