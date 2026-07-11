(function () {
  "use strict";

  var TIERS = {
    spark: {
      name: "Spark",
      perks: ["Spark Discord-rolle", "Hjælp til at holde serveren kørende", "Prioriteret kø", "1x custom nummerplade"],
    },
    flame: {
      name: "Flame",
      perks: [
        "Flame Discord-rolle",
        "Hjælp til at holde serveren kørende",
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
        "Hjælp til at holde serveren kørende",
        "Prioriteret kø++",
        "Adgang til beta-features",
        "3x custom nummerplade",
        "Ændring af nummerplade (1x pr. måned)",
        "Alle Flame fordele",
      ],
    },
    inferno: {
      name: "Inferno",
      perks: [
        "Inferno Discord-rolle",
        "Hjælp til at holde serveren kørende",
        "Højeste kø-prioritet",
        "Adgang til beta-features",
        "5x custom nummerplade",
        "Ændring af nummerplade (fair use)",
        "Prioritet i whitelist/ansøgninger",
        "Alle Blaze fordele",
      ],
    },
  };

  var params = new URLSearchParams(window.location.search);
  var tier = TIERS[params.get("tier")];
  if (!tier) return;

  var intro = document.getElementById("takIntro");
  var panel = document.getElementById("takPerksPanel");
  var label = document.getElementById("takTierLabel");
  var list = document.getElementById("takPerksList");

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
})();
