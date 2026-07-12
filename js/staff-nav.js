(function () {
  "use strict";

  var CATEGORY_PATHS = {
    Politi: "/politi",
    EMS: "/ems",
    Firma: "/firma",
    Bande: "/bande",
    Allowlist: "/allowlist",
  };

  fetch("/api/me")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var categories = data.categories || [];
      if (!categories.length) return;

      document.querySelectorAll(".main-nav, .mobile-nav").forEach(function (nav) {
        var discordLink = nav.querySelector('a[href*="discord.gg"]');
        categories.forEach(function (category) {
          var path = CATEGORY_PATHS[category];
          if (!path) return;
          var link = document.createElement("a");
          link.href = path;
          link.textContent = category;
          if (discordLink && discordLink.parentElement === nav) {
            nav.insertBefore(link, discordLink);
          } else {
            nav.appendChild(link);
          }
        });
      });
    })
    .catch(function () {});
})();
