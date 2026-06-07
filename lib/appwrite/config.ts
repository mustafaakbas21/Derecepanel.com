/** Appwrite Cloud — tek yapılandırma kaynağı */

export const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim().replace(/\/+$/, "") ||
  "https://fra.cloud.appwrite.io/v1";

export const APPWRITE_PROJECT_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim() || "derecepanel";

export const APPWRITE_PROJECT_NAME =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_NAME?.trim() || "Derecepanel";

export const APPWRITE_DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID?.trim() || "derece_panel";

/** Koç/öğrenci panel JSON verisi (localStorage yerine) */
export const APPWRITE_COLLECTION_PANEL_DATA = "panel_data";

/** Profil ve rol */
export const APPWRITE_COLLECTION_USERS = "users";
export const APPWRITE_COLLECTION_COACHES = "coaches";
export const APPWRITE_COLLECTION_STUDENTS = "students";

/** Denemeler */
export const APPWRITE_COLLECTION_GLOBAL_DENEMELER = "global_denemeler";
export const APPWRITE_COLLECTION_EXAMS = "Exams";
export const APPWRITE_COLLECTION_EXAM_RESULTS = "ExamResults";

/** Test Maker / havuz */
export const APPWRITE_COLLECTION_SORU_HAVUZU = "soru_havuzu";
export const APPWRITE_BUCKET_SORU_HAVUZU = "soru_havuzu";
/** Plan limiti: ayrı bucket yoksa soru_havuzu kullanılır */
export const APPWRITE_BUCKET_DENEME_DEPOSU = "deneme_deposu";

/** Randevu / görev / arşiv */
export const APPWRITE_COLLECTION_APPOINTMENTS = "appointments";
export const APPWRITE_COLLECTION_DAILY_TASKS = "student_daily_tasks";
export const APPWRITE_COLLECTION_ARCHIVES = "panel_archives";

/** Kütüphane */
export const APPWRITE_COLLECTION_ATANAN_KAYNAKLAR = "atanan_kaynaklar";

/** Tüm dosya yüklemeleri için birincil bucket (deneme_deposu limitinde) */
export function resolveStorageBucket(): string {
  const override = process.env.APPWRITE_DENEME_BUCKET?.trim();
  if (override) return override;
  return APPWRITE_BUCKET_SORU_HAVUZU;
}

export function resolveDenemeDeposuBucket(): string {
  return resolveStorageBucket();
}

/** Oturum çerezi (httpOnly) */
export const APPWRITE_SESSION_COOKIE = "dp_appwrite_session";

/** Giriş e-postası sentezi: kullanici@host (Appwrite geçerli e-posta ister — localhost kullanılamaz) */
export function authEmailHost(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APPWRITE_AUTH_EMAIL_HOST?.trim();
  if (fromEnv && fromEnv !== "localhost") return fromEnv;
  return "derecepanel.local";
}

export function resolveCoachLoginEmail(usernameOrEmail: string): string {
  const raw = usernameOrEmail.trim();
  if (!raw) return "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return raw.toLowerCase();
  return `${raw.toLowerCase()}@${authEmailHost()}`;
}
