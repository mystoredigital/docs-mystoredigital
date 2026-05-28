#!/usr/bin/env node
/**
 * build.js — escanea docs/*.html, extrae meta tags, y genera index.html.
 *
 * Cada doc debe declarar:
 *   <title>Título visible</title>
 *   <meta name="description" content="Resumen corto.">
 *   <meta name="category" content="INFRAESTRUCTURA">
 *   <meta name="date" content="2026-05-10">
 */

const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.join(__dirname, "docs");
const OUT = path.join(__dirname, "index.html");

const ORDER = ["INFRAESTRUCTURA", "AUTOMATIZACIÓN", "CAPACIDADES", "ANÁLISIS DE MERCADO"];

function extract(html, name) {
  const tag = name === "title"
    ? /<title>([^<]+)<\/title>/i
    : new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, "i");
  const m = html.match(tag);
  return m ? m[1].trim() : "";
}

function escape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const entries = fs.readdirSync(DOCS_DIR)
  .filter((f) => f.endsWith(".html"))
  .map((f) => {
    const html = fs.readFileSync(path.join(DOCS_DIR, f), "utf8");
    return {
      file: f,
      title: extract(html, "title"),
      description: extract(html, "description"),
      category: extract(html, "category") || "OTROS",
      date: extract(html, "date") || "",
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.file.localeCompare(b.file)));

const grouped = {};
for (const e of entries) {
  if (!grouped[e.category]) grouped[e.category] = [];
  grouped[e.category].push(e);
}

const cats = Object.keys(grouped).sort((a, b) => {
  const ai = ORDER.indexOf(a);
  const bi = ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
});

// Numeración global (basada en orden cronológico)
let globalNum = 0;
const allOrdered = [];
for (const cat of cats) for (const e of grouped[cat]) {
  globalNum += 1;
  e.num = String(globalNum).padStart(2, "0");
  allOrdered.push(e);
}

const sections = cats.map((cat) => `
      <section class="section">
        <h2>${escape(cat)}</h2>
        <div class="entries">
${grouped[cat].map((e) => `          <a class="entry" href="docs/${escape(e.file)}">
            <div class="entry-num">${e.num}</div>
            <div class="entry-body">
              <div class="entry-title">${escape(e.title)}</div>
              <div class="entry-desc">${escape(e.description)}</div>
            </div>
            <div class="entry-meta">${escape(e.date)}</div>
          </a>`).join("\n")}
        </div>
      </section>`).join("\n");

const buildId = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

const out = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>docs · My Store Digital</title>
  <meta name="description" content="Documentación técnica de procesos, integraciones y capacidades de la infraestructura de My Store Digital.">
  <link rel="icon" href="assets/isotipo.svg" type="image/svg+xml">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a class="nav-brand" href="/">
        <img class="iso" src="assets/isotipo.svg" alt="My Store Digital">
        <span class="wordmark">My Store <span class="o">Digital</span> · docs</span>
      </a>
      <div class="nav-meta">
        <a href="https://github.com/mystoredigital/docs-mystoredigital" target="_blank" rel="noopener">github</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="hero-inner">
      <div class="pill">Manual técnico</div>
      <h1>Documentación <span class="accent">técnica</span>.<br>Procesos reales, ejecutables.</h1>
      <p class="lede">Cada entrada documenta una intervención real ejecutada en producción: qué problema resolvía, cómo se atacó y qué quedó operando. Pensado para que un cliente entienda el alcance y para que un técnico pueda reproducirlo.</p>
    </div>
  </header>

  <main class="shell">
${sections}
  </main>

  <footer class="site">
    <div class="inner">
      <img src="assets/logo.svg" alt="My Store Digital">
      <div class="meta">${entries.length} documento${entries.length === 1 ? "" : "s"} · build ${escape(buildId)} · <a href="https://github.com/mystoredigital/docs-mystoredigital" target="_blank" rel="noopener">github</a></div>
    </div>
  </footer>
</body>
</html>
`;

fs.writeFileSync(OUT, out);
console.log(`Wrote ${OUT} with ${entries.length} entries across ${cats.length} categories.`);
