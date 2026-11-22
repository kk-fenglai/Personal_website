import { test } from "node:test";
import assert from "node:assert/strict";
import {
  displayDomain,
  domainFromUrl,
  formatProjectNumber,
  normalizeHttpUrl,
  parseProfileInput,
  parseProjectInput,
  pickLocalized,
  splitParagraphs,
} from "../aboutContent";

test("normalizeHttpUrl keeps trimmed http and https addresses", () => {
  assert.equal(normalizeHttpUrl("  https://example.com/a  "), "https://example.com/a");
  assert.equal(normalizeHttpUrl("http://example.com"), "http://example.com");
});

test("normalizeHttpUrl rejects script schemes, bare domains and empty input", () => {
  assert.equal(normalizeHttpUrl("javascript:alert(1)"), null);
  assert.equal(normalizeHttpUrl("JAVASCRIPT:alert(1)"), null);
  assert.equal(normalizeHttpUrl("example.com"), null);
  assert.equal(normalizeHttpUrl("https:example.com"), null);
  assert.equal(normalizeHttpUrl("http:/example.com"), null);
  assert.equal(normalizeHttpUrl(""), null);
});

test("domainFromUrl drops the leading www and the path", () => {
  assert.equal(domainFromUrl("https://www.example.com/path?q=1"), "example.com");
  assert.equal(domainFromUrl("https://app.example.dev"), "app.example.dev");
});

test("displayDomain prefers the typed domain and falls back to the link", () => {
  assert.equal(displayDomain({ url: "https://www.example.com", domain: "  我的域名 " }), "我的域名");
  assert.equal(displayDomain({ url: "https://www.example.com", domain: null }), "example.com");
  assert.equal(displayDomain({ url: "https://www.example.com", domain: "   " }), "example.com");
});

test("splitParagraphs splits on blank lines and keeps single line breaks", () => {
  assert.deepEqual(splitParagraphs("第一段\n仍是第一段\n\n\n第二段  "), ["第一段\n仍是第一段", "第二段"]);
  assert.deepEqual(splitParagraphs("   "), []);
});

test("pickLocalized falls back to Chinese when a translation is missing or blank", () => {
  assert.equal(pickLocalized({ zh: "中", en: "E", fr: null }, "en"), "E");
  assert.equal(pickLocalized({ zh: "中", en: "E", fr: null }, "fr"), "中");
  assert.equal(pickLocalized({ zh: "中", en: "  ", fr: "F" }, "en"), "中");
  assert.equal(pickLocalized({ zh: "中", en: "E", fr: "F" }, "zh"), "中");
});

test("formatProjectNumber is one-based and two digits", () => {
  assert.equal(formatProjectNumber(0), "01");
  assert.equal(formatProjectNumber(11), "12");
});

const profile = {
  headline: "标题",
  email: "a@b.co",
  intro: "",
  fact1Label: "",
  fact1Value: "",
  fact2Label: "",
  fact2Value: "",
  collabTitle: "",
  collabBody: "",
  joinTitle: "",
  joinBody: "",
};

test("parseProfileInput accepts a headline and an email with everything else empty", () => {
  assert.equal(parseProfileInput(profile).ok, true);
  const sparse = parseProfileInput({ headline: " 标题 ", email: "a@b.co" });
  assert.equal(sparse.ok && sparse.value.headline, "标题");
  assert.equal(sparse.ok && sparse.value.intro, "");
});

test("parseProfileInput rejects a blank headline, a bad email, overlong text and non-objects", () => {
  assert.equal(parseProfileInput({ ...profile, headline: "  " }).ok, false);
  assert.equal(parseProfileInput({ ...profile, email: "not-an-email" }).ok, false);
  assert.equal(parseProfileInput({ ...profile, headline: "字".repeat(61) }).ok, false);
  assert.equal(parseProfileInput(null).ok, false);
});

const project = { name: "甲", description: "", url: "https://example.com" };

test("parseProjectInput defaults to visible with no domain or image", () => {
  const ok = parseProjectInput(project);
  assert.equal(ok.ok && ok.value.isVisible, true);
  assert.equal(ok.ok && ok.value.domain, null);
  assert.equal(ok.ok && ok.value.imageUrl, null);
  const hidden = parseProjectInput({ ...project, isVisible: false, domain: " 甲.com " });
  assert.equal(hidden.ok && hidden.value.isVisible, false);
  assert.equal(hidden.ok && hidden.value.domain, "甲.com");
});

test("parseProjectInput requires a name and an http link", () => {
  assert.equal(parseProjectInput({ ...project, name: "" }).ok, false);
  assert.equal(parseProjectInput({ ...project, url: "javascript:alert(1)" }).ok, false);
  assert.equal(parseProjectInput({ ...project, url: undefined }).ok, false);
});

test("parseProjectInput only accepts images from the site's own upload locations", () => {
  assert.equal(parseProjectInput({ ...project, imageUrl: "https://evil.example/x.png" }).ok, false);
  assert.equal(parseProjectInput({ ...project, imageUrl: "/uploads/x.png" }).ok, true);
});
