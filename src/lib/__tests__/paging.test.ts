import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePage } from "../paging";

const params = (query: string) => new URLSearchParams(query);

test("parsePage returns null when no limit is asked for", () => {
  assert.equal(parsePage(params("locale=zh")), null);
});

test("parsePage clamps the page size and rejects bad offsets", () => {
  assert.deepEqual(parsePage(params("limit=20&offset=40")), { take: 20, skip: 40 });
  assert.deepEqual(parsePage(params("limit=9999")), { take: 50, skip: 0 });
  assert.deepEqual(parsePage(params("limit=0&offset=-5")), { take: 1, skip: 0 });
  assert.deepEqual(parsePage(params("limit=abc&offset=xyz")), { take: 20, skip: 0 });
});
