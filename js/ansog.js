(function () {
  "use strict";

  var cardsSection = document.getElementById("applyCards");
  var formSection = document.getElementById("applyFormSection");
  var categoryLabel = document.getElementById("applyCategoryLabel");
  var backBtn = document.getElementById("applyBack");
  var cards = document.querySelectorAll(".apply-card");

  cards.forEach(function (card) {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      var category = card.getAttribute("data-category");
      if (categoryLabel) categoryLabel.textContent = category;
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
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
