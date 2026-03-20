/**
 * Cielonline Bridge v2.0
 *
 * Connects external websites to Cielonline's CRM, booking, content, and analytics layers.
 */
(function () {
  "use strict";

  var scriptTag = document.currentScript;
  if (!scriptTag) return;

  var SUPABASE_URL = scriptTag.getAttribute("data-supabase-url");
  var SUPABASE_KEY = scriptTag.getAttribute("data-supabase-key");
  var SITE_ID = scriptTag.getAttribute("data-site-id");
  var SITE_SLUG = scriptTag.getAttribute("data-site-slug");
  var siteIdPromise = null;

  if (!SUPABASE_URL || !SUPABASE_KEY || (!SITE_ID && !SITE_SLUG)) {
    console.warn("[Cielonline Bridge] Missing required script attributes.");
    return;
  }

  var API = SUPABASE_URL + "/rest/v1";
  var WRITE_HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  var READ_HEADERS = {
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + SUPABASE_KEY,
  };
  var serviceCache = null;
  var contentCache = null;
  var visitorId = getVisitorId();

  function escapeValue(value) {
    return encodeURIComponent(value == null ? "" : String(value));
  }

  function supabaseInsert(table, row) {
    return fetch(API + "/" + table, {
      method: "POST",
      headers: WRITE_HEADERS,
      body: JSON.stringify(row),
    }).then(handleJsonResponse);
  }

  function supabaseSelect(table, query) {
    return fetch(API + "/" + table + "?" + query, {
      headers: READ_HEADERS,
    }).then(handleJsonResponse);
  }

  function handleJsonResponse(response) {
    return response.text().then(function (text) {
      var payload = text ? JSON.parse(text) : null;
      if (!response.ok) throw payload || new Error("Request failed");
      return payload;
    });
  }

  function getVisitorId() {
    try {
      var existing = localStorage.getItem("ciel-visitor-id");
      if (existing) return existing;
      var next = "ciel-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("ciel-visitor-id", next);
      return next;
    } catch (error) {
      return "ciel-anon";
    }
  }

  function ensureSiteId() {
    if (SITE_ID) return Promise.resolve(SITE_ID);
    if (siteIdPromise) return siteIdPromise;

    siteIdPromise = supabaseSelect(
      "client_sites",
      "slug=eq." + escapeValue(SITE_SLUG) + "&is_published=eq.true&select=id&limit=1"
    ).then(function (rows) {
      if (!rows || !rows[0] || !rows[0].id) {
        throw new Error("Unable to resolve site slug: " + SITE_SLUG);
      }
      SITE_ID = rows[0].id;
      return SITE_ID;
    });

    return siteIdPromise;
  }

  function getTextValue(formData, names) {
    for (var i = 0; i < names.length; i += 1) {
      var value = formData.get(names[i]);
      if (value && String(value).trim()) return String(value).trim();
    }
    return "";
  }

  function getCheckedValues(form, name) {
    var values = [];
    form.querySelectorAll('input[name="' + name + '"]:checked').forEach(function (input) {
      var label = input.closest("label") || input.closest(".checkbox-item") || input.parentElement;
      var text = label ? label.textContent.replace(/\s+/g, " ").trim() : input.value;
      values.push(text || input.value);
    });
    return values;
  }

  function extractInquiryPayload(form) {
    var formData = new FormData(form);
    var firstName = getTextValue(formData, ["firstName", "first_name"]);
    var lastName = getTextValue(formData, ["lastName", "last_name"]);
    var fullName = getTextValue(formData, ["name", "full_name"]);
    var name = fullName || [firstName, lastName].filter(Boolean).join(" ").trim();
    var selectedServices = getCheckedValues(form, "services");
    var service = getTextValue(formData, ["service", "service_name"]) || selectedServices.join(", ");
    var vehicle = getTextValue(formData, ["vehicle", "vehicle_info"]);

    if (!vehicle) {
      vehicle = [
        getTextValue(formData, ["vehicle-year", "vehicle_year"]),
        getTextValue(formData, ["vehicle-make", "vehicle_make"]),
        getTextValue(formData, ["vehicle-model", "vehicle_model"]),
      ].filter(Boolean).join(" ");
    }

    return {
      site_id: SITE_ID,
      name: name || null,
      email: getTextValue(formData, ["email"]) || null,
      phone: getTextValue(formData, ["phone"]) || null,
      message: getTextValue(formData, ["message", "details", "notes"]) || null,
      service_requested: service || null,
      vehicle_info: vehicle || null,
      preferred_date: getTextValue(formData, ["preferred_date", "preferred-date", "preferred_slot", "scheduled_at"]) || null,
      status: "new",
      source: "website",
    };
  }

  function submitInquiry(payload) {
    return ensureSiteId().then(function (siteId) {
      return supabaseInsert("inquiries", Object.assign({}, payload, { site_id: siteId }));
    });
  }

  function getServices() {
    if (serviceCache) return Promise.resolve(serviceCache);
    return ensureSiteId().then(function (siteId) {
      return supabaseSelect(
        "services",
        "site_id=eq." + escapeValue(siteId) + "&is_active=eq.true&order=sort_order.asc"
      ).then(function (services) {
        serviceCache = services || [];
        return serviceCache;
      });
    });
  }

  function getSiteContent() {
    if (contentCache) return Promise.resolve(contentCache);
    return ensureSiteId().then(function (siteId) {
      return supabaseSelect(
        "site_content_entries",
        "site_id=eq." + escapeValue(siteId) + "&is_public=eq.true&select=content_key,field_type,value_text,value_json"
      ).then(function (entries) {
        var map = {};
        (entries || []).forEach(function (entry) {
          map[entry.content_key] = entry.field_type === "json" ? entry.value_json : entry.value_text;
        });
        contentCache = map;
        return map;
      });
    });
  }

  function trackEvent(eventName, details) {
    return ensureSiteId().then(function (siteId) {
      return supabaseInsert("site_events", {
        site_id: siteId,
        page_path: window.location.pathname,
        event_type: (details && details.event_type) || "engagement",
        event_name: eventName,
        visitor_id: visitorId,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
        metadata: (details && details.metadata) || {},
      });
    }).catch(function (error) {
      console.error("[Cielonline Bridge] Analytics error:", error);
      return null;
    });
  }

  function setElementValue(element, value) {
    if (value == null || value === "") return;
    var attr = element.getAttribute("data-ciel-attr");
    if (attr) {
      element.setAttribute(attr, value);
      return;
    }

    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      element.value = value;
      return;
    }

    element.textContent = value;
  }

  function applySiteContent() {
    return getSiteContent().then(function (content) {
      document.querySelectorAll("[data-ciel-field]").forEach(function (element) {
        var key = element.getAttribute("data-ciel-field");
        setElementValue(element, content[key]);
      });

      document.querySelectorAll('[data-ciel-link="booking"]').forEach(function (link) {
        var bookingUrl = content["business.booking_url"];
        if (bookingUrl) link.setAttribute("href", bookingUrl);
      });

      document.querySelectorAll('[data-ciel-link="payment"]').forEach(function (link) {
        var paymentUrl = content["business.payment_url"];
        if (paymentUrl) link.setAttribute("href", paymentUrl);
      });

      document.querySelectorAll('[data-ciel-field="business.email"]').forEach(function (link) {
        if (link.tagName === "A" && content["business.email"]) {
          link.setAttribute("href", "mailto:" + content["business.email"]);
        }
      });

      document.querySelectorAll('[data-ciel-field="business.phone"]').forEach(function (link) {
        if (link.tagName === "A" && content["business.phone"]) {
          link.setAttribute("href", "tel:" + content["business.phone"]);
        }
      });
    }).catch(function (error) {
      console.error("[Cielonline Bridge] Content load error:", error);
    });
  }

  function renderServices() {
    var containers = document.querySelectorAll('[data-ciel="services"]');
    if (containers.length === 0) return Promise.resolve();

    return getServices().then(function (services) {
      containers.forEach(function (container) {
        var showPrice = container.getAttribute("data-show-price") !== "false";
        var showDuration = container.getAttribute("data-show-duration") !== "false";
        var showDesc = container.getAttribute("data-show-description") !== "false";

        container.innerHTML = (services || []).map(function (service) {
          var card = '<div class="ciel-service">';
          card += '<h3 class="ciel-service-name">' + escapeHtml(service.name) + '</h3>';
          if (showDesc && service.description) card += '<p class="ciel-service-desc">' + escapeHtml(service.description) + '</p>';
          if (showPrice && service.price != null) card += '<span class="ciel-service-price">$' + Number(service.price).toFixed(2) + '</span>';
          if (showDuration && service.duration_minutes) card += '<span class="ciel-service-duration"> · ' + service.duration_minutes + ' min</span>';
          card += '</div>';
          return card;
        }).join("");
      });
    }).catch(function (error) {
      console.error("[Cielonline Bridge] Services render error:", error);
    });
  }

  function populateServiceDropdowns() {
    var selects = document.querySelectorAll('select[data-ciel="service-picker"]');
    if (selects.length === 0) return Promise.resolve();

    return getServices().then(function (services) {
      selects.forEach(function (select) {
        var placeholder = select.getAttribute("data-placeholder") || "Select a service...";
        select.innerHTML = '<option value="">' + escapeHtml(placeholder) + '</option>';
        (services || []).forEach(function (service) {
          var option = document.createElement("option");
          option.value = service.name;
          option.textContent = service.name + (service.price != null ? " — $" + Number(service.price).toFixed(2) : "");
          select.appendChild(option);
        });
      });
    });
  }

  function populateServiceCheckboxes() {
    var containers = document.querySelectorAll('[data-ciel="service-checkboxes"]');
    if (containers.length === 0) return Promise.resolve();

    return getServices().then(function (services) {
      containers.forEach(function (container) {
        container.innerHTML = (services || []).map(function (service) {
          return (
            '<label class="ciel-service-option">' +
            '<input type="checkbox" name="services" value="' + escapeHtml(service.name) + '">' +
            '<span>' + escapeHtml(service.name) + (service.price != null ? ' — $' + Number(service.price).toFixed(2) : '') + '</span>' +
            '</label>'
          );
        }).join("");
      });
    });
  }

  function bindTrackedLinks() {
    document.querySelectorAll('[data-ciel-link]').forEach(function (link) {
      link.addEventListener("click", function () {
        trackEvent("booking_link_click", {
          event_type: "conversion",
          metadata: {
            href: link.getAttribute("href"),
            link_type: link.getAttribute("data-ciel-link"),
          },
        });
      });
    });
  }

  function showFormSuccess(form) {
    var successTarget = form.getAttribute("data-success-target");
    var successMessage = form.getAttribute("data-success") || "Thanks. We received your request.";
    if (successTarget) {
      var target = document.querySelector(successTarget);
      if (target) {
        target.style.display = "block";
        target.textContent = successMessage;
      }
    } else {
      var block = document.createElement("div");
      block.className = "ciel-success";
      block.textContent = successMessage;
      form.parentNode.insertBefore(block, form.nextSibling);
    }
    form.style.display = "none";
  }

  function bindContactForms() {
    var forms = document.querySelectorAll('form[data-ciel="contact"], form[data-ciel-form="contact"]');
    forms.forEach(function (form) {
      if (form.__cielBound) return;
      form.__cielBound = true;

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var honeypot = form.querySelector('input[name="website"], input#website');
        if (honeypot && honeypot.value) {
          showFormSuccess(form);
          return;
        }

        var payload = extractInquiryPayload(form);
        if (!payload.email) {
          alert("Please provide an email address.");
          return;
        }

        var submitButton = form.querySelector('[type="submit"]');
        var originalText = submitButton ? submitButton.innerHTML : "";
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = "Sending...";
        }

        trackEvent("quote_submit", {
          event_type: "conversion",
          metadata: {
            service_requested: payload.service_requested,
          },
        });

        submitInquiry(payload)
          .then(function () {
            showFormSuccess(form);
            return trackEvent("quote_success", {
              event_type: "conversion",
              metadata: {
                service_requested: payload.service_requested,
              },
            });
          })
          .catch(function (error) {
            console.error("[Cielonline Bridge] Inquiry error:", error);
            alert("Something went wrong. Please call or email the business directly.");
          })
          .finally(function () {
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.innerHTML = originalText;
            }
          });
      });
    });
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(value == null ? "" : String(value)));
    return div.innerHTML;
  }

  function init() {
    Promise.all([
      applySiteContent(),
      renderServices(),
      populateServiceDropdowns(),
      populateServiceCheckboxes(),
    ]).finally(function () {
      bindContactForms();
      bindTrackedLinks();
      trackEvent("page_view", { event_type: "page_view" });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.Cielonline = {
    siteId: SITE_ID,
    siteSlug: SITE_SLUG,
    submitInquiry: function (payload) {
      return submitInquiry({
        name: payload.name || [payload.firstName, payload.lastName].filter(Boolean).join(" "),
        email: payload.email || null,
        phone: payload.phone || null,
        message: payload.message || null,
        service_requested: payload.service || payload.service_requested || null,
        vehicle_info: payload.vehicle || payload.vehicle_info || null,
        preferred_date: payload.preferred_date || null,
        status: "new",
        source: "website",
      });
    },
    getServices: getServices,
    getSiteContent: getSiteContent,
    trackEvent: trackEvent,
    getBookingUrl: function () {
      return getSiteContent().then(function (content) {
        return content["business.booking_url"] || null;
      });
    },
  };
})();