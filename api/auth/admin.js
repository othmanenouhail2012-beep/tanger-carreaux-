// POST /api/auth/admin?action=login          -- { email, password } -> session admin (cookie)
// POST /api/auth/admin?action=logout         -- efface la session admin
// POST /api/auth/admin?action=whoami         -- identité + permissions du compte connecté
//                                                (utilisé au chargement du dashboard pour
//                                                savoir quels panneaux afficher, voir
//                                                bootstrapAdmin() dans admin/admin.js)
// POST /api/auth/admin?action=update-account -- { currentPassword, newEmail?, newPassword?, newFullName? }
//                                                change les infos du compte CONNECTÉ.
// POST /api/auth/admin?action=list-staff     -- liste tous les comptes du dashboard (gérant seul)
// POST /api/auth/admin?action=create-staff   -- crée un compte employé limité (gérant seul)
// POST /api/auth/admin?action=update-staff   -- modifie un compte employé (gérant seul)
// POST /api/auth/admin?action=delete-staff   -- supprime un compte employé (gérant seul)
//
// Fusionné depuis admin-login.js + admin-logout.js pour repasser sous la limite de 12
// fonctions serverless du forfait Vercel Hobby (13 fichiers dans /api au 28/08/2026,
// déploiement refusé). L'écran de connexion admin (retiré au commit 48c4423) a été
// réintroduit le 29/08/2026 -- demande explicite pour restreindre le back-office au
// seul gérant, une fois une vraie base de données connectée. Comptes employés limités
// (staff_role/permissions) ajoutés le 02/09/2026 -- demande explicite, voir lib/auth.js
// requireManager/requirePermission et admin/admin.js PANEL_PERMISSION_LIST.
const { sql } = require("../../lib/db");
const {
  verifyPassword, hashPassword, createSession, clearSession, requireAdmin, requireManager, ADMIN_COOKIE
} = require("../../lib/auth");

// Ajout défensif des colonnes staff -- sans effet si déjà présentes (colonne déjà en
// prod ou base tout juste créée depuis db/schema.sql à jour). Évite d'avoir à rejouer
// une migration manuelle dans le SQL editor de Neon à chaque déploiement de cette
// fonctionnalité (friction connue, voir historique du projet).
var staffColumnsReady = false;
async function ensureStaffColumns() {
  if (staffColumnsReady) return;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS staff_role TEXT NOT NULL DEFAULT 'manager'`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'`;
  await sql`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true`;
  staffColumnsReady = true;
}

function publicStaff(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || "",
    staffRole: row.staff_role,
    permissions: row.permissions || [],
    active: row.active,
    createdAt: row.created_at
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  var action = (req.query && req.query.action) || "login";
  await ensureStaffColumns();

  if (action === "logout") {
    clearSession(res, ADMIN_COOKIE);
    return res.status(200).json({ ok: true });
  }

  if (action === "whoami") {
    var whoSession = requireAdmin(req, res);
    if (!whoSession) return;
    return res.status(200).json({
      email: whoSession.email,
      fullName: whoSession.fullName || "",
      staffRole: whoSession.staffRole || "manager",
      permissions: whoSession.permissions || []
    });
  }

  if (action === "update-account") {
    var session = requireAdmin(req, res);
    if (!session) return;

    var body = req.body || {};
    if (!body.currentPassword) {
      return res.status(400).json({ error: "Mot de passe actuel requis." });
    }
    if (!body.newEmail && !body.newPassword && !body.newFullName) {
      return res.status(400).json({ error: "Renseigne au moins un champ à modifier." });
    }
    if (body.newPassword && String(body.newPassword).length < 8) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
    }

    var current = await sql`SELECT id, email, password_hash, full_name, staff_role, permissions FROM admin_users WHERE id = ${session.id}`;
    var user = current[0];
    if (!user || !(await verifyPassword(body.currentPassword, user.password_hash))) {
      return res.status(401).json({ error: "Mot de passe actuel incorrect." });
    }

    var newEmail = body.newEmail ? String(body.newEmail).trim() : user.email;
    if (newEmail !== user.email) {
      var existing = await sql`SELECT id FROM admin_users WHERE email = ${newEmail} AND id != ${user.id}`;
      if (existing.length) {
        return res.status(409).json({ error: "Cet email est déjà utilisé par un autre compte." });
      }
    }
    var newFullName = body.newFullName != null ? String(body.newFullName).trim() : user.full_name;
    var newHash = body.newPassword ? await hashPassword(body.newPassword) : user.password_hash;

    await sql`UPDATE admin_users SET email = ${newEmail}, password_hash = ${newHash}, full_name = ${newFullName} WHERE id = ${user.id}`;
    // Ré-émet la session avec les infos à jour (sinon resterait les anciennes jusqu'à la prochaine connexion).
    createSession(res, ADMIN_COOKIE, {
      role: "admin", id: user.id, email: newEmail, fullName: newFullName,
      staffRole: user.staff_role, permissions: user.permissions
    });
    return res.status(200).json({ ok: true, email: newEmail, fullName: newFullName });
  }

  // ---------- Comptes employés limités (réservé au gérant) ----------
  if (action === "list-staff") {
    var mgrSession1 = requireManager(req, res);
    if (!mgrSession1) return;
    var rows1 = await sql`SELECT id, email, full_name, staff_role, permissions, active, created_at FROM admin_users ORDER BY created_at ASC`;
    return res.status(200).json({ staff: rows1.map(publicStaff) });
  }

  if (action === "create-staff") {
    var mgrSession2 = requireManager(req, res);
    if (!mgrSession2) return;
    var body2 = req.body || {};
    var email2 = body2.email ? String(body2.email).trim() : "";
    var password2 = body2.password ? String(body2.password) : "";
    var fullName2 = body2.fullName ? String(body2.fullName).trim() : "";
    var staffRole2 = body2.staffRole === "manager" ? "manager" : "employee";
    var permissions2 = Array.isArray(body2.permissions) ? body2.permissions.filter(function (p) { return typeof p === "string"; }) : [];

    if (!email2 || !password2 || !fullName2) {
      return res.status(400).json({ error: "Nom complet, email et mot de passe sont requis." });
    }
    if (password2.length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    }
    var existingStaff = await sql`SELECT id FROM admin_users WHERE email = ${email2}`;
    if (existingStaff.length) {
      return res.status(409).json({ error: "Cet email est déjà utilisé par un autre compte." });
    }
    var hash2 = await hashPassword(password2);
    var created = await sql`
      INSERT INTO admin_users (email, password_hash, full_name, staff_role, permissions, active)
      VALUES (${email2}, ${hash2}, ${fullName2}, ${staffRole2}, ${JSON.stringify(permissions2)}, true)
      RETURNING id, email, full_name, staff_role, permissions, active, created_at
    `;
    return res.status(201).json({ staff: publicStaff(created[0]) });
  }

  if (action === "update-staff") {
    var mgrSession3 = requireManager(req, res);
    if (!mgrSession3) return;
    var body3 = req.body || {};
    if (!body3.id) return res.status(400).json({ error: "id requis." });

    var targetRows = await sql`SELECT id, email, full_name, staff_role, permissions, active FROM admin_users WHERE id = ${body3.id}`;
    var target = targetRows[0];
    if (!target) return res.status(404).json({ error: "Compte introuvable." });

    var newEmail3 = body3.email ? String(body3.email).trim() : target.email;
    if (newEmail3 !== target.email) {
      var dupCheck = await sql`SELECT id FROM admin_users WHERE email = ${newEmail3} AND id != ${target.id}`;
      if (dupCheck.length) return res.status(409).json({ error: "Cet email est déjà utilisé par un autre compte." });
    }
    var newFullName3 = body3.fullName != null ? String(body3.fullName).trim() : target.full_name;
    var newStaffRole3 = body3.staffRole === "manager" || body3.staffRole === "employee" ? body3.staffRole : target.staff_role;
    var newPermissions3 = Array.isArray(body3.permissions) ? body3.permissions.filter(function (p) { return typeof p === "string"; }) : target.permissions;
    var newActive3 = typeof body3.active === "boolean" ? body3.active : target.active;

    // Un gérant ne peut ni se rétrograder ni se désactiver lui-même via ce endpoint --
    // évite de se retrouver bloqué hors du dashboard par erreur. Passe par "Mon compte"
    // pour changer son propre email/mot de passe.
    if (target.id === mgrSession3.id && (newStaffRole3 !== "manager" || newActive3 !== true)) {
      return res.status(400).json({ error: "Impossible de modifier votre propre rôle ou statut depuis cet écran." });
    }
    // Garde-fou : toujours garder au moins un gérant actif.
    if (target.staff_role === "manager" && (newStaffRole3 !== "manager" || newActive3 !== true)) {
      var otherManagers = await sql`SELECT id FROM admin_users WHERE staff_role = 'manager' AND active = true AND id != ${target.id}`;
      if (!otherManagers.length) {
        return res.status(400).json({ error: "Impossible : ce serait le dernier compte gérant actif." });
      }
    }

    var newHash3 = target.password_hash;
    if (body3.newPassword) {
      if (String(body3.newPassword).length < 8) {
        return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
      }
      newHash3 = await hashPassword(body3.newPassword);
    }

    var updated3 = await sql`
      UPDATE admin_users
      SET email = ${newEmail3}, full_name = ${newFullName3}, staff_role = ${newStaffRole3},
          permissions = ${JSON.stringify(newPermissions3)}, active = ${newActive3}, password_hash = ${newHash3}
      WHERE id = ${target.id}
      RETURNING id, email, full_name, staff_role, permissions, active, created_at
    `;
    return res.status(200).json({ staff: publicStaff(updated3[0]) });
  }

  if (action === "delete-staff") {
    var mgrSession4 = requireManager(req, res);
    if (!mgrSession4) return;
    var body4 = req.body || {};
    if (!body4.id) return res.status(400).json({ error: "id requis." });
    if (body4.id === mgrSession4.id) {
      return res.status(400).json({ error: "Impossible de supprimer votre propre compte." });
    }
    var targetRows4 = await sql`SELECT id, staff_role, active FROM admin_users WHERE id = ${body4.id}`;
    if (!targetRows4.length) return res.status(404).json({ error: "Compte introuvable." });
    if (targetRows4[0].staff_role === "manager" && targetRows4[0].active) {
      var otherManagers4 = await sql`SELECT id FROM admin_users WHERE staff_role = 'manager' AND active = true AND id != ${body4.id}`;
      if (!otherManagers4.length) {
        return res.status(400).json({ error: "Impossible : ce serait le dernier compte gérant actif." });
      }
    }
    await sql`DELETE FROM admin_users WHERE id = ${body4.id}`;
    return res.status(200).json({ ok: true });
  }

  // ---------- Connexion ----------
  var body = req.body || {};
  if (!body.email || !body.password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }
  var rows = await sql`SELECT id, email, password_hash, full_name, staff_role, permissions, active FROM admin_users WHERE email = ${body.email}`;
  var user = rows[0];
  // Message volontairement générique -- ne révèle jamais si l'email existe ou non.
  if (!user || !(await verifyPassword(body.password, user.password_hash))) {
    return res.status(401).json({ error: "Identifiants incorrects." });
  }
  if (!user.active) {
    return res.status(401).json({ error: "Ce compte a été désactivé. Contactez le gérant." });
  }
  createSession(res, ADMIN_COOKIE, {
    role: "admin", id: user.id, email: user.email, fullName: user.full_name,
    staffRole: user.staff_role, permissions: user.permissions
  });
  return res.status(200).json({
    ok: true, email: user.email, fullName: user.full_name,
    staffRole: user.staff_role, permissions: user.permissions
  });
};
