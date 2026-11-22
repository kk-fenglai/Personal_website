import { test } from "node:test";
import assert from "node:assert/strict";
import { canResizeRemoteImage, resizedImageUrl, sizesForColumns } from "../photoUrl";

const blob = "https://abc123.public.blob.vercel-storage.com/uploads/a b.jpg";

test("canResizeRemoteImage accepts only the site's blob storage host", () => {
  assert.equal(canResizeRemoteImage(blob), true);
  assert.equal(canResizeRemoteImage("https://evil.example/x.public.blob.vercel-storage.com/a.jpg"), false);
  assert.equal(canResizeRemoteImage("http://abc123.public.blob.vercel-storage.com/a.jpg"), false);
  assert.equal(canResizeRemoteImage("/uploads/a.jpg"), false);
  assert.equal(canResizeRemoteImage("not a url"), false);
});

test("resizedImageUrl points blob images at the resizer and leaves other addresses alone", () => {
  assert.equal(
    resizedImageUrl(blob, 1200),
    `/_next/image?url=${encodeURIComponent(blob)}&w=1200&q=75`
  );
  assert.equal(resizedImageUrl("https://other.example/a.jpg", 1200), "https://other.example/a.jpg");
});

test("sizesForColumns turns a tile's desktop column span into an image width hint", () => {
  assert.equal(
    sizesForColumns("col-span-12 md:col-span-8 md:col-start-1"),
    "(max-width: 768px) 100vw, min(67vw, 854px)"
  );
  assert.equal(sizesForColumns("col-span-12 md:col-span-4 md:col-start-9"), "(max-width: 768px) 100vw, min(34vw, 427px)");
  assert.equal(sizesForColumns("col-span-12"), "(max-width: 768px) 100vw, min(100vw, 1280px)");
});
