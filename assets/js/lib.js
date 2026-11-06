// Pure logic: no DOM, no storage. Shared by the browser UI and the Node tests.

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
  и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ь: "", ю: "iu", я: "ia",
  // Russian-only letters
  ё: "e", ы: "y", э: "e", ъ: "",
};

export const DEFAULT_MAX_LENGTH = 100;
export const MAX_LENGTH_LIMIT = 200;

export function transliterate(text) {
  let out = "";
  for (const ch of String(text)) {
    const lower = ch.toLowerCase();
    out += Object.hasOwn(TRANSLIT, lower) ? TRANSLIT[lower] : ch;
  }
  return out;
}

export function slugify(text, { maxLength = DEFAULT_MAX_LENGTH, separator = "-" } = {}) {
  const sep = separator === "_" ? "_" : "-";
  const limit = clampLength(maxLength);
  const slug = transliterate(text)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, sep)
    .replace(new RegExp(`^${sep}+|${sep}+$`, "g"), "")
    .substring(0, limit);
  return slug.replace(new RegExp(`${sep}+$`), "");
}

function clampLength(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_MAX_LENGTH;
  return Math.min(n, MAX_LENGTH_LIMIT);
}

// Makes one path segment of a ref safe: keeps letters, digits, "." "_" "-".
export function sanitizeSegment(text) {
  return String(text)
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .replace(/\.lock$/i, "");
}

// "feature/Foo Bar" -> "feature/foo-bar"
export function sanitizePrefix(text, separator = "-") {
  return String(text)
    .split("/")
    .map((part) => slugify(part, { separator, maxLength: MAX_LENGTH_LIMIT }))
    .filter(Boolean)
    .join("/");
}

// Extracts an issue key from a tracker URL; other input is returned cleaned up.
export function parseIssueRef(input) {
  const text = String(input ?? "").trim();
  if (!/^https?:\/\//i.test(text)) {
    return text.replace(/^#/, "");
  }
  let url;
  try {
    url = new URL(text);
  } catch {
    return text;
  }
  const patterns = [
    /\/(?:issues|pull|pulls|merge_requests)\/(\d+)/i, // GitHub, GitLab, Gitea
    /\/browse\/([A-Z][A-Z0-9_]*-\d+)/i, // Jira
    /\/issue\/([A-Z][A-Z0-9]*-\d+)/i, // Linear, YouTrack
  ];
  for (const re of patterns) {
    const m = url.pathname.match(re);
    if (m) return m[1];
  }
  const selected = url.searchParams.get("selectedIssue"); // Jira boards
  if (selected && /^[A-Z][A-Z0-9_]*-\d+$/i.test(selected)) return selected;
  return text;
}

export function normalizeTitle(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

// Splits "123 456" into ["123", "456"] (issue + sub-issue), sanitizing each part.
export function numberParts(number) {
  return String(number ?? "")
    .split(/\s+/)
    .map(sanitizeSegment)
    .filter(Boolean);
}

export function buildBranchName({ number = "", title = "", prefix = "", separator = "-", maxLength = DEFAULT_MAX_LENGTH } = {}) {
  return [
    sanitizePrefix(prefix, separator),
    ...numberParts(number),
    slugify(title, { separator, maxLength }),
  ]
    .filter(Boolean)
    .join("/");
}

// Mirrors the rules of `git check-ref-format --branch`.
// Returns null when valid, otherwise an error code.
export function validateBranchName(name) {
  if (!name) return "empty";
  if (name === "@") return "at";
  if (/[\x00-\x20\x7f ~^:?*[\\]/.test(name)) return "chars";
  if (name.includes("..") || name.includes("@{")) return "sequence";
  if (name.startsWith("/") || name.endsWith("/") || name.includes("//")) return "slash";
  if (name.startsWith("-")) return "dash";
  if (name.endsWith(".")) return "dot";
  for (const part of name.split("/")) {
    if (part.startsWith(".") || part.endsWith(".lock")) return "component";
  }
  return null;
}

// Quotes a commit message for a POSIX shell. Single quotes avoid `$`, backticks and `!` expansion.
export function shellQuote(text) {
  return `'${String(text).replace(/'/g, `'\\''`)}'`;
}

export function buildCommitMessage(number, title) {
  const n = String(number ?? "").trim();
  const t = normalizeTitle(title);
  return n && t ? `${n} ${t}` : n || t;
}

export function buildCommands({ base, branch, message }) {
  const baseOk = !validateBranchName(base);
  const branchOk = !validateBranchName(branch);
  const update = baseOk ? `git switch ${base} && git pull` : "";
  const create = branchOk ? `git switch -c ${branch}` : "";
  const switchTo = branchOk ? `git switch ${branch}` : "";
  const commit = message ? `git commit -m ${shellQuote(message)} --allow-empty` : "";
  const all = baseOk && branchOk && message ? `${update} && ${create} && ${commit}` : "";
  return { update, create, switchTo, commit, all };
}
