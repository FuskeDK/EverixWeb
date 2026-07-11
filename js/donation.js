(function () {
  "use strict";

  var STRIPE_LINKS = {
    spark: "https://buy.stripe.com/4gM28tdfta1vfwGaCt3F600",
    flame: "https://buy.stripe.com/14A00ldft2z384e8ul3F601",
    blaze: "https://buy.stripe.com/9B66oJ1wL1uZgAKeSJ3F602",
    inferno: "https://buy.stripe.com/28E4gB7V94HbfwG3a13F603",
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
