import { renderApplicationList, escapeHtml } from "/js/applications-ui.js";

(function () {
  "use strict";

  var loginGate = document.getElementById("dashboardLoginGate");
  var content = document.getElementById("dashboardContent");
  var avatar = document.getElementById("dashboardAvatar");
  var usernameEl = document.getElementById("dashboardUsername");
  var idEl = document.getElementById("dashboardId");
  var stats = document.getElementById("dashboardStats");

  var applicationsList = document.getElementById("dashboardApplicationsList");
  var donationsList = document.getElementById("dashboardDonationsList");

  var railButtons = document.querySelectorAll(".dashboard-rail-item");
  var tabPanels = {
    ansogninger: document.getElementById("dashboardTabAnsogninger"),
    donationer: document.getElementById("dashboardTabDonationer"),
  };

  railButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      railButtons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      Object.keys(tabPanels).forEach(function (key) { tabPanels[key].hidden = key !== tab; });
    });
  });

  var TIER_LABELS = { spark: "Spark", flame: "Flame", blaze: "Blaze", inferno: "Inferno", custom: "Vælg selv" };

  var STAT_ICONS = {
    pending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    approved: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 6 9 17l-5-5"/></svg>',
    rejected: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    donations: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1.4 1.3-2.5 3-2.5s3 1 3 2.3c0 3-6 1.7-6 4.7 0 1.3 1.3 2.3 3 2.3s3-1.1 3-2.5"/></svg>',
  };

  function formatKr(amount) {
    return new Intl.NumberFormat("da-DK").format(amount || 0) + " kr.";
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("da-DK", { year: "numeric", month: "short", day: "numeric" });
  }

  function renderTiles(items) {
    stats.innerHTML = items
      .map(function (item) {
        return (
          '<div class="dashboard-tile dashboard-tile-' + item.tone + '">' +
          '<span class="dashboard-tile-icon">' + STAT_ICONS[item.icon] + "</span>" +
          '<span class="dashboard-tile-value">' + escapeHtml(String(item.value)) + "</span>" +
          '<span class="dashboard-tile-label">' + escapeHtml(item.label) + "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderDonations(donations) {
    donationsList.innerHTML = donations.length
      ? donations
          .map(function (d) {
            var statusClass = d.status === "unused" ? "admin-status-rejected" : "admin-status-approved";
            var statusText = d.status === "unused" ? "Ikke indløst" : "Indløst";
            return (
              '<div class="admin-card ' + statusClass + '">' +
              '<div class="admin-card-head" style="cursor:default;">' +
              '<span class="admin-card-title">' + escapeHtml(TIER_LABELS[d.tier] || d.tier) + " &middot; " + formatKr(d.amount_kr) + "</span>" +
              '<span class="admin-card-meta-inline">' +
              "<span>" + formatDate(d.created_at) + "</span>" +
              '<span class="admin-status-badge">' + statusText + "</span>" +
              "</span>" +
              "</div>" +
              '<div class="admin-card-body">' +
              '<div class="admin-answers">' +
              '<div class="admin-answer-row"><span class="admin-answer-key">Kvitteringskode</span><span class="admin-answer-value">' + escapeHtml(d.code) + "</span></div>" +
              "</div>" +
              "</div>" +
              "</div>"
            );
          })
          .join("")
      : '<p class="apply-gate-text">Du har ingen donationer endnu.</p>';
  }

  fetch("/api/applications", { credentials: "include" })
    .then(function (r) {
      if (r.status === 401) {
        loginGate.hidden = false;
        return null;
      }
      return r.json();
    })
    .then(function (data) {
      if (!data) return;
      content.hidden = false;

      var applications = data.applications || [];
      var donations = data.donations || [];

      renderApplicationList(applicationsList, applications, false);
      renderDonations(donations);

      renderTiles([
        { label: "Afventer", value: applications.filter(function (a) { return a.status === "pending"; }).length, icon: "pending", tone: "blue" },
        { label: "Godkendt", value: applications.filter(function (a) { return a.status === "approved"; }).length, icon: "approved", tone: "green" },
        { label: "Afvist", value: applications.filter(function (a) { return a.status === "rejected"; }).length, icon: "rejected", tone: "orange" },
        { label: "Donationer", value: donations.length, icon: "donations", tone: "amber" },
      ]);

      return fetch("/api/me")
        .then(function (r) { return r.json(); })
        .then(function (me) {
          if (!me.loggedIn) return;
          usernameEl.textContent = me.username;
          idEl.textContent = "Discord-ID " + me.discordId;
          avatar.src = me.avatarUrl;
          avatar.alt = me.username;
        });
    })
    .catch(function () {
      loginGate.hidden = false;
    });
})();
