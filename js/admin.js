import { renderApplicationList, escapeHtml } from "./applications-ui.js";

(function () {
  "use strict";

  var loginGate = document.getElementById("adminLoginGate");
  var denied = document.getElementById("adminDenied");
  var pageTitle = document.getElementById("adminPageTitle");

  var tabAnsogninger = document.getElementById("adminTabAnsogninger");
  var tabRegler = document.getElementById("adminTabRegler");
  var navButtons = document.querySelectorAll(".admin-nav-btn");

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-admin-tab");
      navButtons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      tabAnsogninger.hidden = tab !== "ansogninger";
      tabRegler.hidden = tab !== "regler";
      pageTitle.textContent = tab === "regler" ? "Regler" : "Ansøgninger";
      if (tab === "regler") loadRules();
    });
  });

  // ---------- Ansøgninger ----------
  var filters = document.getElementById("adminFilters");
  var activeList = document.getElementById("adminActiveList");
  var historyList = document.getElementById("adminHistoryList");
  var searchInput = document.getElementById("adminSearch");
  var subTabButtons = document.querySelectorAll("#adminTabAnsogninger .staff-tab-btn");
  var subTabPanels = { aktive: document.getElementById("adminTabAktive"), historik: document.getElementById("adminTabHistorik") };

  var allApplications = [];
  var activeCategoryFilter = "Alle";

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
    renderApplicationList(historyList, answered, false);
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
              '<span><strong>' +
              escapeHtml(r.title) +
              "</strong> " +
              escapeHtml(r.body) +
              "</span>" +
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

  loadApplications();
})();
