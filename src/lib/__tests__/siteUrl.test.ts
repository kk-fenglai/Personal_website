import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSiteUrl } from "../siteUrl";

test("resolveSiteUrl prefers SITE_URL and strips the trailing slash", () => {
  assert.equal(resolveSiteUrl({ SITE_URL: "https://a.example/" }), "https://a.example");
});

test("resolveSiteUrl falls back to the Vercel hosts, then to localhost", () => {
  assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "b.example" }), "https://b.example");
  assert.equal(resolveSiteUrl({ VERCEL_URL: "c.vercel.app" }), "https://c.vercel.app");
  assert.equal(resolveSiteUrl({ SITE_URL: "  ", VERCEL_URL: "c.vercel.app" }), "https://c.vercel.app");
  assert.equal(resolveSiteUrl({}), "http://localhost:3000");
});
