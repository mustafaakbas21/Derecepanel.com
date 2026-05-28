/**
 * Varsayılan e-posta: admin1@localhost (yerel). Üretimde:
 *   $env:DP_COACH_EMAIL="admin1@alanadiniz.com"
 * Gerekli: sunucu API anahtarı (Users scope).
 *
 * Kullanım (PowerShell):
 *   $env:APPWRITE_API_KEY="xxxxxxxx"
 *   node scripts/ensure-admin1-appwrite-user.mjs
 *
 * Proje/endpoint farklıysa:
 *   $env:APPWRITE_ENDPOINT="https://fra.cloud.appwrite.io/v1"
 *   $env:APPWRITE_PROJECT_ID="69c12f05001b051b2f14"
 */
const endpoint = (process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1").replace(/\/+$/, "");
const projectId = process.env.APPWRITE_PROJECT_ID || "69c12f05001b051b2f14";
const apiKey = process.env.APPWRITE_API_KEY || "";

const EMAIL = process.env.DP_COACH_EMAIL || "admin1@localhost";
const PASSWORD = "admin123";
const NAME = "admin1";

function genUserId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID().replace(/-/g, "").slice(0, 20);
  return "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

async function main() {
  if (!apiKey) {
    console.error("APPWRITE_API_KEY tanımlı değil. Appwrite Console → Settings → API Keys ile Users (write) yetkili anahtar oluşturun.");
    process.exit(1);
  }
  const url = endpoint + "/users";
  const body = JSON.stringify({
    userId: genUserId(),
    email: EMAIL,
    password: PASSWORD,
    name: NAME,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
    },
    body,
  });
  const text = await res.text();
  let j = null;
  try {
    j = text ? JSON.parse(text) : null;
  } catch {
    j = null;
  }
  if (res.ok) {
    console.log("Tamam: Appwrite kullanıcısı oluşturuldu:", EMAIL);
    return;
  }
  const msg = (j && (j.message || j.error)) || text || res.status;
  if (res.status === 409 || /already\s*exists|duplicate/i.test(String(msg))) {
    console.log("Zaten var:", EMAIL, "(409 / mevcut kullanıcı — giriş deneyebilirsiniz)");
    return;
  }
  console.error("Appwrite yanıtı:", res.status, msg);
  process.exit(1);
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
