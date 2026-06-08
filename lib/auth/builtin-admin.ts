import "server-only";

import { isAdminHost } from "@/lib/admin/admin-portal";
import {
  BUILTIN_ADMIN,
  BUILTIN_ADMIN_SESSION_PREFIX,
} from "@/lib/auth/builtin-admin-constants";

export { BUILTIN_ADMIN, BUILTIN_ADMIN_SESSION_PREFIX };

export function isBuiltinAdminCredentials(username: string, password: string): boolean {
  return (
    username.trim() === BUILTIN_ADMIN.username && password === BUILTIN_ADMIN.password
  );
}

export function buildBuiltinAdminSessionSecret(): string {
  return `${BUILTIN_ADMIN_SESSION_PREFIX}${BUILTIN_ADMIN.id}`;
}

export function isBuiltinAdminSession(secret: string): boolean {
  return secret.startsWith(BUILTIN_ADMIN_SESSION_PREFIX);
}

/** Yerleşik kurucu girişi — dev veya admin subdomain */
export function builtinAdminSessionAllowed(host?: string): boolean {
  if (process.env.NODE_ENV === "development") return true;
  if (host && isAdminHost(host)) return true;
  return false;
}
