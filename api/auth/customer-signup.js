const { sql } = require("../../lib/db");
const { hashPassword, createSession, CUSTOMER_COOKIE } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  var body = req.body || {};
  if (!body.email || !body.password || !body.name) {
    return res.status(400).json({ error: "Nom, email et mot de passe requis." });
  }
  if (String(body.password).length < 8) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
  }
  var existing = await sql`SELECT id FROM customers WHERE email = ${body.email}`;
  if (existing.length) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
  }
  var hash = await hashPassword(body.password);
  var rows = await sql`
    INSERT INTO customers (email, password_hash, name, phone)
    VALUES (${body.email}, ${hash}, ${body.name}, ${body.phone || ""})
    RETURNING id, email, name
  `;
  var user = rows[0];
  createSession(res, CUSTOMER_COOKIE, { role: "customer", id: user.id, email: user.email, name: user.name });
  return res.status(201).json({ ok: true, email: user.email, name: user.name });
};
