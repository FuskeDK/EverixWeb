(function () {
  "use strict";

  var TIERS = {
    spark: {
      name: "Spark",
      perks: ["Spark Discord-rolle", "Prioriteret kø", "1x custom nummerplade"],
    },
    flame: {
      name: "Flame",
      perks: [
        "Flame Discord-rolle",
        "Prioriteret kø+",
        "Adgang til beta-features",
        "2x custom nummerplade",
        "Alle Spark fordele",
      ],
    },
    blaze: {
      name: "Blaze",
      perks: [
        "Blaze Discord-rolle",
        "Prioriteret kø++",
        "Adgang til beta-features",
        "3x custom nummerplade",
        "Custom telefonnummer",
        "Alle Flame fordele",
      ],
    },
    inferno: {
      name: "Inferno",
      perks: [
        "Inferno Discord-rolle",
        "Højeste kø-prioritet",
        "Adgang til beta-features",
        "5x custom nummerplade",
        "Custom telefonnummer",
        "Prioritet i whitelist/ansøgninger",
        "Alle Blaze fordele",
      ],
    },
    custom: {
      name: "Valgfri",
      perks: ["Anerkendelse for din støtte til serveren"],
    },
  };

  var params = new URLSearchParams(window.location.search);
  var tier = TIERS[params.get("tier")];
  var sessionId = params.get("session_id");

  var intro = document.getElementById("takIntro");
  var panel = document.getElementById("takPerksPanel");
  var label = document.getElementById("takTierLabel");
  var list = document.getElementById("takPerksList");
  var codePanel = document.getElementById("takCodePanel");
  var codeEl = document.getElementById("takCode");

  if (tier) {
    if (intro) intro.textContent = "Tak for din " + tier.name + "-donation! Her er det, du har fået adgang til.";
    if (label) label.textContent = tier.name + " fordele";
    if (list) {
      list.innerHTML = tier.perks
        .map(function (perk) {
          var div = document.createElement("div");
          div.textContent = perk;
          return "<li>" + div.innerHTML + "</li>";
        })
        .join("");
    }
    if (panel) panel.hidden = false;
  }

  if (sessionId && codePanel && codeEl) {
    fetch("/api/create-donation?session_id=" + encodeURIComponent(sessionId))
      .then(function (r) {
        if (!r.ok) throw new Error("not_found");
        return r.json();
      })
      .then(function (data) {
        codeEl.textContent = data.code;
        codePanel.hidden = false;
      })
      .catch(function () {
        // Code lookup can fail if the webhook hasn't processed yet - not fatal, page still works.
      });
  }
})();
