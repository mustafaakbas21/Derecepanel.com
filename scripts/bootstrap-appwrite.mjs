/**
 * Appwrite veritabanı + storage bootstrap
 * Kullanım: node --env-file=.env.local scripts/bootstrap-appwrite.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Databases, Permission, Role, Storage } from "node-appwrite";

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

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "derecepanel";
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "derece_panel";
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error("APPWRITE_API_KEY gerekli (.env.local).");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);
const storage = new Storage(client);

const USER_PERMS = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

async function wait(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function ensureDatabase() {
  const list = await databases.list();
  if (list.databases.some((d) => d.$id === databaseId)) {
    console.log("✓ Veritabanı:", databaseId);
    return;
  }
  await databases.create({ databaseId, name: "Derece Panel" });
  console.log("+ Veritabanı oluşturuldu:", databaseId);
}

async function collectionExists(collectionId) {
  try {
    await databases.getCollection(databaseId, collectionId);
    return true;
  } catch {
    return false;
  }
}

async function ensureStringAttr(collectionId, key, size, required = false) {
  try {
    await databases.createStringAttribute(databaseId, collectionId, key, size, required);
    console.log(`  + attr ${collectionId}.${key}`);
    await wait(1200);
  } catch (err) {
    const msg = String(err?.message || "");
    if (/already exists|attribute.*exist/i.test(msg)) return;
    throw err;
  }
}

async function ensureIndex(collectionId, key, type, attributes) {
  try {
    await databases.createIndex(databaseId, collectionId, key, type, attributes);
    console.log(`  + index ${collectionId}.${key}`);
    await wait(800);
  } catch (err) {
    const msg = String(err?.message || "");
    if (/already exists|index.*exist/i.test(msg)) return;
    throw err;
  }
}

async function ensureCollection({ id, name, documentSecurity = true, attrs = [], indexes = [] }) {
  if (!(await collectionExists(id))) {
    await databases.createCollection({
      databaseId,
      collectionId: id,
      name,
      documentSecurity,
      permissions: USER_PERMS,
    });
    console.log("+ Koleksiyon:", id);
    await wait(1500);
  } else {
    console.log("✓ Koleksiyon:", id);
  }

  for (const a of attrs) {
    await ensureStringAttr(id, a.key, a.size, a.required ?? false);
  }
  if (attrs.length) await wait(2000);
  for (const idx of indexes) {
    await ensureIndex(id, idx.key, idx.type, idx.attributes);
  }
}

async function ensureCollections() {
  console.log("\n— Koleksiyonlar —");

  await ensureCollection({
    id: "panel_data",
    name: "Panel Data",
    attrs: [
      { key: "ownerId", size: 64, required: true },
      { key: "dataKey", size: 256, required: true },
      { key: "payload", size: 1_000_000, required: false },
    ],
    indexes: [{ key: "owner_key", type: "key", attributes: ["ownerId", "dataKey"] }],
  });

  await ensureCollection({
    id: "users",
    name: "Users",
    attrs: [
      { key: "role", size: 32, required: true },
      { key: "username", size: 128 },
      { key: "coachId", size: 64 },
      { key: "email", size: 255 },
      { key: "fullName", size: 255 },
    ],
    indexes: [
      { key: "by_coach", type: "key", attributes: ["coachId"] },
      { key: "by_email", type: "key", attributes: ["email"] },
      { key: "by_username", type: "key", attributes: ["username"] },
    ],
  });

  await ensureCollection({
    id: "coaches",
    name: "Coaches",
    attrs: [
      { key: "coachId", size: 64, required: true },
      { key: "username", size: 128 },
      { key: "displayName", size: 255 },
      { key: "email", size: 255 },
      { key: "status", size: 32 },
      { key: "phone", size: 32 },
      { key: "specialty", size: 255 },
    ],
    indexes: [
      { key: "by_coach", type: "key", attributes: ["coachId"] },
      { key: "by_username", type: "key", attributes: ["username"] },
    ],
  });

  await ensureCollection({
    id: "students",
    name: "Students",
    attrs: [
      { key: "ogrenciId", size: 64, required: true },
      { key: "coachId", size: 64, required: true },
      { key: "koc_id", size: 64 },
      { key: "name", size: 255 },
      { key: "fullName", size: 255 },
      { key: "studentCode", size: 64 },
      { key: "kullaniciAdi", size: 128 },
      { key: "panelSifre", size: 128 },
      { key: "email", size: 255 },
      { key: "alan", size: 32 },
      { key: "goal", size: 500 },
      { key: "status", size: 32 },
      { key: "parent", size: 255 },
      { key: "parentPhone", size: 32 },
      { key: "sinifBranch", size: 128 },
      { key: "targetUniversity", size: 255 },
      { key: "targetDepartment", size: 255 },
      { key: "kayitDate", size: 32 },
    ],
    indexes: [
      { key: "by_coach", type: "key", attributes: ["coachId"] },
      { key: "by_kullanici", type: "key", attributes: ["kullaniciAdi"] },
      { key: "by_email", type: "key", attributes: ["email"] },
      { key: "by_ogrenci", type: "key", attributes: ["ogrenciId"] },
    ],
  });

  const genericDoc = (id, name) =>
    ensureCollection({
      id,
      name,
      attrs: [
        { key: "coachId", size: 64 },
        { key: "ownerId", size: 64 },
        { key: "entityId", size: 128 },
        { key: "examId", size: 64 },
        { key: "payload", size: 2_000_000 },
      ],
      indexes: [
        { key: "by_coach", type: "key", attributes: ["coachId"] },
        { key: "by_entity", type: "key", attributes: ["entityId"] },
        { key: "by_exam", type: "key", attributes: ["examId"] },
      ],
    });

  await genericDoc("global_denemeler", "Global Denemeler");
  await genericDoc("Exams", "Exams");
  await genericDoc("ExamResults", "Exam Results");
  await genericDoc("soru_havuzu", "Soru Havuzu");
  await genericDoc("atanan_kaynaklar", "Atanan Kaynaklar");
  await genericDoc("panel_archives", "Panel Arşivleri");
  await genericDoc("appointments", "Appointments");

  await ensureCollection({
    id: "student_daily_tasks",
    name: "Student Daily Tasks",
    attrs: [
      { key: "ogrenciId", size: 64, required: true },
      { key: "coachId", size: 64 },
      { key: "baslik", size: 500 },
      { key: "title", size: 500 },
      { key: "tarih", size: 32, required: true },
      { key: "tamamlandi", size: 8 },
      { key: "durum", size: 32 },
      { key: "status", size: 16 },
      { key: "sira", size: 8 },
      { key: "updatedAt", size: 64 },
    ],
    indexes: [
      { key: "by_ogrenci", type: "key", attributes: ["ogrenciId"] },
      { key: "by_tarih", type: "key", attributes: ["tarih"] },
      { key: "by_ogrenci_tarih", type: "key", attributes: ["ogrenciId", "tarih"] },
    ],
  });
}

async function bucketExists(bucketId) {
  try {
    await storage.getBucket(bucketId);
    return true;
  } catch {
    return false;
  }
}

async function ensureBucket({ id, name, extensions, maxMb = 50 }) {
  if (await bucketExists(id)) {
    console.log("✓ Bucket:", id);
    return;
  }
  try {
    await storage.createBucket({
      bucketId: id,
      name,
      permissions: USER_PERMS,
      fileSecurity: true,
      enabled: true,
      maximumFileSize: maxMb * 1024 * 1024,
      allowedFileExtensions: extensions,
      encryption: true,
      antivirus: true,
    });
    console.log("+ Bucket oluşturuldu:", id);
  } catch (err) {
    const msg = String(err?.message || "");
    if (/maximum number of buckets|already exists/i.test(msg)) {
      console.warn("⚠ Bucket atlandı (plan limiti veya mevcut):", id);
      return;
    }
    throw err;
  }
}

async function ensureBuckets() {
  console.log("\n— Storage —");
  await ensureBucket({
    id: "soru_havuzu",
    name: "Soru Havuzu",
    extensions: ["pdf", "png", "jpg", "jpeg", "webp", "gif"],
    maxMb: 30,
  });
  await ensureBucket({
    id: "deneme_deposu",
    name: "Deneme Deposu",
    extensions: ["pdf"],
    maxMb: 80,
  });
}

try {
  console.log("Appwrite bootstrap başlıyor…");
  console.log("Proje:", projectId, "| DB:", databaseId);
  await ensureDatabase();
  await ensureCollections();
  await ensureBuckets();
  console.log("\n— Admin1 —");
  const { main: provisionAdmin1 } = await import("./provision-admin1.mjs");
  await provisionAdmin1();
  console.log("\n✅ Appwrite bootstrap tamamlandı.");
} catch (err) {
  console.error("\n❌ Bootstrap hatası:", err?.message || err);
  process.exit(1);
}
