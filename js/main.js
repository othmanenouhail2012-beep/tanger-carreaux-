// TANGER CARREAUX — comportements partagés du site

document.addEventListener("DOMContentLoaded", function () {
  // ---------- Synchronisation simulée avec le back-office (admin/) ----------
  // Lit les mêmes clés localStorage que admin/admin.js : simule une base de données
  // partagée (même navigateur / même origine uniquement — voir note de sécurité).
  (function () {
    var ADMIN_PRODUCTS_KEY = "tc-admin-products-v1";
    var ADMIN_SETTINGS_KEY = "tc-admin-settings-v1";
    var PLACEHOLDER_IMAGE =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23232a27'/%3E%3Cpath d='M22 70l18-24 14 17 10-12 18 19z' fill='%233a4440'/%3E%3Ccircle cx='32' cy='32' r='9' fill='%233a4440'/%3E%3C/svg%3E";

    function escapeHtmlSync(str) {
      var div = document.createElement("div");
      div.textContent = str == null ? "" : String(str);
      return div.innerHTML;
    }

    var adminProducts = [];
    try { adminProducts = JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || []; } catch (e) {}

    if (adminProducts.length) {
      // 1) Prix / promotions / suppressions sur les fiches déjà présentes sur la page
      document.querySelectorAll(".product-card").forEach(function (card) {
        var tagEl = card.querySelector(".product-tag");
        var h4 = card.querySelector("h4");
        var priceEl = card.querySelector(".product-price");
        if (!tagEl || !h4 || !priceEl || !priceEl.firstChild) return;
        var id = tagEl.textContent.trim() + "::" + h4.textContent.trim();
        var override = null;
        for (var i = 0; i < adminProducts.length; i++) {
          if (adminProducts[i].id === id && adminProducts[i].source === "site") { override = adminProducts[i]; break; }
        }
        if (!override) return;
        if (override.deleted) { card.style.display = "none"; return; }
        if (override.price == null) return;

        var raw = priceEl.firstChild.textContent || "";
        var isM2 = raw.indexOf("/m²") !== -1;
        var unitSuffix = isM2 ? "/m²" : "";
        var sellPrice = override.promoPrice != null ? override.promoPrice : override.price;
        priceEl.firstChild.textContent = sellPrice + " MAD" + unitSuffix;

        var oldStrike = priceEl.querySelector(".admin-old-price");
        if (override.promoPrice != null) {
          if (!oldStrike) {
            oldStrike = document.createElement("s");
            oldStrike.className = "admin-old-price";
            priceEl.appendChild(oldStrike);
          }
          oldStrike.textContent = override.price + " MAD" + unitSuffix;
          priceEl.classList.add("has-promo");
        } else if (oldStrike) {
          oldStrike.remove();
          priceEl.classList.remove("has-promo");
        }
      });

      // 2) Nouveaux produits ajoutés depuis le back-office, injectés sur la bonne page catégorie
      var currentPage = location.pathname.split("/").pop() || "index.html";
      var currentPageNoExt = currentPage.replace(/\.html$/, "");
      var searchWrap = document.querySelector("#productSearchWrap");
      var newProducts = adminProducts.filter(function (p) {
        var pPageNoExt = p.page.replace(/\.html$/, "");
        return p.source === "admin" && pPageNoExt === currentPageNoExt && !p.deleted;
      });
      if (newProducts.length && searchWrap) {
        var cardsContainer = document.querySelector("#adminNewProductsCards");
        if (!cardsContainer) {
          var row = document.createElement("div");
          row.className = "product-row";
          row.id = "adminNewProductsRow";
          row.innerHTML =
            '<div class="product-row-head"><h3>Ajoutés récemment</h3></div>' +
            '<div class="scroll-cards" id="adminNewProductsCards"></div>';
          searchWrap.insertAdjacentElement("afterend", row);
          cardsContainer = row.querySelector("#adminNewProductsCards");
        }
        newProducts.forEach(function (p) {
          if (cardsContainer.querySelector('[data-admin-id="' + p.id + '"]')) return;
          var sellPrice = p.promoPrice != null ? p.promoPrice : p.price;
          var priceHtml = sellPrice + " MAD<span>à partir de</span>";
          var card = document.createElement("div");
          card.className = "card product-card";
          card.setAttribute("data-admin-id", p.id);
          card.innerHTML =
            '<div class="product-visual"><span class="product-tag">' + escapeHtmlSync(p.tag || "Nouveau") + "</span>" +
            '<img src="' + escapeHtmlSync(p.image || PLACEHOLDER_IMAGE) + '" alt="' + escapeHtmlSync(p.name) + '" loading="lazy"></div>' +
            '<div class="product-body"><h4>' + escapeHtmlSync(p.name) + "</h4><p>" + escapeHtmlSync(p.description || "") + "</p>" +
            '<div class="product-price-row"><span class="product-price' + (p.promoPrice != null ? " has-promo" : "") + '">' + priceHtml +
            (p.promoPrice != null ? '<s class="admin-old-price">' + p.price + " MAD</s>" : "") + "</span>" +
            '<a href="contact.html" class="product-quote-link">Demander →</a></div></div>';
          cardsContainer.appendChild(card);
        });
      }
    }

    // 3) Numéros de téléphone / WhatsApp / horaires (Paramètres du site)
    var adminSettings = null;
    try { adminSettings = JSON.parse(localStorage.getItem(ADMIN_SETTINGS_KEY)); } catch (e) {}
    if (adminSettings) {
      var PHONE_SYNC = [
        { key: "tangerPhone1", originalTel: "+212539324696" },
        { key: "tangerPhone2", originalTel: "+212539324697" },
        { key: "casaPhone", originalTel: "+212653775609", waNumber: "212653775609" }
      ];
      PHONE_SYNC.forEach(function (entry) {
        var newDisplay = adminSettings[entry.key];
        if (!newDisplay) return;
        var digits = newDisplay.replace(/\D/g, "");
        if (!digits) return;
        var newTel = "+212" + digits.replace(/^0/, "");
        document.querySelectorAll('a[href="tel:' + entry.originalTel + '"]').forEach(function (a) {
          a.setAttribute("href", "tel:" + newTel);
          var lastText = null;
          for (var i = a.childNodes.length - 1; i >= 0; i--) {
            if (a.childNodes[i].nodeType === 3) { lastText = a.childNodes[i]; break; }
          }
          if (lastText) lastText.textContent = newDisplay;
          else a.textContent = newDisplay;
        });
        if (entry.waNumber) {
          var newWa = digits.replace(/^0/, "212");
          document.querySelectorAll('a[href^="https://wa.me/' + entry.waNumber + '"]').forEach(function (a) {
            a.setAttribute("href", a.getAttribute("href").replace(entry.waNumber, newWa));
          });
        }
      });
      var tangerHoursEl = document.querySelector("#tangerHoursValue");
      var casaHoursEl = document.querySelector("#casablancaHoursValue");
      if (tangerHoursEl && adminSettings.tangerHours) tangerHoursEl.textContent = adminSettings.tangerHours;
      if (casaHoursEl && adminSettings.casaHours) casaHoursEl.textContent = adminSettings.casaHours;
    }
  })();

  // ---------- Application des modifications de l'Éditeur visuel (admin/ > Éditeur visuel) ----------
  // Sélecteurs partagés avec admin/admin.js (attachEditingHandlers) : gardez-les identiques,
  // sinon l'index calculé ici ne correspondra plus à celui enregistré côté back-office.
  (function () {
    var PAGE_EDITS_KEY = "tc-admin-page-edits-v1";
    var GLOBAL_LOGO_KEY = "tc-admin-global-logo-v1";
    var EDIT_TEXT_SELECTOR = "main h1, main h2, main h3, main h4, main p, main li, main span.eyebrow";
    var EDIT_EXCLUDE_SELECTOR = ".product-card, .product-modal, .cart-drawer, .checkout-modal, form";

    function editableTextEls() {
      return Array.prototype.filter.call(document.querySelectorAll(EDIT_TEXT_SELECTOR), function (el) {
        return !el.closest(EDIT_EXCLUDE_SELECTOR);
      });
    }
    function editableImgEls() {
      return Array.prototype.filter.call(document.querySelectorAll("main img"), function (el) {
        return !el.closest(EDIT_EXCLUDE_SELECTOR) && !el.classList.contains("brand-mark");
      });
    }
    function editableBgEls() {
      return Array.prototype.filter.call(document.querySelectorAll('main [style*="background-image"]'), function (el) {
        return !el.closest(".product-card");
      });
    }
    // Petites icônes de contenu (fiches showroom, bandeau de confiance, cartes valeurs) --
    // volontairement PAS tous les SVG du site (menu, panier, etc. restent hors édition).
    function editableIconEls() {
      return Array.prototype.filter.call(
        document.querySelectorAll(".showroom-detail > svg, .trust-item > svg, .icon-badge > svg"),
        function (el) { return !el.closest(EDIT_EXCLUDE_SELECTOR); }
      );
    }
    function applyIconEdit(svg, dataUrl) {
      svg.style.display = "none";
      var img = svg.nextElementSibling;
      if (!img || !img.classList || !img.classList.contains("tc-icon-override")) {
        img = document.createElement("img");
        img.className = "tc-icon-override";
        img.alt = "";
        var cs = getComputedStyle(svg);
        img.style.width = cs.width;
        img.style.height = cs.height;
        img.style.flexShrink = "0";
        img.style.objectFit = "contain";
        svg.parentNode.insertBefore(img, svg.nextSibling);
      }
      img.src = dataUrl;
    }
    function applyEdits(pageEdits) {
      if (!pageEdits) return;
      var texts = editableTextEls(), imgs = editableImgEls(), bgs = editableBgEls(), icons = editableIconEls();
      Object.keys(pageEdits).forEach(function (key) {
        var edit = pageEdits[key];
        var idx = parseInt(key.split(":")[1], 10);
        if (edit.type === "text" && texts[idx]) texts[idx].innerHTML = edit.value;
        else if (edit.type === "img" && imgs[idx]) imgs[idx].src = edit.value;
        else if (edit.type === "bg" && bgs[idx]) bgs[idx].style.backgroundImage = "url('" + edit.value + "')";
        else if (edit.type === "color" && texts[idx]) texts[idx].style.color = edit.value;
        else if (edit.type === "icon" && icons[idx]) applyIconEdit(icons[idx], edit.value);
      });
    }
    function applyLogo(globalLogo) {
      if (!globalLogo) return;
      document.querySelectorAll(".brand-mark").forEach(function (el) { el.src = globalLogo; });
    }

    var currentPageEdit = location.pathname.split("/").pop() || "index.html";

    // 1) Application instantanée depuis localStorage -- utile surtout dans le même
    //    navigateur que celui qui vient de faire la modification (aperçu immédiat),
    //    et comme secours si l'API est indisponible.
    var localPageEdits = null, localLogo = null;
    try { localPageEdits = (JSON.parse(localStorage.getItem(PAGE_EDITS_KEY)) || {})[currentPageEdit]; } catch (e) {}
    try { localLogo = localStorage.getItem(GLOBAL_LOGO_KEY); } catch (e) {}
    applyEdits(localPageEdits);
    applyLogo(localLogo);

    // 2) Source de vérité réelle : api/page-content.js (base de données), pour que TOUT
    //    visiteur voie les modifications faites par le manager -- pas seulement le
    //    navigateur où elles ont été faites (le localStorage seul ne suffit pas une fois
    //    le site publié pour de vrais visiteurs). Réapplique par-dessus l'étape 1 dès que
    //    la réponse arrive ; silencieux si hors-ligne, en local via file://, ou backend
    //    pas encore déployé -- le contenu déjà présent dans le HTML reste affiché.
    if (location.protocol !== "file:") {
      fetch("/api/page-content?page=" + encodeURIComponent(currentPageEdit))
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          if (!data) return;
          applyEdits(data.edits);
          applyLogo(data.globalLogo);
        })
        .catch(function () { /* backend indisponible -- le contenu déjà affiché suffit */ });
    }
  })();

  // Menu mobile
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  // Sous-menu "Produits" (accordéon sur mobile, hover/clic sur desktop)
  document.querySelectorAll(".nav-item-dropdown").forEach(function (item) {
    var dropToggle = item.querySelector(".nav-dropdown-toggle");
    if (!dropToggle) return;
    dropToggle.addEventListener("click", function () {
      var isOpen = item.classList.toggle("open");
      dropToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  // Marquer le lien de nav actif selon l'URL courante
  var current = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === current) a.classList.add("active");
  });

  // Révélation au scroll (ignoré si GSAP ScrollTrigger a déjà pris le relais dans animations.js)
  var revealEls = document.querySelectorAll(".reveal");
  if (document.documentElement.classList.contains("gsap-active")) {
    // no-op — animé par GSAP
  } else if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // Formulaire de contact (statique — envoi via mailto en l'absence de backend)
  var form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      var name = form.querySelector("#name").value.trim();
      var email = form.querySelector("#email").value.trim();
      var phone = form.querySelector("#phone").value.trim();
      var subject = form.querySelector("#subject").value;
      var message = form.querySelector("#message").value.trim();

      if (!name || !email || !message) {
        status.textContent = "Merci de renseigner votre nom, votre email et votre message.";
        status.classList.add("show");
        status.classList.remove("ok");
        return;
      }

      var body = "Nom : " + name + "\nTéléphone : " + (phone || "-") + "\nEmail : " + email + "\n\n" + message;
      var mailto =
        "mailto:tangercarreaux1@gmail.com" +
        "?subject=" + encodeURIComponent("[Site web] " + (subject || "Demande de renseignement")) +
        "&body=" + encodeURIComponent(body);

      window.location.href = mailto;
      status.textContent = "Votre messagerie s'ouvre pour envoyer la demande à tangercarreaux1@gmail.com. Vous pouvez aussi nous appeler directement.";
      status.classList.add("show", "ok");
    });
  }

  // Fiches produits (modal au clic sur une carte produit)
  // NOTE : #productModal n'existe sur AUCUNE page du site (jamais ajouté au HTML) --
  // avant, tout ce bloc (y compris la recherche, les filtres ET la mise en page Market
  // avec #marketGrid plus bas) était gardé par "if (productModal && ...)" et donc ne
  // s'exécutait JAMAIS nulle part : aucune erreur, mais aucun produit affiché non plus.
  // On ne garde le if que sur productCards.length ; chaque usage de productModal est
  // protégé individuellement pour rester silencieux tant que la modale n'existe pas.
  var productModal = document.querySelector("#productModal");
  var productCards = document.querySelectorAll(".product-card");
  if (productCards.length) {
    var modalVisual = productModal ? productModal.querySelector(".product-modal-visual") : null;
    var modalTag = productModal ? productModal.querySelector(".product-modal-tag") : null;
    var modalTitle = productModal ? productModal.querySelector("#productModalTitle") : null;
    var modalDesc = productModal ? productModal.querySelector(".product-modal-desc") : null;
    var modalPrice = productModal ? productModal.querySelector(".product-modal-price-row .product-price") : null;
    var lastFocused = null;

    function openProductModal(card) {
      if (!productModal) return;
      var media = card.querySelector(".product-visual img, .product-visual svg");
      modalVisual.innerHTML = media ? media.outerHTML : "";
      modalTag.textContent = card.querySelector(".product-tag").textContent;
      modalTitle.textContent = card.querySelector("h4").textContent;
      modalDesc.textContent = card.querySelector(".product-body p").textContent;
      if (modalPrice) modalPrice.innerHTML = card.querySelector(".product-price").innerHTML;
      productModal._currentCardEl = card;
      lastFocused = document.activeElement;
      productModal.classList.add("open");
      productModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      productModal.querySelector(".product-modal-close").focus();
    }
    function closeProductModal() {
      if (!productModal) return;
      productModal.classList.remove("open");
      productModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    productCards.forEach(function (card) {
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.addEventListener("click", function (e) {
        if (e.target.closest(".product-quote-link, .product-fav-btn")) return;
        openProductModal(card);
      });
      card.addEventListener("keydown", function (e) {
        if (e.target.closest(".product-quote-link, .product-fav-btn")) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProductModal(card);
        }
      });
    });
    if (productModal) {
      productModal.querySelectorAll("[data-modal-close]").forEach(function (el) {
        el.addEventListener("click", closeProductModal);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && productModal.classList.contains("open")) closeProductModal();
      });
    }

    // Lien direct vers une fiche produit — utilisé par les QR codes générés dans le
    // back-office (admin/ > QR Codes > Produit du catalogue), ex: carrelage.html?produit=...
    // Même logique d'identifiant (marque::nom, ou data-admin-id) que la synchro admin ci-dessus.
    (function openProductFromQuery() {
      var wantedId = new URLSearchParams(location.search).get("produit");
      if (!wantedId) return;
      var target = null;
      productCards.forEach(function (card) {
        if (target) return;
        var id = card.getAttribute("data-admin-id");
        if (!id) {
          var tagEl = card.querySelector(".product-tag");
          var h4 = card.querySelector("h4");
          if (tagEl && h4) id = tagEl.textContent.trim() + "::" + h4.textContent.trim();
        }
        if (id === wantedId) target = card;
      });
      if (target) {
        target.scrollIntoView({ block: "center" });
        openProductModal(target);
      }
    })();

    // Favoris (mémorisés dans ce navigateur, par nom de produit)
    var FAV_KEY = "tc-favorites";
    function getFavs() {
      try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
    }
    function setFavs(list) {
      try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {}
    }
    var favs = getFavs();
    productCards.forEach(function (card) {
      var visual = card.querySelector(".product-visual");
      var h4 = card.querySelector("h4");
      if (!visual || !h4) return;
      var name = h4.textContent;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "product-fav-btn";
      btn.setAttribute("aria-label", "Ajouter aux favoris");
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
      if (favs.indexOf(name) !== -1) btn.classList.add("active");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var current = getFavs();
        var idx = current.indexOf(name);
        if (idx === -1) { current.push(name); btn.classList.add("active"); }
        else { current.splice(idx, 1); btn.classList.remove("active"); }
        setFavs(current);
      });
      visual.appendChild(btn);
    });

    // Recherche produit (filtre en direct les cartes par nom / catégorie)
    // + filtres catégorie / format / couleur / finition, construits dynamiquement
    // à partir des attributs data-cat / data-format / data-couleur / data-finition
    // réellement présents sur la page (aucune liste codée en dur : chaque page a son
    // propre vocabulaire de catégories).
    var searchInput = document.querySelector("#productSearch");
    var searchWrap = document.querySelector("#productSearchWrap");
    var searchEmpty = document.querySelector("#productSearchEmpty");
    var clearBtn = searchWrap ? searchWrap.querySelector(".product-search-clear") : null;
    var productRows = document.querySelectorAll(".product-row");
    // Liste stable de TOUTES les cartes, capturée une fois avant tout déplacement --
    // en mode Market, les cartes correspondantes sont physiquement déplacées dans
    // #marketGrid (voir applyFilter), donc reparcourir productRows à chaque rendu ne
    // retrouverait plus que les cartes pas encore déplacées. allProductCards reste
    // valide quel que soit leur parent actuel dans le DOM.
    var allProductCards = Array.prototype.slice.call(document.querySelectorAll(".product-card"));
    var filterBar = document.querySelector("#productFilterBar");
    var activeFilters = { cat: "", format: "", couleur: "", finition: "", priceMin: null, priceMax: null };

    // ----- Mise en page "Market" (pilote sur carrelage.html, voir #marketGrid) -----
    // Regroupement de la vraie taxonomie data-cat de la page sous des intitulés parents
    // plus lisibles façon marketplace (Sol / Mur / Effet matière / Style décoratif) --
    // choix d'organisation, pas une donnée produit : n'invente aucune valeur, ne fait
    // que regrouper les catégories réelles déjà présentes. Si une page n'a pas d'entrée
    // ici, l'arborescence retombe sur une liste plate (voir buildMarketCatTree).
    var MARKET_CATEGORY_GROUPS = {
      "carrelage.html": [
        { group: "Sol", cats: ["gres", "exterieur"] },
        { group: "Mur", cats: ["faience"] },
        { group: "Effet matière", cats: ["woods", "marbre", "ciment"] },
        { group: "Style décoratif", cats: ["origin", "naturel"] }
      ],
      "sanitaire.html": [
        { group: "Vasques", cats: ["lavabo"] },
        { group: "Bains & douches", cats: ["baignoire", "douche"] },
        { group: "Toilettes", cats: ["wc", "bidet"] }
      ],
      "mosaique-pierre.html": [
        { group: "Matière", cats: ["pierre", "verre"] },
        { group: "Formats & motifs", cats: ["formats"] }
      ],
      // Reprend exactement les 2 rangées déjà existantes de cette page (mêmes intitulés
      // réels : "Meubles vasques" / "Plans, colonnes & accessoires") -- pas une nouvelle
      // organisation, juste le même découpage retranscrit pour la sidebar.
      "meubles-salle-de-bain.html": [
        { group: "Meubles vasques", cats: ["simple-vasque", "double-vasque", "lave-mains", "personnalisable"] },
        { group: "Plans, colonnes & accessoires", cats: ["plan-vasque", "colonne", "accessoire"] }
      ],
      // Page de déstockage multi-catégories : regroupe par famille d'origine du produit.
      "destockage.html": [
        { group: "Salle de bain", cats: ["sdb", "sanitaire"] },
        { group: "Cuisine", cats: ["cuisine"] },
        { group: "Carrelage", cats: ["carrelage"] }
      ]
      // robinetterie.html (3 catégories) et miroirs-led.html (1 catégorie) : pas assez
      // de catégories pour qu'un regroupement apporte quoi que ce soit -- liste plate
      // (comportement par défaut de buildMarketCatTree en l'absence d'entrée ici).
    };
    var marketGrid = document.querySelector("#marketGrid");
    var marketCatTree = document.querySelector("#marketCatTree");
    var marketCount = document.querySelector("#marketCount");
    var marketSortSelect = document.querySelector("#marketSort");
    var marketPriceMin = document.querySelector("#marketPriceMin");
    var marketPriceMax = document.querySelector("#marketPriceMax");
    var marketPriceApply = document.querySelector("#marketPriceApply");

    // Libellés lisibles pour les valeurs data-couleur / data-finition (celles-ci sont
    // stockées sans accents en ASCII pour rester des attributs simples) — complété au fil
    // des pages, retombe sur une version générique si un nouveau token apparaît.
    var FILTER_VALUE_LABELS = {
      "anthracite": "Anthracite", "blanc": "Blanc", "noir": "Noir", "vert": "Vert",
      "bleu-petrole": "Bleu pétrole", "turquoise": "Turquoise", "gris": "Gris",
      "vert-imperial": "Vert impérial", "beige": "Beige", "bleu-pastel": "Bleu pastel",
      "chene-clair": "Chêne clair", "chrome": "Chromé", "or": "Or", "cuivre": "Cuivré",
      "dore": "Doré", "gris-anthracite": "Gris anthracite", "wengue-fonce": "Wengué foncé",
      "brillant": "Brillant", "brosse": "Brossé", "noir-mat": "Noir mat",
      "or-brosse": "Or brossé", "chrome-brillant": "Chromé brillant",
      "cuivre-brosse": "Cuivre brossé", "dore-brosse": "Doré brossé",
      "gris-anthracite-brosse": "Gris anthracite brossé", "lisse": "Lissé", "mat": "Mat",
      "mate-rectifiee": "Mate rectifiée", "poli": "Poli", "vieilli": "Vieilli",
      "ultra-brillant": "Ultra brillant"
    };
    function prettyLabel(token) {
      if (FILTER_VALUE_LABELS[token]) return FILTER_VALUE_LABELS[token];
      return token.replace(/-/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    // Construit la liste des valeurs distinctes présentes pour un attribut donné.
    // Pour "cat", réutilise l'intitulé déjà affiché du groupe (h3 du .product-row)
    // comme libellé plutôt que d'en inventer un à partir du code interne ("gres", "sdb"...).
    function collectFilterValues(attr, useRowHeading) {
      var values = [];
      function addValue(v, label) {
        if (!v || values.some(function (o) { return o.value === v; })) return;
        values.push({ value: v, label: label });
      }
      productRows.forEach(function (row) {
        if (useRowHeading) {
          var cardsWithAttr = row.querySelectorAll(".product-card[" + attr + "]");
          if (!cardsWithAttr.length) return;
          var heading = row.querySelector(".product-row-head h3");
          var headingText = heading ? heading.textContent.trim() : null;
          // Cas normal (une rangée = une seule catégorie, ex. carrelage/sanitaire/...) :
          // l'intitulé de la rangée reste le meilleur libellé. Cas particulier
          // (destockage.html : plusieurs catégories d'origine mélangées dans UNE seule
          // rangée "À prix cassé") : l'intitulé de rangée ne convient à aucune valeur en
          // particulier -- on retombe alors sur l'étiquette .product-tag propre à chaque
          // carte, réelle et déjà affichée, plutôt que d'inventer un libellé.
          var distinctValues = [];
          cardsWithAttr.forEach(function (c) {
            var v = c.getAttribute(attr);
            if (distinctValues.indexOf(v) === -1) distinctValues.push(v);
          });
          if (distinctValues.length === 1) {
            addValue(distinctValues[0], headingText || prettyLabel(distinctValues[0]));
          } else {
            cardsWithAttr.forEach(function (c) {
              var v = c.getAttribute(attr);
              var tagEl = c.querySelector(".product-tag");
              addValue(v, tagEl ? tagEl.textContent.trim() : prettyLabel(v));
            });
          }
          return;
        }
        row.querySelectorAll(".product-card[" + attr + "]").forEach(function (card) {
          (card.getAttribute(attr) || "").split(/\s+/).forEach(function (v) {
            addValue(v, prettyLabel(v));
          });
        });
      });
      values.sort(function (a, b) { return a.label.localeCompare(b.label, "fr"); });
      return values;
    }

    // Extrait le prix numérique d'une carte (même lecture que parsePriceFromCard plus bas
    // dans le module panier -- dupliqué ici car IIFE séparée, voir la convention déjà
    // suivie ailleurs dans ce fichier). Renvoie null pour "Prix sur devis" (pas de valeur
    // fixe, ne doit jamais être traité comme 0 par le filtre prix).
    function parseCardPriceValue(card) {
      var priceEl = card.querySelector(".product-price");
      if (!priceEl || !priceEl.firstChild) return null;
      var raw = (priceEl.firstChild.textContent || "").trim();
      var match = raw.match(/^([\d\s ]+)\s*MAD/);
      if (!match) return null;
      var value = parseInt(match[1].replace(/[\s ]/g, ""), 10);
      return value || null;
    }

    // Construit l'arborescence de catégories de la sidebar "Market" (voir #marketCatTree).
    // Réutilise les vraies valeurs/libellés de data-cat (collectFilterValues) -- le
    // regroupement en familles (Sol/Mur/...) est une organisation de menu, pas une donnée
    // produit inventée. Sans entrée dans MARKET_CATEGORY_GROUPS pour cette page, retombe
    // sur une liste plate de toutes les catégories réelles.
    function buildMarketCatTree() {
      if (!marketCatTree) return;
      var catValues = collectFilterValues("data-cat", true);
      if (!catValues.length) { marketCatTree.hidden = true; return; }
      var pageFile = location.pathname.split("/").pop() || "";
      var groups = MARKET_CATEGORY_GROUPS[pageFile];

      function countFor(catValue) {
        return document.querySelectorAll('.product-card[data-cat="' + catValue + '"]').length;
      }
      function makeLink(value, label) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "market-cat-link";
        btn.setAttribute("data-cat-value", value);
        btn.innerHTML = escapeHtmlLocal(label) + '<span class="market-cat-count">' + countFor(value) + "</span>";
        btn.addEventListener("click", function () {
          activeFilters.cat = activeFilters.cat === value ? "" : value;
          marketCatTree.querySelectorAll(".market-cat-link").forEach(function (el) {
            el.classList.toggle("is-active", el.getAttribute("data-cat-value") === activeFilters.cat);
          });
          applyFilter();
        });
        li.appendChild(btn);
        return li;
      }
      function escapeHtmlLocal(str) {
        var div = document.createElement("div");
        div.textContent = str == null ? "" : String(str);
        return div.innerHTML;
      }

      var allLi = document.createElement("li");
      var allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "market-cat-link is-active";
      allBtn.textContent = "Toutes les catégories";
      allBtn.addEventListener("click", function () {
        activeFilters.cat = "";
        marketCatTree.querySelectorAll(".market-cat-link").forEach(function (el) { el.classList.remove("is-active"); });
        allBtn.classList.add("is-active");
        applyFilter();
      });
      allLi.appendChild(allBtn);
      marketCatTree.appendChild(allLi);

      if (groups) {
        groups.forEach(function (g) {
          var groupLi = document.createElement("li");
          var groupLabel = document.createElement("span");
          groupLabel.className = "market-cat-group";
          groupLabel.textContent = g.group;
          groupLi.appendChild(groupLabel);
          var subUl = document.createElement("ul");
          g.cats.forEach(function (catValue) {
            var found = catValues.filter(function (o) { return o.value === catValue; })[0];
            if (found) subUl.appendChild(makeLink(found.value, found.label));
          });
          groupLi.appendChild(subUl);
          marketCatTree.appendChild(groupLi);
        });
      } else {
        catValues.forEach(function (o) { marketCatTree.appendChild(makeLink(o.value, o.label)); });
      }
    }
    buildMarketCatTree();

    if (filterBar) {
      [
        { key: "cat", attr: "data-cat", label: "Catégorie", useRowHeading: true },
        { key: "format", attr: "data-format", label: "Format", useRowHeading: false },
        { key: "couleur", attr: "data-couleur", label: "Couleur", useRowHeading: false },
        { key: "finition", attr: "data-finition", label: "Finition", useRowHeading: false }
      ].filter(function (g) {
        // La catégorie est déjà gérée par l'arborescence de la sidebar Market quand elle
        // existe -- éviter un double contrôle (dropdown + sidebar) pour la même chose.
        return !(marketCatTree && g.key === "cat");
      }).forEach(function (g) {
        var values = collectFilterValues(g.attr, g.useRowHeading);
        if (!values.length) return;
        var field = document.createElement("div");
        field.className = "product-filter-field";
        var select = document.createElement("select");
        select.setAttribute("aria-label", g.label);
        var optAll = document.createElement("option");
        optAll.value = "";
        optAll.textContent = g.label + " — tous";
        select.appendChild(optAll);
        values.forEach(function (o) {
          var opt = document.createElement("option");
          opt.value = o.value;
          opt.textContent = o.label;
          select.appendChild(opt);
        });
        select.addEventListener("change", function () {
          activeFilters[g.key] = select.value;
          select.classList.toggle("is-active", !!select.value);
          applyFilter();
        });
        field.appendChild(select);
        filterBar.appendChild(field);
      });
      if (!filterBar.children.length) filterBar.hidden = true;
    }

    function cardMatchesFilters(card) {
      if (activeFilters.cat && card.getAttribute("data-cat") !== activeFilters.cat) return false;
      var axes = ["format", "couleur", "finition"];
      for (var i = 0; i < axes.length; i++) {
        var key = axes[i];
        if (!activeFilters[key]) continue;
        var raw = card.getAttribute("data-" + key) || "";
        if (raw.split(/\s+/).indexOf(activeFilters[key]) === -1) return false;
      }
      if (activeFilters.priceMin != null || activeFilters.priceMax != null) {
        var price = parseCardPriceValue(card);
        // "Prix sur devis" (pas de valeur fixe) exclu dès qu'un filtre prix est actif --
        // on ne peut pas prétendre qu'il correspond à une fourchette qu'on ne connaît pas.
        if (price == null) return false;
        if (activeFilters.priceMin != null && price < activeFilters.priceMin) return false;
        if (activeFilters.priceMax != null && price > activeFilters.priceMax) return false;
      }
      return true;
    }

    function applyFilter() {
      var q = searchInput ? searchInput.value.trim().toLowerCase() : "";
      if (searchWrap) searchWrap.classList.toggle("has-value", q.length > 0);
      var anyFilterActive = activeFilters.cat || activeFilters.format || activeFilters.couleur ||
        activeFilters.finition || activeFilters.priceMin != null || activeFilters.priceMax != null;

      if (marketGrid) {
        // Mode "Market" : une seule grille plate plutôt que des rangées par catégorie.
        // Repart de la liste stable allProductCards (pas de productRows.forEach ici --
        // une fois une carte déplacée dans #marketGrid, elle n'est plus un descendant
        // de .product-row et serait invisible à un parcours basé sur les rangées).
        var matched = [];
        allProductCards.forEach(function (card) {
          var name = (card.querySelector("h4").textContent || "").toLowerCase();
          var tag = (card.querySelector(".product-tag").textContent || "").toLowerCase();
          var matchesText = !q || name.indexOf(q) !== -1 || tag.indexOf(q) !== -1;
          var match = matchesText && cardMatchesFilters(card);
          card.style.display = match ? "" : "none";
          if (match) matched.push(card);
        });
        var sortMode = marketSortSelect ? marketSortSelect.value : "default";
        if (sortMode === "price-asc" || sortMode === "price-desc") {
          matched.sort(function (a, b) {
            var pa = parseCardPriceValue(a), pb = parseCardPriceValue(b);
            // "Prix sur devis" (null) toujours envoyé en fin de liste, jamais traité comme 0
            if (pa == null && pb == null) return 0;
            if (pa == null) return 1;
            if (pb == null) return -1;
            return sortMode === "price-asc" ? pa - pb : pb - pa;
          });
        }
        matched.forEach(function (card) { marketGrid.appendChild(card); });
        if (marketCount) {
          marketCount.innerHTML = "<strong>" + matched.length + "</strong> produit" + (matched.length !== 1 ? "s" : "") +
            (allProductCards.length !== matched.length ? " affiché" + (matched.length !== 1 ? "s" : "") + " sur " + allProductCards.length : "");
        }
        if (searchEmpty) searchEmpty.style.display = matched.length === 0 ? "block" : "none";
        return;
      }

      var anyVisible = false;
      productRows.forEach(function (row) {
        var rowHasVisible = false;
        row.querySelectorAll(".product-card").forEach(function (card) {
          var name = (card.querySelector("h4").textContent || "").toLowerCase();
          var tag = (card.querySelector(".product-tag").textContent || "").toLowerCase();
          var matchesText = !q || name.indexOf(q) !== -1 || tag.indexOf(q) !== -1;
          var match = matchesText && cardMatchesFilters(card);
          card.style.display = match ? "" : "none";
          if (match) { rowHasVisible = true; anyVisible = true; }
        });
        row.style.display = rowHasVisible ? "" : "none";
      });
      if (searchEmpty) searchEmpty.style.display = (q || anyFilterActive) && !anyVisible ? "block" : "none";
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilter);
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          searchInput.value = "";
          applyFilter();
          searchInput.focus();
        });
      }
    }
    if (marketSortSelect) marketSortSelect.addEventListener("change", applyFilter);
    if (marketPriceApply) {
      marketPriceApply.addEventListener("click", function () {
        var minVal = marketPriceMin && marketPriceMin.value !== "" ? parseInt(marketPriceMin.value, 10) : null;
        var maxVal = marketPriceMax && marketPriceMax.value !== "" ? parseInt(marketPriceMax.value, 10) : null;
        activeFilters.priceMin = isNaN(minVal) ? null : minVal;
        activeFilters.priceMax = isNaN(maxVal) ? null : maxVal;
        applyFilter();
      });
    }
    // Rendu initial : place les cartes dans #marketGrid dès le chargement (sinon la
    // grille reste vide tant qu'aucun filtre n'a été touché).
    if (marketGrid) applyFilter();
  }

  // Rangées de produits défilantes (une flèche gauche/droite par rangée)
  document.querySelectorAll(".product-row").forEach(function (row) {
    var track = row.querySelector(".scroll-cards");
    if (!track) return;
    row.querySelectorAll(".scroll-arrow").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = parseInt(btn.dataset.scroll, 10) || 1;
        track.scrollBy({ left: dir * 320, behavior: "smooth" });
      });
    });
  });

  // Année courante dans le footer
  document.querySelectorAll(".current-year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Panier & tunnel de commande ----------
  (function () {
    var CART_KEY = "tc-cart-v1";
    var WHATSAPP_NUMBER = "212653775609";

    var cartToggle = document.querySelector("#cartToggle");
    var cartCountEl = document.querySelector("#cartCount");
    var cartDrawer = document.querySelector("#cartDrawer");
    var cartDrawerBody = document.querySelector("#cartDrawerBody");
    var cartSubtotalEl = document.querySelector("#cartSubtotal");
    var cartCheckoutBtn = document.querySelector("#cartCheckoutBtn");
    var checkoutModal = document.querySelector("#checkoutModal");
    if (!cartToggle || !cartDrawer || !checkoutModal) return;

    var checkoutStepForm = checkoutModal.querySelector("#checkoutStepForm");
    var checkoutStepRecap = checkoutModal.querySelector("#checkoutStepRecap");
    var checkoutSummaryMini = checkoutModal.querySelector("#checkoutSummaryMini");
    var checkoutSummaryTotal = checkoutModal.querySelector("#checkoutSummaryTotal");
    var checkoutForm = checkoutModal.querySelector("#checkoutForm");
    var checkoutFormError = checkoutModal.querySelector("#checkoutFormError");
    var orderRecapEl = checkoutModal.querySelector("#orderRecap");
    var recapWhatsapp = checkoutModal.querySelector("#recapWhatsapp");
    var checkoutRecapClose = checkoutModal.querySelector("#checkoutRecapClose");

    function getCart() {
      try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
    }
    function saveCart(cart) {
      try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    }
    function formatMAD(n) {
      var s = Math.round(n).toString();
      s = s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return s + " MAD";
    }
    function cartTotal(cart) {
      var total = 0;
      cart.forEach(function (i) { total += i.price * i.qty; });
      return total;
    }
    function cartCount(cart) {
      var count = 0;
      cart.forEach(function (i) { count += i.qty; });
      return count;
    }
    function escapeHtml(str) {
      var div = document.createElement("div");
      div.textContent = str == null ? "" : String(str);
      return div.innerHTML;
    }

    function parsePriceFromCard(card) {
      var priceEl = card.querySelector(".product-price");
      if (!priceEl || !priceEl.firstChild) return null;
      var raw = (priceEl.firstChild.textContent || "").trim();
      var match = raw.match(/^([\d\s  ]+)\s*MAD(\/m²)?/);
      if (!match) return null;
      var value = parseInt(match[1].replace(/[\s  ]/g, ""), 10);
      if (!value) return null;
      return { value: value, unit: match[2] ? "m²" : "unité" };
    }

    function dataFromCard(card) {
      var priceInfo = parsePriceFromCard(card);
      if (!priceInfo) return null;
      var h4 = card.querySelector("h4");
      var tag = card.querySelector(".product-tag");
      var img = card.querySelector(".product-visual img");
      if (!h4) return null;
      var name = h4.textContent.trim();
      return {
        id: (tag ? tag.textContent.trim() : "") + "::" + name,
        name: name,
        tag: tag ? tag.textContent.trim() : "",
        price: priceInfo.value,
        unit: priceInfo.unit,
        image: img ? img.src : ""
      };
    }

    function bumpCartIcon() {
      if (!cartToggle) return;
      cartToggle.classList.remove("bump");
      void cartToggle.offsetWidth;
      cartToggle.classList.add("bump");
    }

    function addToCart(data, qty) {
      qty = qty || 1;
      var cart = getCart();
      var existing = null;
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === data.id) { existing = cart[i]; break; }
      }
      if (existing) existing.qty += qty;
      else cart.push({ id: data.id, name: data.name, tag: data.tag, price: data.price, unit: data.unit, image: data.image, qty: qty });
      saveCart(cart);
      renderCartBadge();
      renderCartDrawer();
      bumpCartIcon();
    }
    function updateQty(id, delta) {
      var cart = getCart();
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
          cart[i].qty += delta;
          if (cart[i].qty < 1) cart.splice(i, 1);
          break;
        }
      }
      saveCart(cart);
      renderCartBadge();
      renderCartDrawer();
    }
    function removeItem(id) {
      var cart = getCart().filter(function (i) { return i.id !== id; });
      saveCart(cart);
      renderCartBadge();
      renderCartDrawer();
    }
    function clearCart() {
      saveCart([]);
      renderCartBadge();
      renderCartDrawer();
    }

    function renderCartBadge() {
      var count = cartCount(getCart());
      if (cartCountEl) {
        cartCountEl.textContent = count;
      }
    }

    function renderCartDrawer() {
      var cart = getCart();
      if (!cartDrawerBody) return;
      if (!cart.length) {
        cartDrawerBody.innerHTML = '<p class="cart-empty">Votre panier est vide pour le moment. Parcourez nos catalogues pour ajouter des produits.</p>';
      } else {
        var html = "";
        cart.forEach(function (item) {
          var lineTotal = item.price * item.qty;
          var visual = item.image ? '<img src="' + item.image + '" alt="">' : "";
          html +=
            '<div class="cart-item" data-id="' + escapeHtml(item.id) + '">' +
              '<div class="cart-item-visual">' + visual + "</div>" +
              "<div>" +
                '<p class="cart-item-name">' + escapeHtml(item.name) + "</p>" +
                '<p class="cart-item-unit-price">' + formatMAD(item.price) + " / " + escapeHtml(item.unit) + "</p>" +
                '<div class="cart-item-qty">' +
                  '<button type="button" data-qty="-1" aria-label="Diminuer la quantité">−</button>' +
                  "<span>" + item.qty + "</span>" +
                  '<button type="button" data-qty="1" aria-label="Augmenter la quantité">+</button>' +
                "</div>" +
              "</div>" +
              '<div class="cart-item-end">' +
                '<span class="cart-item-total">' + formatMAD(lineTotal) + "</span>" +
                '<button type="button" class="cart-item-remove" data-remove>Retirer</button>' +
              "</div>" +
            "</div>";
        });
        cartDrawerBody.innerHTML = html;
      }
      if (cartSubtotalEl) cartSubtotalEl.textContent = formatMAD(cartTotal(cart));
    }

    function openCartDrawer() {
      renderCartDrawer();
      cartDrawer.classList.add("open");
      cartDrawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeCartDrawer() {
      cartDrawer.classList.remove("open");
      cartDrawer.setAttribute("aria-hidden", "true");
      if (!checkoutModal.classList.contains("open")) document.body.style.overflow = "";
    }

    cartToggle.addEventListener("click", openCartDrawer);
    cartDrawer.querySelectorAll("[data-cart-close]").forEach(function (el) {
      el.addEventListener("click", closeCartDrawer);
    });
    if (cartDrawerBody) {
      cartDrawerBody.addEventListener("click", function (e) {
        var item = e.target.closest(".cart-item");
        if (!item) return;
        var id = item.getAttribute("data-id");
        var qtyBtn = e.target.closest("[data-qty]");
        var removeBtn = e.target.closest("[data-remove]");
        if (qtyBtn) updateQty(id, parseInt(qtyBtn.getAttribute("data-qty"), 10));
        else if (removeBtn) removeItem(id);
      });
    }

    // ----- Boutons "Ajouter au panier" sur les fiches produits -----
    document.querySelectorAll(".product-card").forEach(function (card) {
      var data = dataFromCard(card);
      if (!data) return;

      // Étiquette + bouton d'ajout rapide au survol de l'image
      var visual = card.querySelector(".product-visual");
      if (visual && !visual.querySelector(".product-hover-overlay")) {
        var overlay = document.createElement("div");
        overlay.className = "product-hover-overlay";
        overlay.innerHTML =
          '<span class="product-hover-label">' + escapeHtml(data.name) + "</span>" +
          '<button type="button" class="product-hover-add" aria-label="Ajouter ' + escapeHtml(data.name) + ' au panier">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>';
        visual.appendChild(overlay);
        overlay.querySelector(".product-hover-add").addEventListener("click", function (e) {
          e.stopPropagation();
          addToCart(data, 1);
          openCartDrawer();
        });
      }

      if (card.querySelector(".product-add-btn")) return;
      var row = card.querySelector(".product-price-row");
      if (!row) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "product-add-btn";
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        "<span>Ajouter au panier</span>";
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        addToCart(data, 1);
        btn.classList.add("added");
        btn.querySelector("span").textContent = "Ajouté ✓";
        openCartDrawer();
        setTimeout(function () {
          btn.classList.remove("added");
          btn.querySelector("span").textContent = "Ajouter au panier";
        }, 1600);
      });
      row.insertAdjacentElement("afterend", btn);
    });

    // ----- Bouton "Ajouter au panier" dans la fiche produit modale -----
    var productModalEl = document.querySelector("#productModal");
    if (productModalEl) {
      var modalPriceRow = productModalEl.querySelector(".product-modal-price-row");
      if (modalPriceRow && !modalPriceRow.querySelector(".product-add-btn")) {
        var modalAddBtn = document.createElement("button");
        modalAddBtn.type = "button";
        modalAddBtn.className = "btn btn-outline btn-sm product-add-btn";
        modalAddBtn.innerHTML = "<span>Ajouter au panier</span>";
        modalAddBtn.addEventListener("click", function () {
          var card = productModalEl._currentCardEl;
          if (!card) return;
          var data = dataFromCard(card);
          if (!data) return;
          addToCart(data, 1);
          modalAddBtn.querySelector("span").textContent = "Ajouté ✓";
          openCartDrawer();
          setTimeout(function () { modalAddBtn.querySelector("span").textContent = "Ajouter au panier"; }, 1600);
        });
        modalPriceRow.appendChild(modalAddBtn);

        // Cache le bouton pour les produits "Prix sur devis" (pas de prix fixe à ajouter)
        var modalObserver = new MutationObserver(function () {
          if (!productModalEl.classList.contains("open")) return;
          var card = productModalEl._currentCardEl;
          var data = card ? dataFromCard(card) : null;
          modalAddBtn.style.display = data ? "" : "none";
          modalAddBtn.querySelector("span").textContent = "Ajouter au panier";
        });
        modalObserver.observe(productModalEl, { attributes: true, attributeFilter: ["class"] });
      }
    }

    // ----- Tunnel de commande (validation finale) -----
    function renderCheckoutSummary() {
      var cart = getCart();
      var html = "";
      cart.forEach(function (item) {
        var thumb = item.image ? '<img class="cs-thumb" src="' + escapeHtml(item.image) + '" alt="">' : '<div class="cs-thumb"></div>';
        html +=
          '<div class="checkout-summary-mini-row">' + thumb +
          '<div class="cs-info"><span class="cs-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="cs-qty">' + item.qty + " × " + escapeHtml(item.unit) + "</span></div>" +
          '<span class="cs-price">' + formatMAD(item.price * item.qty) + "</span></div>";
      });
      if (checkoutSummaryMini) checkoutSummaryMini.innerHTML = html;
      if (checkoutSummaryTotal) checkoutSummaryTotal.textContent = formatMAD(cartTotal(cart));
    }

    var ckDeliveryModeSelect = checkoutModal.querySelector("#ckDeliveryMode");
    var ckAddressField = checkoutModal.querySelector("#ckAddressField");
    var youcanPayPanel = checkoutModal.querySelector("#youcanPayPanel");
    var youcanPayElement = checkoutModal.querySelector("#youcanPayElement");
    var youcanPayNote = checkoutModal.querySelector("#youcanPayNote");

    function currentPaymentValue() {
      var checked = checkoutModal.querySelector('input[name="payment"]:checked');
      return checked ? checked.value : "";
    }
    function isDeliveryMode(value) {
      return value === "Paiement à la livraison";
    }
    // Le sélecteur "Mode de réception" (#ckDeliveryMode) ne couvre volontairement que
    // livraison/showroom -- le paiement en ligne est un axe de paiement, pas de
    // réception, donc pas d'option correspondante là-bas (choix de portée délibéré,
    // ce point n'étant de toute façon pas testable sans compte marchand réel).
    function isOnlineCardMode(value) {
      return value === "Paiement en ligne";
    }
    function syncPaymentOptionStyles() {
      checkoutModal.querySelectorAll(".payment-tab").forEach(function (opt) {
        var input = opt.querySelector("input");
        opt.classList.toggle("is-checked", !!(input && input.checked));
      });
      var value = currentPaymentValue();
      if (ckDeliveryModeSelect && !isOnlineCardMode(value)) ckDeliveryModeSelect.value = value;
      if (ckAddressField) ckAddressField.classList.toggle("is-hidden", !isDeliveryMode(value));
      if (youcanPayPanel) youcanPayPanel.classList.toggle("is-hidden", !isOnlineCardMode(value));
    }
    checkoutModal.querySelectorAll(".payment-tab input").forEach(function (radio) {
      radio.addEventListener("change", syncPaymentOptionStyles);
    });
    if (ckDeliveryModeSelect) {
      ckDeliveryModeSelect.addEventListener("change", function () {
        checkoutModal.querySelectorAll('input[name="payment"]').forEach(function (radio) {
          radio.checked = radio.value === ckDeliveryModeSelect.value;
        });
        syncPaymentOptionStyles();
      });
    }

    function openCheckoutModal() {
      if (!getCart().length) return;
      renderCheckoutSummary();
      syncPaymentOptionStyles();
      if (checkoutStepForm) checkoutStepForm.hidden = false;
      if (checkoutStepRecap) checkoutStepRecap.hidden = true;
      if (checkoutFormError) { checkoutFormError.classList.remove("show"); checkoutFormError.textContent = ""; }
      checkoutModal.classList.add("open");
      checkoutModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var firstInput = checkoutModal.querySelector("#ckName");
      if (firstInput) firstInput.focus();
    }
    function closeCheckoutModal() {
      checkoutModal.classList.remove("open");
      checkoutModal.setAttribute("aria-hidden", "true");
      if (!cartDrawer.classList.contains("open")) document.body.style.overflow = "";
    }

    if (cartCheckoutBtn) {
      cartCheckoutBtn.addEventListener("click", function () {
        closeCartDrawer();
        openCheckoutModal();
      });
    }
    checkoutModal.querySelectorAll("[data-checkout-close]").forEach(function (el) {
      el.addEventListener("click", closeCheckoutModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (checkoutModal.classList.contains("open")) closeCheckoutModal();
      else if (cartDrawer.classList.contains("open")) closeCartDrawer();
    });

    function orderRef() {
      return "TC-" + Date.now().toString().slice(-6);
    }
    function pad2(n) { return n < 10 ? "0" + n : "" + n; }
    function formatDate(d) {
      return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear() + " à " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    }

    function buildOrder(cart, customer) {
      return {
        ref: orderRef(),
        date: new Date(),
        items: cart.map(function (i) { return { name: i.name, tag: i.tag, qty: i.qty, unit: i.unit, price: i.price, total: i.price * i.qty }; }),
        subtotal: cartTotal(cart),
        customer: customer
      };
    }

    function renderOrderRecap(order) {
      if (!orderRecapEl) return;
      var itemsHtml = order.items.map(function (i) {
        return (
          '<div class="order-recap-item"><span class="oi-name">' +
          escapeHtml(i.name) + (i.tag ? " <small>(" + escapeHtml(i.tag) + ")</small>" : "") +
          '</span><span class="oi-qty">' + i.qty + " " + escapeHtml(i.unit) + '</span><span class="oi-total">' + formatMAD(i.total) + "</span></div>"
        );
      }).join("");
      var discountHtml = order.discount
        ? '<div class="order-recap-discount"><span>Code promo ' + escapeHtml(order.promoCode || "") + '</span><span>-' + formatMAD(order.discount) + "</span></div>"
        : "";
      orderRecapEl.innerHTML =
        '<div class="order-recap-ref">Commande N° ' + order.ref + " — " + formatDate(order.date) + "</div>" +
        '<div class="order-recap-items">' + itemsHtml + "</div>" +
        discountHtml +
        '<div class="order-recap-total"><span>Total estimé</span><strong>' + formatMAD(order.subtotal) + "</strong></div>" +
        '<div class="order-recap-client">' +
          "<div><strong>Client</strong><span>" + escapeHtml(order.customer.name) + "</span></div>" +
          "<div><strong>Téléphone</strong><span>" + escapeHtml(order.customer.phone) + "</span></div>" +
          "<div><strong>Ville</strong><span>" + escapeHtml(order.customer.city) + "</span></div>" +
          (order.customer.address ? "<div><strong>Adresse</strong><span>" + escapeHtml(order.customer.address) + "</span></div>" : "") +
          "<div><strong>Paiement</strong><span>" + escapeHtml(order.customer.payment) + "</span></div>" +
        "</div>";
    }

    function orderText(order) {
      var lines = [];
      lines.push("Nouvelle commande " + order.ref + " (" + formatDate(order.date) + ")");
      lines.push("");
      order.items.forEach(function (i) {
        lines.push("- " + i.name + " : " + i.qty + " " + i.unit + " x " + formatMAD(i.price) + " = " + formatMAD(i.total));
      });
      lines.push("");
      lines.push("Total estimé : " + formatMAD(order.subtotal));
      lines.push("");
      lines.push("Client : " + order.customer.name);
      lines.push("Téléphone : " + order.customer.phone);
      lines.push("Ville : " + order.customer.city);
      if (order.customer.address) lines.push("Adresse : " + order.customer.address);
      lines.push("Paiement : " + order.customer.payment);
      return lines.join("\n");
    }

    function wireRecapActions(order) {
      var text = orderText(order);
      if (recapWhatsapp) recapWhatsapp.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
    }

    // Simule l'enregistrement de la commande côté back-office (admin/), lu par admin/admin.js
    function pushOrderToAdmin(order) {
      try {
        var key = "tc-admin-orders-v1";
        var list = JSON.parse(localStorage.getItem(key)) || [];
        list.push({
          id: order.ref,
          ref: order.ref,
          date: order.date.getTime(),
          dateLabel: formatDate(order.date),
          customer: order.customer,
          items: order.items,
          subtotal: order.subtotal,
          status: "pending"
        });
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {}
    }

    // Envoie la commande au vrai backend (POST /api/checkout, prix revalidé serveur --
    // voir api/checkout.js). Retourne les données confirmées par le serveur.
    function submitCheckoutToBackend(cart, customerFields, paymentMethod, promoCode) {
      var payload = {
        items: cart.map(function (i) { return { id: i.id, qty: i.qty }; }),
        customer: { name: customerFields.name, phone: customerFields.phone, city: customerFields.city, address: customerFields.address },
        paymentMethod: paymentMethod
      };
      if (promoCode) payload.promoCode = promoCode;
      return fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var err = new Error(data.error || "Erreur serveur.");
            // 400 = requête refusée par un serveur bien atteint (code promo invalide,
            // produit inconnu, champ manquant...) -- distingué d'une vraie panne (5xx,
            // timeout réseau...) via isValidationError, pour ne créer une commande locale
            // de secours QUE dans ce dernier cas (voir le .catch du submit plus bas) :
            // une commande de secours sur un 400 ignorerait silencieusement l'erreur
            // (ex. un code promo refusé serait simplement perdu et le client facturé
            // plein tarif sans le savoir). Un vrai 5xx garde le comportement d'origine
            // ("on ne bloque jamais une commande pour une panne serveur").
            if (res.status === 400) err.isValidationError = true;
            throw err;
          }
          return data;
        });
      });
    }

    // ----- Paiement en ligne YouCan Pay (yp.js) -----
    // Jamais exercé en conditions réelles à ce jour (pas de compte marchand actif,
    // voir la Phase 5 du plan) -- basé sur la documentation publique officielle
    // (developer.youcan.shop/youcan-pay/yp-js/getting-started), vérifiée le
    // 2026-08-08. Tant que le serveur ne renvoie pas de bloc `youcanpay` dans la
    // réponse (voir api/checkout.js), ce chemin n'est jamais emprunté.
    var YOUCANPAY_SCRIPT_URL = "https://youcanpay.com/yp.js";
    var youcanPayScriptPromise = null;
    function loadYouCanPayScript() {
      if (window.yp) return Promise.resolve();
      if (youcanPayScriptPromise) return youcanPayScriptPromise;
      youcanPayScriptPromise = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = YOUCANPAY_SCRIPT_URL;
        script.onload = function () { resolve(); };
        script.onerror = function () { reject(new Error("Impossible de charger le module de paiement.")); };
        document.head.appendChild(script);
      });
      return youcanPayScriptPromise;
    }
    // Monte le formulaire carte dans #youcanPayElement et résout une fois le paiement
    // confirmé avec succès (rejette sinon -- jamais de succès simulé). Le bouton
    // "Confirmer ma commande" original reste désactivé pendant ce temps ; c'est le
    // bouton "Valider le paiement" du widget qui déclenche payment.confirm().
    function collectOnlineCardPayment(youcanpayData) {
      return loadYouCanPayScript().then(function () {
        return new Promise(function (resolve, reject) {
          if (youcanPayNote) youcanPayNote.textContent = "";
          if (!youcanPayElement) { reject(new Error("Formulaire de paiement indisponible.")); return; }
          youcanPayElement.innerHTML = "";
          var payment = window.yp(youcanpayData.publicKey, { locale: "fr" }).elements({
            token: youcanpayData.tokenId,
            container: "#youcanPayElement"
          });
          payment.mount();

          var payBtn = document.createElement("button");
          payBtn.type = "button";
          payBtn.className = "btn btn-primary btn-block";
          payBtn.style.marginTop = "14px";
          payBtn.textContent = "Valider le paiement";
          youcanPayElement.insertAdjacentElement("afterend", payBtn);

          payBtn.addEventListener("click", function () {
            payBtn.disabled = true;
            payment
              .confirm()
              .then(function (result) {
                if (result.status === "succeeded") {
                  resolve(result);
                  return;
                }
                payBtn.disabled = false;
                if (youcanPayNote) youcanPayNote.textContent = (result.error && result.error.message) || "Le paiement a échoué, réessayez.";
              })
              .catch(function (err) {
                payBtn.disabled = false;
                if (youcanPayNote) youcanPayNote.textContent = "Erreur de paiement : " + err.message;
              });
          });
        });
      });
    }

    // Termine la commande côté UI, que la source soit le backend réel ou le secours
    // local -- même rendu de récap/WhatsApp dans les deux cas.
    function finalizeOrder(order, note) {
      renderOrderRecap(order);
      if (note && orderRecapEl) {
        var noteEl = document.createElement("p");
        noteEl.className = "order-recap-note";
        noteEl.textContent = note;
        orderRecapEl.appendChild(noteEl);
      }
      wireRecapActions(order);
      // TODO(#9 admin API) : retirer une fois admin/admin.js branché sur /api/admin/orders --
      // gardé pour l'instant pour que l'admin (encore 100% localStorage) continue de voir
      // les commandes, y compris celles réellement enregistrées côté serveur.
      pushOrderToAdmin(order);
      clearCart();
      if (checkoutStepForm) checkoutStepForm.hidden = true;
      if (checkoutStepRecap) checkoutStepRecap.hidden = false;
    }

    if (checkoutForm) {
      checkoutForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var cart = getCart();
        if (!cart.length) return;
        var name = checkoutForm.querySelector("#ckName").value.trim();
        var phone = checkoutForm.querySelector("#ckPhone").value.trim();
        var city = checkoutForm.querySelector("#ckCity").value.trim();
        var address = checkoutForm.querySelector("#ckAddress").value.trim();
        var paymentInput = checkoutForm.querySelector('input[name="payment"]:checked');
        var payment = paymentInput ? paymentInput.value : "";
        var isDelivery = isDeliveryMode(payment);

        if (!name || !phone || !city || (isDelivery && !address)) {
          if (checkoutFormError) {
            checkoutFormError.textContent = isDelivery
              ? "Merci de renseigner votre nom, votre téléphone, votre ville et votre adresse de livraison."
              : "Merci de renseigner votre nom, votre téléphone et votre ville.";
            checkoutFormError.classList.add("show");
          }
          return;
        }
        if (checkoutFormError) checkoutFormError.classList.remove("show");

        var isOnlineCard = isOnlineCardMode(payment);
        var customerFields = { name: name, phone: phone, city: city, address: isDelivery ? address : "" };
        var paymentMethod = isOnlineCard ? "online_card" : (isDelivery ? "cod" : "showroom");
        var submitBtn = checkoutForm.querySelector(".btn-confirm-order");
        if (submitBtn) submitBtn.disabled = true;
        var promoInput = checkoutForm.querySelector("#ckPromoCode");
        var promoCode = promoInput ? promoInput.value.trim() : "";

        submitCheckoutToBackend(cart, customerFields, paymentMethod, promoCode)
          .then(function (serverOrder) {
            // Commande réellement enregistrée en base -- on affiche les données
            // confirmées par le serveur (ref/prix revalidés), pas celles du client.
            var order = {
              ref: serverOrder.ref,
              date: new Date(),
              items: serverOrder.items.map(function (i) {
                return { name: i.name, tag: i.tag, qty: i.qty, unit: i.unit, price: i.price, total: i.total };
              }),
              subtotal: serverOrder.subtotal,
              discount: serverOrder.discount || 0,
              promoCode: serverOrder.promoCode || "",
              customer: { name: name, phone: phone, city: city, address: isDelivery ? address : "", payment: payment }
            };

            if (serverOrder.youcanpay) {
              // YouCan Pay configuré (jamais le cas testé à ce jour) -- affiche le
              // formulaire carte et attend une vraie confirmation avant de finaliser.
              if (youcanPayNote) youcanPayNote.textContent = "Complétez le paiement ci-dessous pour finaliser votre commande " + order.ref + ".";
              return collectOnlineCardPayment(serverOrder.youcanpay).then(function () {
                finalizeOrder(order, "Paiement confirmé. Merci pour votre commande !");
              });
            }

            finalizeOrder(order, serverOrder.message || serverOrder.paymentError || null);
            if (submitBtn) submitBtn.disabled = false;
          })
          .catch(function (err) {
            // Requête refusée par un serveur bien atteint (code promo invalide, produit
            // inconnu...) : affiche l'erreur et laisse le client corriger, jamais de
            // commande de secours ici (voir isValidationError plus haut).
            if (err.isValidationError) {
              if (checkoutFormError) { checkoutFormError.textContent = err.message; checkoutFormError.classList.add("show"); }
              if (submitBtn) submitBtn.disabled = false;
              return;
            }
            // Backend pas encore déployé (pas de compte Vercel/DB actif) ou souci réseau --
            // on ne bloque jamais une commande pour cette raison : secours identique au
            // comportement client-only d'avant ce changement, avec prix du panier local.
            // Pour le paiement en ligne spécifiquement, jamais de faux "payé" -- message
            // honnête indiquant que le règlement se fera par un autre canal.
            console.warn("Checkout backend indisponible, secours local :", err.message);
            var order = buildOrder(cart, { name: name, phone: phone, city: city, address: isDelivery ? address : "", payment: payment });
            var note = isOnlineCard
              ? "Le paiement en ligne est momentanément indisponible. Votre commande " + order.ref + " est enregistrée, notre équipe vous contactera pour le règlement."
              : null;
            finalizeOrder(order, note);
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }

    if (checkoutRecapClose) {
      checkoutRecapClose.addEventListener("click", function () {
        closeCheckoutModal();
        checkoutForm.reset();
        syncPaymentOptionStyles();
      });
    }

    renderCartBadge();
  })();

  // ---------- Espace client (connexion / inscription / historique) ----------
  // Uniquement actif sur espace-client.html (guard sur #espaceClientRoot). Le checkout
  // invité reste toujours possible (voir le tunnel de commande ci-dessus) -- ce bloc ne
  // fait qu'ajouter la possibilité optionnelle d'un compte avec historique.
  (function () {
    var root = document.querySelector("#espaceClientRoot");
    if (!root) return;

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.textContent = str == null ? "" : String(str);
      return div.innerHTML;
    }
    function formatMAD(n) {
      var s = Math.round(n).toString();
      s = s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      return s + " MAD";
    }
    var STATUS_LABELS = { pending: "En attente", preparing: "En préparation", shipping: "En livraison", done: "Livrée", cancelled: "Annulée" };

    var authForms = document.querySelector("#authForms");
    var accountView = document.querySelector("#accountView");
    var tabLogin = document.querySelector("#tabLogin");
    var tabSignup = document.querySelector("#tabSignup");
    var loginForm = document.querySelector("#loginForm");
    var signupForm = document.querySelector("#signupForm");
    var loginStatus = document.querySelector("#loginStatus");
    var signupStatus = document.querySelector("#signupStatus");
    var authUnavailableNote = document.querySelector("#authUnavailableNote");
    var accountName = document.querySelector("#accountName");
    var logoutBtn = document.querySelector("#logoutBtn");
    var orderHistoryList = document.querySelector("#orderHistoryList");
    var orderHistoryEmpty = document.querySelector("#orderHistoryEmpty");

    // Juste pour afficher "Bonjour X" sans refaire un appel réseau dédié -- l'accès réel
    // à l'historique reste vérifié à chaque requête via le cookie de session httpOnly,
    // cette valeur locale n'accorde jamais d'accès par elle-même.
    var NAME_KEY = "tc-customer-name";

    function setStatus(el, text, ok) {
      if (!el) return;
      el.textContent = text;
      el.classList.add("show");
      el.classList.toggle("ok", !!ok);
    }

    function showTab(which) {
      var isLogin = which === "login";
      if (tabLogin) tabLogin.classList.toggle("is-active", isLogin);
      if (tabSignup) tabSignup.classList.toggle("is-active", !isLogin);
      if (loginForm) loginForm.hidden = !isLogin;
      if (signupForm) signupForm.hidden = isLogin;
    }
    if (tabLogin) tabLogin.addEventListener("click", function () { showTab("login"); });
    if (tabSignup) tabSignup.addEventListener("click", function () { showTab("signup"); });

    function renderOrders(orders) {
      if (!orders.length) {
        if (orderHistoryEmpty) orderHistoryEmpty.hidden = false;
        if (orderHistoryList) orderHistoryList.innerHTML = "";
        return;
      }
      if (orderHistoryEmpty) orderHistoryEmpty.hidden = true;
      if (!orderHistoryList) return;
      orderHistoryList.innerHTML = orders.map(function (o) {
        var itemsText = (o.items || []).map(function (i) { return i.name + " × " + i.qty; }).join(", ");
        var date = new Date(o.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
        return (
          '<div class="order-history-item">' +
            '<div class="order-history-head"><strong>Commande ' + escapeHtml(o.ref) + "</strong><span>" + date + "</span></div>" +
            '<span class="order-history-status">' + escapeHtml(STATUS_LABELS[o.fulfillment_status] || o.fulfillment_status) + "</span>" +
            '<div class="order-history-items">' + escapeHtml(itemsText) + "</div>" +
            '<div class="order-history-total">' + formatMAD(Number(o.subtotal)) + "</div>" +
          "</div>"
        );
      }).join("");
    }

    function showAccountView(name) {
      if (authForms) authForms.hidden = true;
      if (accountView) accountView.hidden = false;
      if (accountName) accountName.textContent = name || "";
    }
    function showAuthFormsView() {
      if (authForms) authForms.hidden = false;
      if (accountView) accountView.hidden = true;
    }

    // État initial : 200 = déjà connecté (cookie de session valide) -> vue compte ;
    // 401 = déconnecté -> formulaires ; erreur réseau = backend pas encore déployé
    // (voir Phase 3 du plan) -> formulaires + note honnête plutôt qu'un écran cassé.
    fetch("/api/customer/orders")
      .then(function (res) {
        if (res.status === 401) { showAuthFormsView(); return null; }
        if (!res.ok) throw new Error("Erreur serveur.");
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        showAccountView(localStorage.getItem(NAME_KEY) || "");
        renderOrders(data.orders || []);
      })
      .catch(function () {
        showAuthFormsView();
        if (authUnavailableNote) authUnavailableNote.hidden = false;
      });

    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = loginForm.querySelector("#loginEmail").value.trim();
        var password = loginForm.querySelector("#loginPassword").value;
        fetch("/api/auth/customer?action=login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, password: password })
        })
          .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (r) {
            if (!r.ok) { setStatus(loginStatus, r.data.error || "Connexion impossible.", false); return; }
            localStorage.setItem(NAME_KEY, r.data.name || "");
            showAccountView(r.data.name);
            return fetch("/api/customer/orders")
              .then(function (res) { return res.json(); })
              .then(function (data) { renderOrders(data.orders || []); });
          })
          .catch(function () { setStatus(loginStatus, "Service momentanément indisponible -- réessayez plus tard.", false); });
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = signupForm.querySelector("#signupName").value.trim();
        var email = signupForm.querySelector("#signupEmail").value.trim();
        var phone = signupForm.querySelector("#signupPhone").value.trim();
        var password = signupForm.querySelector("#signupPassword").value;
        fetch("/api/auth/customer?action=signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, email: email, phone: phone, password: password })
        })
          .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
          .then(function (r) {
            if (!r.ok) { setStatus(signupStatus, r.data.error || "Inscription impossible.", false); return; }
            localStorage.setItem(NAME_KEY, r.data.name || "");
            showAccountView(r.data.name);
            renderOrders([]); // nouveau compte, aucune commande encore
          })
          .catch(function () { setStatus(signupStatus, "Service momentanément indisponible -- réessayez plus tard.", false); });
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        fetch("/api/auth/customer?action=logout", { method: "POST" })
          .catch(function () {})
          .then(function () {
            localStorage.removeItem(NAME_KEY);
            showAuthFormsView();
            if (loginForm) loginForm.reset();
          });
      });
    }
  })();

  // ---------- Assistant (Claude côté serveur, avec repli local si indisponible) ----------
  (function () {
    var toggle = document.querySelector("#assistantToggle");
    var panel = document.querySelector("#assistantPanel");
    var closeBtn = document.querySelector("#assistantClose");
    var log = document.querySelector("#assistantLog");
    var form = document.querySelector("#assistantForm");
    var input = document.querySelector("#assistantInput");
    if (!toggle || !panel || !form || !log) return;

    // Les suggestions rejoignent la zone de messages défilante (au lieu de rester un
    // bloc fixe entre le journal et le formulaire) : sur un petit écran -- ou clavier
    // mobile ouvert, qui réduit fortement la hauteur visible -- c'est cette zone qui se
    // comprime en premier, jamais le champ de saisie ni le bouton d'envoi.
    var suggestions = document.querySelector(".assistant-suggestions");
    if (suggestions) log.appendChild(suggestions);

    var started = false;
    // Historique envoyé à /api/assistant pour le contexte de conversation (jamais
    // persisté au-delà de la session en cours -- remis à zéro au rechargement).
    var history = [];

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.textContent = str == null ? "" : String(str);
      return div.innerHTML;
    }
    function addMsg(html, who) {
      var div = document.createElement("div");
      div.className = "assistant-msg " + who;
      div.innerHTML = html;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
      return div;
    }
    function intro() {
      if (started) return;
      started = true;
      addMsg("Bonjour 👋 Je peux répondre à vos questions sur nos horaires, nos adresses, la livraison, le paiement ou nos gammes de produits. Choisissez une suggestion ci-dessous ou écrivez votre question.", "bot");
    }
    function openPanel() {
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      intro();
      if (input) input.focus();
    }
    function closePanel() {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      if (panel.classList.contains("open")) closePanel(); else openPanel();
    });
    if (closeBtn) closeBtn.addEventListener("click", closePanel);

    // Raccourci clavier : "/" ouvre l'assistant depuis n'importe quelle page, sauf si
    // l'utilisateur est en train de taper dans un champ (formulaire, recherche...).
    toggle.title = "Ouvrir l'assistant (raccourci : /)";
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) { closePanel(); return; }
      if (e.key !== "/") return;
      var active = document.activeElement;
      var tag = active && active.tagName;
      var isEditable = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (active && active.isContentEditable);
      if (isEditable) return;
      e.preventDefault();
      if (panel.classList.contains("open")) { if (input) input.focus(); } else { openPanel(); }
    });

    // Lien direct : www.site.../n-importe-quelle-page.html#assistant (ou #chat) ouvre
    // le widget automatiquement au chargement -- pratique pour un lien partagé ou un bouton
    // "Discuter avec nous" ailleurs sur le site.
    function maybeOpenFromHash() {
      var h = (window.location.hash || "").replace("#", "").toLowerCase();
      if (h === "assistant" || h === "chat") openPanel();
    }
    maybeOpenFromHash();
    window.addEventListener("hashchange", maybeOpenFromHash);

    // Repli local à mots-clés -- utilisé uniquement si /api/assistant est indisponible
    // (clé API non configurée, service en panne, hors ligne...). Garantit que le widget
    // répond toujours, même sans IA générative.
    function localAnswer(q) {
      var s = q.toLowerCase();
      if (/horaire|heure|ouvert|ferm/.test(s)) {
        return "Nos horaires précis sont en cours de confirmation en showroom — le plus simple est de nous appeler avant votre visite : <a href=\"tel:+212539324696\">Tanger</a> ou <a href=\"tel:+212653775609\">Casablanca</a>.";
      }
      if (/adresse|\boù\b|localis|magasin|showroom/.test(s)) {
        return "Showroom Tanger : Avenue Moulay Youssef, angle Rue Mimosa, Immeuble Mimosa N°1-2, Magasin 21. Showroom Casablanca : Route de Mediouna, km 12. Plans et itinéraires sur <a href=\"showrooms.html\">notre page Showrooms</a>.";
      }
      if (/livrai|paiement|payer|carte bancaire|esp[eè]ces/.test(s)) {
        return "Trois modes sont proposés au tunnel de commande : paiement à la livraison, paiement en showroom, ou paiement en ligne par carte. Les prix affichés sont indicatifs, hors pose, et confirmés à la commande ou en showroom.";
      }
      if (/carrelage/.test(s)) return "Sol, mur, extérieur, céramique, grès cérame et pâte de verre — <a href=\"carrelage.html\">voir la gamme Carrelage</a>.";
      if (/sanitaire|vasque|baignoire|\bwc\b|douche/.test(s)) return "Vasques, WC, baignoires, receveurs de douche et meubles de salle de bain — <a href=\"sanitaire.html\">voir la gamme Sanitaire</a>.";
      if (/robinet|mitigeur/.test(s)) return "Robinetterie sanitaire et de bâtiment, douches et accessoires — <a href=\"robinetterie.html\">voir la gamme Robinetterie</a>.";
      if (/mosa[iï]que|pierre|marbre/.test(s)) return "Mosaïque décorative, pierre naturelle, marbre et pâte de verre — <a href=\"mosaique-pierre.html\">voir Mosaïque &amp; Pierre</a>.";
      if (/meuble/.test(s)) return "Meubles vasques cannelés livrés montés d'usine, plans et colonnes — <a href=\"meubles-salle-de-bain.html\">voir les Meubles de salle de bain</a>.";
      if (/miroir|led/.test(s)) return "Miroirs rétro-éclairés Ledimex, antibuée et à capteur tactile — <a href=\"miroirs-led.html\">voir les Miroirs LED</a>.";
      if (/d[ée]stockage|promo|solde|prix r[ée]duit/.test(s)) return "Fins de série et surstock à prix réduit, disponibles jusqu'à épuisement — <a href=\"destockage.html\">voir le Déstockage</a>.";
      if (/devis|conseil|contact|parler/.test(s)) return "Notre équipe vous répond à Tanger et à Casablanca — <a href=\"contact.html\">contactez-nous</a> ou appelez directement au <a href=\"tel:+212539324696\">05 39 32 46 96</a>.";
      if (/produit|cat[ée]gorie|gamme/.test(s)) return "Nos univers : Carrelage, Sanitaire, Robinetterie, Mosaïque &amp; Pierre, Meubles de salle de bain et Miroirs LED — plus le Déstockage pour les bonnes affaires.";
      return "Je peux vous renseigner sur nos horaires, nos adresses, la livraison, le paiement ou nos catégories de produits — essayez l'une des suggestions ci-dessous, ou appelez-nous directement au <a href=\"tel:+212539324696\">05 39 32 46 96</a>.";
    }

    function setTyping(on) {
      var existing = log.querySelector(".assistant-msg.typing");
      if (on && !existing) {
        var div = addMsg("…", "bot");
        div.classList.add("typing");
      } else if (!on && existing) {
        existing.parentNode.removeChild(existing);
      }
    }

    function askAssistant(q) {
      history.push({ role: "user", content: q });
      setTyping(true);
      fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          setTyping(false);
          if (!r.ok || !r.data || !r.data.reply) throw new Error("assistant indisponible");
          history.push({ role: "assistant", content: r.data.reply });
          addMsg(escapeHtml(r.data.reply).replace(/\n/g, "<br>"), "bot");
        })
        .catch(function () {
          setTyping(false);
          history.pop(); // l'échange raté ne pollue pas le contexte des prochains appels
          addMsg(localAnswer(q), "bot");
        });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      intro();
      addMsg(escapeHtml(q), "user");
      input.value = "";
      askAssistant(q);
    });
    document.querySelectorAll(".assistant-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        intro();
        var q = chip.getAttribute("data-question") || chip.textContent;
        addMsg(escapeHtml(chip.textContent), "user");
        askAssistant(q);
      });
    });
  })();
});
