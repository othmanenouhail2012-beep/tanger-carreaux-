// TANGER CARREAUX — animations premium (scroll fluide, révélations, parallax, curseur magnétique, transitions de page)
// Amélioration progressive : si GSAP/Lenis ne chargent pas (CDN indisponible), le site reste
// pleinement fonctionnel grâce au fallback IntersectionObserver déjà présent dans main.js.

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* ---------------- GSAP ScrollTrigger : révélations + parallax ---------------- */
  /* Le scroll natif du navigateur est utilisé directement (fiable sur tous les appareils) */
  if (hasGsap) {
    document.documentElement.classList.add("gsap-active");
    gsap.registerPlugin(ScrollTrigger);

    var reveals = document.querySelectorAll(".reveal");
    reveals.forEach(function (el, i) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: (i % 4) * 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        }
      );
    });

    document.querySelectorAll(".hero, .page-hero").forEach(function (el) {
      gsap.to(el, {
        backgroundPosition: "50% 32%",
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });
    });
  }

  /* ---------------- Lenis (scroll fluide) ----------------
     Réintégré après un incident de production précédent où Lenis avait cassé le scroll
     tactile réel (jamais isolé avec certitude -- seul un test à vrai geste tactile
     l'avait révélé, pas de simple scrollTo() programmatique). Défense en profondeur
     cette fois : (1) chargement de Lenis sauté entièrement sur tactile (le point qui
     avait cassé reste donc 100% natif, aucun changement), (2) `syncTouch` de Lenis
     laissé à sa valeur par défaut `false` même si ce garde-fou venait à échouer un jour.
     Fichier vendorisé (js/vendor/lenis.min.js, version 1.3.26 figée, pas de CDN) pour
     éliminer toute dérive de version comme facteur possible. */
  var lenis = null;
  if (hasGsap && !isTouch && !reduceMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Lenis pilote elle-même chaque scroll via scrollTo({behavior:"instant"}), donc son
    // propre mécanisme ne dépend jamais de scroll-behavior CSS -- vérifié : le scroll à
    // la molette reste fluide quoi qu'il arrive ici. Ce correctif traite un effet de bord
    // distinct et plus étroit : GSAP ScrollTrigger gère lui-même un scroll-behavior en
    // style INLINE (pour éviter que le scroll natif fluide n'interfère avec ses calculs
    // pendant un refresh) et restaure ensuite la valeur "smooth" d'origine -- ce qui
    // écraserait silencieusement notre intention pour les sauts d'ancre native (#lien)
    // pendant que Lenis est active. Un style inline gagnant toujours sur une règle CSS
    // par classe, on utilise la même arme : réaffirmé à chaque mutation de l'attribut
    // style, pas seulement une fois au chargement.
    document.documentElement.style.scrollBehavior = "auto";
    new MutationObserver(function () {
      if (document.documentElement.style.scrollBehavior !== "auto") {
        document.documentElement.style.scrollBehavior = "auto";
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
  }

  /* ---------------- Texte du hero : révélation mot par mot ---------------- */
  function splitWords(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = "1";
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    words.forEach(function (word, i) {
      var wrap = document.createElement("span");
      wrap.className = "word-split";
      var inner = document.createElement("span");
      inner.textContent = word + (i < words.length - 1 ? " " : "");
      wrap.appendChild(inner);
      el.appendChild(wrap);
      if (hasGsap && !reduceMotion) {
        gsap.fromTo(
          inner,
          { yPercent: 115, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.85, delay: 0.1 + i * 0.05, ease: "power4.out" }
        );
      }
    });
  }
  document.querySelectorAll(".hero h1, .page-hero h1").forEach(splitWords);

  /* ---------------- Boutons magnétiques ---------------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * 0.22 + "px," + y * 0.32 + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ---------------- Transition de page (fondu) ---------------- */
  var overlay = document.createElement("div");
  overlay.className = "page-transition";
  document.body.appendChild(overlay);
  requestAnimationFrame(function () {
    document.body.classList.add("page-loaded");
  });

  document.querySelectorAll("a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    if (a.target === "_blank" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;
    if (/^https?:\/\//i.test(href) && href.indexOf(location.hostname) === -1) return;
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.body.classList.add("page-leaving");
      setTimeout(function () {
        window.location.href = href;
      }, 380);
    });
  });
})();
