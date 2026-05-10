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

const ORDER = [
  "INFRAESTRUCTURA",
  "AUTOMATIZACIÓN",
  "CAPACIDADES",
];

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

const sections = cats.map((cat) => `
      <section class="section">
        <h2>${escape(cat)}</h2>
${grouped[cat].map((e) => `        <a class="entry" href="docs/${escape(e.file)}">
          <div>
            <p class="entry-title">${escape(e.title)}</p>
            <p class="entry-desc">${escape(e.description)}</p>
          </div>
          <div class="entry-meta">${escape(e.date)}</div>
        </a>`).join("\n")}
      </section>`).join("\n");

const buildId = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

const out = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>docs.mystoredigital.cloud</title>
  <meta name="description" content="Documentación técnica de procesos, integraciones y capacidades de la infraestructura de My Store Digital.">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="shell">
    <div class="brand">
      <span class="dot"></span>
      <span>docs.mystoredigital.cloud</span>
    </div>

    <div class="hero">
      <h1>Documentación técnica</h1>
      <p class="lede">Procesos, integraciones y capacidades de nuestra infraestructura. Cada entrada documenta una intervención real ejecutada en producción, con la lógica del por qué y el cómo replicarla.</p>
    </div>
${sections}

    <footer>
      My Store Digital · ${entries.length} documento${entries.length === 1 ? "" : "s"} · build ${escape(buildId)} · <a href="https://github.com/My-Store-Digital-Team/docs-mystoredigital">github</a>
    </footer>
  </main>
</body>
</html>
`;

fs.writeFileSync(OUT, out);
console.log(`Wrote ${OUT} with ${entries.length} entries across ${cats.length} categories.`);
