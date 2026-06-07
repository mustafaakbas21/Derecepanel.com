/** Sunucu açılışında atlas önbelleğini ısıt — tercih sihirbazı ilk istek gecikmesini azaltır */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getEnrichedAtlas } = await import("@/lib/yks-sim/atlas-cache");
  void getEnrichedAtlas("all").catch(() => {});
}
