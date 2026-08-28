-- Schéma Postgres -- Tanger Carreaux backend (paiement + espace client + éditeur de
-- contenu du site).
--
-- Périmètre restreint : le reste du back-office (produits, fournisseurs, employés)
-- reste en localStorage côté admin/admin.js, hors périmètre validé pour ce backend --
-- voir le plan de la Phase 3. L'éditeur visuel (texte/images des pages + logo) a été
-- ajouté au périmètre pour que les modifications d'un manager soient visibles par TOUS
-- les visiteurs du site une fois publié -- pas seulement dans le navigateur qui a fait
-- la modification (limite du localStorage seul). Voir api/admin/page-edits.js et
-- api/page-content.js.
--
-- À exécuter une fois, manuellement, dans le SQL editor du dashboard Vercel Postgres
-- (ou `psql "$POSTGRES_URL" -f db/schema.sql` en local une fois .env.local rempli).
-- Pas de migration automatique pour l'instant : un seul schéma, appliqué une fois.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- pour gen_random_uuid()

CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref                TEXT NOT NULL UNIQUE, -- même format que l'existant : "TC-" + timestamp, voir js/main.js orderRef()
  customer_id        UUID REFERENCES customers(id), -- NULL = commande invité (le checkout invité reste possible, voir Phase 4)
  name               TEXT NOT NULL,
  phone              TEXT NOT NULL,
  city               TEXT NOT NULL,
  address            TEXT NOT NULL DEFAULT '',
  subtotal           NUMERIC(10, 2) NOT NULL, -- MAD, calculé serveur à partir de order_items -- jamais pris tel quel du client
  fulfillment_status TEXT NOT NULL DEFAULT 'pending', -- pending/preparing/shipping/done/cancelled -- voir lib/orderStatus.js, NE PAS diverger
  payment_method     TEXT NOT NULL, -- 'cod' | 'showroom' | 'online_card'
  payment_status     TEXT NOT NULL DEFAULT 'not_applicable', -- voir lib/orderStatus.js PAYMENT_STATUS
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL, -- schéma "tag::name", identique à dataFromCard() dans js/main.js -- clé de jointure avec products
  name        TEXT NOT NULL,
  tag         TEXT NOT NULL,
  qty         INTEGER NOT NULL,
  unit        TEXT NOT NULL,
  price       NUMERIC(10, 2) NOT NULL, -- prix unitaire réel au moment de la commande, revalidé serveur -- jamais celui envoyé par le client
  total       NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL DEFAULT 'youcanpay',
  provider_ref  TEXT, -- transaction_id YouCan Pay
  amount        NUMERIC(10, 2) NOT NULL,
  status        TEXT NOT NULL, -- reflète le statut réel renvoyé par YouCan Pay (voir lib/youcanpay.js verifyTransaction)
  raw_payload   JSONB, -- payload webhook/API brut, conservé pour audit
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table de prix "produits" utilisée UNIQUEMENT pour la revalidation serveur du prix au
-- checkout (voir lib/... et api/checkout.js) -- ce n'est pas un catalogue, juste un
-- miroir minimal id -> prix, seedé depuis les pages HTML réelles (db/seed-products.js).
CREATE TABLE IF NOT EXISTS products (
  id         TEXT PRIMARY KEY, -- "tag::name", identique à dataFromCard() dans js/main.js
  name       TEXT NOT NULL,
  tag        TEXT NOT NULL,
  price      NUMERIC(10, 2) NOT NULL,
  unit       TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Éditeur visuel (admin/ > Digital > Éditeur visuel / Médiathèque) : une ligne par
-- élément modifié sur une page. edit_key suit le même format que côté front
-- ("text:0", "img:2", "bg:1" -- index dans la liste filtrée des éléments modifiables
-- de CETTE page, voir EDIT_TEXT_SELECTOR / tcEditableImgEls / tcEditableBgEls dans
-- admin/admin.js et js/main.js -- gardez ces sélecteurs synchronisés entre les deux
-- fichiers, sinon l'index ne correspond plus au bon élément). value contient soit le
-- HTML du texte, soit une image en data URL (redimensionnée côté client avant envoi).
CREATE TABLE IF NOT EXISTS site_content_edits (
  page       TEXT NOT NULL,       -- ex. "index.html", "carrelage.html"
  edit_key   TEXT NOT NULL,       -- ex. "text:0", "img:3", "bg:1"
  edit_type  TEXT NOT NULL,       -- 'text' | 'img' | 'bg'
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (page, edit_key)
);

-- Réglages globaux à une seule valeur -- pour l'instant uniquement le logo (clé
-- 'global_logo'), appliqué sur toutes les pages. Table générique pour accueillir
-- d'éventuels futurs réglages du même genre sans nouvelle migration.
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
