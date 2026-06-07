import "server-only";

import { AuthError } from "@/lib/auth/require-coach";
import { getServerAuthSession } from "@/lib/auth/session-server";

export { AuthError };

export async function requireAdminAuth(): Promise<{
  userId: string;
  username?: string;
}> {
  const session = await getServerAuthSession();
  if (!session) {
    throw new AuthError("Oturum gerekli.", 401);
  }
  if (session.role !== "admin") {
    throw new AuthError("Yönetici erişimi gerekli.", 403);
  }
  return { userId: session.userId, username: session.username };
}
