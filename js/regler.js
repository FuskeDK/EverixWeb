(function () {
  "use strict";

  var container = document.getElementById("rulesContainer");
  if (!container) return;

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  fetch("/api/rules")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var groups = data.groups || [];
      container.innerHTML = groups
        .map(function (g) {
          if (g.note) {
            return (
              '<div class="rules-group">' +
              "<h2>" + escapeHtml(g.name) + "</h2>" +
              '<p class="rules-note">' + escapeHtml(g.note) + "</p>" +
              "</div>"
            );
          }
          var items = (g.rules || [])
            .map(function (r) {
              return "<li><strong>" + escapeHtml(r.title) + "</strong> " + escapeHtml(r.body) + "</li>";
            })
            .join("");
          return (
            '<div class="rules-group" style="--code:\'' + escapeHtml(g.code || "") + '\'">' +
            "<h2>" + escapeHtml(g.name) + "</h2>" +
            '<ol class="rule-list">' + items + "</ol>" +
            "</div>"
          );
        })
        .join("");
    });
})();
