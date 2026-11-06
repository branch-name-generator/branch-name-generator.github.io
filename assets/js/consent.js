// Google Analytics is loaded only after the visitor explicitly accepts.
// Until then no request is made to Google and no analytics cookies are set.
import { load, save } from "./storage.js";
import { t } from "./i18n.js";

const GA_ID = "G-V41TC5DB0L";
const KEY = "analyticsConsent"; // "granted" | "denied"

let loaded = false;

function loadAnalytics() {
  if (loaded) return;
  loaded = true;
  window[`ga-disable-${GA_ID}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function deleteAnalyticsCookies() {
  const hosts = new Set([location.hostname]);
  const parts = location.hostname.split(".");
  for (let i = 0; i < parts.length - 1; i++) hosts.add("." + parts.slice(i).join("."));
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name !== "_ga" && !name.startsWith("_ga_") && name !== "_gid") continue;
    for (const host of hosts) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${host}`;
    }
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

export function initConsent({ banner, acceptBtn, declineBtn, openBtn, status }) {
  function render() {
    const state = load(KEY);
    if (status) {
      status.textContent = state === "granted" ? t("consent.status.granted") : t("consent.status.denied");
    }
  }

  function decide(value) {
    const previous = load(KEY);
    save(KEY, value);
    banner.hidden = true;
    if (value === "granted") {
      loadAnalytics();
    } else {
      window[`ga-disable-${GA_ID}`] = true;
      deleteAnalyticsCookies();
    }
    render();
    // Scripts already loaded in this page keep running until reload, so say so.
    if (value === "denied" && (loaded || previous === "granted") && status) {
      status.textContent = t("consent.reload");
    }
  }

  acceptBtn.addEventListener("click", () => decide("granted"));
  declineBtn.addEventListener("click", () => decide("denied"));
  openBtn.addEventListener("click", () => {
    banner.hidden = false;
    acceptBtn.focus();
  });

  const state = load(KEY);
  if (state === "granted") loadAnalytics();
  else if (state !== "denied") banner.hidden = false;
  render();
  return { render };
}
