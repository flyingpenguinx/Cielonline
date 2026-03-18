/**
 * Cielonline Bridge v1.0
 * 
 * Connects any external website to Cielonline's backend.
 * 
 * Usage — add this to your website:
 *   <script 
 *     src="https://cielonline.com/bridge.js"
 *     data-supabase-url="YOUR_SUPABASE_URL"
 *     data-supabase-key="YOUR_ANON_KEY"
 *     data-site-id="YOUR_SITE_ID"
 *   ></script>
 * 
 * Features:
 *   1. Contact form → Inquiries: auto-intercepts forms with data-ciel="contact"
 *   2. Services list: auto-renders services into elements with data-ciel="services"
 *   3. Manual API: window.Cielonline.submitInquiry(), window.Cielonline.getServices()
 */
(function () {
  "use strict";

  // ── Read config from script tag ──
  var scriptTag = document.currentScript;
  if (!scriptTag) return;

  var SUPABASE_URL = scriptTag.getAttribute("data-supabase-url");
  var SUPABASE_KEY = scriptTag.getAttribute("data-supabase-key");
  var SITE_ID = scriptTag.getAttribute("data-site-id");

  if (!SUPABASE_URL || !SUPABASE_KEY || !SITE_ID) {
    console.warn("[Cielonline Bridge] Missing data-supabase-url, data-supabase-key, or data-site-id attributes.");
    return;
  }

  // ── Lightweight Supabase REST helper (no SDK needed) ──
  var API = SUPABASE_URL + "/rest/v1";
  var HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
  };

  function supabaseInsert(table, row) {
    return fetch(API + "/" + table, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(row)
    }).then(function (res) {
      if (!res.ok) return res.json().then(function (e) { throw e; });
      return { ok: true };
    });
  }

  function supabaseSelect(table, query) {
    var url = API + "/" + table + "?" + query;
    var readHeaders = {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY
    };
    return fetch(url, { headers: readHeaders })
      .then(function (res) { return res.json(); });
  }

  // ── Submit Inquiry ──
  function submitInquiry(data) {
    var row = {
      site_id: SITE_ID,
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message || null,
      service_requested: data.service || data.service_requested || null,
      vehicle_info: data.vehicle || data.vehicle_info || null,
      preferred_date: data.preferred_date || null,
      status: "new",
      source: "website"
    };
    return supabaseInsert("inquiries", row);
  }

  // ── Get Services ──
  function getServices() {
    return supabaseSelect(
      "services",
      "site_id=eq." + SITE_ID + "&is_active=eq.true&order=sort_order.asc"
    );
  }

  // ── Auto-bind contact forms with data-ciel="contact" ──
  function bindContactForms() {
    var forms = document.querySelectorAll('form[data-ciel="contact"]');
    forms.forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var btn = form.querySelector('[type="submit"]');
        var origText = btn ? btn.textContent : "";
        if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

        submitInquiry({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message"),
          service: fd.get("service"),
          vehicle: fd.get("vehicle"),
          preferred_date: fd.get("preferred_date")
        }).then(function () {
          // Success
          var msg = form.getAttribute("data-success") || "Thank you! We'll get back to you shortly.";
          var successDiv = document.createElement("div");
          successDiv.className = "ciel-success";
          successDiv.innerHTML = '<p style="color:green;font-weight:600;padding:20px;text-align:center;">' + msg + '</p>';
          form.style.display = "none";
          form.parentNode.insertBefore(successDiv, form.nextSibling);
        }).catch(function (err) {
          console.error("[Cielonline Bridge] Inquiry error:", err);
          alert("Something went wrong. Please call us directly.");
        }).finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = origText; }
        });
      });
    });
  }

  // ── Auto-render services into data-ciel="services" containers ──
  function renderServices() {
    var containers = document.querySelectorAll('[data-ciel="services"]');
    if (containers.length === 0) return;

    getServices().then(function (services) {
      if (!services || !services.length) return;
      containers.forEach(function (el) {
        var showPrice = el.getAttribute("data-show-price") !== "false";
        var showDuration = el.getAttribute("data-show-duration") !== "false";
        var showDesc = el.getAttribute("data-show-description") !== "false";

        var html = services.map(function (svc) {
          var card = '<div class="ciel-service">';
          card += '<h3 class="ciel-service-name">' + escapeHtml(svc.name) + '</h3>';
          if (showDesc && svc.description) card += '<p class="ciel-service-desc">' + escapeHtml(svc.description) + '</p>';
          if (showPrice && svc.price != null) card += '<span class="ciel-service-price">$' + parseFloat(svc.price).toFixed(2) + '</span>';
          if (showDuration && svc.duration_minutes) card += '<span class="ciel-service-duration"> · ' + svc.duration_minutes + ' min</span>';
          card += '</div>';
          return card;
        }).join("");
        el.innerHTML = html;
      });
    }).catch(function (err) {
      console.error("[Cielonline Bridge] Services load error:", err);
    });
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(s));
    return div.innerHTML;
  }

  // ── Populate service dropdowns ──
  function populateServiceDropdowns() {
    var selects = document.querySelectorAll('select[data-ciel="service-picker"]');
    if (selects.length === 0) return;

    getServices().then(function (services) {
      if (!services || !services.length) return;
      selects.forEach(function (sel) {
        var placeholder = sel.getAttribute("data-placeholder") || "Select a service...";
        sel.innerHTML = '<option value="">' + placeholder + '</option>';
        services.forEach(function (svc) {
          var opt = document.createElement("option");
          opt.value = svc.name;
          opt.textContent = svc.name + (svc.price != null ? " — $" + parseFloat(svc.price).toFixed(2) : "");
          sel.appendChild(opt);
        });
      });
    });
  }

  // ── Initialize on DOM ready ──
  function init() {
    bindContactForms();
    renderServices();
    populateServiceDropdowns();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ── Expose public API ──
  window.Cielonline = {
    submitInquiry: submitInquiry,
    getServices: getServices,
    siteId: SITE_ID
  };
})();
