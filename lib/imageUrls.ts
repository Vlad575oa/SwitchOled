export function buildS3ObjectUrl(publicUrl: string, bucket: string, key: string): string {
  const baseUrl = publicUrl.replace(/\/+$/, "");
  const objectKey = key.replace(/^\/+/, "");
  const bucketPath = bucket ? `/${bucket}` : "";
  const objectBase = bucketPath && !baseUrl.endsWith(bucketPath)
    ? `${baseUrl}${bucketPath}`
    : baseUrl;

  return `${objectBase}/${objectKey}`;
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
