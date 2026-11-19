import assert from "node:assert/strict";

import { buildS3ObjectUrl, normalizeS3ObjectUrl, withS3KeyPrefix } from "../lib/imageUrls";

const bucket = "f0f1f2a0-a633-4043-b632-47f3cade91b3";
const key = "products/example.jpg";

assert.equal(
  buildS3ObjectUrl("https://s3.twcstorage.ru", bucket, key),
  `https://s3.twcstorage.ru/${bucket}/${key}`
);

assert.equal(
  buildS3ObjectUrl(`https://s3.twcstorage.ru/${bucket}/`, bucket, key),
  `https://s3.twcstorage.ru/${bucket}/${key}`
);

assert.equal(
  normalizeS3ObjectUrl(
    `https://s3.twcstorage.ru/${bucket}/${bucket}/${key}`,
    bucket
  ),
  `https://s3.twcstorage.ru/${bucket}/${key}`
);

assert.equal(
  normalizeS3ObjectUrl("/images/placeholder.webp", bucket),
  "/images/placeholder.webp"
);

assert.equal(withS3KeyPrefix("nintendo", key), `nintendo/${key}`);
assert.equal(withS3KeyPrefix("/nintendo/", `/${key}`), `nintendo/${key}`);
assert.equal(withS3KeyPrefix("nintendo", `nintendo/${key}`), `nintendo/${key}`);
assert.throws(() => withS3KeyPrefix("", key), /S3_KEY_PREFIX/);

console.log("image-urls.test.ts passed");
