import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, limitTimeline } from "../timeline";

const thoughts = [
  { id: "t1", createdAt: "2026-11-22T03:00:00Z" },
  { id: "t2", createdAt: "2025-12-31T10:00:00Z" },
];
const photos = [
  { id: "p1", filename: "/uploads/1.jpg", createdAt: "2026-11-15T02:00:00Z" },
  { id: "p2", filename: "/uploads/2.jpg", createdAt: "2026-11-15T09:00:00Z" },
  { id: "p3", filename: "/uploads/3.jpg", createdAt: "2026-12-31T23:30:00Z" },
];

test("buildTimeline orders years, months and entries newest first", () => {
  const tl = buildTimeline(thoughts, photos, "UTC", "all");
  assert.deepEqual(tl.map((y) => y.year), [2026, 2025]);
  assert.deepEqual(tl[0].months.map((m) => m.month), [12, 11]);
  assert.deepEqual(
    tl[0].months[1].entries.map((e) => [e.kind, e.day]),
    [["thought", 22], ["photos", 15]]
  );
});

test("buildTimeline merges photos from the same day into one entry, newest first", () => {
  const november = buildTimeline(thoughts, photos, "UTC", "all")[0].months[1];
  const group = november.entries[1];
  assert.equal(group.kind, "photos");
  assert.deepEqual(group.kind === "photos" && group.photos.map((p) => p.id), ["p2", "p1"]);
  assert.equal(group.at, "2026-11-15T09:00:00Z");
});

test("buildTimeline assigns day, month and year in the visitor's time zone", () => {
  const tl = buildTimeline(thoughts, photos, "Asia/Shanghai", "all");
  assert.deepEqual(tl.map((y) => y.year), [2027, 2026, 2025]);
  assert.deepEqual(tl[0].months.map((m) => m.month), [1]);
  assert.equal(tl[0].months[0].entries[0].day, 1);
  assert.deepEqual([tl[1].thoughtCount, tl[1].photoCount], [1, 2]);
});

test("buildTimeline filters by kind and drops empty years", () => {
  const onlyThoughts = buildTimeline(thoughts, photos, "Asia/Shanghai", "thoughts");
  assert.deepEqual(onlyThoughts.map((y) => y.year), [2026, 2025]);
  assert.equal(onlyThoughts[0].photoCount, 0);
  const onlyPhotos = buildTimeline(thoughts, photos, "Asia/Shanghai", "photos");
  assert.deepEqual(onlyPhotos.map((y) => y.year), [2027, 2026]);
  assert.equal(onlyPhotos[1].thoughtCount, 0);
});

test("buildTimeline returns nothing for empty input", () => {
  assert.deepEqual(buildTimeline([], [], "UTC", "all"), []);
});

test("limitTimeline keeps the newest entries and the full yearly counts", () => {
  const full = buildTimeline(thoughts, photos, "UTC", "all");
  const total = full.flatMap((year) => year.months.flatMap((month) => month.entries)).length;
  const limited = limitTimeline(full, 2);
  const kept = limited.years.flatMap((year) => year.months.flatMap((month) => month.entries));
  assert.equal(kept.length, 2);
  assert.deepEqual(kept, full.flatMap((year) => year.months.flatMap((month) => month.entries)).slice(0, 2));
  assert.equal(limited.hasMore, true);
  assert.equal(limited.years[0].thoughtCount, full[0].thoughtCount);
  assert.equal(limited.years[0].photoCount, full[0].photoCount);
  assert.equal(limited.years.every((year) => year.months.every((month) => month.entries.length > 0)), true);

  const all = limitTimeline(full, total);
  assert.equal(all.hasMore, false);
  assert.deepEqual(all.years, full);
});
