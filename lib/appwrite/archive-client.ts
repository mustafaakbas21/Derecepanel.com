import type { ArchiveScope } from "@/lib/appwrite/archive-server";

export type ArchiveListItem = {
  id: string;
  scope: ArchiveScope;
  payload: string;
  fileId?: string;
  bucketId?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || "İstek başarısız");
  return data;
}

export async function cloudArchiveList(scope: ArchiveScope): Promise<ArchiveListItem[]> {
  const params = new URLSearchParams({ scope });
  const res = await fetch(`/api/appwrite/archive?${params}`, { credentials: "include" });
  const data = await parseJson<{ items: ArchiveListItem[] }>(res);
  return data.items ?? [];
}

export async function cloudArchiveGet(
  scope: ArchiveScope,
  id: string
): Promise<ArchiveListItem | null> {
  const params = new URLSearchParams({ scope, id });
  const res = await fetch(`/api/appwrite/archive?${params}`, { credentials: "include" });
  if (res.status === 404) return null;
  const data = await parseJson<{ item: ArchiveListItem }>(res);
  return data.item ?? null;
}

export async function cloudArchivePut(input: {
  scope: ArchiveScope;
  id: string;
  payload: string;
  file?: Blob;
  filename?: string;
}): Promise<ArchiveListItem> {
  const form = new FormData();
  form.append("scope", input.scope);
  form.append("id", input.id);
  form.append("payload", input.payload);
  if (input.file) {
    form.append("file", input.file, input.filename || "file.bin");
  }

  const res = await fetch("/api/appwrite/archive", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const data = await parseJson<{ item: ArchiveListItem }>(res);
  return data.item;
}

export async function cloudArchiveDelete(scope: ArchiveScope, id: string): Promise<void> {
  const params = new URLSearchParams({ scope, id });
  const res = await fetch(`/api/appwrite/archive?${params}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "Silinemedi");
  }
}

export async function cloudArchiveFetchFile(item: ArchiveListItem): Promise<Blob | null> {
  if (!item.fileId || !item.bucketId) return null;
  const params = new URLSearchParams({
    bucketId: item.bucketId,
    fileId: item.fileId,
  });
  const res = await fetch(`/api/storage/file?${params}`, { credentials: "include" });
  if (!res.ok) return null;
  return res.blob();
}
