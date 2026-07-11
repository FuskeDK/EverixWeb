(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var navToggle = document.getElementById("navToggle");

  /* Header state on scroll */
  function onScroll() {
    if (window.scrollY > 12) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile nav toggle */
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = header.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* FAQ accordion */
  var faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(function (item) {
    var btn = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");
    btn.addEventListener("click", function () {
      var isOpen = btn.getAttribute("aria-expanded") === "true";

      faqItems.forEach(function (other) {
        if (other === item) return;
        other.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        other.querySelector(".faq-answer").style.maxHeight = null;
      });

      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + "px";
    });
  });

  /* Ribbon line draws in as the steps section scrolls into view */
  var ribbonPath = document.getElementById("ribbonPath");
  if (ribbonPath && "getTotalLength" in ribbonPath) {
    var length = ribbonPath.getTotalLength();
    ribbonPath.style.strokeDasharray = length;
    ribbonPath.style.strokeDashoffset = length;

    var stepsSection = document.getElementById("kom-i-gang");
    if (stepsSection && "IntersectionObserver" in window) {
      var ribbonIO = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              ribbonPath.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.22,.75,.32,1)";
              ribbonPath.style.strokeDashoffset = 0;
              ribbonIO.unobserve(ribbonPath);
            }
          });
        },
        { threshold: 0.3 }
      );
      ribbonIO.observe(stepsSection);
    }
  }
})();
