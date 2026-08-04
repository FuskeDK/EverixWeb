import { renderApplicationList, escapeHtml } from "/js/applications-ui.js";

(function () {
  "use strict";

  var loginGate = document.getElementById("adminLoginGate");
  var denied = document.getElementById("adminDenied");
  var pageTitle = document.getElementById("adminPageTitle");

  var tabAnsogninger = document.getElementById("adminTabAnsogninger");
  var tabDonationer = document.getElementById("adminTabDonationer");
  var tabKategorier = document.getElementById("adminTabKategorier");
  var tabRegler = document.getElementById("adminTabRegler");
  var navButtons = document.querySelectorAll(".admin-nav-btn");
  var tabTitles = { ansogninger: "Ansøgninger", donationer: "Donationer", kategorier: "Kategorier", regler: "Regler" };

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-admin-tab");
      navButtons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      tabAnsogninger.hidden = tab !== "ansogninger";
      tabDonationer.hidden = tab !== "donationer";
      tabKategorier.hidden = tab !== "kategorier";
      tabRegler.hidden = tab !== "regler";
      pageTitle.textContent = tabTitles[tab] || "Ansøgninger";
      if (tab === "regler") loadRules();
      if (tab === "kategorier") loadCategorySettings();
      if (tab === "donationer") loadDonations();
    });
  });

  // ---------- Kategorier ----------
  var categoryToggleGrid = document.getElementById("categoryToggleGrid");
  var ALL_CATEGORIES = ["Whitelist", "Politi", "EMS", "Firma", "Bande"];

  function renderCategoryToggles(settings) {
    categoryToggleGrid.innerHTML = ALL_CATEGORIES.map(function (cat) {
      var enabled = Boolean(settings[cat]);
      return (
        '<div class="staff-toggle-row" data-category="' + cat + '">' +
        "<span class=\"staff-toggle-label\">" + cat + " &middot; " + (enabled ? "Åben for ansøgninger" : "Lukket for ansøgninger") + "</span>" +
        '<button type="button" class="staff-toggle' + (enabled ? " is-on" : "") + '" data-toggle-category="' + cat + '" aria-label="Slå ' + cat + ' til/fra"></button>' +
        "</div>"
      );
    }).join("");

    categoryToggleGrid.querySelectorAll("[data-toggle-category]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cat = btn.getAttribute("data-toggle-category");
        var next = !btn.classList.contains("is-on");
        btn.disabled = true;
        fetch("/api/category-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ category: cat, enabled: next }),
        })
          .then(function (r) {
            if (!r.ok) throw new Error("toggle_failed");
            return loadCategorySettings();
          })
          .catch(function () {
            alert("Kunne ikke ændre status. Prøv igen.");
          })
          .finally(function () {
            btn.disabled = false;
          });
      });
    });
  }

  function loadCategorySettings() {
    return fetch("/api/category-settings")
      .then(function (r) { return r.json(); })
      .then(renderCategoryToggles);
  }

  // ---------- Ansøgninger ----------
  var filters = document.getElementById("adminFilters");
  var activeList = document.getElementById("adminActiveList");
  var historyList = document.getElementById("adminHistoryList");
  var searchInput = document.getElementById("adminSearch");
  var subTabButtons = document.querySelectorAll("#adminTabAnsogninger .staff-tab-btn");
  var subTabPanels = { aktive: document.getElementById("adminTabAktive"), historik: document.getElementById("adminTabHistorik") };

  var allApplications = [];
  var activeCategoryFilter = "Alle";
  var applicationStats = document.getElementById("applicationStats");

  function downloadCsv(filename, rows) {
    if (!rows.length) return;
    var headers = Object.keys(rows[0]);
    var escapeCell = function (val) {
      var str = val === null || val === undefined ? "" : String(val);
      return '"' + str.replace(/"/g, '""') + '"';
    };
    var lines = [headers.map(escapeCell).join(",")].concat(
      rows.map(function (row) { return headers.map(function (h) { return escapeCell(row[h]); }).join(","); })
    );
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderStatRow(el, items) {
    if (!el) return;
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

  subTabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      subTabButtons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      Object.keys(subTabPanels).forEach(function (key) { subTabPanels[key].hidden = key !== tab; });
    });
  });

  if (filters) {
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".admin-filter-btn");
      if (!btn) return;
      activeCategoryFilter = btn.getAttribute("data-filter");
      filters.querySelectorAll(".admin-filter-btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderAll();
    });
  }

  if (searchInput) searchInput.addEventListener("input", renderAll);

  function byCategory(list) {
    return activeCategoryFilter === "Alle" ? list : list.filter(function (a) { return a.category === activeCategoryFilter; });
  }

  function renderAll() {
    var pending = byCategory(allApplications.filter(function (a) { return a.status === "pending"; }));
    renderApplicationList(activeList, pending, true, loadApplications);

    var query = (searchInput.value || "").toLowerCase().trim();
    var answered = byCategory(allApplications.filter(function (a) { return a.status !== "pending"; })).filter(function (a) {
      return !query || a.discord_username.toLowerCase().indexOf(query) !== -1;
    });
    renderApplicationList(historyList, answered, true, loadApplications);

    renderStatRow(applicationStats, [
      { label: "Afventer", value: allApplications.filter(function (a) { return a.status === "pending"; }).length },
      { label: "Godkendt", value: allApplications.filter(function (a) { return a.status === "approved"; }).length },
      { label: "Afvist", value: allApplications.filter(function (a) { return a.status === "rejected"; }).length },
      { label: "I alt", value: allApplications.length },
    ]);
  }

  var refreshApplicationsBtn = document.getElementById("refreshApplicationsBtn");
  var exportApplicationsBtn = document.getElementById("exportApplicationsBtn");

  if (refreshApplicationsBtn) {
    refreshApplicationsBtn.addEventListener("click", function () {
      refreshApplicationsBtn.disabled = true;
      loadApplications().finally(function () { refreshApplicationsBtn.disabled = false; });
    });
  }

  if (exportApplicationsBtn) {
    exportApplicationsBtn.addEventListener("click", function () {
      downloadCsv(
        "ansogninger.csv",
        allApplications.map(function (a) {
          return {
            discord_username: a.discord_username,
            category: a.category,
            status: a.status,
            created_at: a.created_at,
          };
        })
      );
    });
  }

  function loadApplications() {
    return fetch("/api/admin/applications", { credentials: "include" }).then(function (r) {
      if (r.status === 401) {
        loginGate.hidden = false;
        return;
      }
      if (r.status === 403) {
        denied.hidden = false;
        return;
      }
      return r.json().then(function (data) {
        tabAnsogninger.hidden = false;
        allApplications = data.applications || [];
        renderAll();
      });
    });
  }

  // ---------- Regler ----------
  var rulesGroups = document.getElementById("rulesGroups");
  var newGroupName = document.getElementById("newGroupName");
  var newGroupCode = document.getElementById("newGroupCode");
  var addGroupBtn = document.getElementById("addGroupBtn");

  function ruleApi(method, kind, payload) {
    return fetch("/api/rules", {
      method: method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(Object.assign({ kind: kind }, payload)),
    }).then(function (r) {
      if (!r.ok) throw new Error("rules_failed");
      return r.json();
    });
  }

  function renderRules(groups) {
    rulesGroups.innerHTML = groups
      .map(function (g) {
        var items = (g.rules || [])
          .map(function (r) {
            return (
              '<div class="rule-check-item" data-rule-id="' +
              r.id +
              '">' +
              '<span class="rule-view"><strong>' +
              escapeHtml(r.title) +
              "</strong> " +
              escapeHtml(r.body) +
              "</span>" +
              '<span class="rule-edit" hidden>' +
              '<input type="text" class="edit-rule-title" value="' + escapeHtml(r.title) + '">' +
              '<input type="text" class="edit-rule-body" value="' + escapeHtml(r.body) + '">' +
              "</span>" +
              '<button type="button" class="btn btn-outline btn-small" data-edit-rule="' +
              r.id +
              '">Redigér</button>' +
              '<button type="button" class="btn btn-outline btn-small" data-delete-rule="' +
              r.id +
              '">Slet</button>' +
              "</div>"
            );
          })
          .join("");
        return (
          '<div class="admin-card" style="margin-bottom:18px;">' +
          '<div class="admin-card-head" style="cursor:default;">' +
          '<span class="admin-card-title">' +
          escapeHtml(g.name) +
          (g.code ? " (" + escapeHtml(g.code) + ")" : "") +
          "</span>" +
          '<button type="button" class="btn btn-outline btn-small" data-delete-group="' +
          g.id +
          '">Slet gruppe</button>' +
          "</div>" +
          '<div class="admin-card-body">' +
          (g.note ? '<p class="rules-note">' + escapeHtml(g.note) + "</p>" : items) +
          (g.note
            ? ""
            : '<div class="form-panel" style="margin-top:16px;">' +
              '<div class="form-panel-grid">' +
              '<label class="field field-compact"><span>Titel</span><input type="text" class="new-rule-title" placeholder="F.eks. Metagaming er forbudt."></label>' +
              '<label class="field field-compact"><span>Beskrivelse</span><input type="text" class="new-rule-body" placeholder="Uddyb reglen"></label>' +
              "</div>" +
              '<button type="button" class="btn btn-primary btn-small" data-add-rule="' +
              g.id +
              '">Tilføj regel</button>' +
              "</div>") +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    rulesGroups.querySelectorAll("[data-edit-rule]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var row = btn.closest(".rule-check-item");
        var view = row.querySelector(".rule-view");
        var edit = row.querySelector(".rule-edit");
        var editing = !edit.hidden;
        if (!editing) {
          view.hidden = true;
          edit.hidden = false;
          btn.textContent = "Gem";
          return;
        }
        var title = row.querySelector(".edit-rule-title").value.trim();
        var body = row.querySelector(".edit-rule-body").value.trim();
        if (!title || !body) return;
        ruleApi("PUT", "item", { id: btn.getAttribute("data-edit-rule"), fields: { title: title, body: body } }).then(loadRules);
      });
    });
    rulesGroups.querySelectorAll("[data-delete-rule]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("Slet denne regel?")) return;
        ruleApi("DELETE", "item", { id: btn.getAttribute("data-delete-rule") }).then(loadRules);
      });
    });
    rulesGroups.querySelectorAll("[data-delete-group]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("Slet hele gruppen og alle dens regler?")) return;
        ruleApi("DELETE", "group", { id: btn.getAttribute("data-delete-group") }).then(loadRules);
      });
    });
    rulesGroups.querySelectorAll("[data-add-rule]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".admin-card");
        var title = card.querySelector(".new-rule-title").value.trim();
        var body = card.querySelector(".new-rule-body").value.trim();
        if (!title || !body) return;
        var groupId = btn.getAttribute("data-add-rule");
        ruleApi("POST", "item", { fields: { group_id: groupId, title: title, body: body, position: 999 } }).then(loadRules);
      });
    });
  }

  function loadRules() {
    return fetch("/api/rules")
      .then(function (r) { return r.json(); })
      .then(function (data) { renderRules(data.groups || []); });
  }

  if (addGroupBtn) {
    addGroupBtn.addEventListener("click", function () {
      var name = newGroupName.value.trim();
      if (!name) return;
      ruleApi("POST", "group", { fields: { name: name, code: newGroupCode.value.trim() || null, position: 999 } }).then(function () {
        newGroupName.value = "";
        newGroupCode.value = "";
        loadRules();
      });
    });
  }

  // ---------- Donationer ----------
  var donationStats = document.getElementById("donationStats");
  var donationList = document.getElementById("donationList");
  var donationSearch = document.getElementById("donationSearch");
  var allDonations = [];

  var TIER_LABELS = { spark: "Spark", flame: "Flame", blaze: "Blaze", inferno: "Inferno", custom: "Vælg selv" };

  function formatKr(amount) {
    return new Intl.NumberFormat("da-DK").format(amount || 0) + " kr.";
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("da-DK", { year: "numeric", month: "short", day: "numeric" });
  }

  function renderDonationList() {
    var query = (donationSearch.value || "").toLowerCase().trim();
    var filtered = allDonations.filter(function (d) {
      if (!query) return true;
      return (
        d.discord_id.toLowerCase().indexOf(query) !== -1 ||
        d.code.toLowerCase().indexOf(query) !== -1 ||
        (TIER_LABELS[d.tier] || d.tier).toLowerCase().indexOf(query) !== -1
      );
    });

    donationList.innerHTML = filtered
      .map(function (d) {
        var statusClass = d.status === "unused" ? "admin-status-rejected" : "admin-status-approved";
        var statusLabel = d.status === "unused" ? "Ikke indløst" : "Indløst";
        return (
          '<div class="admin-card ' + statusClass + '">' +
          '<div class="admin-card-head" style="cursor:default;">' +
          '<span class="admin-card-title">' + escapeHtml(TIER_LABELS[d.tier] || d.tier) + " &middot; " + formatKr(d.amount_kr) + "</span>" +
          '<span class="admin-card-meta-inline">' +
          "<span>" + escapeHtml(d.frequency === "month" ? "Månedlig" : "Engang") + "</span>" +
          "<span>" + formatDate(d.created_at) + "</span>" +
          '<span class="admin-status-badge">' + statusLabel + "</span>" +
          "</span>" +
          "</div>" +
          '<div class="admin-card-body">' +
          '<div class="admin-answers">' +
          '<div class="admin-answer-row"><span class="admin-answer-key">Discord-ID</span><span class="admin-answer-value">' + escapeHtml(d.discord_id) + "</span></div>" +
          '<div class="admin-answer-row"><span class="admin-answer-key">Kvitteringskode</span><span class="admin-answer-value">' + escapeHtml(d.code) +
          ' <button type="button" class="btn btn-ghost btn-small" data-copy-code="' + escapeHtml(d.code) + '">Kopiér</button></span></div>' +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("") || '<p class="apply-gate-text">Ingen donationer matcher din søgning.</p>';

    donationList.querySelectorAll("[data-copy-code]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var code = btn.getAttribute("data-copy-code");
        navigator.clipboard.writeText(code).then(function () {
          var original = btn.textContent;
          btn.textContent = "Kopieret!";
          setTimeout(function () { btn.textContent = original; }, 1500);
        });
      });
    });
  }

  if (donationSearch) donationSearch.addEventListener("input", renderDonationList);

  var donationTierBreakdown = document.getElementById("donationTierBreakdown");

  function renderTierBreakdown(byTier) {
    if (!donationTierBreakdown) return;
    var tiers = Object.keys(byTier || {});
    donationTierBreakdown.innerHTML = tiers.length
      ? tiers
          .map(function (tier) {
            return (
              '<span class="admin-tier-chip">' +
              escapeHtml(TIER_LABELS[tier] || tier) +
              " <strong>" + byTier[tier] + "</strong></span>"
            );
          })
          .join("")
      : "";
  }

  var refreshDonationsBtn = document.getElementById("refreshDonationsBtn");
  var exportDonationsBtn = document.getElementById("exportDonationsBtn");

  if (refreshDonationsBtn) {
    refreshDonationsBtn.addEventListener("click", function () {
      refreshDonationsBtn.disabled = true;
      loadDonations().finally(function () { refreshDonationsBtn.disabled = false; });
    });
  }

  if (exportDonationsBtn) {
    exportDonationsBtn.addEventListener("click", function () {
      downloadCsv(
        "donationer.csv",
        allDonations.map(function (d) {
          return {
            code: d.code,
            discord_id: d.discord_id,
            tier: TIER_LABELS[d.tier] || d.tier,
            amount_kr: d.amount_kr,
            frequency: d.frequency,
            status: d.status,
            created_at: d.created_at,
          };
        })
      );
    });
  }

  function loadDonations() {
    return fetch("/api/admin/applications?resource=donations", { credentials: "include" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        allDonations = data.donations || [];
        var stats = data.stats || {};
        renderStatRow(donationStats, [
          { label: "Denne måned", value: formatKr(stats.totalThisMonth) },
          { label: "I alt", value: formatKr(stats.totalAllTime) },
          { label: "Aktive abonnementer", value: stats.activeSubscriptions || 0 },
          { label: "Ikke-indløste koder", value: stats.unusedCodes || 0 },
        ]);
        renderTierBreakdown(stats.byTier);
        renderDonationList();
      });
  }

  loadApplications();
})();
