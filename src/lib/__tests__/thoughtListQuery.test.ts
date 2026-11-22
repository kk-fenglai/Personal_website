import { test } from "node:test";
import assert from "node:assert/strict";
import { parseThoughtPage, thoughtListWhere } from "../thoughtListQuery";

const params = (query: string) => new URLSearchParams(query);

test("parseThoughtPage returns null when no limit is asked for", () => {
  assert.equal(parseThoughtPage(params("locale=zh")), null);
});

test("parseThoughtPage clamps the page size and rejects bad offsets", () => {
  assert.deepEqual(parseThoughtPage(params("limit=20&offset=40")), { take: 20, skip: 40 });
  assert.deepEqual(parseThoughtPage(params("limit=9999")), { take: 50, skip: 0 });
  assert.deepEqual(parseThoughtPage(params("limit=0&offset=-5")), { take: 1, skip: 0 });
  assert.deepEqual(parseThoughtPage(params("limit=abc&offset=xyz")), { take: 20, skip: 0 });
});

test("thoughtListWhere hides private thoughts from visitors only", () => {
  assert.deepEqual(thoughtListWhere(params(""), { admin: false }), { isPublic: true });
  assert.deepEqual(thoughtListWhere(params(""), { admin: true }), {});
});

test("thoughtListWhere filters by folder, including the uncategorized one", () => {
  assert.deepEqual(thoughtListWhere(params("category=c1"), { admin: true }), { categoryId: "c1" });
  assert.deepEqual(thoughtListWhere(params("category=uncategorized"), { admin: true }), {
    categoryId: null,
  });
  assert.deepEqual(thoughtListWhere(params("category=all"), { admin: true }), {});
});

test("thoughtListWhere searches titles and bodies in every language, ignoring case", () => {
  const where = thoughtListWhere(params("q=%20Rome%20"), { admin: false });
  assert.equal(where.isPublic, true);
  assert.deepEqual(
    where.OR?.map((clause) => Object.keys(clause)[0]),
    ["title", "content", "titleEn", "contentEn", "titleFr", "contentFr"]
  );
  assert.deepEqual(where.OR?.[0], { title: { contains: "Rome", mode: "insensitive" } });
  assert.equal(thoughtListWhere(params("q=%20%20"), { admin: false }).OR, undefined);
});
