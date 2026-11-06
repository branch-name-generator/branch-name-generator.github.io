// Static sanity checks: JSON validity, referenced local files exist, i18n keys are consistent.
import { readFileSync, existsSync } from "node:fs";

let failed = false;
const fail = (msg) => { console.error("FAIL:", msg); failed = true; };

const html = readFileSync("index.html", "utf8");

// 1. Every local href/src in index.html must exist.
for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
  if (!existsSync("." + m[1])) fail(`index.html references missing file ${m[1]}`);
}

// 2. Manifest and JSON-LD must be valid JSON; manifest icons must exist.
const manifest = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
for (const icon of manifest.icons) if (!existsSync("." + icon.src)) fail(`manifest icon missing: ${icon.src}`);
for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);

// 3. Every data-i18n* key used in HTML exists in both languages.
const i18n = readFileSync("assets/js/i18n.js", "utf8");
const block = (lang) => {
  const start = i18n.indexOf(`  ${lang}: {`);
  const end = i18n.indexOf("\n  },", start);
  return new Set([...i18n.slice(start, end).matchAll(/^\s+"([\w.]+)":/gm)].map((x) => x[1]));
};
const en = block("en"), uk = block("uk");
for (const k of en) if (!uk.has(k)) fail(`uk is missing key ${k}`);
for (const k of uk) if (!en.has(k)) fail(`en is missing key ${k}`);
for (const m of html.matchAll(/data-i18n(?:-placeholder|-title)?="([\w.]+)"/g)) {
  if (!en.has(m[1])) fail(`HTML uses unknown i18n key ${m[1]}`);
}
for (const src of ["assets/js/app.js", "assets/js/consent.js"]) {
  for (const m of readFileSync(src, "utf8").matchAll(/\bt\("([\w.]+)"/g)) {
    if (!en.has(m[1])) fail(`${src} uses unknown i18n key ${m[1]}`);
  }
}

// 4. Every id referenced by app.js via $("#id") exists in the HTML.
for (const m of readFileSync("assets/js/app.js", "utf8").matchAll(/\$\("#([\w-]+)"\)/g)) {
  if (!html.includes(`id="${m[1]}"`)) fail(`app.js uses missing element #${m[1]}`);
}

// 5. Analytics must not be hard-coded into the page.
if (/googletagmanager\.com|gtag\(/.test(html)) fail("index.html must not load Google Analytics directly");

if (failed) process.exit(1);
console.log("site checks passed");
