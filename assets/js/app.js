import {
  DEFAULT_MAX_LENGTH,
  MAX_LENGTH_LIMIT,
  buildBranchName,
  buildCommands,
  buildCommitMessage,
  normalizeTitle,
  parseIssueRef,
  sanitizePrefix,
  validateBranchName,
} from "./lib.js";
import { load, save, remove } from "./storage.js";
import { applyTranslations, detectLang, getLang, onLangChange, setLang, t } from "./i18n.js";
import { initConsent } from "./consent.js";

const $ = (selector) => document.querySelector(selector);

const el = {
  number: $("#issue-number"),
  name: $("#issue-name"),
  customBase: $("#custom-base"),
  baseWarning: $("#base-warning"),
  pasteWarning: $("#paste-warning"),
  prefix: $("#prefix"),
  separator: $("#separator"),
  maxLength: $("#max-length"),
  branch: $("#branch-output"),
  branchWarning: $("#branch-warning"),
  emptyHint: $("#empty-hint"),
  historyList: $("#history-list"),
  historyEmpty: $("#history-empty"),
  cmd: {
    update: $("#cmd-update"),
    create: $("#cmd-create"),
    switchTo: $("#cmd-switch"),
    commit: $("#cmd-commit"),
    all: $("#cmd-all"),
  },
};

const DEFAULT_SETTINGS = { base: "main", customBase: "", prefix: "", separator: "-", maxLength: DEFAULT_MAX_LENGTH };
const HISTORY_LIMIT = 10;

let settings = { ...DEFAULT_SETTINGS, ...(load("settings") || {}) };
if (!["main", "master", "custom"].includes(settings.base)) settings.base = "main";
const stored = load("history");
let recent = Array.isArray(stored) ? stored : [];
let current = { branch: "" };

// ---------- helpers ----------

function baseBranch() {
  return settings.base === "custom" ? settings.customBase.trim() : settings.base;
}

function normalizedMaxLength() {
  const n = Number.parseInt(settings.maxLength, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_LENGTH_LIMIT) : DEFAULT_MAX_LENGTH;
}

function setText(node, text) {
  node.textContent = text;
}

function showFeedback(btn, key) {
  if (btn.dataset.busy) return;
  btn.dataset.busy = "1";
  btn.textContent = t(key);
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = btn.dataset.i18n ? t(btn.dataset.i18n) : btn.textContent;
    btn.disabled = false;
    delete btn.dataset.busy;
    updateButtons();
  }, 1000);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for insecure contexts or blocked permission.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

function valueOf(target) {
  return "value" in target ? target.value : target.textContent;
}

let pasteTimer;
function showPasteWarning() {
  el.pasteWarning.textContent = t("paste.unsupported");
  el.pasteWarning.hidden = false;
  clearTimeout(pasteTimer);
  pasteTimer = setTimeout(() => (el.pasteWarning.hidden = true), 6000);
}

// ---------- rendering ----------

function render({ syncUrl = true } = {}) {
  const number = el.number.value.trim();
  const title = el.name.value;

  const branch = buildBranchName({
    number,
    title,
    prefix: settings.prefix,
    separator: settings.separator,
    maxLength: normalizedMaxLength(),
  });
  const base = baseBranch();
  const message = buildCommitMessage(number, title);
  const commands = buildCommands({ base, branch, message });
  current = { branch, number, title };

  el.branch.value = branch;
  for (const key of Object.keys(el.cmd)) setText(el.cmd[key], commands[key]);

  const branchError = branch ? validateBranchName(branch) : null;
  el.branchWarning.hidden = !branchError;
  if (branchError) el.branchWarning.textContent = t(`err.${branchError}`);
  el.emptyHint.hidden = Boolean(branch || message);

  const baseError = validateBranchName(base);
  el.baseWarning.hidden = !baseError;
  if (baseError) el.baseWarning.textContent = t("err.base", { reason: t(`err.${baseError}`) });

  updateButtons();
  if (syncUrl) syncUrlState(number, title);
}

function updateButtons() {
  for (const btn of document.querySelectorAll("[data-copy]")) {
    if (btn.dataset.busy) continue;
    const target = $(btn.dataset.copy);
    btn.disabled = !valueOf(target);
  }
}

function syncUrlState(number, title) {
  const params = new URLSearchParams();
  if (number) params.set("n", number);
  if (title.trim()) params.set("t", title.trim());
  const query = params.toString();
  try {
    window.history.replaceState(null, "", query ? `?${query}` : location.pathname);
  } catch {
    /* ignore (e.g. sandboxed frames) */
  }
}

function syncSettingsControls() {
  document.querySelector(`input[name="base"][value="${settings.base}"]`).checked = true;
  el.customBase.value = settings.customBase;
  el.customBase.disabled = settings.base !== "custom";
  el.prefix.value = settings.prefix;
  el.separator.value = settings.separator;
  el.maxLength.value = settings.maxLength;
}

function persistSettings() {
  save("settings", settings);
}

// ---------- history ----------

function renderHistory() {
  el.historyList.replaceChildren();
  el.historyEmpty.hidden = recent.length > 0;
  $("#history-clear").hidden = recent.length === 0;
  for (const item of recent) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = item.branch;
    btn.title = t("history.restore");
    btn.addEventListener("click", () => {
      el.number.value = item.number;
      el.name.value = item.title;
      render();
    });
    li.appendChild(btn);
    el.historyList.appendChild(li);
  }
}

function recordHistory() {
  if (!current.branch || validateBranchName(current.branch)) return;
  recent = [
    { branch: current.branch, number: current.number, title: current.title },
    ...recent.filter((h) => h.branch !== current.branch),
  ].slice(0, HISTORY_LIMIT);
  save("history", recent);
  renderHistory();
}

// ---------- events ----------

document.addEventListener("click", async (event) => {
  const copyBtn = event.target.closest("[data-copy]");
  if (copyBtn) {
    const text = valueOf($(copyBtn.dataset.copy));
    if (!text) return;
    const ok = await copyText(text);
    showFeedback(copyBtn, ok ? "btn.copied" : "btn.failed");
    if (ok && copyBtn.hasAttribute("data-record")) recordHistory();
    return;
  }

  const pasteBtn = event.target.closest("[data-paste]");
  if (pasteBtn) {
    const input = $(pasteBtn.dataset.paste);
    try {
      const text = await navigator.clipboard.readText();
      input.value = input === el.number ? parseIssueRef(text) : normalizeTitle(text);
      el.pasteWarning.hidden = true;
      render();
      showFeedback(pasteBtn, "btn.pasted");
    } catch {
      showFeedback(pasteBtn, "btn.failed");
      showPasteWarning();
      input.focus();
    }
  }
});

el.branch.addEventListener("click", async () => {
  if (!el.branch.value) return;
  const ok = await copyText(el.branch.value);
  if (ok) recordHistory();
  el.branch.select();
});

el.number.addEventListener("input", () => render());
el.name.addEventListener("input", () => render());
el.number.addEventListener("change", () => {
  el.number.value = parseIssueRef(el.number.value);
  render();
});

$("#clear-all").addEventListener("click", () => {
  el.number.value = "";
  el.name.value = "";
  render();
  el.number.focus();
});

for (const radio of document.querySelectorAll('input[name="base"]')) {
  radio.addEventListener("change", () => {
    settings.base = radio.value;
    el.customBase.disabled = settings.base !== "custom";
    if (settings.base === "custom") el.customBase.focus();
    persistSettings();
    render();
  });
}

el.customBase.addEventListener("input", () => {
  settings.customBase = el.customBase.value.trim();
  persistSettings();
  render();
});

el.prefix.addEventListener("input", () => {
  settings.prefix = el.prefix.value;
  persistSettings();
  render();
});
el.prefix.addEventListener("change", () => {
  settings.prefix = sanitizePrefix(el.prefix.value, settings.separator);
  el.prefix.value = settings.prefix;
  persistSettings();
  render();
});

el.separator.addEventListener("change", () => {
  settings.separator = el.separator.value === "_" ? "_" : "-";
  persistSettings();
  render();
});

el.maxLength.addEventListener("input", () => {
  settings.maxLength = el.maxLength.value;
  persistSettings();
  render();
});
el.maxLength.addEventListener("change", () => {
  settings.maxLength = normalizedMaxLength();
  el.maxLength.value = settings.maxLength;
  persistSettings();
  render();
});

$("#reset-settings").addEventListener("click", () => {
  settings = { ...DEFAULT_SETTINGS };
  remove("settings");
  syncSettingsControls();
  render();
});

$("#history-clear").addEventListener("click", () => {
  recent = [];
  remove("history");
  renderHistory();
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    $("#copy-all").click();
  }
});

$("#theme-btn").addEventListener("click", () => {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  save("theme", next);
});

$("#lang-btn").addEventListener("click", () => setLang(getLang() === "uk" ? "en" : "uk"));

// ---------- init ----------

const consent = initConsent({
  banner: $("#consent-banner"),
  acceptBtn: $("#consent-accept"),
  declineBtn: $("#consent-decline"),
  openBtn: $("#consent-open"),
  status: $("#consent-status"),
});

onLangChange(() => {
  render({ syncUrl: false });
  renderHistory();
  consent.render();
});

const params = new URLSearchParams(location.search);
el.number.value = parseIssueRef(params.get("n") || "");
el.name.value = normalizeTitle(params.get("t") || "");

syncSettingsControls();
setLang(detectLang(), { persist: false });
render({ syncUrl: false });
renderHistory();
