(function () {
  "use strict";

  var loginGate = document.getElementById("adminLoginGate");
  var denied = document.getElementById("adminDenied");
  var panel = document.getElementById("adminPanel");
  var list = document.getElementById("adminList");
  var empty = document.getElementById("adminEmpty");
  var filters = document.getElementById("adminFilters");

  var allApplications = [];
  var activeFilter = "Alle";

  function statusLabel(status) {
    if (status === "approved") return "Godkendt";
    if (status === "rejected") return "Afvist";
    return "Afventer";
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderAnswers(answers) {
    var rows = Object.keys(answers)
      .map(function (key) {
        var value = answers[key];
        if (Array.isArray(value)) value = value.join(", ");
        return (
          '<div class="admin-answer-row"><span class="admin-answer-key">' +
          escapeHtml(key) +
          "</span><span class=\"admin-answer-value\">" +
          escapeHtml(String(value)) +
          "</span></div>"
        );
      })
      .join("");
    return '<div class="admin-answers">' + rows + "</div>";
  }

  function render() {
    var applications =
      activeFilter === "Alle" ? allApplications : allApplications.filter(function (a) { return a.category === activeFilter; });

    if (!applications.length) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    list.innerHTML = applications
      .map(function (app) {
        var actions =
          app.status === "pending"
            ? '<div class="admin-actions">' +
              '<button class="btn btn-primary btn-small" data-action="approve" data-id="' +
              app.id +
              '">Godkend</button>' +
              '<button class="btn btn-outline btn-small" data-action="reject" data-id="' +
              app.id +
              '">Afvis</button>' +
              "</div>"
            : "";
        return (
          '<article class="admin-card admin-status-' +
          app.status +
          '" data-id="' +
          app.id +
          '">' +
          '<button type="button" class="admin-card-head" data-toggle="' +
          app.id +
          '">' +
          '<span class="admin-card-title">' +
          escapeHtml(app.discord_username) +
          " &middot; " +
          escapeHtml(app.category) +
          "</span>" +
          '<span class="admin-card-meta-inline">' +
          new Date(app.created_at).toLocaleDateString("da-DK") +
          '<span class="admin-status-badge">' +
          statusLabel(app.status) +
          "</span>" +
          '<svg class="admin-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          "</span>" +
          "</button>" +
          '<div class="admin-card-body" id="admin-body-' +
          app.id +
          '" hidden>' +
          renderAnswers(app.answers) +
          actions +
          "</div>" +
          "</article>"
        );
      })
      .join("");

    list.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-toggle");
        var body = document.getElementById("admin-body-" + id);
        var card = btn.closest(".admin-card");
        var isOpen = !body.hidden;
        body.hidden = isOpen;
        card.classList.toggle("is-open", !isOpen);
      });
    });

    list.querySelectorAll("button[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        btn.disabled = true;
        fetch("/api/admin/applications/" + id + "/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: action }),
        })
          .then(function (r) {
            if (!r.ok) throw new Error("decision_failed");
            return r.json();
          })
          .then(function (data) {
            if (data.warning === "role_grant_failed") {
              alert(
                "Ansøgningen blev godkendt og brugeren fik en DM, men rollen kunne ikke gives. " +
                  "Tjek at botten's egen rolle står højere end rollen i Server Settings > Roles."
              );
            }
            return load();
          })
          .catch(function () {
            btn.disabled = false;
            alert("Kunne ikke gennemføre handlingen. Prøv igen.");
          });
      });
    });
  }

  if (filters) {
    filters.addEventListener("click", function (e) {
      var btn = e.target.closest(".admin-filter-btn");
      if (!btn) return;
      activeFilter = btn.getAttribute("data-filter");
      filters.querySelectorAll(".admin-filter-btn").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      render();
    });
  }

  function load() {
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
        panel.hidden = false;
        allApplications = data.applications || [];
        render();
      });
    });
  }

  load();
})();
