(function () {
  "use strict";

  var loginGate = document.getElementById("loginGate");
  var cardsSection = document.getElementById("applyCards");
  var formSection = document.getElementById("applyFormSection");
  var categoryLabel = document.getElementById("applyCategoryLabel");
  var backBtn = document.getElementById("applyBack");
  var usernameEl = document.getElementById("applyUsername");
  var discordField = document.getElementById("discordUsernameField");

  var currentUser = null;

  fetch("/api/me")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.loggedIn) {
        currentUser = data.username;
        if (usernameEl) usernameEl.textContent = data.username;
        if (discordField) discordField.value = data.username;
        if (cardsSection) cardsSection.hidden = false;
      } else {
        if (loginGate) loginGate.hidden = false;
      }
    })
    .catch(function () {
      if (loginGate) loginGate.hidden = false;
    });

  var allCards = document.querySelectorAll(".apply-card[data-category]");
  var selectedCategory = null;

  fetch("/api/category-settings")
    .then(function (r) { return r.json(); })
    .then(function (settings) {
      allCards.forEach(function (card) {
        var category = card.getAttribute("data-category");
        if (settings[category] === false) {
          card.classList.add("apply-card-disabled");
          card.setAttribute("aria-disabled", "true");
          card.setAttribute("tabindex", "-1");
          var cta = card.querySelector(".apply-card-cta");
          if (cta) {
            cta.classList.add("apply-card-cta-disabled");
            cta.textContent = "Lukket for ansøgninger";
          }
        }
      });
    });

  allCards.forEach(function (card) {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      if (card.classList.contains("apply-card-disabled")) return;
      selectedCategory = card.getAttribute("data-category");
      if (categoryLabel) categoryLabel.textContent = selectedCategory;
      cardsSection.hidden = true;
      formSection.hidden = false;
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (backBtn) {
    backBtn.addEventListener("click", function () {
      formSection.hidden = true;
      cardsSection.hidden = false;
      cardsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  var form = document.getElementById("applyForm");
  var success = document.getElementById("formSuccess");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var formData = new FormData(form);
    var answers = {};
    formData.forEach(function (value, key) {
      if (key === "discord") return; // identity comes from the verified session, not the form
      answers[key] = value;
    });

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ category: selectedCategory, answers: answers }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("submit_failed");
        return r.json();
      })
      .then(function () {
        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: "smooth", block: "center" });
      })
      .catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        alert("Der gik noget galt. Prøv igen, eller kontakt staff hvis det bliver ved.");
      });
  });
})();
