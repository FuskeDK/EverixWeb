(function () {
  "use strict";

  var loginGate = document.getElementById("adminLoginGate");
  var denied = document.getElementById("adminDenied");
  var panel = document.getElementById("adminPanel");
  var list = document.getElementById("adminList");
  var empty = document.getElementById("adminEmpty");

  function statusLabel(status) {
    if (status === "approved") return "Godkendt";
    if (status === "rejected") return "Afvist";
    return "Afventer";
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

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderApplications(applications) {
    if (!applications.length) {
      empty.hidden = false;
      return;
    }
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
          '">' +
          '<div class="admin-card-head">' +
          "<h3>" +
          escapeHtml(app.discord_username) +
          " &middot; " +
          escapeHtml(app.category) +
          "</h3>" +
          '<span class="admin-status-badge">' +
          statusLabel(app.status) +
          "</span>" +
          "</div>" +
          '<p class="admin-meta">' +
          new Date(app.created_at).toLocaleString("da-DK") +
          "</p>" +
          renderAnswers(app.answers) +
          actions +
          "</article>"
        );
      })
      .join("");

    list.querySelectorAll("button[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
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
        renderApplications(data.applications || []);
      });
    });
  }

  load();
})();
