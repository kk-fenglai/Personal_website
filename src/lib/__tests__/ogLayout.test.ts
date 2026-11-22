import { test } from "node:test";
import assert from "node:assert/strict";
import { ogLayout } from "../ogLayout";

const CONTENT_HEIGHT = 630 - 80 * 2;

test("ogLayout keeps short titles large with a subtitle", () => {
  assert.deepEqual(ogLayout("等风来的小站", "一句描述"), { titleSize: 96, showSubtitle: true });
});

test("ogLayout shrinks longer titles and drops the subtitle once it no longer fits", () => {
  assert.deepEqual(ogLayout("字".repeat(26), "描述"), { titleSize: 72, showSubtitle: true });
  assert.deepEqual(ogLayout("字".repeat(54), "描述"), { titleSize: 52, showSubtitle: true });
  assert.deepEqual(ogLayout("字".repeat(60), "描述"), { titleSize: 52, showSubtitle: false });
});

test("ogLayout never shows a subtitle when there is none", () => {
  assert.equal(ogLayout("标题", null).showSubtitle, false);
});

test("ogLayout fits the card for every title length up to the headline limit", () => {
  for (let length = 1; length <= 60; length += 1) {
    const { titleSize, showSubtitle } = ogLayout("字".repeat(length), "描述".repeat(30));
    const perLine = Math.floor(1040 / (titleSize + 4));
    const titleHeight = Math.ceil(length / perLine) * titleSize * 1.35;
    const subtitleHeight = showSubtitle ? 36 + 2 * 36 * 1.5 : 0;
    const total = 26 * 1.2 + titleHeight + 41 + subtitleHeight;
    assert.ok(total <= CONTENT_HEIGHT, `title of ${length} characters needs ${total}px`);
  }
});
