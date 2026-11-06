// Browser smoke test (Playwright + Chromium). Run with `just e2e`.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import assert from "node:assert/strict";

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
const server = http.createServer(async (req, res) => {
  const raw = new URL(req.url, "http://x").pathname;
  const path = raw === "/" ? "/index.html" : raw;
  try {
    const body = await readFile(join("/app", path));
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch();
const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"], locale: "en-US" });
const page = await context.newPage();
const errors = [];
const requests = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("request", (r) => requests.push(r.url()));

await page.goto(url);
await page.waitForSelector("#branch-output");

// Consent banner visible, and GA not requested before consent.
assert.equal(await page.locator("#consent-banner").isVisible(), true);
assert.ok(!requests.some((u) => u.includes("googletagmanager")), "GA must not load before consent");

// Paste buttons read from the clipboard.
await page.evaluate(() => navigator.clipboard.writeText("https://github.com/o/r/issues/1234"));
await page.click('[data-paste="#issue-number"]');
await page.waitForFunction(() => document.querySelector("#issue-number").value !== "");
await page.evaluate(() => navigator.clipboard.writeText("Fix login bug"));
await page.click('[data-paste="#issue-name"]');
await page.waitForFunction(() => document.querySelector("#issue-name").value !== "");
assert.equal(await page.inputValue("#issue-number"), "1234");
assert.equal(await page.inputValue("#issue-name"), "Fix login bug");
assert.equal(await page.inputValue("#branch-output"), "1234/fix-login-bug");
assert.equal(await page.textContent("#cmd-all"), "git switch main && git pull && git switch -c 1234/fix-login-bug && git commit -m '1234 Fix login bug' --allow-empty && git push -u origin 1234/fix-login-bug");

// Base branch: master, then custom; both persist across reload.
await page.check('input[name="base"][value="master"]');
assert.match(await page.textContent("#cmd-update"), /^git switch master && git pull$/);
await page.check('input[name="base"][value="custom"]');
await page.fill("#custom-base", "develop");
assert.match(await page.textContent("#cmd-all"), /^git switch develop && git pull && /);
await page.fill("#custom-base", "bad name");
assert.equal(await page.locator("#base-warning").isVisible(), true);
await page.fill("#custom-base", "develop");
await page.reload();
assert.equal(await page.isChecked('input[name="base"][value="custom"]'), true);
assert.equal(await page.inputValue("#custom-base"), "develop");
// Fields restored from the URL.
assert.equal(await page.inputValue("#branch-output"), "1234/fix-login-bug");

// Copy writes to the clipboard and lands in history.
await page.click("#copy-all");
await page.waitForSelector("#history-list li");
assert.match(await page.evaluate(() => navigator.clipboard.readText()), /git switch -c 1234\/fix-login-bug/);
assert.equal(await page.locator("#history-list li").count(), 1);

// Cyrillic title is transliterated; Ukrainian UI.
await page.fill("#issue-name", "Виправити помилку входу");
assert.equal(await page.inputValue("#branch-output"), "1234/vypravyty-pomylku-vkhodu");
await page.click("#lang-btn");
assert.equal(await page.getAttribute("html", "lang"), "uk");
assert.equal(await page.textContent("h1"), "Генератор назв Git-гілок");

// Consent: accept loads GA, decline afterwards sets the disable flag.
await Promise.all([
  page.waitForRequest((r) => r.url().includes("googletagmanager.com/gtag/js")),
  page.click("#consent-accept"),
]);
await page.click("#consent-open");
await page.click("#consent-decline");
assert.equal(await page.evaluate(() => window["ga-disable-G-V41TC5DB0L"]), true);

assert.deepEqual(errors.filter((e) => !/googletagmanager|ghbtns|ERR_|Failed to load resource/.test(e)), []);
await page.screenshot({ path: "/tmp/shot.png", fullPage: true });
await browser.close();
server.close();
console.log("e2e passed");
