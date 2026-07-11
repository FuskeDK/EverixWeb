(function () {
  "use strict";

  // TODO: replace with real Stripe Payment Link(s) once Stripe is set up.
  // If each tier gets its own link, swap this for a { spark: "...", flame: "...", ... } map.
  var STRIPE_PLACEHOLDER_URL = "https://buy.stripe.com/REPLACE_ME";

  document.querySelectorAll(".donate-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var tier = btn.getAttribute("data-tier");

      fetch("/api/me")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.loggedIn) {
            window.location.href = "/api/discord-callback?return=" + encodeURIComponent("/donation");
            return;
          }
          window.location.href = STRIPE_PLACEHOLDER_URL + "?tier=" + encodeURIComponent(tier);
        })
        .catch(function () {
          window.location.href = "/api/discord-callback?return=" + encodeURIComponent("/donation");
        });
    });
  });
})();
