/**
 * Appwrite'ta admin1 kurucu hesabını oluşturur / günceller.
 * Kullanım: node --env-file=.env.local scripts/provision-admin1.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { Client, Databases, ID, Query, Users } from "node-appwrite";

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

const ADMIN_USERNAME = "admin1";
const ADMIN_PASSWORD = process.env.ADMIN1_PASSWORD || "admin123";
const ADMIN_ID = "admin-super-1";
const ADMIN_NAME = "Kurucu";
const AUTH_HOST =
  process.env.NEXT_PUBLIC_APPWRITE_AUTH_EMAIL_HOST === "derecepanel.local" ||
  !process.env.NEXT_PUBLIC_APPWRITE_AUTH_EMAIL_HOST
    ? "login.derecepanel.com"
    : process.env.NEXT_PUBLIC_APPWRITE_AUTH_EMAIL_HOST;

if (!apiKey) {
  console.error("APPWRITE_API_KEY gerekli (.env.local).");
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const users = new Users(client);
const databases = new Databases(client);

const email = `${ADMIN_USERNAME}@${AUTH_HOST}`;

async function findUserByEmail(targetEmail) {
  const page = await users.list([Query.equal("email", targetEmail), Query.limit(1)]);
  return page.users[0] ?? null;
}

async function main() {
  console.log("Appwrite admin1 provision başlıyor…");
  console.log("E-posta:", email);

  let user = await findUserByEmail(email);
  if (!user) {
    user = await users.create({
      userId: ID.unique(),
      email,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
    });
    console.log("+ Auth kullanıcısı oluşturuldu:", user.$id);
  } else {
    await users.updatePassword(user.$id, ADMIN_PASSWORD);
    await users.updateName(user.$id, ADMIN_NAME);
    console.log("✓ Auth kullanıcısı güncellendi:", user.$id);
  }

  const payload = {
    role: "admin",
    username: ADMIN_USERNAME,
    coachId: ADMIN_ID,
    email,
    fullName: ADMIN_NAME,
  };

  try {
    const existing = await databases.listDocuments(databaseId, "users", [
      Query.equal("username", ADMIN_USERNAME),
      Query.limit(1),
    ]);
    const doc = existing.documents[0];
    if (doc) {
      await databases.updateDocument(databaseId, "users", doc.$id, payload);
      console.log("✓ users dokümanı güncellendi:", doc.$id);
    } else {
      await databases.createDocument(databaseId, "users", user.$id, payload);
      console.log("+ users dokümanı oluşturuldu:", user.$id);
    }
  } catch (err) {
    console.warn("⚠ users koleksiyonu yazılamadı (bootstrap çalıştırın):", err.message);
  }

  console.log("\n✅ admin1 hazır.");
  console.log("   Giriş: kullanıcı adı admin1, şifre", ADMIN_PASSWORD);
  console.log("   Appwrite e-posta:", email);
  console.log(
    "\nAPI Key kapsamları: users.*, databases.*, collections.*, documents.*, sessions.write"
  );
}

export { main };

const invokedDirectly =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  main().catch((err) => {
    console.error("❌", err.message || err);
    process.exit(1);
  });
}
