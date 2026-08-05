(function () {
  "use strict";

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function loginHref() {
    return "/api/discord-callback?return=" + encodeURIComponent(window.location.pathname);
  }

  function logoutHref() {
    return "/api/me?logout=1&return=" + encodeURIComponent(window.location.pathname);
  }

  function renderLoggedOut() {
    document.querySelectorAll(".header-actions").forEach(function (el) {
      var a = document.createElement("a");
      a.className = "btn-pill";
      a.href = loginHref();
      a.textContent = "Log ind";
      el.insertBefore(a, el.firstChild);
    });
    document.querySelectorAll(".mobile-nav").forEach(function (el) {
      var a = document.createElement("a");
      a.href = loginHref();
      a.textContent = "Log ind med Discord";
      el.appendChild(a);
    });
  }

  function renderLoggedIn(data) {
    document.querySelectorAll(".header-actions").forEach(function (el) {
      var wrap = document.createElement("div");
      wrap.className = "user-nav";
      wrap.innerHTML =
        '<button type="button" class="user-nav-trigger">' +
        '<img class="user-nav-avatar" src="' + escapeHtml(data.avatarUrl) + '" alt="">' +
        '<span class="user-nav-name">' + escapeHtml(data.username) + "</span>" +
        '<svg class="user-nav-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</button>" +
        '<div class="user-menu">' +
        '<a href="/dashboard">Dashboard</a>' +
        '<a href="' + logoutHref() + '" class="user-menu-logout">Log ud</a>' +
        "</div>";
      el.insertBefore(wrap, el.firstChild);

      var trigger = wrap.querySelector(".user-nav-trigger");
      var menu = wrap.querySelector(".user-menu");
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.classList.toggle("is-open");
      });
      document.addEventListener("click", function (e) {
        if (!wrap.contains(e.target)) menu.classList.remove("is-open");
      });
    });

    document.querySelectorAll(".mobile-nav").forEach(function (el) {
      var dashboard = document.createElement("a");
      dashboard.href = "/dashboard";
      dashboard.textContent = "Dashboard";
      el.appendChild(dashboard);

      var logout = document.createElement("a");
      logout.href = logoutHref();
      logout.textContent = "Log ud";
      el.appendChild(logout);
    });
  }

  fetch("/api/me")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.loggedIn) renderLoggedIn(data);
      else renderLoggedOut();
    })
    .catch(function () {});
})();
