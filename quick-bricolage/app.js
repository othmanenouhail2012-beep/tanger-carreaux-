(function () {
  "use strict";
  const C = window.QB_CONFIG, I = window.QB_I18N;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  let lang = store.get("qb_lang", "fr");
  if (!I[lang]) lang = "fr";
  const t = (k) => (I[lang] && I[lang][k]) || I.fr[k] || k;
  const svcName = (s) => s[lang] || s.fr;
  const tc = (v) => v || "[" + t("toComplete") + "]";

  /* ---------- Thème ---------- */
  const root = document.documentElement;
  const savedTheme = store.get("qb_theme", null);
  if (savedTheme) root.dataset.theme = savedTheme;
  $("#themeBtn").onclick = () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    store.set("qb_theme", root.dataset.theme);
  };

  /* ---------- WhatsApp / appel ---------- */
  const waLink = (text) => "https://wa.me/" + (C.whatsapp || "") + (text ? "?text=" + encodeURIComponent(text) : "");
  const telLink = "tel:" + (C.telephone || "").replace(/\s/g, "");

  /* ---------- Rendu des textes ---------- */
  function renderTexts() {
    root.lang = lang === "da" ? "fr" : lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    $("#lang").value = lang;
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-ph]").forEach((el) => (el.placeholder = t(el.dataset.ph)));
    // Services
    const card = (s, tag) => `<${tag} class="svc" data-id="${s.id}" ${tag === "a" ? `href="#demande/${s.id}"` : 'type="button"'}><span class="ic" aria-hidden="true">${s.icone}</span><span>${svcName(s)}</span></${tag}>`;
    $("#homeServices").innerHTML = C.services.map((s) => card(s, "a")).join("");
    $("#formServices").innerHTML = C.services.map((s) => card(s, "button")).join("");
    markService();
    // FAQ
    $("#faqList").innerHTML = C.faq.map((f) => { const x = f[lang] || f.fr; return `<details><summary>${x.q}</summary><p>${x.r}</p></details>`; }).join("");
    // Boutique
    $("#shop").hidden = !(C.boutique && C.boutique.afficher);
    $("#shopAddr").textContent = C.boutique.adresse;
    $("#shopHours").textContent = tc(C.boutique.horaires || C.horaires);
    $("#shopTel").textContent = C.telephoneAffiche || C.telephone;
    $("#cities").innerHTML = (C.villes || []).map((v) => `<option value="${v}">`).join("");
    renderRequests();
    updateStep();
  }
  $("#lang").onchange = (e) => { lang = e.target.value; store.set("qb_lang", lang); renderTexts(); };

  const q = encodeURIComponent(C.boutique.mapsQuery || C.boutique.adresse);
  $("#shopMap").src = "https://www.google.com/maps?q=" + q + "&output=embed";
  $("#shopDir").href = "https://www.google.com/maps/search/?api=1&query=" + q;
  $("#shopCall").href = $("#dockCall").href = telLink;
  $("#dockWa").href = waLink("Bonjour Quick Bricolage, ");
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Navigation ---------- */
  function route() {
    const [view, arg] = (location.hash.slice(1) || "accueil").split("/");
    const v = ["accueil", "demande", "mes-demandes"].includes(view) ? view : "accueil";
    $$(".view").forEach((s) => (s.hidden = s.id !== "v-" + v));
    $$(".topnav a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + v));
    if (v === "demande" && arg && C.services.some((s) => s.id === arg)) { data.service = arg; markService(); goStep(2); }
    else if (v === "demande" && !arg) goStep(step);
    if (!(v === "accueil" && view === "accueil" && !location.hash)) scrollTo(0, 0);
  }
  addEventListener("hashchange", route);

  /* ---------- Formulaire ---------- */
  const data = { service: null, photo: null, lat: null, lng: null };
  let step = 1;
  function markService() { $$("#formServices .svc").forEach((b) => b.classList.toggle("on", b.dataset.id === data.service)); }
  $("#formServices").onclick = (e) => {
    const b = e.target.closest(".svc"); if (!b) return;
    data.service = b.dataset.id; markService(); $("#e1").textContent = ""; setTimeout(() => goStep(2), 150);
  };
  function updateStep() {
    $$(".step").forEach((f) => (f.hidden = +f.dataset.step !== step));
    $("#stepNum").textContent = step;
    $("#bar").style.width = step * 25 + "%";
    $("#prev").style.visibility = step === 1 ? "hidden" : "visible";
    $("#nextBtn").hidden = step === 4; $("#sendBtn").hidden = step !== 4;
  }
  function goStep(n) { step = Math.max(1, Math.min(4, n)); updateStep(); }
  function validate(n) {
    if (n === 1 && !data.service) { $("#e1").textContent = t("chooseService"); return false; }
    let ok = true;
    $$(`.step[data-step="${n}"] [required]`).forEach((el) => {
      const bad = !el.value.trim() || (el.type === "tel" && el.value.replace(/\D/g, "").length < 9);
      el.classList.toggle("invalid", bad); el.title = bad ? t("required") : "";
      if (bad && ok) { el.focus(); ok = false; }
    });
    return ok;
  }
  $("#nextBtn").onclick = () => { if (validate(step)) { goStep(step + 1); scrollTo(0, 0); } };
  $("#prev").onclick = () => goStep(step - 1);
  $("#form").addEventListener("input", (e) => e.target.classList.remove("invalid"));

  // Photo (aperçu local uniquement)
  $("#photo").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (data.photo) URL.revokeObjectURL(data.photo);
    data.photo = URL.createObjectURL(f);
    $("#previewImg").src = data.photo; $("#preview").hidden = false;
    $("#photoLbl").textContent = t("photoChange");
  };
  $("#photoDel").onclick = () => { data.photo = null; $("#photo").value = ""; $("#preview").hidden = true; $("#photoLbl").textContent = t("photo"); };

  // Géolocalisation
  $("#geoBtn").onclick = () => {
    const m = $("#geoMsg");
    if (!navigator.geolocation) { m.textContent = t("geoErr"); return; }
    m.textContent = t("geoWait");
    navigator.geolocation.getCurrentPosition(
      (p) => { data.lat = p.coords.latitude.toFixed(6); data.lng = p.coords.longitude.toFixed(6); m.textContent = t("geoOk") + " (" + data.lat + ", " + data.lng + ")"; },
      () => { m.textContent = t("geoErr"); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  // Créneau
  $$('input[name="when"]').forEach((r) => (r.onchange = () => {
    const planned = $('input[name="when"]:checked').value === "planned";
    $("#planned").hidden = !planned; $("#date").required = planned;
  }));
  $("#date").min = new Date().toISOString().slice(0, 10);

  // Message WhatsApp (toujours en français pour l'équipe + langue du client si différente : on garde la langue choisie)
  function buildMessage(r, withPhoto) {
    const s = C.services.find((x) => x.id === r.service);
    const L = [`*${t("msgTitle")}* – ${C.nom}`, `${t("mRef")} ${r.id}`, "",
      `🛠️ *${t("mService")}* : ${s ? svcName(s) : r.service}`,
      `📝 *${t("mProblem")}* : ${r.desc}`,
      `🏠 *${t("mAddr")}* : ${[r.addr, r.district, r.city].filter(Boolean).join(", ")}`];
    if (r.lat) L.push(`📍 *${t("mMap")}* : https://www.google.com/maps?q=${r.lat},${r.lng}`);
    L.push(`🕒 *${t("mWhen")}* : ${r.urgent ? "🚨 " + t("urgent") : r.date + " – " + t(r.slot)}`,
      `👤 *${t("mName")}* : ${r.name}`, `📞 *${t("mPhone")}* : ${r.phone}`);
    if (withPhoto) L.push("", t("mPhoto"));
    return L.join("\n");
  }
  function openWa(text) { window.open(waLink(text), "_blank", "noopener"); }

  $("#form").onsubmit = (e) => {
    e.preventDefault();
    for (let n = 1; n <= 4; n++) if (!validate(n)) { goStep(n); validate(n); return; }
    const urgent = $('input[name="when"]:checked').value === "urgent";
    const r = {
      id: "QB" + Date.now().toString(36).toUpperCase().slice(-6), created: Date.now(), status: "sent",
      service: data.service, desc: $("#desc").value.trim(), hasPhoto: !!data.photo,
      addr: $("#addr").value.trim(), district: $("#district").value.trim(), city: $("#city").value.trim(),
      lat: data.lat, lng: data.lng, urgent, date: urgent ? "" : $("#date").value, slot: urgent ? "" : $("#slot").value,
      name: $("#name").value.trim(), phone: $("#phone").value.trim()
    };
    store.set("qb_contact", { name: r.name, phone: r.phone, city: r.city, district: r.district });
    const list = store.get("qb_requests", []); list.unshift(r); store.set("qb_requests", list);
    openWa(buildMessage(r, r.hasPhoto));
    $("#dlgSent").showModal();
    // Réinitialiser
    $("#form").reset(); $("#photoDel").click(); data.service = null; data.lat = data.lng = null;
    $("#geoMsg").textContent = ""; $("#planned").hidden = true; markService(); prefill(); goStep(1);
    renderRequests();
  };
  $("#dlgSent").addEventListener("close", () => (location.hash = "#mes-demandes"));
  function prefill() { const c = store.get("qb_contact", {}); ["name", "phone", "city", "district"].forEach((k) => c[k] && ($("#" + k).value = c[k])); }

  /* ---------- Mes demandes ---------- */
  function renderRequests() {
    const list = store.get("qb_requests", []);
    if (!list.length) { $("#reqList").innerHTML = `<p class="note">${t("noReq")}</p><p><a class="btn" href="#demande">${t("cta")}</a></p>`; return; }
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    $("#reqList").innerHTML = list.map((r) => {
      const s = C.services.find((x) => x.id === r.service); const x = r.status === "cancelled";
      const d = new Date(r.created).toLocaleString(lang === "ar" ? "ar-MA" : "fr-MA", { dateStyle: "medium", timeStyle: "short" });
      return `<article class="req ${x ? "cancelled" : ""}" data-id="${r.id}">
        <h3>${s ? s.icone + " " + esc(svcName(s)) : esc(r.service)} <span class="badge ${x ? "x" : ""}">${t(x ? "cancelled" : "sent")}</span></h3>
        <p>${r.id} · ${d}</p><p>${esc(r.desc)}</p>
        <p>${esc([r.district, r.city].filter(Boolean).join(", "))} · ${r.urgent ? t("urgent") : esc(r.date) + " – " + t(r.slot)}</p>
        <div class="row">${x ? "" : `<button class="btn btn-wa" data-act="resend">${t("resend")}</button><button class="btn btn-ghost" data-act="cancel">${t("cancel")}</button>`}
        <button class="btn btn-ghost" data-act="del">${t("del")}</button></div></article>`;
    }).join("");
  }
  $("#reqList").onclick = (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = b.closest(".req").dataset.id; let list = store.get("qb_requests", []);
    const r = list.find((x) => x.id === id); if (!r) return;
    if (b.dataset.act === "resend") openWa(buildMessage(r, r.hasPhoto));
    if (b.dataset.act === "cancel" && confirm(t("cancelConfirm"))) {
      r.status = "cancelled"; openWa(`${t("mCancel")} (${t("mRef")} ${r.id}) – ${r.name}`);
    }
    if (b.dataset.act === "del") list = list.filter((x) => x.id !== id);
    store.set("qb_requests", list); renderRequests();
  };

  /* ---------- Installation PWA ---------- */
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let deferred = null;
  const ib = $("#installBtn");
  if (!standalone && isIOS) ib.hidden = false;
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; if (!standalone) ib.hidden = false; });
  addEventListener("appinstalled", () => { ib.hidden = true; deferred = null; });
  ib.onclick = async () => {
    if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; ib.hidden = true; }
    else if (isIOS) $("#dlgIos").showModal();
  };
  $$("dialog [data-close]").forEach((b) => (b.onclick = () => b.closest("dialog").close()));

  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));

  prefill(); renderTexts(); route();
})();
