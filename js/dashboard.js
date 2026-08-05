import { renderApplicationList, escapeHtml } from "/js/applications-ui.js";

(function () {
  "use strict";

  var loginGate = document.getElementById("dashboardLoginGate");
  var content = document.getElementById("dashboardContent");
  var who = document.getElementById("dashboardWho");
  var stats = document.getElementById("dashboardStats");

  var applicationsList = document.getElementById("dashboardApplicationsList");
  var donationsList = document.getElementById("dashboardDonationsList");

  var tabButtons = document.querySelectorAll(".staff-tab-btn");
  var tabPanels = {
    ansogninger: document.getElementById("dashboardTabAnsogninger"),
    donationer: document.getElementById("dashboardTabDonationer"),
  };

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      tabButtons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      Object.keys(tabPanels).forEach(function (key) { tabPanels[key].hidden = key !== tab; });
    });
  });

  var TIER_LABELS = { spark: "Spark", flame: "Flame", blaze: "Blaze", inferno: "Inferno", custom: "Vælg selv" };

  function formatKr(amount) {
    return new Intl.NumberFormat("da-DK").format(amount || 0) + " kr.";
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("da-DK", { year: "numeric", month: "short", day: "numeric" });
  }

  function renderStatRow(el, items) {
    el.innerHTML = items
      .map(function (item) {
        return (
          '<div class="admin-stat">' +
          '<span class="admin-stat-label">' + escapeHtml(item.label) + "</span>" +
          '<span class="admin-stat-value">' + escapeHtml(String(item.value)) + "</span>" +
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

      renderStatRow(stats, [
        { label: "Afventer", value: applications.filter(function (a) { return a.status === "pending"; }).length },
        { label: "Godkendt", value: applications.filter(function (a) { return a.status === "approved"; }).length },
        { label: "Afvist", value: applications.filter(function (a) { return a.status === "rejected"; }).length },
        { label: "Donationer", value: donations.length },
      ]);

      return fetch("/api/me")
        .then(function (r) { return r.json(); })
        .then(function (me) {
          if (me.loggedIn) who.textContent = "Logget ind som " + me.username;
        });
    })
    .catch(function () {
      loginGate.hidden = false;
    });
})();
