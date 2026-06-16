import assert from "node:assert/strict";
import { getCategoryRedirectTarget } from "../lib/categoryRedirects";

assert.equal(getCategoryRedirectTarget("/catalog/nintendo-switch"), "/catalog/nintendo");
assert.equal(
  getCategoryRedirectTarget("/catalog/nintendo-switch/"),
  "/catalog/nintendo"
);
assert.equal(getCategoryRedirectTarget("/catalog/nintendo-switch-lite"), null);
