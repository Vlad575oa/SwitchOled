export function buildS3ObjectUrl(publicUrl: string, bucket: string, key: string): string {
  const baseUrl = publicUrl.replace(/\/+$/, "");
  const objectKey = key.replace(/^\/+/, "");
  const bucketPath = bucket ? `/${bucket}` : "";
  const objectBase = bucketPath && !baseUrl.endsWith(bucketPath)
    ? `${baseUrl}${bucketPath}`
    : baseUrl;

  return `${objectBase}/${objectKey}`;
}

// Every project writes only under its own prefix, so a shared bucket never
// lets one site overwrite or delete another site's objects.
export function withS3KeyPrefix(prefix: string, key: string): string {
  const keyPrefix = prefix.replace(/^\/+|\/+$/g, "");
  if (!keyPrefix) throw new Error("S3_KEY_PREFIX не задан");

  const objectKey = key.replace(/^\/+/, "");
  return objectKey.startsWith(`${keyPrefix}/`) ? objectKey : `${keyPrefix}/${objectKey}`;
}

export function normalizeS3ObjectUrl(url: string, bucket: string): string {
  if (!bucket) return url;

  const duplicateBucketPath = `/${bucket}/${bucket}/`;
  let normalizedUrl = url;
  while (normalizedUrl.includes(duplicateBucketPath)) {
    normalizedUrl = normalizedUrl.replace(duplicateBucketPath, `/${bucket}/`);
  }

  return normalizedUrl;
}
