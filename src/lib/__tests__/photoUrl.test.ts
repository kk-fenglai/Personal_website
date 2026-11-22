import { test } from "node:test";
import assert from "node:assert/strict";
import { canResizeRemoteImage, resizedImageUrl } from "../photoUrl";

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
