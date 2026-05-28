import { NextResponse } from "next/server";

function appwriteConfig() {
  const endpoint = process.env.APPWRITE_ENDPOINT?.replace(/\/+$/, "");
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const bucketId = process.env.APPWRITE_BUCKET_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  return { endpoint, projectId, bucketId, apiKey };
}

export async function GET() {
  const { endpoint, projectId, bucketId, apiKey } = appwriteConfig();
  return NextResponse.json({
    configured: Boolean(endpoint && projectId && bucketId && apiKey),
  });
}

export async function POST(request: Request) {
  const { endpoint, projectId, bucketId, apiKey } = appwriteConfig();
  if (!endpoint || !projectId || !bucketId || !apiKey) {
    return NextResponse.json(
      {
        error:
          "Appwrite yapılandırılmadı. APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_BUCKET_ID, APPWRITE_API_KEY env değişkenlerini tanımlayın.",
      },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "PDF dosyası gerekli" }, { status: 400 });
  }

  const fileId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 20)
      : `pdf_${Date.now().toString(36)}`;

  const uploadForm = new FormData();
  uploadForm.append("fileId", fileId);
  uploadForm.append(
    "file",
    file,
    file instanceof File ? file.name : "test.pdf"
  );

  const url = `${endpoint}/storage/buckets/${encodeURIComponent(bucketId)}/files`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
    },
    body: uploadForm,
  });

  const text = await res.text();
  let json: { $id?: string; message?: string } | null = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: json?.message || text || `HTTP ${res.status}` },
      { status: 502 }
    );
  }

  if (!json?.$id) {
    return NextResponse.json({ error: "Appwrite dosya ID dönmedi" }, { status: 502 });
  }

  return NextResponse.json({ fileId: json.$id });
}
