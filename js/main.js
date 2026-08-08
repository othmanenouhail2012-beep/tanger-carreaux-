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

    var currentPageEdit = location.pathname.split("/").pop() || "index.html";
    var pageEdits = null;
    try { pageEdits = (JSON.parse(localStorage.getItem(PAGE_EDITS_KEY)) || {})[currentPageEdit]; } catch (e) {}
    if (pageEdits) {
      var texts = editableTextEls(), imgs = editableImgEls(), bgs = editableBgEls();
      Object.keys(pageEdits).forEach(function (key) {
        var edit = pageEdits[key];
        var idx = parseInt(key.split(":")[1], 10);
        if (edit.type === "text" && texts[idx]) texts[idx].innerHTML = edit.value;
        else if (edit.type === "img" && imgs[idx]) imgs[idx].src = edit.value;
        else if (edit.type === "bg" && bgs[idx]) bgs[idx].style.backgroundImage = "url('" + edit.value + "')";
      });
    }

    var globalLogo = null;
    try { globalLogo = localStorage.getItem(GLOBAL_LOGO_KEY); } catch (e) {}
    if (globalLogo) {
      document.querySelectorAll(".brand-mark").forEach(function (el) { el.src = globalLogo; });
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
  var productModal = document.querySelector("#productModal");
  var productCards = document.querySelectorAll(".product-card");
  if (productModal && productCards.length) {
    var modalVisual = productModal.querySelector(".product-modal-visual");
    var modalTag = productModal.querySelector(".product-modal-tag");
    var modalTitle = productModal.querySelector("#productModalTitle");
    var modalDesc = productModal.querySelector(".product-modal-desc");
    var modalPrice = productModal.querySelector(".product-modal-price-row .product-price");
    var lastFocused = null;

    function openProductModal(card) {
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
    productModal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeProductModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && productModal.classList.contains("open")) closeProductModal();
    });

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
    var filterBar = document.querySelector("#productFilterBar");
    var activeFilters = { cat: "", format: "", couleur: "", finition: "" };

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
          var firstCard = row.querySelector(".product-card[" + attr + "]");
          if (!firstCard) return;
          var heading = row.querySelector(".product-row-head h3");
          addValue(firstCard.getAttribute(attr), heading ? heading.textContent.trim() : prettyLabel(firstCard.getAttribute(attr)));
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

    if (filterBar) {
      [
        { key: "cat", attr: "data-cat", label: "Catégorie", useRowHeading: true },
        { key: "format", attr: "data-format", label: "Format", useRowHeading: false },
        { key: "couleur", attr: "data-couleur", label: "Couleur", useRowHeading: false },
        { key: "finition", attr: "data-finition", label: "Finition", useRowHeading: false }
      ].forEach(function (g) {
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
      return true;
    }

    function applyFilter() {
      var q = searchInput ? searchInput.value.trim().toLowerCase() : "";
      if (searchWrap) searchWrap.classList.toggle("has-value", q.length > 0);
      var anyFilterActive = activeFilters.cat || activeFilters.format || activeFilters.couleur || activeFilters.finition;
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

    function currentPaymentValue() {
      var checked = checkoutModal.querySelector('input[name="payment"]:checked');
      return checked ? checked.value : "";
    }
    function isDeliveryMode(value) {
      return value === "Paiement à la livraison";
    }
    function syncPaymentOptionStyles() {
      checkoutModal.querySelectorAll(".payment-tab").forEach(function (opt) {
        var input = opt.querySelector("input");
        opt.classList.toggle("is-checked", !!(input && input.checked));
      });
      var value = currentPaymentValue();
      if (ckDeliveryModeSelect) ckDeliveryModeSelect.value = value;
      if (ckAddressField) ckAddressField.classList.toggle("is-hidden", !isDeliveryMode(value));
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
      orderRecapEl.innerHTML =
        '<div class="order-recap-ref">Commande N° ' + order.ref + " — " + formatDate(order.date) + "</div>" +
        '<div class="order-recap-items">' + itemsHtml + "</div>" +
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

        var order = buildOrder(cart, { name: name, phone: phone, city: city, address: isDelivery ? address : "", payment: payment });
        renderOrderRecap(order);
        wireRecapActions(order);
        pushOrderToAdmin(order);
        clearCart();

        if (checkoutStepForm) checkoutStepForm.hidden = true;
        if (checkoutStepRecap) checkoutStepRecap.hidden = false;
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
});
