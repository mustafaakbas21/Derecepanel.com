/**
 * Öğrenci panelSifre alanlarını bcrypt hash'e çevirir.
 * Kullanım: node --env-file=.env.local scripts/migrate-panel-passwords.mjs [--dry-run]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { Client, Databases, Query } from "node-appwrite";

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

const dryRun = process.argv.includes("--dry-run");
const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "derecepanel";
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "derece_panel";
const collectionId = process.env.APPWRITE_COLLECTION_STUDENTS || "students";
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error("APPWRITE_API_KEY gerekli (.env.local).");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);
const databases = new Databases(client);

function isBcrypt(value) {
  return /^\$2[aby]\$/.test(String(value || "").trim());
}

async function main() {
  let cursor = undefined;
  let scanned = 0;
  let migrated = 0;
  let skipped = 0;

  console.log(dryRun ? "[dry-run] Tarama başlıyor…" : "Hash migration başlıyor…");

  while (true) {
    const queries = [Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const page = await databases.listDocuments(databaseId, collectionId, queries);
    if (!page.documents.length) break;

    for (const doc of page.documents) {
      scanned += 1;
      const plain = String(doc.panelSifre || "").trim();
      if (!plain) {
        skipped += 1;
        continue;
      }
      if (isBcrypt(plain)) {
        skipped += 1;
        continue;
      }

      const hashed = bcrypt.hashSync(plain, 12);
      if (dryRun) {
        console.log(`[dry-run] ${doc.$id} → hash`);
      } else {
        await databases.updateDocument(databaseId, collectionId, doc.$id, {
          panelSifre: hashed,
        });
        console.log(`Hashlendi: ${doc.$id}`);
      }
      migrated += 1;
    }

    cursor = page.documents[page.documents.length - 1].$id;
    if (page.documents.length < 100) break;
  }

  console.log(
    `Bitti. scanned=${scanned} migrated=${migrated} skipped=${skipped}${dryRun ? " (dry-run)" : ""}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
