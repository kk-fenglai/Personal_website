import { test } from "node:test";
import assert from "node:assert/strict";
import { parseListLocale, toListView } from "../thoughtListView";

const thought = {
  id: "t1",
  title: "中文标题",
  titleEn: "English title",
  titleFr: null,
  content: "中文正文",
  contentEn: "English body",
  contentFr: "  ",
  isPublic: true,
  createdAt: "2026-11-22T03:00:00Z",
  comments: [{ id: "c1" }, { id: "c2" }],
};

test("toListView keeps one language and falls back to Chinese when a translation is missing", () => {
  const en = toListView(thought, "en", { excerpt: false });
  assert.equal(en.title, "English title");
  assert.equal(en.content, "English body");
  const fr = toListView(thought, "fr", { excerpt: false });
  assert.equal(fr.title, "中文标题");
  assert.equal(fr.content, "中文正文");
});

test("toListView drops the other languages and replaces comments with a count", () => {
  const view = toListView(thought, "zh", { excerpt: false }) as Record<string, unknown>;
  for (const key of ["titleEn", "titleFr", "contentEn", "contentFr", "comments"]) {
    assert.equal(key in view, false, key);
  }
  assert.equal(view.commentCount, 2);
  assert.equal(view.id, "t1");
  assert.equal(view.createdAt, "2026-11-22T03:00:00Z");
});

test("toListView shortens the body to a plain-text excerpt on request", () => {
  const long = { ...thought, content: `![图](https://x.example/a.png)${"字".repeat(500)}` };
  const view = toListView(long, "zh", { excerpt: true });
  assert.equal(view.content.length, 221);
  assert.equal(view.content.includes("https://"), false);
  assert.equal(toListView(thought, "zh", { excerpt: true }).content, "中文正文");
});

test("parseListLocale accepts only the three site languages", () => {
  assert.equal(parseListLocale("fr"), "fr");
  assert.equal(parseListLocale("de"), null);
  assert.equal(parseListLocale(null), null);
});
