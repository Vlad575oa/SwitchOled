import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";

const cssPath = path.join(process.cwd(), "app/globals.css");
const css = fs.readFileSync(cssPath, "utf8");
const root = postcss.parse(css);

let mobileGutter: string | undefined;

root.walkAtRules("media", (media) => {
  if (!media.params.includes("max-width: 767px")) return;

  media.walkRules(".product-mobile-gutter", (rule) => {
    rule.walkDecls("padding-inline", (declaration) => {
      mobileGutter = declaration.value;
    });
  });
});

assert.equal(
  mobileGutter,
  "0.75rem",
  "Product headings and text need a 12px mobile gutter",
);
