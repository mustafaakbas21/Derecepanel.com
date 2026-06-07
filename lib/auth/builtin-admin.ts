import "server-only";

import { BUILTIN_ADMIN } from "@/lib/auth/local-auth";

export { BUILTIN_ADMIN };

export const BUILTIN_ADMIN_SESSION_PREFIX = "builtin:admin:";

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

export function builtinAdminSessionAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_BUILTIN_ADMIN_LOGIN === "1"
  );
}
