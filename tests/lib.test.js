import { test } from "node:test";
import assert from "node:assert/strict";

import {
  slugify,
  transliterate,
  sanitizeSegment,
  sanitizePrefix,
  parseIssueRef,
  numberParts,
  buildBranchName,
  validateBranchName,
  shellQuote,
  buildCommitMessage,
  buildCommands,
} from "../assets/js/lib.js";

test("slugify: basic latin", () => {
  assert.equal(slugify("Fix login bug"), "fix-login-bug");
  assert.equal(slugify("  --Hello,   World!!  "), "hello-world");
  assert.equal(slugify(""), "");
});

test("slugify: transliterates Ukrainian and Russian", () => {
  assert.equal(slugify("Виправити помилку входу"), "vypravyty-pomylku-vkhodu");
  assert.equal(slugify("Їжак, щука та є"), "izhak-shchuka-ta-ie");
  assert.equal(slugify("Объект съёмки"), "obekt-semky");
  assert.equal(transliterate("Жук-abc"), "zhuk-abc");
});

test("slugify: strips diacritics", () => {
  assert.equal(slugify("Café déjà vu"), "cafe-deja-vu");
});

test("slugify: separator and max length", () => {
  assert.equal(slugify("Fix login bug", { separator: "_" }), "fix_login_bug");
  assert.equal(slugify("abcdefgh ijk", { maxLength: 9 }), "abcdefgh");
  assert.equal(slugify("a".repeat(500)).length, 100);
  assert.equal(slugify("abc", { maxLength: "nonsense" }), "abc");
});

test("sanitizeSegment / sanitizePrefix", () => {
  assert.equal(sanitizeSegment("PROJ-123"), "PROJ-123");
  assert.equal(sanitizeSegment("#12 / 3"), "12-3");
  assert.equal(sanitizeSegment("a..b.lock"), "a.b");
  assert.equal(sanitizePrefix("Feature/My Thing"), "feature/my-thing");
  assert.equal(sanitizePrefix("//"), "");
});

test("parseIssueRef: urls and plain text", () => {
  assert.equal(parseIssueRef("https://github.com/o/r/issues/42"), "42");
  assert.equal(parseIssueRef("https://github.com/o/r/pull/7#issuecomment-1"), "7");
  assert.equal(parseIssueRef("https://gitlab.com/g/p/-/merge_requests/15"), "15");
  assert.equal(parseIssueRef("https://acme.atlassian.net/browse/PROJ-123"), "PROJ-123");
  assert.equal(parseIssueRef("https://acme.atlassian.net/jira/software/projects/P/boards/1?selectedIssue=P-9"), "P-9");
  assert.equal(parseIssueRef("https://linear.app/acme/issue/ENG-5/some-title"), "ENG-5");
  assert.equal(parseIssueRef("#1234"), "1234");
  assert.equal(parseIssueRef("123 456"), "123 456");
  assert.equal(parseIssueRef("https://example.com/nothing"), "https://example.com/nothing");
  assert.equal(parseIssueRef(null), "");
});

test("numberParts: empty and sub-issues", () => {
  assert.deepEqual(numberParts(""), []);
  assert.deepEqual(numberParts("  "), []);
  assert.deepEqual(numberParts("123 456"), ["123", "456"]);
});

test("buildBranchName", () => {
  assert.equal(buildBranchName({ number: "1234", title: "Fix login bug" }), "1234/fix-login-bug");
  assert.equal(buildBranchName({ number: "", title: "Fix login bug" }), "fix-login-bug");
  assert.equal(buildBranchName({ number: "123 456", title: "Sub task" }), "123/456/sub-task");
  assert.equal(buildBranchName({ number: "123", title: "" }), "123");
  assert.equal(buildBranchName({ number: "7", title: "X", prefix: "Feature" }), "feature/7/x");
  assert.equal(buildBranchName({ number: "7", title: "A B", separator: "_" }), "7/a_b");
  assert.equal(buildBranchName({}), "");
});

test("validateBranchName", () => {
  for (const ok of ["main", "master", "release/1.0", "feature/a-b_c", "v1.2.3"]) {
    assert.equal(validateBranchName(ok), null, ok);
  }
  const bad = ["", "@", "a b", "a..b", "a~b", "a^b", "a:b", "a?b", "a*b", "a[b", "a\\b", "a@{b", "/a", "a/", "a//b", "-a", "a.", ".a", "a/.b", "a.lock", "a/b.lock"];
  for (const name of bad) {
    assert.notEqual(validateBranchName(name), null, JSON.stringify(name));
  }
});

test("shellQuote handles quotes and shell metacharacters", () => {
  assert.equal(shellQuote("Fix bug"), "'Fix bug'");
  assert.equal(shellQuote("it's"), "'it'\\''s'");
  assert.equal(shellQuote("$HOME `x` !y \"z\""), "'$HOME `x` !y \"z\"'");
});

test("buildCommitMessage", () => {
  assert.equal(buildCommitMessage("1", "Fix"), "1 Fix");
  assert.equal(buildCommitMessage("", "Fix\n  it"), "Fix it");
  assert.equal(buildCommitMessage("1", ""), "1");
  assert.equal(buildCommitMessage("", ""), "");
});

test("buildCommands", () => {
  const c = buildCommands({ base: "main", branch: "1/fix", message: "1 Fix" });
  assert.equal(c.update, "git switch main && git pull");
  assert.equal(c.create, "git switch -c 1/fix");
  assert.equal(c.switchTo, "git switch 1/fix");
  assert.equal(c.commit, "git commit -m '1 Fix' --allow-empty");
  assert.equal(c.all, "git switch main && git pull && git switch -c 1/fix && git commit -m '1 Fix' --allow-empty");
});

test("buildCommands: empty or invalid input produces empty commands", () => {
  const none = buildCommands({ base: "main", branch: "", message: "" });
  assert.equal(none.create, "");
  assert.equal(none.all, "");
  assert.equal(none.update, "git switch main && git pull");
  const badBase = buildCommands({ base: "a b", branch: "x", message: "m" });
  assert.equal(badBase.update, "");
  assert.equal(badBase.all, "");
});
