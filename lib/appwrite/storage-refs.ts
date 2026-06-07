/** Appwrite Storage dosya referansı — panel-store / IndexedDB içinde inline blob yerine */

export const CLOUD_REF_PREFIX = "__cloud__:";

export type CloudFileRef = {
  bucketId: string;
  fileId: string;
};

export function encodeCloudRef(bucketId: string, fileId: string): string {
  return `${CLOUD_REF_PREFIX}${bucketId}:${fileId}`;
}

export function parseCloudRef(value: string): CloudFileRef | null {
  if (!value.startsWith(CLOUD_REF_PREFIX)) return null;
  const rest = value.slice(CLOUD_REF_PREFIX.length);
  const sep = rest.indexOf(":");
  if (sep < 1) return null;
  const bucketId = rest.slice(0, sep).trim();
  const fileId = rest.slice(sep + 1).trim();
  if (!bucketId || !fileId) return null;
  return { bucketId, fileId };
}

export function isCloudRef(value: string | undefined | null): boolean {
  return typeof value === "string" && value.startsWith(CLOUD_REF_PREFIX);
}

export function isDataUrl(value: string | undefined | null): boolean {
  return typeof value === "string" && value.startsWith("data:");
}
