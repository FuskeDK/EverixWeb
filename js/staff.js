import { renderApplicationList } from "./applications-ui.js";

(function () {
  "use strict";

  var category = document.body.getAttribute("data-category");
  if (!category) return;

  var loginGate = document.getElementById("staffLoginGate");
  var notAuthorized = document.getElementById("staffNotAuthorized");
  var panel = document.getElementById("staffPanel");
  var activeList = document.getElementById("staffActiveList");
  var historyList = document.getElementById("staffHistoryList");
  var searchInput = document.getElementById("staffSearch");
  var toggleBtn = document.getElementById("staffCategoryToggle");
  var toggleLabel = document.getElementById("staffCategoryToggleLabel");
  var tabButtons = document.querySelectorAll(".staff-tab-btn");
  var tabPanels = { aktive: document.getElementById("staffTabAktive"), historik: document.getElementById("staffTabHistorik") };

  var allApplications = [];
  var categoryEnabled = null;

  function switchTab(name) {
    tabButtons.forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === name);
    });
    Object.keys(tabPanels).forEach(function (key) {
      tabPanels[key].hidden = key !== name;
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTab(btn.getAttribute("data-tab"));
    });
  });

  function renderActive() {
    var pending = allApplications.filter(function (a) { return a.status === "pending"; });
    renderApplicationList(activeList, pending, true, load);
  }

  function renderHistory() {
    var query = (searchInput.value || "").toLowerCase().trim();
    var answered = allApplications.filter(function (a) {
      if (a.status === "pending") return false;
      if (!query) return true;
      return a.discord_username.toLowerCase().indexOf(query) !== -1;
    });
    renderApplicationList(historyList, answered, false);
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderHistory);
  }

  function updateToggleUI() {
    if (!toggleBtn) return;
    toggleBtn.classList.toggle("is-on", categoryEnabled);
    toggleLabel.textContent = categoryEnabled ? "Åben for ansøgninger" : "Lukket for ansøgninger";
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var next = !categoryEnabled;
      toggleBtn.disabled = true;
      fetch("/api/admin/category-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category: category, enabled: next }),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("toggle_failed");
          categoryEnabled = next;
          updateToggleUI();
        })
        .catch(function () {
          alert("Kunne ikke ændre status. Prøv igen.");
        })
        .finally(function () {
          toggleBtn.disabled = false;
        });
    });
  }

  function load() {
    return fetch("/api/staff/applications?category=" + encodeURIComponent(category), { credentials: "include" }).then(
      function (r) {
        if (r.status === 401) {
          loginGate.hidden = false;
          return;
        }
        if (r.status === 403) {
          notAuthorized.hidden = false;
          return;
        }
        return r.json().then(function (data) {
          panel.hidden = false;
          allApplications = data.applications || [];
          renderActive();
          renderHistory();
        });
      }
    );
  }

  fetch("/api/category-settings")
    .then(function (r) { return r.json(); })
    .then(function (settings) {
      categoryEnabled = Boolean(settings[category]);
      updateToggleUI();
    });

  fetch("/api/me")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.loggedIn) {
        loginGate.hidden = false;
        return;
      }
      return load();
    })
    .catch(function () {
      loginGate.hidden = false;
    });
})();
