(function () {
  "use strict";

  var cardsSection = document.getElementById("applyCards");
  var formSection = document.getElementById("applyFormSection");
  var categoryLabel = document.getElementById("applyCategoryLabel");
  var backBtn = document.getElementById("applyBack");
  var cards = document.querySelectorAll(".apply-card:not(.apply-card-disabled)");

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

  var voucherSelect = document.getElementById("voucherSelect");
  var voucherIdField = document.getElementById("voucherIdField");
  if (voucherSelect && voucherIdField) {
    voucherSelect.addEventListener("change", function () {
      voucherIdField.hidden = voucherSelect.value !== "ja";
    });
  }

  var ruleCheckboxes = document.querySelectorAll('input[name="regel"]');
  var ruleCounter = document.getElementById("ruleCounter");
  if (ruleCheckboxes.length && ruleCounter) {
    var updateRuleCounter = function () {
      var checked = document.querySelectorAll('input[name="regel"]:checked').length;
      ruleCounter.textContent = checked + " / " + ruleCheckboxes.length + " valgt (kræver alle)";
      ruleCounter.classList.toggle("is-complete", checked === ruleCheckboxes.length);
    };
    ruleCheckboxes.forEach(function (box) {
      box.addEventListener("change", updateRuleCounter);
    });
    updateRuleCounter();
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
