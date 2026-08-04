(function () {
  "use strict";

  var STRIPE_LINKS = {
    spark: "https://buy.stripe.com/test_fZufZi5UCaz26KybrTfjG04",
    flame: "https://buy.stripe.com/test_9B614oaaS8qU3ymcvXfjG05",
    blaze: "https://buy.stripe.com/test_fZu7sM3MugXq2ui67zfjG06",
    inferno: "https://buy.stripe.com/test_cNi3cwcj0ePib0O0NffjG07",
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
          var urlWithRef = stripeUrl + "?client_reference_id=" + encodeURIComponent(data.discordId);
          window.open(urlWithRef, "_blank", "noopener");
        })
        .catch(function () {
          window.location.href = "/api/discord-callback?return=" + encodeURIComponent("/donation");
        });
    });
  });

  var customBtn = document.getElementById("customDonateBtn");
  var customAmount = document.getElementById("customAmount");
  var customFrequency = document.getElementById("customFrequency");
  var customHint = document.getElementById("customDonateHint");

  document.querySelectorAll(".amount-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll(".amount-chip").forEach(function (c) { c.classList.remove("is-active"); });
      chip.classList.add("is-active");
      if (customAmount) customAmount.value = chip.getAttribute("data-amount");
    });
  });

  if (customBtn) {
    customBtn.addEventListener("click", function () {
      var amount = parseInt(customAmount.value, 10);
      if (!amount || amount < 10 || amount > 10000) {
        customHint.textContent = "Indtast et beløb mellem 10 kr. og 10.000 kr.";
        customHint.style.color = "var(--orange)";
        return;
      }
      customHint.style.color = "";
      customHint.textContent = "Mellem 10 kr. og 10.000 kr.";

      fetch("/api/me")
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.loggedIn) {
            window.location.href = "/api/discord-callback?return=" + encodeURIComponent("/donation");
            return;
          }
          customBtn.disabled = true;
          return fetch("/api/create-donation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ amount: amount, frequency: customFrequency.value }),
          })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              customBtn.disabled = false;
              if (!data.url) throw new Error("no_url");
              window.open(data.url, "_blank", "noopener");
            });
        })
        .catch(function () {
          customBtn.disabled = false;
          customHint.textContent = "Der gik noget galt. Prøv igen.";
          customHint.style.color = "var(--orange)";
        });
    });
  }
})();
