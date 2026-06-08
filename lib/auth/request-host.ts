/** Vercel / reverse proxy arkasında gerçek host (admin.derecepanel.com) */
export function resolveRequestHost(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("host")?.trim() || undefined;
}
