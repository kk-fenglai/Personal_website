import { test } from "node:test";
import assert from "node:assert/strict";
import { neighborToSwap, planTranslationReset, translationWrite } from "../aboutPlan";

test("planTranslationReset lists only the fields whose Chinese text changed", () => {
  assert.deepEqual(
    planTranslationReset({ a: "一", b: "二" }, { a: "一", b: "三" }, ["a", "b"] as const),
    ["b"]
  );
  assert.deepEqual(
    planTranslationReset({ a: "一", b: "二" }, { a: "一", b: "二" }, ["a", "b"] as const),
    []
  );
});

const items = [
  { id: "c", sortOrder: 7 },
  { id: "a", sortOrder: 1 },
  { id: "b", sortOrder: 4 },
];

test("neighborToSwap picks the adjacent item in display order across gaps", () => {
  assert.equal(neighborToSwap(items, "c", "up")?.id, "b");
  assert.equal(neighborToSwap(items, "a", "down")?.id, "b");
});

test("neighborToSwap returns null at the ends and for unknown ids", () => {
  assert.equal(neighborToSwap(items, "a", "up"), null);
  assert.equal(neighborToSwap(items, "c", "down"), null);
  assert.equal(neighborToSwap(items, "zzz", "up"), null);
});

test("translationWrite only applies while the Chinese text is still the one that was translated", () => {
  assert.deepEqual(translationWrite("p1", "intro", "旧文", { en: "old", fr: "ancien" }), {
    where: { id: "p1", intro: "旧文" },
    data: { introEn: "old", introFr: "ancien" },
  });
});
