(function () {
  "use strict";

  // TEST MODE Stripe Payment Links - swap for live links (buy.stripe.com/... without "/test_")
  // once the flow is verified end-to-end.
  var STRIPE_LINKS = {
    spark: "https://buy.stripe.com/test_4gM5kE1Em8qUd8W3ZrfjG00",
    flame: "https://buy.stripe.com/test_fZu6oI96O4aE0maeE5fjG01",
    blaze: "https://buy.stripe.com/test_dRmaEYgzgfTm0ma3ZrfjG02",
    inferno: "https://buy.stripe.com/test_14A3cwfvc4aEed0brTfjG03",
  };

  document.querySelectorAll(".donate-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var tier = btn.getAttribute("data-tier");
      var stripeUrl = STRIPE_LINKS[tier];
      if (!stripeUrl) return;

      fetch("/api/me")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.loggedIn) {
            window.location.href = "/api/discord-callback?return=" + encodeURIComponent("/donation");
            return;
          }
          window.open(stripeUrl, "_blank", "noopener");
        })
        .catch(function () {
          window.location.href = "/api/discord-callback?return=" + encodeURIComponent("/donation");
        });
    });
  });
})();
