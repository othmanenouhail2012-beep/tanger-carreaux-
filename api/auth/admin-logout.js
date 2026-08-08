const { clearSession, ADMIN_COOKIE } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  clearSession(res, ADMIN_COOKIE);
  return res.status(200).json({ ok: true });
};
