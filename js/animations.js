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
