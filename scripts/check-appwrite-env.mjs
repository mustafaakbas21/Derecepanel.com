/**
 * Appwrite + Vercel env doğrulama
 * Kullanım: node --env-file=.env.local scripts/check-appwrite-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Databases } from "node-appwrite";

function loadEnvLocal() {
  const path = resolve(import.meta.dirname, "..", ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
  "NEXT_PUBLIC_APPWRITE_AUTH_EMAIL_HOST",
];

const REQUIRED_SERVER = ["APPWRITE_API_KEY"];

const RECOMMENDED = ["SESSION_SIGNING_SECRET", "APPWRITE_BUCKET_ID"];

function check(name, ok, detail = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function main() {
  console.log("DerecePanel — Appwrite / Vercel env kontrolü\n");

  let allOk = true;

  for (const key of REQUIRED_PUBLIC) {
    const val = process.env[key]?.trim();
    allOk = check(key, Boolean(val), val || "eksik") && allOk;
  }

  for (const key of REQUIRED_SERVER) {
    const val = process.env[key]?.trim();
    const ok = Boolean(val);
    if (key === "APPWRITE_API_KEY" && val) {
      const prefix = val.startsWith("standard_") ? "standard (doğru format)" : "format kontrol edin";
      allOk = check(key, ok, prefix) && allOk;
    } else {
      allOk = check(key, ok, val ? "tanımlı" : "eksik") && allOk;
    }
  }

  for (const key of RECOMMENDED) {
    const val = process.env[key]?.trim();
    check(key, Boolean(val), val ? "tanımlı" : "önerilir (Vercel Production)");
  }

  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim().replace(/\/+$/, "") ||
    "https://fra.cloud.appwrite.io/v1";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim();
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim();
  const apiKey = process.env.APPWRITE_API_KEY?.trim();

  if (!projectId || !apiKey) {
    console.log("\nAppwrite bağlantı testi atlandı (eksik env).");
    process.exit(allOk ? 0 : 1);
  }

  console.log("\n— Appwrite API bağlantı testi —");

  try {
    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const db = new Databases(client);
    const list = await db.list();
    const found = list.databases.some((d) => d.$id === databaseId);
    allOk = check("Veritabanı erişimi", found, databaseId || "?") && allOk;

    if (found) {
      const cols = await db.listCollections(databaseId);
      const ids = new Set(cols.collections.map((c) => c.$id));
      for (const col of ["users", "students", "panel_data", "coaches"]) {
        check(`Koleksiyon: ${col}`, ids.has(col));
      }
    }
  } catch (err) {
    allOk = false;
    console.error("✗ Appwrite API hatası:", String(err?.message || err));
    console.error(
      "\n  → Appwrite Console → API Keys → scope: databases.read, users.read/write, sessions.write, storage.read/write"
    );
  }

  console.log(allOk ? "\nHazır — Vercel'e aynı değerleri kopyalayın." : "\nEksik/hatalı env var.");
  process.exit(allOk ? 0 : 1);
}

main();
