import { hasCategoryAccess } from "../lib/roles.js";

const CATEGORY_ROLE_NAMES = {
  Politi: "Politi Ledelse",
  EMS: "Sundhedsvæsen Ledelse",
  Firma: "Firma Ansvarlig",
  Bande: "Bande Ansvarlig",
  Allowlist: "Whitelist Ansvarlig",
};

const NOT_FOUND_HTML = `<!doctype html>
<html lang="da"><head><meta charset="UTF-8"><title>404 - Everix</title>
<meta name="robots" content="noindex, nofollow">
<style>body{background:#0a0a0b;color:#9a9ba3;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style>
</head><body><p>404 &mdash; Siden findes ikke.</p></body></html>`;

function renderPage(category) {
  const roleName = CATEGORY_ROLE_NAMES[category];
  return `<!doctype html>
<html lang="da">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${category} - Everix</title>
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="icon" type="image/png" href="/logo.png">
<link rel="stylesheet" href="/css/style.css">
</head>
<body data-category="${category}">

<div class="grain" aria-hidden="true"></div>
<a class="skip-link" href="#hovedindhold">Spring til indhold</a>

<header class="site-header" id="site-header">
  <div class="wrap header-inner">
    <a href="/" class="brand">
      <span class="brand-name">Everix</span>
    </a>
    <nav class="main-nav" aria-label="Hovednavigation">
      <a href="/">Hjem</a>
      <a href="/regler">Regler</a>
      <a href="/ansog">Ansøg</a>
    </nav>
    <div class="header-actions">
      <a class="btn-pill" href="https://discord.gg/nfb6urQQnG" target="_blank" rel="noopener">Discord</a>
      <a class="btn btn-primary btn-small" href="https://cfx.re/join/85jpg4">Spil nu</a>
    </div>
    <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="mobileNav" aria-label="Åbn menu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="mobile-nav" id="mobileNav">
    <a href="/">Hjem</a>
    <a href="/regler">Regler</a>
    <a href="/ansog">Ansøg</a>
    <a href="https://discord.gg/nfb6urQQnG" target="_blank" rel="noopener">Discord</a>
    <a href="https://cfx.re/join/85jpg4" class="mobile-cta">Spil nu</a>
  </div>
</header>

<main id="hovedindhold">

  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">Staff</p>
      <h1 class="page-title">${category}</h1>
    </div>
  </section>

  <!-- LOGIN GATE (fallback if the session expires after this page was served) -->
  <section class="section apply-section" id="staffLoginGate" hidden>
    <div class="wrap apply-wrap apply-gate">
      <p class="apply-gate-text">Log ind med Discord for at se ${category}-ansøgninger.</p>
      <a href="/api/discord-callback" class="btn btn-primary btn-large">Log ind med Discord</a>
    </div>
  </section>

  <!-- NOT AUTHORIZED (fallback if the role is removed after this page was served) -->
  <section class="section apply-section" id="staffNotAuthorized" hidden>
    <div class="wrap apply-wrap apply-gate">
      <p class="apply-gate-text">Du har ikke adgang til denne side. Kræver rollen ${roleName} på Discord.</p>
    </div>
  </section>

  <!-- STAFF PANEL -->
  <section class="section" id="staffPanel">
    <div class="wrap">
      <div class="apply-user-bar">
        <span>Logget ind</span>
        <a href="/api/logout">Log ud</a>
      </div>

      <div class="staff-toggle-row">
        <span id="staffCategoryToggleLabel" class="staff-toggle-label">—</span>
        <button type="button" id="staffCategoryToggle" class="staff-toggle" aria-label="Slå ansøgninger til/fra"></button>
      </div>

      <div class="admin-filters" role="tablist">
        <button type="button" class="admin-filter-btn staff-tab-btn is-active" data-tab="aktive">Aktive</button>
        <button type="button" class="admin-filter-btn staff-tab-btn" data-tab="historik">Historik</button>
      </div>

      <div id="staffTabAktive">
        <div id="staffActiveList" class="admin-list"></div>
      </div>

      <div id="staffTabHistorik" hidden>
        <input type="text" id="staffSearch" class="staff-search" placeholder="Søg efter Discord brugernavn...">
        <div id="staffHistoryList" class="admin-list"></div>
      </div>
    </div>
  </section>

</main>

<footer class="site-footer">
  <div class="wrap footer-bottom">
    <span>© 2026 Everix Roleplay</span>
  </div>
</footer>

<script type="module" src="/js/main.js"></script>
<script type="module" src="/js/staff.js"></script>
</body>
</html>`;
}

export default async function handler(req, res) {
  const { category } = req.query;

  if (!CATEGORY_ROLE_NAMES[category]) {
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(NOT_FOUND_HTML);
    return;
  }

  const allowed = await hasCategoryAccess(req, category);
  if (!allowed) {
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(NOT_FOUND_HTML);
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(renderPage(category));
}
